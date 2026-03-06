from flask import Blueprint, request

from src.db import db
from src.models.notification import Notification
from src.utils.http import error_response


notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.get("")
def list_notifications():
    limit = int(request.args.get("limit", "50"))
    only_unread = request.args.get("unread") == "1"

    q = Notification.query
    if only_unread:
        q = q.filter(Notification.is_read.is_(False))

    notifications = q.order_by(Notification.created_at.desc()).limit(limit).all()
    return [n.to_dict() for n in notifications]


@notifications_bp.put("/<int:notification_id>/read")
def mark_read(notification_id: int):
    n = Notification.query.get(notification_id)
    if not n:
        return error_response("Notification not found", 404)

    n.is_read = True
    db.session.commit()
    return n.to_dict()


@notifications_bp.put("/read-all")
def mark_all_read():
    Notification.query.filter(Notification.is_read.is_(False)).update({Notification.is_read: True})
    db.session.commit()
    return {"status": "ok"}
