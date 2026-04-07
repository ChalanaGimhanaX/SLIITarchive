import hashlib
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.documents.models import Document
from apps.taxonomy.models import DegreeProgram, Faculty, Module


def minimal_pdf_bytes() -> bytes:
    return b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R /Resources << >> >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 10 10 Td (SE3020 sample keyword) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000010 00000 n
0000000060 00000 n
0000000117 00000 n
0000000210 00000 n
trailer
<< /Root 1 0 R /Size 5 >>
startxref
300
%%EOF"""


class SmokeFlowTests(APITestCase):
    def setUp(self):
        self.User = get_user_model()
        self.faculty = Faculty.objects.create(name="Faculty of Computing", slug="computing")
        self.degree = DegreeProgram.objects.create(
            faculty=self.faculty,
            name="Software Engineering",
            slug="seng",
            short_code="SE",
        )
        self.module = Module.objects.create(
            degree_program=self.degree,
            code="SE3020",
            title="Software Engineering",
            slug="se3020-software-engineering",
            semester="Semester 1",
            academic_year="Year 3",
        )
        self.student = self.User.objects.create_user(
            email="student@sliit.local",
            username="student",
            password="demo12345",
            role=self.User.Role.STUDENT,
        )
        self.moderator = self.User.objects.create_user(
            email="moderator@sliit.local",
            username="moderator",
            password="demo12345",
            role=self.User.Role.MODERATOR,
        )
        self.document = Document.objects.create(
            module=self.module,
            uploader=self.student,
            title="SE3020 sample keyword paper",
            description="Contains a searchable keyword",
            document_type=Document.DocumentType.PAST_PAPER,
            status=Document.Status.PENDING_REVIEW,
            file=SimpleUploadedFile("sample.pdf", minimal_pdf_bytes(), content_type="application/pdf"),
            file_name="sample.pdf",
            file_size=len(minimal_pdf_bytes()),
            mime_type="application/pdf",
            file_hash=hashlib.sha256(minimal_pdf_bytes()).hexdigest(),
        )

    def authenticate(self, email: str, password: str) -> str:
        response = self.client.post(
            reverse("login"),
            {"email": email, "password": password},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        return response.data["access"]

    @patch("apps.documents.views.extract_document_text.delay")
    def test_login_upload_moderation_and_search_flow(self, _mock_delay):
        student_token = self.authenticate("student@sliit.local", "demo12345")

        upload_response = self.client.post(
            reverse("documents-list"),
            {
                "module_id": self.module.id,
                "title": "SE3020 uploaded keyword paper",
                "description": "Student upload for smoke test",
                "document_type": "past_paper",
                "academic_year_label": "Year 3",
                "semester_label": "Semester 1",
                "exam_session": "Final",
                "file": SimpleUploadedFile("upload.pdf", minimal_pdf_bytes(), content_type="application/pdf"),
            },
            format="multipart",
            HTTP_AUTHORIZATION=f"Bearer {student_token}",
        )
        self.assertEqual(upload_response.status_code, 201)
        self.assertEqual(upload_response.data["status"], "processing")

        uploaded_document = Document.objects.get(title="SE3020 uploaded keyword paper")
        self.assertEqual(uploaded_document.uploader, self.student)

        moderator_token = self.authenticate("moderator@sliit.local", "demo12345")
        approve_response = self.client.post(
            reverse("moderation-document-approve", args=[uploaded_document.id]),
            {"notes": "Looks good"},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {moderator_token}",
        )
        self.assertEqual(approve_response.status_code, 200)

        uploaded_document.refresh_from_db()
        self.assertEqual(uploaded_document.status, Document.Status.APPROVED)
        self.assertTrue(uploaded_document.is_public)

        search_response = self.client.get(
            reverse("documents-list"),
            {"q": "keyword"},
        )
        self.assertEqual(search_response.status_code, 200)
        titles = [item["title"] for item in search_response.data["results"]]
        self.assertIn("SE3020 uploaded keyword paper", titles)

    def test_public_document_report_requires_auth(self):
        response = self.client.post(
            reverse("document-report-create", args=[self.document.id]),
            {"reason": "duplicate", "details": "Already uploaded elsewhere"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_admin_user_management_endpoint_requires_admin_role(self):
        admin_user = self.User.objects.create_user(
            email="admin@sliit.local",
            username="admin",
            password="demo12345",
            role=self.User.Role.ADMIN,
        )
        admin_token = self.authenticate("admin@sliit.local", "demo12345")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {admin_token}")

        list_response = self.client.get(reverse("admin-user-list"))
        self.assertEqual(list_response.status_code, 200)
        self.assertGreaterEqual(list_response.data["count"], 1)

        patch_response = self.client.patch(
            reverse("admin-user-detail", args=[self.student.id]),
            {"full_name": "Updated Student", "role": self.User.Role.MODERATOR},
            format="json",
        )
        self.assertEqual(patch_response.status_code, 200)

        self.student.refresh_from_db()
        self.assertEqual(self.student.full_name, "Updated Student")
        self.assertEqual(self.student.role, self.User.Role.MODERATOR)
        self.assertTrue(self.student.is_staff)

    def test_moderator_can_delete_document_and_file(self):
        moderator_token = self.authenticate("moderator@sliit.local", "demo12345")
        document_id = self.document.id
        stored_file_name = self.document.file.name

        self.assertTrue(self.document.file.storage.exists(stored_file_name))

        response = self.client.delete(
            reverse("documents-detail", args=[document_id]),
            HTTP_AUTHORIZATION=f"Bearer {moderator_token}",
        )

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Document.objects.filter(pk=document_id).exists())
        self.assertFalse(self.document.file.storage.exists(stored_file_name))

    def test_session_login_and_me_endpoint(self):
        csrf_response = self.client.get(reverse("session-csrf"))
        self.assertEqual(csrf_response.status_code, 200)
        self.assertIn("csrfToken", csrf_response.data)

        login_response = self.client.post(
            reverse("session-login"),
            {"email": "student@sliit.local", "password": "demo12345"},
            format="json",
        )
        self.assertEqual(login_response.status_code, 200)
        self.assertEqual(login_response.data["email"], "student@sliit.local")

        me_response = self.client.get(reverse("session-me"))
        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.data["email"], "student@sliit.local")

    def test_analytics_event_and_summary_endpoint(self):
        event_response = self.client.post(
            reverse("analytics-event-create"),
            {"event_type": "page_view", "path": "/dashboard", "visitor_id": "visitor-1"},
            format="json",
        )
        self.assertEqual(event_response.status_code, 201)

        download_response = self.client.post(
            reverse("analytics-event-create"),
            {
                "event_type": "download",
                "path": "/search",
                "visitor_id": "visitor-1",
                "document_id": self.document.id,
            },
            format="json",
        )
        self.assertEqual(download_response.status_code, 201)

        moderator_token = self.authenticate("moderator@sliit.local", "demo12345")
        summary_response = self.client.get(
            reverse("analytics-summary"),
            HTTP_AUTHORIZATION=f"Bearer {moderator_token}",
        )
        self.assertEqual(summary_response.status_code, 200)
        self.assertEqual(summary_response.data["total_visitors"], 1)
        self.assertEqual(summary_response.data["total_downloads"], 1)
        self.assertEqual(summary_response.data["total_page_views"], 1)
