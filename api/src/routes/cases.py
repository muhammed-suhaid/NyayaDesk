from datetime import date, datetime

from flask import Blueprint, request

from src.db import db
from src.models.case import Case
from src.models.case_client import CaseClient
from src.models.client import Client
from src.models.notification import Notification
from src.utils.auth import current_session, require_auth
from src.utils.http import error_response, success_response


cases_bp = Blueprint("cases", __name__)


def _parse_date(value):
    if value is None or value == "":
        return None
    if isinstance(value, date):
        return value
    return datetime.strptime(value, "%Y-%m-%d").date()


@cases_bp.post("")
@require_auth
def create_case():
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin cannot create cases", 403)

    payload = request.get_json(silent=True) or {}

    title = (payload.get("title") or "").strip()
    if not title:
        return error_response("Case title is required")

    new_case = Case(
        company_id=sess.company_id,
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
        assigned_advocate_id=None,
    )

    assigned_advocate_id = payload.get("assignedAdvocateId")
    if assigned_advocate_id is not None:
        try:
            aid = int(assigned_advocate_id)
        except Exception:
            return error_response("Invalid assignedAdvocateId")
        from src.models.advocate import Advocate

        advocate = Advocate.query.filter_by(id=aid, company_id=sess.company_id).first()
        if not advocate:
            return error_response("Assigned advocate not found", 400)
        new_case.assigned_advocate_id = advocate.id

    db.session.add(new_case)
    db.session.flush()

    client_ids = payload.get("clientIds") or []
    if isinstance(client_ids, list):
        for cid in client_ids:
            client = Client.query.filter_by(id=cid, company_id=sess.company_id).first()
            if client:
                db.session.add(CaseClient(case_id=new_case.id, client_id=client.id))

    db.session.add(
        Notification(
            company_id=sess.company_id,
            title="Case created",
            message=f"Case '{new_case.title}' was created.",
            category="case",
        )
    )

    db.session.commit()

    return success_response(
        "Case created",
        201,
        case=new_case.to_dict(include_clients=True, include_advocate=True),
    )


@cases_bp.get("")
@require_auth
def list_cases():
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin must use /superadmin endpoints", 403)

    q = Case.query.filter(Case.company_id == sess.company_id)

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
@require_auth
def get_case(case_id: int):
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin must use /superadmin endpoints", 403)

    c = Case.query.filter_by(id=case_id, company_id=sess.company_id).first()
    if not c:
        return error_response("Case not found", 404)
    return c.to_dict(include_clients=True, include_advocate=True)


@cases_bp.put("/<int:case_id>")
@require_auth
def update_case(case_id: int):
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin cannot update cases", 403)

    c = Case.query.filter_by(id=case_id, company_id=sess.company_id).first()
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
            if field == "assignedAdvocateId":
                from src.models.advocate import Advocate

                aid = payload.get(field)
                if aid is None or aid == "":
                    c.assigned_advocate_id = None
                else:
                    try:
                        aid_int = int(aid)
                    except Exception:
                        return error_response("Invalid assignedAdvocateId")
                    advocate = Advocate.query.filter_by(id=aid_int, company_id=sess.company_id).first()
                    if not advocate:
                        return error_response("Assigned advocate not found", 400)
                    c.assigned_advocate_id = advocate.id
            else:
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
            client = Client.query.filter_by(id=cid, company_id=sess.company_id).first()
            if client:
                db.session.add(CaseClient(case_id=c.id, client_id=client.id))

    db.session.add(
        Notification(
            company_id=sess.company_id,
            title="Case updated",
            message=f"Case '{c.title}' was updated.",
            category="case",
        )
    )

    db.session.commit()
    return success_response(
        "Case updated",
        case=c.to_dict(include_clients=True, include_advocate=True),
    )


@cases_bp.delete("/<int:case_id>")
@require_auth
def delete_case(case_id: int):
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin cannot delete cases", 403)

    c = Case.query.filter_by(id=case_id, company_id=sess.company_id).first()
    if not c:
        return error_response("Case not found", 404)

    db.session.delete(c)

    db.session.add(
        Notification(
            company_id=sess.company_id,
            title="Case deleted",
            message=f"Case '{c.title}' was deleted.",
            category="case",
        )
    )

    db.session.commit()
    return success_response("Case deleted")
