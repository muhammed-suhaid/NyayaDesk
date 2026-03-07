from datetime import date, datetime

from flask import Blueprint, request

from src.db import db
from src.models.advocate import Advocate
from src.models.attendance import Attendance
from src.utils.auth import current_session, require_auth
from src.utils.http import error_response, success_response


attendance_bp = Blueprint("attendance", __name__)


@attendance_bp.post("")
@require_auth
def mark_attendance():
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin cannot mark attendance", 403)

    if sess.role != "advocate":
        return error_response("Only advocates can mark attendance", 403)

    payload = request.get_json(silent=True) or {}

    from src.models.user import User

    user = User.query.get(sess.user_id)
    if not user:
        return error_response("User not found", 404)

    advocate = Advocate.query.filter_by(email=user.email, company_id=sess.company_id).first()
    if not advocate:
        return error_response("Advocate not found", 404)

    day = date.today()

    record = Attendance.query.filter_by(company_id=sess.company_id, advocate_id=advocate.id, day=day).first()
    if not record:
        record = Attendance(company_id=sess.company_id, advocate_id=advocate.id, day=day)
        db.session.add(record)

    if "checkInTime" in payload:
        t = payload.get("checkInTime")
        record.check_in_time = datetime.strptime(t, "%H:%M").time() if t else None

    if "checkOutTime" in payload:
        t = payload.get("checkOutTime")
        record.check_out_time = datetime.strptime(t, "%H:%M").time() if t else None

    if "status" in payload:
        status = (payload.get("status") or "").strip().lower()
        if status not in {"present", "absent"}:
            return error_response("Invalid attendance status", 400)
        record.status = status

    db.session.commit()
    return success_response("Attendance saved", 201, attendance=record.to_dict())


@attendance_bp.get("")
@require_auth
def list_attendance():
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin must use /superadmin endpoints", 403)

    advocate_id = request.args.get("advocateId")
    month = request.args.get("month")
    summary = request.args.get("summary")

    q = Attendance.query.filter(Attendance.company_id == sess.company_id)

    if sess.role == "advocate":
        from src.models.user import User

        user = User.query.get(sess.user_id)
        if not user:
            return error_response("User not found", 404)
        advocate = Advocate.query.filter_by(email=user.email, company_id=sess.company_id).first()
        if not advocate:
            return error_response("Advocate not found", 404)
        q = q.filter(Attendance.advocate_id == advocate.id)
    else:
        # admin can optionally filter by advocateId
        if advocate_id:
            q = q.filter(Attendance.advocate_id == int(advocate_id))

    if month:
        try:
            y, m = month.split("-", 1)
            y = int(y)
            m = int(m)
            start = date(y, m, 1)
            end = date(y + (1 if m == 12 else 0), 1 if m == 12 else (m + 1), 1)
            q = q.filter(Attendance.day >= start, Attendance.day < end)
        except Exception:
            return error_response("month must be in YYYY-MM format", 400)

    if summary and sess.role == "admin":
        records = q.all()
        by_adv = {}
        for r in records:
            row = by_adv.setdefault(
                r.advocate_id,
                {
                    "advocateId": r.advocate_id,
                    "advocateName": r.advocate.name if r.advocate else None,
                    "presentDays": 0,
                    "absentDays": 0,
                    "total": 0,
                },
            )
            row["total"] += 1
            if r.status == "present":
                row["presentDays"] += 1
            elif r.status == "absent":
                row["absentDays"] += 1

        return {
            "month": month,
            "summary": list(by_adv.values()),
        }

    records = q.order_by(Attendance.day.desc()).limit(500).all()
    return [r.to_dict() for r in records]
