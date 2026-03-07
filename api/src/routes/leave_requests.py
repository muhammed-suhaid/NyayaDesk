from datetime import datetime

from flask import Blueprint, request

from src.db import db
from src.models.advocate import Advocate
from src.models.leave_request import LeaveRequest
from src.models.notification import Notification
from src.utils.auth import current_session, require_auth
from src.utils.http import error_response, success_response


leave_bp = Blueprint("leave", __name__)


@leave_bp.post("")
@require_auth
def submit_leave_request():
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin cannot submit leave", 403)

    if sess.role != "advocate":
        return error_response("Only advocates can submit leave requests", 403)

    payload = request.get_json(silent=True) or {}

    reason = (payload.get("reason") or "").strip()
    if not payload.get("fromDate"):
        return error_response("fromDate is required")
    if not payload.get("toDate"):
        return error_response("toDate is required")
    if not reason:
        return error_response("reason is required")

    from src.models.user import User

    user = User.query.get(sess.user_id)
    if not user:
        return error_response("User not found", 404)

    advocate = Advocate.query.filter_by(email=user.email, company_id=sess.company_id).first()
    if not advocate:
        return error_response("Advocate not found", 404)

    try:
        start_date = datetime.strptime(payload.get("fromDate"), "%Y-%m-%d").date()
        end_date = datetime.strptime(payload.get("toDate"), "%Y-%m-%d").date()
    except Exception:
        return error_response("Invalid fromDate/toDate")

    if end_date < start_date:
        return error_response("fromDate must be earlier than or equal to toDate")

    req = LeaveRequest(
        company_id=sess.company_id,
        advocate_id=advocate.id,
        start_date=start_date,
        end_date=end_date,
        reason=reason,
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

    return success_response("Leave request submitted", 201, leave=req.to_dict())


@leave_bp.get("")
@require_auth
def list_leave_requests():
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin must use /superadmin endpoints", 403)

    q = LeaveRequest.query.filter(LeaveRequest.company_id == sess.company_id)

    if sess.role == "advocate":
        from src.models.user import User

        user = User.query.get(sess.user_id)
        if not user:
            return error_response("User not found", 404)
        advocate = Advocate.query.filter_by(email=user.email, company_id=sess.company_id).first()
        if not advocate:
            return error_response("Advocate not found", 404)
        q = q.filter(LeaveRequest.advocate_id == advocate.id)
    elif sess.role != "admin":
        return error_response("Forbidden", 403)

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
    status_raw = (payload.get("status") or "").strip().lower()
    if status_raw not in {"pending", "approved", "rejected"}:
        return error_response("Invalid status")

    req.status = status_raw

    # Get advocate name for the notification
    advocate = Advocate.query.get(req.advocate_id)
    advocate_name = advocate.name if advocate else "Unknown advocate"

    db.session.add(
        Notification(
            company_id=sess.company_id,
            title="Leave request updated",
            message=f"{advocate_name}'s leave request is now {status_raw}.",
            category="leave",
        )
    )

    db.session.commit()
    return success_response("Leave request updated", leave=req.to_dict())
