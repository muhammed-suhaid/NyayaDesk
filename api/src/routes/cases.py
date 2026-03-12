from datetime import date, datetime

from flask import Blueprint, request, send_file

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

    # Check if advocate is trying to create a case
    if sess.role == "advocate":
        from src.models.user import User
        from src.models.advocate import Advocate
        
        user = User.query.get(sess.user_id)
        if not user:
            return error_response("User not found", 404)
            
        advocate = Advocate.query.filter_by(email=user.email, company_id=sess.company_id).first()
        if not advocate:
            return error_response("Advocate not found", 404)
        
        # Advocates can only create cases for themselves
        assigned_advocate_id = payload.get("assignedAdvocateId")
        if assigned_advocate_id and int(assigned_advocate_id) != advocate.id:
            return error_response("Advocates can only create cases for themselves", 403)

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
    client_id = request.args.get("clientId")
    case_group = request.args.get("caseGroup")
    from_date = request.args.get("from")
    to_date = request.args.get("to")
    hearing_date = request.args.get("hearingDate")

    if status:
        q = q.filter(Case.current_status == status)
    if advocate_id:
        q = q.filter(Case.assigned_advocate_id == int(advocate_id))
    if district:
        q = q.filter(Case.district == district)
    if case_group:
        q = q.filter(Case.case_group == case_group)
    if client_id:
        q = q.join(CaseClient).filter(CaseClient.client_id == int(client_id))

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
    return c.to_dict(include_clients=True, include_advocate=True, include_details=True)


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

    if c.current_status in ["Disposed", "Closed"]:
        return error_response("Case is disposed and cannot be edited", 400)

    # Advocates can only update their own cases
    if sess.role == "advocate":
        from src.models.user import User
        from src.models.advocate import Advocate
        
        user = User.query.get(sess.user_id)
        if not user:
            return error_response("User not found", 404)
            
        advocate = Advocate.query.filter_by(email=user.email, company_id=sess.company_id).first()
        if not advocate:
            return error_response("Advocate not found", 404)
        
        if c.assigned_advocate_id != advocate.id:
            return error_response("Advocates can only update their own cases", 403)

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
                    
                    # Advocates can only assign cases to themselves
                    if sess.role == "advocate" and aid_int != c.assigned_advocate_id:
                        return error_response("Advocates can only assign cases to themselves", 403)
                    
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

    # Advocates can only delete their own cases
    if sess.role == "advocate":
        from src.models.user import User
        from src.models.advocate import Advocate
        
        user = User.query.get(sess.user_id)
        if not user:
            return error_response("User not found", 404)
            
        advocate = Advocate.query.filter_by(email=user.email, company_id=sess.company_id).first()
        if not advocate:
            return error_response("Advocate not found", 404)
        
        if c.assigned_advocate_id != advocate.id:
            return error_response("Advocates can only delete their own cases", 403)

    try:
        # Add notification before deletion
        from src.models.notification import Notification
        db.session.add(
            Notification(
                company_id=sess.company_id,
                title="Case deleted",
                message=f"Case '{c.title}' was deleted.",
                category="case",
            )
        )
        
        # Delete the case - cascade will handle client_links and documents automatically
        db.session.delete(c)
        db.session.commit()
        return success_response("Case deleted")
    except Exception as e:
        db.session.rollback()
        return error_response(f"Failed to delete case: {str(e)}", 500)


@cases_bp.post("/<int:case_id>/hearings")
@require_auth
def add_hearing(case_id: int):
    sess = current_session()
    assert sess is not None
    if sess.role not in ["admin", "advocate"]:
        return error_response("Unauthorized", 403)

    c = Case.query.filter_by(id=case_id, company_id=sess.company_id).first()
    if not c:
        return error_response("Case not found", 404)

    if c.current_status in ["Disposed", "Closed"]:
        return error_response("Case is disposed and cannot be edited", 400)

    payload = request.get_json(silent=True) or {}
    h_date_str = payload.get("hearingDate")
    if not h_date_str:
        return error_response("Hearing date is required")
        
    try:
        h_date = datetime.strptime(h_date_str, "%Y-%m-%d").date()
    except Exception:
        return error_response("Invalid date format", 400)

    from src.models.hearing import Hearing
    h = Hearing(
        company_id=sess.company_id,
        case_id=c.id,
        hearing_date=h_date,
        notes=payload.get("notes"),
        outcome=payload.get("outcome")
    )
    db.session.add(h)
    
    # Update case next hearing date if it's the latest
    if not c.next_hearing_date or h_date > c.next_hearing_date:
        c.next_hearing_date = h_date

    db.session.commit()
    return success_response("Hearing added", 201, hearing=h.to_dict())


@cases_bp.put("/<int:case_id>/hearings/<int:hearing_id>")
@require_auth
def update_hearing(case_id: int, hearing_id: int):
    sess = current_session()
    assert sess is not None
    if sess.role != "admin":
        return error_response("Only admins can manage hearings", 403)

    from src.models.hearing import Hearing
    h = Hearing.query.filter_by(id=hearing_id, case_id=case_id, company_id=sess.company_id).first()
    if not h:
        return error_response("Hearing not found", 404)

    c = Case.query.get(case_id)
    if c and c.current_status in ["Disposed", "Closed"]:
        return error_response("Case is disposed and cannot be edited", 400)

    payload = request.get_json(silent=True) or {}
    if "hearingDate" in payload:
        try:
            h.hearing_date = datetime.strptime(payload["hearingDate"], "%Y-%m-%d").date()
        except Exception:
            return error_response("Invalid date format", 400)
            
    if "notes" in payload:
        h.notes = payload["notes"]
    if "outcome" in payload:
        h.outcome = payload["outcome"]

    # Re-evaluate case next_hearing_date
    db.session.commit()
    
    # find latest hearing for the case
    latest = Hearing.query.filter_by(case_id=case_id).order_by(Hearing.hearing_date.desc()).first()
    c = Case.query.get(case_id)
    if latest:
        c.next_hearing_date = latest.hearing_date
    db.session.commit()

    return success_response("Hearing updated", hearing=h.to_dict())


@cases_bp.delete("/<int:case_id>/hearings/<int:hearing_id>")
@require_auth
def delete_hearing(case_id: int, hearing_id: int):
    sess = current_session()
    assert sess is not None
    if sess.role != "admin":
        return error_response("Only admins can manage hearings", 403)

    from src.models.hearing import Hearing
    h = Hearing.query.filter_by(id=hearing_id, case_id=case_id, company_id=sess.company_id).first()
    if not h:
        return error_response("Hearing not found", 404)

    c = Case.query.get(case_id)
    if c and c.current_status in ["Disposed", "Closed"]:
        return error_response("Case is disposed and cannot be edited", 400)

    db.session.delete(h)
    db.session.commit()
    return success_response("Hearing deleted")


@cases_bp.get("/<int:case_id>/updates")
@require_auth
def list_updates(case_id: int):
    sess = current_session()
    assert sess is not None
    
    from src.models.case_update import CaseUpdate
    updates = CaseUpdate.query.filter_by(case_id=case_id, company_id=sess.company_id).order_by(CaseUpdate.created_at.desc()).all()
    return [u.to_dict() for u in updates]


@cases_bp.post("/<int:case_id>/updates")
@require_auth
def add_update(case_id: int):
    sess = current_session()
    assert sess is not None
    
    c = Case.query.filter_by(id=case_id, company_id=sess.company_id).first()
    if not c:
        return error_response("Case not found", 404)

    payload = request.get_json(silent=True) or {}
    text = (payload.get("updateText") or "").strip()
    if not text:
        return error_response("Update text is required", 400)

    if c.current_status in ["Disposed", "Closed"]:
        return error_response("Case is disposed and cannot be edited", 400)

    from src.models.user import User
    u = User.query.get(sess.user_id)
    author_name = u.name if u else "Unknown"

    from src.models.case_update import CaseUpdate
    update = CaseUpdate(
        company_id=sess.company_id,
        case_id=c.id,
        author_name=author_name,
        update_text=text
    )
    db.session.add(update)
    db.session.commit()

    return success_response("Update added", 201, update=update.to_dict())


@cases_bp.put("/<int:case_id>/dispose")
@require_auth
def dispose_case(case_id: int):
    sess = current_session()
    assert sess is not None
    if sess.role != "admin":
        return error_response("Only admins can dispose cases", 403)

    c = Case.query.filter_by(id=case_id, company_id=sess.company_id).first()
    if not c:
        return error_response("Case not found", 404)

    payload = request.get_json(silent=True) or {}
    
    disp_date_str = payload.get("disposalDate")
    if disp_date_str:
        try:
            c.disposal_date = datetime.strptime(disp_date_str, "%Y-%m-%d").date()
        except:
            pass
    
    if "disposalReason" in payload:
        c.disposal_reason = payload["disposalReason"]
        
    if "outcome" in payload:
        c.outcome = payload["outcome"]
        
    if "status" in payload:
        c.current_status = payload["status"]
    else:
        c.current_status = "Disposed"
        
    from src.models.notification import Notification
    db.session.add(
        Notification(
            company_id=sess.company_id,
            title="Case Disposed",
            message=f"Case '{c.title}' was marked as {c.current_status}.",
            category="case",
        )
    )

    db.session.commit()
    return success_response("Case disposed", case=c.to_dict(include_details=True))


@cases_bp.get("/<int:case_id>/report")
@require_auth
def download_report(case_id: int):
    sess = current_session()
    assert sess is not None
    
    c = Case.query.filter_by(id=case_id, company_id=sess.company_id).first()
    if not c:
        return error_response("Case not found", 404)

    try:
        from src.reports.case_report import generate_case_report_pdf
        pdf_buffer = generate_case_report_pdf(c.to_dict(include_advocate=True, include_details=True))
        
        clean_num = (c.case_number or "NA").replace("/", "_").replace("\\", "_")
        filename = f"Case_Report_{clean_num}.pdf"
        
        return send_file(
            pdf_buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(tb)
        return error_response(f"PDF Error: {str(e)}\n{tb}", 500)
