from datetime import datetime

from flask import Blueprint, request
from sqlalchemy import func

from src.db import db
from src.models.attendance import Attendance
from src.models.case import Case
from src.utils.auth import current_session, require_auth
from src.utils.http import error_response


reports_bp = Blueprint("reports", __name__)


@reports_bp.get("/cases-by-district")
@require_auth
def cases_by_district():
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin must use /superadmin endpoints", 403)

    rows = (
        db.session.query(Case.district, func.count(Case.id))
        .filter(Case.company_id == sess.company_id)
        .group_by(Case.district)
        .all()
    )
    return [{"district": r[0] or "(Not set)", "count": r[1]} for r in rows]


@reports_bp.get("/cases-by-advocate")
@require_auth
def cases_by_advocate():
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin must use /superadmin endpoints", 403)

    rows = (
        db.session.query(Case.assigned_advocate_id, func.count(Case.id))
        .filter(Case.company_id == sess.company_id)
        .group_by(Case.assigned_advocate_id)
        .all()
    )
    return [{"advocateId": r[0], "count": r[1]} for r in rows]


@reports_bp.get("/upcoming-hearings")
@require_auth
def upcoming_hearings():
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin must use /superadmin endpoints", 403)

    from_date = request.args.get("from")
    to_date = request.args.get("to")
    if not from_date or not to_date:
        return error_response("from and to are required (YYYY-MM-DD)")

    try:
        start = datetime.strptime(from_date, "%Y-%m-%d").date()
        end = datetime.strptime(to_date, "%Y-%m-%d").date()
    except ValueError:
        return error_response("Invalid from/to date")

    cases = (
        Case.query.filter(Case.company_id == sess.company_id)
        .filter(Case.next_hearing_date.isnot(None))
        .filter(Case.next_hearing_date >= start)
        .filter(Case.next_hearing_date <= end)
        .order_by(Case.next_hearing_date.asc())
        .all()
    )

    return [c.to_dict(include_advocate=True) for c in cases]


@reports_bp.get("/attendance")
@require_auth
def attendance_report():
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin must use /superadmin endpoints", 403)

    advocate_id = request.args.get("advocateId")
    from_date = request.args.get("from")
    to_date = request.args.get("to")

    q = Attendance.query.filter(Attendance.company_id == sess.company_id)
    if advocate_id:
        q = q.filter(Attendance.advocate_id == int(advocate_id))

    if from_date:
        q = q.filter(Attendance.day >= datetime.strptime(from_date, "%Y-%m-%d").date())
    if to_date:
        q = q.filter(Attendance.day <= datetime.strptime(to_date, "%Y-%m-%d").date())

    rows = q.order_by(Attendance.day.desc()).limit(1000).all()
    return [r.to_dict() for r in rows]
