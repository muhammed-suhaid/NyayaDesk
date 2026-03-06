from flask import Blueprint, request

from src.db import db
from src.models.advocate import Advocate
from src.models.case import Case
from src.utils.http import error_response


advocates_bp = Blueprint("advocates", __name__)


@advocates_bp.post("")
def create_advocate():
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    if not name:
        return error_response("Advocate name is required")

    a = Advocate(
        name=name,
        phone=payload.get("phone"),
        email=payload.get("email"),
        bar_council_number=payload.get("barCouncilNumber"),
        role=payload.get("role") or "Advocate",
        status=payload.get("status") or "Active",
    )
    db.session.add(a)
    db.session.commit()
    return a.to_dict(), 201


@advocates_bp.get("")
def list_advocates():
    advocates = Advocate.query.order_by(Advocate.created_at.desc()).all()

    include_workload = request.args.get("includeWorkload") == "1"
    if not include_workload:
        return [a.to_dict() for a in advocates]

    result = []
    for a in advocates:
        open_cases = (
            Case.query.filter(Case.assigned_advocate_id == a.id)
            .filter(Case.current_status != "Closed")
            .count()
        )
        data = a.to_dict()
        data["openCaseCount"] = open_cases
        result.append(data)

    return result


@advocates_bp.put("/<int:advocate_id>")
def update_advocate(advocate_id: int):
    a = Advocate.query.get(advocate_id)
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
def delete_advocate(advocate_id: int):
    a = Advocate.query.get(advocate_id)
    if not a:
        return error_response("Advocate not found", 404)

    db.session.delete(a)
    db.session.commit()
    return {"status": "deleted"}
