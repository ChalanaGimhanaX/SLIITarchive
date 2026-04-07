from rest_framework import serializers

from .models import DegreeProgram, Faculty, Module


class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = ("id", "name", "slug", "is_active")


class DegreeProgramSerializer(serializers.ModelSerializer):
    faculty = FacultySerializer(read_only=True)
    faculty_id = serializers.PrimaryKeyRelatedField(source="faculty", queryset=Faculty.objects.all(), write_only=True)

    class Meta:
        model = DegreeProgram
        fields = ("id", "faculty", "faculty_id", "name", "slug", "short_code", "is_active")


class ModuleSerializer(serializers.ModelSerializer):
    degree_program = DegreeProgramSerializer(read_only=True)
    degree_program_id = serializers.PrimaryKeyRelatedField(
        source="degree_program",
        queryset=DegreeProgram.objects.all(),
        write_only=True,
    )

    class Meta:
        model = Module
        fields = (
            "id",
            "degree_program",
            "degree_program_id",
            "code",
            "title",
            "slug",
            "semester",
            "academic_year",
            "is_active",
        )
