from datetime import datetime

from flask import Blueprint, request

from src.db import db
from src.models.advocate import Advocate
from src.models.attendance import Attendance
from src.utils.http import error_response


attendance_bp = Blueprint("attendance", __name__)


@attendance_bp.post("")
def mark_attendance():
    payload = request.get_json(silent=True) or {}

    advocate_id = payload.get("advocateId")
    if not advocate_id:
        return error_response("advocateId is required")

    advocate = Advocate.query.get(advocate_id)
    if not advocate:
        return error_response("Advocate not found", 404)

    day_str = payload.get("date")
    if not day_str:
        return error_response("date is required (YYYY-MM-DD)")

    try:
        day = datetime.strptime(day_str, "%Y-%m-%d").date()
    except ValueError:
        return error_response("Invalid date format")

    record = Attendance.query.filter_by(advocate_id=advocate.id, day=day).first()
    if not record:
        record = Attendance(advocate_id=advocate.id, day=day)
        db.session.add(record)

    if "checkInTime" in payload:
        t = payload.get("checkInTime")
        record.check_in_time = datetime.strptime(t, "%H:%M").time() if t else None

    if "checkOutTime" in payload:
        t = payload.get("checkOutTime")
        record.check_out_time = datetime.strptime(t, "%H:%M").time() if t else None

    if "status" in payload:
        record.status = payload.get("status")

    db.session.commit()
    return record.to_dict(), 201


@attendance_bp.get("")
def list_attendance():
    advocate_id = request.args.get("advocateId")
    q = Attendance.query
    if advocate_id:
        q = q.filter(Attendance.advocate_id == int(advocate_id))

    records = q.order_by(Attendance.day.desc()).limit(500).all()
    return [r.to_dict() for r in records]
