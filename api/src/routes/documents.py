from flask import Blueprint, current_app, request, send_file

from src.db import db
from src.models.case import Case
from src.models.document import Document
from src.models.notification import Notification
from src.services.documents_service import delete_document_file, get_document_path, store_case_document
from src.utils.http import error_response


documents_bp = Blueprint("documents", __name__)


@documents_bp.post("/<int:case_id>/upload")
def upload_case_document(case_id: int):
    case = Case.query.get(case_id)
    if not case:
        return error_response("Case not found", 404)

    if "file" not in request.files:
        return error_response("Missing multipart file field 'file'")

    file = request.files["file"]

    try:
        full_path, stored_filename = store_case_document(current_app.config["UPLOAD_ROOT"], case_id, file)
    except ValueError as e:
        return error_response(str(e))

    doc = Document(
        case_id=case_id,
        original_filename=file.filename,
        stored_filename=stored_filename,
        mime_type=file.mimetype,
        size_bytes=full_path.stat().st_size,
    )

    db.session.add(doc)
    db.session.add(
        Notification(
            title="Document uploaded",
            message=f"Uploaded '{file.filename}' for case '{case.title}'.",
            category="document",
        )
    )
    db.session.commit()

    return doc.to_dict(), 201


@documents_bp.get("/<int:case_id>/documents")
def list_case_documents(case_id: int):
    case = Case.query.get(case_id)
    if not case:
        return error_response("Case not found", 404)

    docs = Document.query.filter_by(case_id=case_id).order_by(Document.created_at.desc()).all()
    return [d.to_dict() for d in docs]


@documents_bp.get("/<int:case_id>/documents/<int:doc_id>/download")
def download_case_document(case_id: int, doc_id: int):
    doc = Document.query.filter_by(id=doc_id, case_id=case_id).first()
    if not doc:
        return error_response("Document not found", 404)

    path = get_document_path(current_app.config["UPLOAD_ROOT"], case_id, doc.stored_filename)
    if not path.exists():
        return error_response("File not found on disk", 404)

    return send_file(path, as_attachment=True, download_name=doc.original_filename)


@documents_bp.delete("/<int:case_id>/documents/<int:doc_id>")
def delete_case_document(case_id: int, doc_id: int):
    doc = Document.query.filter_by(id=doc_id, case_id=case_id).first()
    if not doc:
        return error_response("Document not found", 404)

    delete_document_file(current_app.config["UPLOAD_ROOT"], case_id, doc.stored_filename)

    db.session.delete(doc)
    db.session.add(
        Notification(
            title="Document deleted",
            message=f"Deleted '{doc.original_filename}' from case #{case_id}.",
            category="document",
        )
    )
    db.session.commit()

    return {"status": "deleted"}
