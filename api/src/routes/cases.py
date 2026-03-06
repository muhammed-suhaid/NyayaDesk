from datetime import date, datetime

from flask import Blueprint, request

from src.db import db
from src.models.case import Case
from src.models.case_client import CaseClient
from src.models.client import Client
from src.models.notification import Notification
from src.utils.http import error_response


cases_bp = Blueprint("cases", __name__)


def _parse_date(value):
    if value is None or value == "":
        return None
    if isinstance(value, date):
        return value
    return datetime.strptime(value, "%Y-%m-%d").date()


@cases_bp.post("")
def create_case():
    payload = request.get_json(silent=True) or {}

    title = (payload.get("title") or "").strip()
    if not title:
        return error_response("Case title is required")

    new_case = Case(
        title=title,
        case_number=payload.get("caseNumber"),
        case_type=payload.get("caseType"),
        case_group=payload.get("caseGroup"),
        court_name=payload.get("courtName"),
        district=payload.get("district"),
        state=payload.get("state") or "Kerala",
        next_hearing_date=_parse_date(payload.get("nextHearingDate")),
        current_status=payload.get("currentStatus"),
        next_purpose=payload.get("nextPurpose"),
        description=payload.get("description"),
        assigned_advocate_id=payload.get("assignedAdvocateId"),
    )

    db.session.add(new_case)
    db.session.flush()

    client_ids = payload.get("clientIds") or []
    if isinstance(client_ids, list):
        for cid in client_ids:
            client = Client.query.get(cid)
            if client:
                db.session.add(CaseClient(case_id=new_case.id, client_id=client.id))

    db.session.add(
        Notification(
            title="Case created",
            message=f"Case '{new_case.title}' was created.",
            category="case",
        )
    )

    db.session.commit()

    return new_case.to_dict(include_clients=True, include_advocate=True), 201


@cases_bp.get("")
def list_cases():
    q = Case.query

    status = request.args.get("status")
    advocate_id = request.args.get("advocateId")
    district = request.args.get("district")
    from_date = request.args.get("from")
    to_date = request.args.get("to")
    hearing_date = request.args.get("hearingDate")

    if status:
        q = q.filter(Case.current_status == status)
    if advocate_id:
        q = q.filter(Case.assigned_advocate_id == int(advocate_id))
    if district:
        q = q.filter(Case.district == district)

    if hearing_date:
        q = q.filter(Case.next_hearing_date == _parse_date(hearing_date))
    else:
        if from_date:
            q = q.filter(Case.next_hearing_date >= _parse_date(from_date))
        if to_date:
            q = q.filter(Case.next_hearing_date <= _parse_date(to_date))

    cases = q.order_by(Case.updated_at.desc()).all()
    return [c.to_dict(include_advocate=True) for c in cases]


@cases_bp.get("/<int:case_id>")
def get_case(case_id: int):
    c = Case.query.get(case_id)
    if not c:
        return error_response("Case not found", 404)
    return c.to_dict(include_clients=True, include_advocate=True)


@cases_bp.put("/<int:case_id>")
def update_case(case_id: int):
    c = Case.query.get(case_id)
    if not c:
        return error_response("Case not found", 404)

    payload = request.get_json(silent=True) or {}

    if "title" in payload:
        title = (payload.get("title") or "").strip()
        if not title:
            return error_response("Case title cannot be empty")
        c.title = title

    for field, attr in [
        ("caseNumber", "case_number"),
        ("caseType", "case_type"),
        ("caseGroup", "case_group"),
        ("courtName", "court_name"),
        ("district", "district"),
        ("state", "state"),
        ("currentStatus", "current_status"),
        ("nextPurpose", "next_purpose"),
        ("description", "description"),
        ("assignedAdvocateId", "assigned_advocate_id"),
    ]:
        if field in payload:
            setattr(c, attr, payload.get(field))

    if "nextHearingDate" in payload:
        c.next_hearing_date = _parse_date(payload.get("nextHearingDate"))

    if "clientIds" in payload and isinstance(payload.get("clientIds"), list):
        new_ids = set(payload.get("clientIds") or [])
        existing_ids = {link.client_id for link in c.client_links}

        for link in list(c.client_links):
            if link.client_id not in new_ids:
                db.session.delete(link)

        for cid in new_ids - existing_ids:
            client = Client.query.get(cid)
            if client:
                db.session.add(CaseClient(case_id=c.id, client_id=client.id))

    db.session.add(
        Notification(
            title="Case updated",
            message=f"Case '{c.title}' was updated.",
            category="case",
        )
    )

    db.session.commit()
    return c.to_dict(include_clients=True, include_advocate=True)


@cases_bp.delete("/<int:case_id>")
def delete_case(case_id: int):
    c = Case.query.get(case_id)
    if not c:
        return error_response("Case not found", 404)

    db.session.delete(c)

    db.session.add(
        Notification(
            title="Case deleted",
            message=f"Case '{c.title}' was deleted.",
            category="case",
        )
    )

    db.session.commit()
    return {"status": "deleted"}
