from django.contrib import admin

from .models import DegreeProgram, Faculty, Module


@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active")
    search_fields = ("name", "slug")
    list_filter = ("is_active",)


@admin.register(DegreeProgram)
class DegreeProgramAdmin(admin.ModelAdmin):
    list_display = ("short_code", "name", "faculty", "is_active")
    search_fields = ("short_code", "name", "faculty__name")
    list_filter = ("faculty", "is_active")


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ("code", "title", "degree_program", "semester", "academic_year", "is_active")
    search_fields = ("code", "title", "degree_program__name")
    list_filter = ("degree_program", "semester", "is_active")
