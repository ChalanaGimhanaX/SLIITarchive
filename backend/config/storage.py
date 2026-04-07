from urllib.parse import quote

from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage
from storages.utils import clean_name


class R2MediaStorage(S3Boto3Storage):
    # Document model already prefixes files with upload_to="documents/%Y/%m/".
    location = ""
    file_overwrite = False

    def url(self, name, parameters=None, expire=None, http_method=None):
        public_base = getattr(settings, "CLOUDFLARE_R2_PUBLIC_BASE_URL", "").strip().rstrip("/")
        if public_base and not getattr(settings, "CLOUDFLARE_R2_QUERYSTRING_AUTH", False):
            cleaned_name = self._normalize_name(clean_name(name)).lstrip("/")
            return f"{public_base}/{quote(cleaned_name, safe='/')}"
        return super().url(name, parameters=parameters, expire=expire, http_method=http_method)
