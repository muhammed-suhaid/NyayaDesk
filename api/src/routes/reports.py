from datetime import datetime

from flask import Blueprint, request
from sqlalchemy import func

from src.db import db
from src.models.attendance import Attendance
from src.models.case import Case
from src.utils.auth import current_session, require_auth
from src.utils.http import error_response


reports_bp = Blueprint("reports", __name__)


@reports_bp.get("/summary")
@require_auth
def dashboard_summary():
    sess = current_session()
    assert sess is not None
    
    total_cases = Case.query.filter_by(company_id=sess.company_id).count()
    active_cases = Case.query.filter(Case.company_id == sess.company_id, Case.current_status.notin_(["Disposed", "Closed"])).count()
    
    from src.models.hearing import Hearing
    from datetime import date
    upcoming_hearings = Hearing.query.filter(Hearing.company_id == sess.company_id, Hearing.hearing_date >= date.today()).count()
    
    return {
        "totalCases": total_cases,
        "activeCases": active_cases,
        "upcomingHearings": upcoming_hearings,
        "pendingTasks": 0  # Placeholder for future task module
    }


@reports_bp.get("/cases-by-status")
@require_auth
def cases_by_status():
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin must use /superadmin endpoints", 403)

    rows = (
        db.session.query(Case.current_status, func.count(Case.id))
        .filter(Case.company_id == sess.company_id)
        .group_by(Case.current_status)
        .all()
    )
    return [{"status": r[0] or "Unknown", "count": r[1]} for r in rows]


@reports_bp.get("/cases-by-group")
@require_auth
def cases_by_group():
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin must use /superadmin endpoints", 403)

    rows = (
        db.session.query(Case.case_group, func.count(Case.id))
        .filter(Case.company_id == sess.company_id)
        .group_by(Case.case_group)
        .all()
    )
    return [{"group": r[0] or "Other", "count": r[1]} for r in rows]


@reports_bp.get("/case-trends")
@require_auth
def case_trends():
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin must use /superadmin endpoints", 403)

    # Simplified trend logic for different DB backends (sqlite vs postgres)
    # Group by month and year of created_at
    # Since we might be on SQLite, we'll use string formatting or date functions
    
    # Let's get all cases for the company and group in Python for maximum compatibility if needed,
    # but try SQL first.
    
    # For SQLite, strftime is common.
    from sqlalchemy import text
    try:
        rows = (
            db.session.query(func.strftime('%Y-%m', Case.created_at), func.count(Case.id))
            .filter(Case.company_id == sess.company_id)
            .group_by(func.strftime('%Y-%m', Case.created_at))
            .order_by(func.strftime('%Y-%m', Case.created_at).desc())
            .limit(6)
            .all()
        )
        # Reverse to get chronological order
        result = [{"month": r[0], "count": r[1]} for r in reversed(rows)]
    except Exception:
        # Fallback for other DBs if strftime fails
        # Get last 6 months records and group in memory
        from datetime import datetime, timedelta
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        cases = Case.query.filter(Case.company_id == sess.company_id, Case.created_at >= six_months_ago).all()
        
        counts = {}
        for c in cases:
            m = c.created_at.strftime('%Y-%m')
            counts[m] = counts.get(m, 0) + 1
        
        sorted_months = sorted(counts.keys())
        result = [{"month": m, "count": counts[m]} for m in sorted_months]

    return result


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
