from datetime import datetime

from flask import Blueprint, request
from sqlalchemy import func

from src.db import db
from src.models.attendance import Attendance
from src.models.case import Case
from src.utils.http import error_response


reports_bp = Blueprint("reports", __name__)


@reports_bp.get("/cases-by-district")
def cases_by_district():
    rows = db.session.query(Case.district, func.count(Case.id)).group_by(Case.district).all()
    return [{"district": r[0] or "(Not set)", "count": r[1]} for r in rows]


@reports_bp.get("/cases-by-advocate")
def cases_by_advocate():
    rows = (
        db.session.query(Case.assigned_advocate_id, func.count(Case.id))
        .group_by(Case.assigned_advocate_id)
        .all()
    )
    return [{"advocateId": r[0], "count": r[1]} for r in rows]


@reports_bp.get("/upcoming-hearings")
def upcoming_hearings():
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
        Case.query.filter(Case.next_hearing_date.isnot(None))
        .filter(Case.next_hearing_date >= start)
        .filter(Case.next_hearing_date <= end)
        .order_by(Case.next_hearing_date.asc())
        .all()
    )

    return [c.to_dict(include_advocate=True) for c in cases]


@reports_bp.get("/attendance")
def attendance_report():
    advocate_id = request.args.get("advocateId")
    from_date = request.args.get("from")
    to_date = request.args.get("to")

    q = Attendance.query
    if advocate_id:
        q = q.filter(Attendance.advocate_id == int(advocate_id))

    if from_date:
        q = q.filter(Attendance.day >= datetime.strptime(from_date, "%Y-%m-%d").date())
    if to_date:
        q = q.filter(Attendance.day <= datetime.strptime(to_date, "%Y-%m-%d").date())

    rows = q.order_by(Attendance.day.desc()).limit(1000).all()
    return [r.to_dict() for r in rows]
