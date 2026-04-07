from django.db import models


class Faculty(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class DegreeProgram(models.Model):
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name="degree_programs")
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    short_code = models.CharField(max_length=50, db_index=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["faculty", "name"], name="unique_degree_per_faculty_name"),
            models.UniqueConstraint(fields=["faculty", "slug"], name="unique_degree_per_faculty_slug"),
        ]

    def __str__(self) -> str:
        return f"{self.short_code} - {self.name}"


class Module(models.Model):
    degree_program = models.ForeignKey(DegreeProgram, on_delete=models.CASCADE, related_name="modules")
    code = models.CharField(max_length=50, db_index=True)
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    semester = models.CharField(max_length=50, blank=True)
    academic_year = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["code"]
        constraints = [
            models.UniqueConstraint(fields=["degree_program", "code"], name="unique_module_per_program_code"),
            models.UniqueConstraint(fields=["degree_program", "slug"], name="unique_module_per_program_slug"),
        ]

    def __str__(self) -> str:
        return self.code
