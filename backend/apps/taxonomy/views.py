from rest_framework import permissions, viewsets

from .models import DegreeProgram, Faculty, Module
from .serializers import DegreeProgramSerializer, FacultySerializer, ModuleSerializer


class ReadOnlyOrAdminPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or getattr(request.user, "is_admin", False))
        )


class FacultyViewSet(viewsets.ModelViewSet):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    permission_classes = [ReadOnlyOrAdminPermission]


class DegreeProgramViewSet(viewsets.ModelViewSet):
    queryset = DegreeProgram.objects.select_related("faculty").all()
    serializer_class = DegreeProgramSerializer
    permission_classes = [ReadOnlyOrAdminPermission]


class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.select_related("degree_program", "degree_program__faculty").all()
    serializer_class = ModuleSerializer
    permission_classes = [ReadOnlyOrAdminPermission]
