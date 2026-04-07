# Implementation Blueprint

## 1. Product Scope

### Primary Use Cases

- Students search for past papers, lecture notes, and tutorials by keyword or module.
- Students upload new study material and track whether it is approved.
- Moderators review pending uploads, reject bad submissions, and keep the public archive clean.
- The system extracts text from PDFs so documents can be found by their internal content, not just title and metadata.

### MVP Non-Goals

- No native mobile app.
- No OCR-heavy scanned document pipeline in the first release.
- No custom moderation UI outside Django Admin unless admin limitations become a blocker.
- No advanced recommendation engine in the first release.

## 2. Architecture

### High-Level Components

- `frontend`: React SPA for public search, uploads, and account pages
- `backend`: Django + DRF API
- `database`: PostgreSQL for relational data and full-text search
- `queue`: Redis as Celery broker/result backend
- `worker`: Celery workers for PDF extraction and metadata generation
- `storage`: Cloudflare R2 for uploaded files and optional preview assets

### Flow

1. User uploads a PDF through the frontend.
2. Django validates the file and stores it in R2.
3. A `Document` is created in `processing` state.
4. Celery extracts text and updates search fields.
5. Document moves to `pending_review`.
6. Moderator approves or rejects from Django Admin.
7. Approved documents appear in public search results.

## 3. Repository Structure

```text
backend/
|-- apps/
|   |-- accounts/
|   |   |-- admin.py
|   |   |-- models.py
|   |   |-- serializers.py
|   |   |-- urls.py
|   |   `-- views.py
|   |-- taxonomy/
|   |   |-- admin.py
|   |   |-- models.py
|   |   |-- serializers.py
|   |   |-- urls.py
|   |   `-- views.py
|   |-- documents/
|   |   |-- admin.py
|   |   |-- models.py
|   |   |-- selectors.py
|   |   |-- serializers.py
|   |   |-- services.py
|   |   |-- tasks.py
|   |   |-- urls.py
|   |   `-- views.py
|   `-- moderation/
|       |-- admin.py
|       |-- models.py
|       `-- services.py
|-- config/
|   |-- settings/
|   |   |-- base.py
|   |   |-- local.py
|   |   `-- production.py
|   |-- urls.py
|   |-- celery.py
|   `-- asgi.py
|-- requirements/
|   |-- base.txt
|   |-- dev.txt
|   `-- prod.txt
`-- manage.py
```

```text
frontend/
|-- src/
|   |-- api/
|   |-- app/
|   |-- components/
|   |-- features/
|   |   |-- auth/
|   |   |-- search/
|   |   |-- taxonomy/
|   |   `-- uploads/
|   |-- pages/
|   |-- routes/
|   |-- styles/
|   `-- types/
`-- vite.config.ts
```

## 4. Backend App Responsibilities

### `accounts`

- Custom user model
- JWT login, refresh, logout
- Role and permission helpers
- User profile endpoints

### `taxonomy`

- Faculty, degree program, module
- Admin-managed academic hierarchy
- Public read APIs for browsing and filtering

### `documents`

- Upload API
- Storage integration
- Text extraction pipeline hooks
- Search queries and ranking
- User upload history

### `moderation`

- Approval and rejection actions
- Audit logs
- Reported-content workflow

## 5. Data Model

### User

Use Django `AbstractUser`.

Suggested fields:

- `email` unique
- `full_name`
- `role`: `student`, `moderator`, `admin`
- `is_email_verified`
- `created_at`
- `updated_at`

Notes:

- Prefer email-based authentication.
- Keep role logic simple and explicit.

### Faculty

- `name`
- `slug`
- `is_active`

Constraints:

- `name` unique
- `slug` unique

### DegreeProgram

- `faculty` FK
- `name`
- `slug`
- `short_code`
- `is_active`

Constraints:

- unique on `faculty + name`
- `short_code` indexed

### Module

- `degree_program` FK
- `code`
- `title`
- `slug`
- `semester`
- `academic_year`
- `is_active`

Constraints:

- `code` indexed
- unique on `degree_program + code`

### Document

- `module` FK
- `uploader` FK to user
- `approved_by` FK to user, nullable
- `title`
- `description`
- `document_type`: `past_paper`, `lecture_note`, `tutorial`, `lab_sheet`, `other`
- `status`: `uploaded`, `processing`, `pending_review`, `approved`, `rejected`, `failed`
- `file`
- `file_name`
- `file_size`
- `mime_type`
- `file_hash`
- `academic_year_label`
- `semester_label`
- `exam_session`
- `is_public`
- `page_count`
- `extracted_text`
- `search_vector`
- `processing_error`
- `rejection_reason`
- `uploaded_at`
- `processed_at`
- `approved_at`
- `updated_at`

Constraints and indexes:

- `file_hash` indexed for duplicate detection
- `status` indexed
- `document_type` indexed
- `uploaded_at` indexed
- `search_vector` with `GIN` index

### ModerationLog

- `document` FK
- `moderator` FK
- `action`: `approved`, `rejected`, `reopened`
- `notes`
- `created_at`

### DocumentReport

- `document` FK
- `reported_by` FK
- `reason`: `wrong_module`, `bad_scan`, `copyright_issue`, `duplicate`, `other`
- `details`
- `status`: `open`, `reviewed`, `dismissed`
- `created_at`

This is optional for the first milestone but worth designing early.

## 6. Document Lifecycle

### Upload State Machine

- `uploaded`: file saved, waiting for worker dispatch
- `processing`: worker is extracting metadata/text
- `pending_review`: extraction finished, moderator can review
- `approved`: visible to the public
- `rejected`: hidden from public search
- `failed`: processing broke and needs operator attention

### Rules

- Only `approved` documents are visible in public search.
- Uploaders can see their own rejected and pending documents.
- Moderators and admins can see all documents.
- Rejected documents should retain rejection reason for uploader feedback.

## 7. API Design

Base prefix: `/api/v1/`

### Auth

- `POST /auth/register/`
- `POST /auth/login/`
- `POST /auth/token/refresh/`
- `POST /auth/logout/`
- `GET /auth/me/`

### Taxonomy

- `GET /faculties/`
- `GET /faculties/{id}/`
- `GET /degrees/`
- `GET /degrees/{id}/`
- `GET /modules/`
- `GET /modules/{id}/`

Moderator/admin only:

- `POST /faculties/`
- `PATCH /faculties/{id}/`
- `POST /degrees/`
- `PATCH /degrees/{id}/`
- `POST /modules/`
- `PATCH /modules/{id}/`

### Documents

- `POST /documents/` for upload
- `GET /documents/` for public approved search
- `GET /documents/{id}/`
- `GET /documents/mine/`
- `DELETE /documents/{id}/` optional for uploader before review

Moderator/admin:

- `GET /moderation/documents/`
- `POST /moderation/documents/{id}/approve/`
- `POST /moderation/documents/{id}/reject/`
- `POST /moderation/documents/{id}/reprocess/`

Reports:

- `POST /documents/{id}/reports/`
- `GET /moderation/reports/`

## 8. Search Design

### Strategy

Use PostgreSQL native full-text search with a stored `SearchVectorField` on `Document`.

Compose the vector from:

- module code with highest weight
- module title with high weight
- document title with high weight
- description with medium weight
- extracted text with lower weight

### Example Weighting

- `A`: module code
- `A`: document title
- `B`: module title
- `C`: description
- `D`: extracted text

### Filters

- `q`
- `faculty`
- `degree_program`
- `module`
- `document_type`
- `status` for moderator views only
- `academic_year_label`
- `semester_label`
- `exam_session`

### Ranking

- Order by `SearchRank`
- Secondary order by `approved_at DESC`

### Performance Notes

- Store the search vector instead of recalculating every query.
- Add `GIN` index on `search_vector`.
- Add `select_related` for module and uploader where needed.
- Paginate aggressively.

## 9. Upload and Storage Design

### File Rules

- Accept PDF only for MVP.
- Enforce file size cap, for example 25 MB.
- Validate mime type and extension.
- Compute `file_hash` for duplicate detection.

### R2 Layout

- `documents/raw/{year}/{month}/{uuid}.pdf`
- `documents/previews/{year}/{month}/{uuid}.jpg`

### Why Hashing Matters

- Prevent exact duplicate spam
- Help moderators spot repeated uploads
- Support future deduplication UI

## 10. Background Jobs

### Celery Tasks

- `extract_document_text(document_id)`
- `generate_document_preview(document_id)` optional
- `rebuild_document_search_vector(document_id)`
- `detect_possible_module_matches(document_id)` optional V2

### Extraction Library Recommendation

Primary: `PyMuPDF`

Reasons:

- Fast
- Good text extraction performance
- Can also support preview generation later

Fallback:

- `pdfminer.six` if edge cases require a second extractor

### Failure Handling

- Save worker error message to `processing_error`
- Move document to `failed`
- Expose retry action to moderators/admins

## 11. Django Admin Moderation

### Admin Enhancements

- Filter by `status`, `document_type`, `module`, `uploader`
- Search by title, module code, file hash
- Bulk approve action
- Bulk reject action with required note
- Read-only extracted text preview snippet
- Highlight duplicate hashes
- Link to stored file for manual inspection

### Custom Admin Views Worth Adding

- Pending queue sorted by oldest first
- Failed processing queue
- Reported content queue

## 12. Frontend Experience

### Public Pages

- `/`
- `/search`
- `/modules`
- `/modules/:moduleId`
- `/documents/:documentId`

### Authenticated Pages

- `/login`
- `/register`
- `/dashboard`
- `/dashboard/uploads`
- `/dashboard/upload`

### Key Components

- global search bar
- searchable module selector
- upload dropzone
- status badges
- moderation-safe document card
- filter sidebar / mobile drawer

### UX Requirements

- Mobile-first layout support
- Clear pending/approved/rejected states
- Upload validation before submit
- Helpful empty states and error states
- Debounced search queries

## 13. Permissions

### Student

- register/login
- search approved documents
- upload documents
- view own uploads
- submit reports

### Moderator

- everything a student can do
- review pending documents
- approve/reject/reprocess
- view reports

### Admin

- full platform access
- manage taxonomy
- manage moderators
- inspect failed jobs and audit history

## 14. Security and Abuse Prevention

### Must-Haves

- file type validation
- file size limits
- authenticated uploads only
- rate limiting on auth and upload endpoints
- permission checks at serializer and view level
- private-by-default storage paths with backend-issued file URLs if needed
- environment secrets kept out of source control

### Recommended Additions

- email verification before uploads
- CAPTCHA on registration if abuse appears
- virus scanning if public scale grows
- content reporting workflow

## 15. Testing Strategy

### Backend

- model tests for constraints and status rules
- API tests for auth, uploads, permissions, moderation
- service tests for search-vector building
- Celery task tests for extraction success/failure

### Frontend

- form validation tests
- route guard tests
- search interaction tests
- upload status UI tests

### End-to-End

- upload sample PDF
- wait for worker processing
- approve document
- search extracted keyword
- confirm public result visibility
- reject a different document and confirm it stays hidden

## 16. Observability and Operations

### Logging

- structured app logs
- Celery worker error logs
- audit logs for moderator actions

### Monitoring

- Sentry for backend and frontend
- health endpoint for API
- worker heartbeat monitoring

### Backups

- scheduled PostgreSQL backups
- versioned R2 bucket policy if feasible

## 17. Environment Setup

### Local Development

Use Docker Compose for:

- PostgreSQL
- Redis

Run app servers locally:

- Django API server
- Celery worker
- React dev server

### Required Environment Variables

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `DATABASE_URL`
- `REDIS_URL`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET_NAME`
- `CLOUDFLARE_R2_ENDPOINT_URL`
- `CLOUDFLARE_R2_REGION`
- `CLOUDFLARE_R2_QUERYSTRING_AUTH`
- `CORS_ALLOWED_ORIGINS`
- `JWT_ACCESS_LIFETIME_MINUTES`
- `JWT_REFRESH_LIFETIME_DAYS`
- `SENTRY_DSN`

## 18. Phased Delivery Plan

### Milestone 1: Project Skeleton

- initialize Django project
- create custom user model
- create taxonomy and document apps
- configure PostgreSQL
- configure DRF and JWT
- set up Docker Compose for PostgreSQL and Redis

Exit criteria:

- app boots locally
- migrations run
- superuser can log in to admin

### Milestone 2: Core Models and Admin

- implement Faculty, DegreeProgram, Module, Document
- register and customize admin
- add initial fixtures or seed script for sample taxonomy

Exit criteria:

- taxonomy manageable in admin
- document entries can be created manually

### Milestone 3: Upload Pipeline

- configure R2 storage
- create upload serializer/view
- save metadata and queue worker
- enforce validation and status transitions

Exit criteria:

- authenticated user can upload PDF
- file lands in R2
- document enters processing flow

### Milestone 4: Background Processing

- integrate Celery and Redis
- extract PDF text
- populate `extracted_text`, `page_count`, `search_vector`
- handle failures and retries

Exit criteria:

- sample PDF text appears in database
- failed jobs are visible and retryable

### Milestone 5: Search and Public Discovery

- build public document list/detail endpoints
- add filters and ranking
- restrict results to approved documents

Exit criteria:

- exact keyword search returns approved matching file
- rejected and pending files stay hidden publicly

### Milestone 6: Moderation Workflow

- add approve/reject/reprocess actions
- save moderation logs
- show rejection reason to uploader

Exit criteria:

- moderator can clear review queue fully through admin/API

### Milestone 7: Frontend MVP

- scaffold React app
- build auth flows
- build search page
- build upload page
- build my uploads dashboard

Exit criteria:

- student can register, upload, search, and track status end-to-end

### Milestone 8: Hardening

- testing coverage
- API docs
- Sentry
- backup plan
- deployment scripts

Exit criteria:

- CI passes
- production config is documented

## 19. Future Enhancements

- OCR for scanned PDFs
- automatic module suggestion from extracted content
- duplicate merge tools for moderators
- saved searches and bookmarks
- upload notifications
- popularity analytics
- contributor reputation system
- semantic search as a later upgrade if PostgreSQL search becomes limiting

## 20. Recommended First Build Order

If starting implementation immediately, build in this exact order:

1. Django project, custom user, PostgreSQL, DRF, JWT
2. Taxonomy models and admin
3. Document model and R2 upload
4. Celery extraction pipeline
5. Search API with approved-only filter
6. Moderation actions and audit logs
7. React frontend
8. Tests, docs, and deployment polish

## 21. Important Product Calls

### Manual vs Automatic Module Assignment

For MVP, require uploader-selected module assignment from a dropdown. Later, add background suggestions from extracted text, but keep moderator approval over final tagging.

### Search Engine Choice

PostgreSQL is the right first choice here. Move to a dedicated search engine only if ranking quality, scale, or fuzzy search requirements outgrow native search.

### Moderation Interface

Django Admin should carry the first release. Build a custom moderator interface only if queue volume or UX becomes a real productivity issue.
