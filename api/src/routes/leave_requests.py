from datetime import datetime

from flask import Blueprint, request

from src.db import db
from src.models.advocate import Advocate
from src.models.leave_request import LeaveRequest
from src.models.notification import Notification
from src.utils.auth import current_session, require_auth
from src.utils.http import error_response


leave_bp = Blueprint("leave", __name__)


@leave_bp.post("")
@require_auth
def submit_leave_request():
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin cannot submit leave", 403)

    payload = request.get_json(silent=True) or {}

    advocate_id = payload.get("advocateId")
    if not advocate_id:
        return error_response("advocateId is required")

    advocate = Advocate.query.filter_by(id=advocate_id, company_id=sess.company_id).first()
    if not advocate:
        return error_response("Advocate not found", 404)

    try:
        start_date = datetime.strptime(payload.get("startDate"), "%Y-%m-%d").date()
        end_date = datetime.strptime(payload.get("endDate"), "%Y-%m-%d").date()
    except Exception:
        return error_response("Invalid startDate/endDate")

    if end_date < start_date:
        return error_response("endDate cannot be earlier than startDate")

    req = LeaveRequest(
        company_id=sess.company_id,
        advocate_id=advocate.id,
        start_date=start_date,
        end_date=end_date,
        reason=payload.get("reason"),
        status="pending",
    )

    db.session.add(req)
    db.session.add(
        Notification(
            company_id=sess.company_id,
            title="Leave requested",
            message=f"{advocate.name} requested leave from {start_date} to {end_date}.",
            category="leave",
        )
    )
    db.session.commit()

    return req.to_dict(), 201


@leave_bp.get("")
@require_auth
def list_leave_requests():
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin must use /superadmin endpoints", 403)

    advocate_id = request.args.get("advocateId")
    q = LeaveRequest.query.filter(LeaveRequest.company_id == sess.company_id)
    if advocate_id:
        q = q.filter(LeaveRequest.advocate_id == int(advocate_id))

    reqs = q.order_by(LeaveRequest.created_at.desc()).limit(500).all()
    return [r.to_dict() for r in reqs]


@leave_bp.put("/<int:leave_id>")
@require_auth
def update_leave_status(leave_id: int):
    sess = current_session()
    assert sess is not None
    if sess.role != "admin":
        return error_response("Only admin can approve/reject leave", 403)

    req = LeaveRequest.query.filter_by(id=leave_id, company_id=sess.company_id).first()
    if not req:
        return error_response("Leave request not found", 404)

    payload = request.get_json(silent=True) or {}
    status = payload.get("status")
    if status not in {"pending", "approved", "rejected"}:
        return error_response("Invalid status")

    req.status = status

    db.session.add(
        Notification(
            company_id=sess.company_id,
            title="Leave request updated",
            message=f"Leave request #{req.id} is now {status}.",
            category="leave",
        )
    )

    db.session.commit()
    return req.to_dict()
