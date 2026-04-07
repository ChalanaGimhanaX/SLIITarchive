from __future__ import annotations

import hashlib
from pathlib import Path
from typing import IO

from pypdf import PdfReader


def calculate_file_hash(file_path: str | Path) -> str:
    digest = hashlib.sha256()
    with open(file_path, "rb") as handle:
        for chunk in iter(lambda: handle.read(8192), b""):
            digest.update(chunk)
    return digest.hexdigest()


def calculate_uploaded_file_hash(uploaded_file) -> str:
    digest = hashlib.sha256()
    original_position = uploaded_file.tell() if hasattr(uploaded_file, "tell") else None

    if hasattr(uploaded_file, "seek"):
        uploaded_file.seek(0)

    for chunk in uploaded_file.chunks():
        digest.update(chunk)

    if hasattr(uploaded_file, "seek") and original_position is not None:
        uploaded_file.seek(original_position)

    return digest.hexdigest()


def extract_pdf_text(file_handle: IO[bytes]) -> tuple[str, int]:
    if hasattr(file_handle, "seek"):
        file_handle.seek(0)

    reader = PdfReader(file_handle)
    text_parts = []

    for page in reader.pages:
        extracted = page.extract_text() or ""
        if extracted.strip():
            text_parts.append(extracted.strip())

    if hasattr(file_handle, "seek"):
        file_handle.seek(0)

    return "\n\n".join(text_parts), len(reader.pages)
