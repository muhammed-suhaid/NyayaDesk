from flask import Blueprint, request

from src.db import db
from src.models.advocate import Advocate
from src.models.case import Case
from src.utils.auth import current_session, require_role, require_auth
from src.utils.http import error_response


advocates_bp = Blueprint("advocates", __name__)


@advocates_bp.post("")
@require_role("admin")
def create_advocate():
    return error_response("Use /admin/users to create advocates", 400)


@advocates_bp.get("")
@require_auth
def list_advocates():
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin must use /superadmin endpoints", 403)

    advocates = Advocate.query.filter(Advocate.company_id == sess.company_id).order_by(Advocate.created_at.desc()).all()

    include_workload = request.args.get("includeWorkload") == "1"
    if not include_workload:
        return [a.to_dict() for a in advocates]

    result = []
    for a in advocates:
        open_cases = (
            Case.query.filter(Case.company_id == sess.company_id)
            .filter(Case.assigned_advocate_id == a.id)
            .filter(Case.current_status != "Closed")
            .count()
        )
        data = a.to_dict()
        data["openCaseCount"] = open_cases
        result.append(data)

    return result


@advocates_bp.put("/<int:advocate_id>")
@require_auth
def update_advocate(advocate_id: int):
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin cannot update advocates", 403)

    a = Advocate.query.filter_by(id=advocate_id, company_id=sess.company_id).first()
    if not a:
        return error_response("Advocate not found", 404)

    payload = request.get_json(silent=True) or {}

    if "name" in payload:
        name = (payload.get("name") or "").strip()
        if not name:
            return error_response("Advocate name cannot be empty")
        a.name = name

    for field, attr in [
        ("phone", "phone"),
        ("email", "email"),
        ("barCouncilNumber", "bar_council_number"),
        ("role", "role"),
        ("status", "status"),
    ]:
        if field in payload:
            setattr(a, attr, payload.get(field))

    db.session.commit()
    return a.to_dict()


@advocates_bp.delete("/<int:advocate_id>")
@require_auth
def delete_advocate(advocate_id: int):
    sess = current_session()
    assert sess is not None
    if sess.role != "admin":
        return error_response("Only admin can delete advocates", 403)

    a = Advocate.query.filter_by(id=advocate_id, company_id=sess.company_id).first()
    if not a:
        return error_response("Advocate not found", 404)

    db.session.delete(a)
    db.session.commit()
    return {"status": "deleted"}
