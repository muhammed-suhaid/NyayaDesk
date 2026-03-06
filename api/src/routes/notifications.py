from flask import Blueprint, request

from src.db import db
from src.models.notification import Notification
from src.utils.auth import current_session, require_auth
from src.utils.http import error_response


notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.get("")
@require_auth
def list_notifications():
    sess = current_session()
    assert sess is not None

    limit = int(request.args.get("limit", "50"))
    only_unread = request.args.get("unread") == "1"

    if sess.role == "super_admin":
        q = Notification.query.filter(Notification.company_id.is_(None))
    else:
        q = Notification.query.filter(Notification.company_id == sess.company_id)

    if only_unread:
        q = q.filter(Notification.is_read.is_(False))

    notifications = q.order_by(Notification.created_at.desc()).limit(limit).all()
    return [n.to_dict() for n in notifications]


@notifications_bp.put("/<int:notification_id>/read")
@require_auth
def mark_read(notification_id: int):
    sess = current_session()
    assert sess is not None

    if sess.role == "super_admin":
        n = Notification.query.filter_by(id=notification_id, company_id=None).first()
    else:
        n = Notification.query.filter_by(id=notification_id, company_id=sess.company_id).first()
    if not n:
        return error_response("Notification not found", 404)

    n.is_read = True
    db.session.commit()
    return n.to_dict()


@notifications_bp.put("/read-all")
@require_auth
def mark_all_read():
    sess = current_session()
    assert sess is not None

    q = Notification.query.filter(Notification.is_read.is_(False))
    if sess.role == "super_admin":
        q = q.filter(Notification.company_id.is_(None))
    else:
        q = q.filter(Notification.company_id == sess.company_id)

    q.update({Notification.is_read: True})
    db.session.commit()
    return {"status": "ok"}
