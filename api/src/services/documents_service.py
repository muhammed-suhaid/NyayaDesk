import os
from pathlib import Path
from uuid import uuid4

from werkzeug.datastructures import FileStorage


ALLOWED_EXTENSIONS = {"pdf", "txt", "doc", "docx", "png", "jpg", "jpeg", "webp"}


def _safe_ext(filename: str) -> str:
    parts = filename.rsplit(".", 1)
    if len(parts) != 2:
        return ""
    return parts[1].lower()


def validate_file(file: FileStorage):
    if not file or not file.filename:
        raise ValueError("No file provided")

    ext = _safe_ext(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError("Unsupported file type")


def store_case_document(upload_root: str | Path, case_id: int, file: FileStorage) -> tuple[Path, str]:
    validate_file(file)

    upload_root_path = Path(upload_root)
    case_dir = upload_root_path / f"case_{case_id}"
    case_dir.mkdir(parents=True, exist_ok=True)

    ext = _safe_ext(file.filename)
    stored_filename = f"{uuid4().hex}.{ext}" if ext else uuid4().hex
    full_path = case_dir / stored_filename

    file.save(full_path)

    return full_path, stored_filename


def get_document_path(upload_root: str | Path, case_id: int, stored_filename: str) -> Path:
    upload_root_path = Path(upload_root)
    path = upload_root_path / f"case_{case_id}" / stored_filename
    return path


def delete_document_file(upload_root: str | Path, case_id: int, stored_filename: str) -> bool:
    path = get_document_path(upload_root, case_id, stored_filename)
    if path.exists() and path.is_file():
        os.remove(path)
        return True
    return False
