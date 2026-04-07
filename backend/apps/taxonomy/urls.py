from rest_framework.routers import DefaultRouter

from .views import DegreeProgramViewSet, FacultyViewSet, ModuleViewSet

router = DefaultRouter()
router.register("faculties", FacultyViewSet, basename="faculty")
router.register("degrees", DegreeProgramViewSet, basename="degree")
router.register("modules", ModuleViewSet, basename="module")

urlpatterns = router.urls
