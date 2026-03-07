from datetime import datetime
from flask import Blueprint, request

from src.db import db
from src.models.notification import Notification
from src.models.notification_read import NotificationRead
from src.utils.auth import current_session, require_auth
from src.utils.http import error_response, success_response


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
    elif sess.role == "admin":
        # Admins see all company notifications
        q = Notification.query.filter(Notification.company_id == sess.company_id)
    elif sess.role == "advocate":
        # Advocates see filtered notifications
        q = Notification.query.filter(Notification.company_id == sess.company_id)
        
        # Filter notifications based on relevance to the advocate
        from src.models.user import User
        from src.models.advocate import Advocate
        
        user = User.query.get(sess.user_id)
        if not user:
            return error_response("User not found", 404)
            
        advocate = Advocate.query.filter_by(email=user.email, company_id=sess.company_id).first()
        if not advocate:
            return error_response("Advocate not found", 404)
        
        # Get leave requests for this advocate to include their leave notifications
        from src.models.leave_request import LeaveRequest
        advocate_leave_ids = [lr.id for lr in LeaveRequest.query.filter_by(advocate_id=advocate.id).all()]
        
        # Build conditions for notifications relevant to this advocate
        conditions = []
        
        # Include leave notifications for this advocate's leave requests
        if advocate_leave_ids:
            # Match leave notifications that mention this advocate's name or relate to their leave requests
            import re
            for notif in q.all():
                if notif.category == 'leave':
                    # Check if notification mentions this advocate's name
                    if advocate.name.lower() in notif.message.lower():
                        conditions.append(Notification.id == notif.id)
                    # Or if it's about their specific leave requests
                    elif any(f"Leave request #{leave_id}" in notif.message for leave_id in advocate_leave_ids):
                        conditions.append(Notification.id == notif.id)
        
        # Apply the filter if we have conditions
        if conditions:
            from sqlalchemy import or_
            q = q.filter(or_(*conditions))
        else:
            # If no relevant notifications, return empty
            q = q.filter(Notification.id == -1)
    else:
        return error_response("Forbidden", 403)

    if only_unread:
        # Get unread notifications for this specific user
        read_notification_ids = db.session.query(NotificationRead.notification_id).filter(
            NotificationRead.user_id == sess.user_id,
            NotificationRead.is_read == True
        ).subquery()
        q = q.filter(~Notification.id.in_(read_notification_ids))

    notifications = q.order_by(Notification.created_at.desc()).limit(limit).all()
    
    # Get read status for each notification for this user
    result = []
    for notif in notifications:
        notif_dict = notif.to_dict()
        
        # Check if this user has read this notification
        read_status = NotificationRead.query.filter_by(
            notification_id=notif.id,
            user_id=sess.user_id
        ).first()
        
        notif_dict["isRead"] = read_status.is_read if read_status else False
        result.append(notif_dict)
    
    return success_response("Notifications retrieved", data=result)


@notifications_bp.put("/<int:notification_id>/read")
@require_auth
def mark_read(notification_id: int):
    sess = current_session()
    assert sess is not None

    if sess.role == "super_admin":
        n = Notification.query.filter_by(id=notification_id, company_id=None).first()
    elif sess.role == "admin":
        n = Notification.query.filter_by(id=notification_id, company_id=sess.company_id).first()
    elif sess.role == "advocate":
        # Advocates can only mark notifications that are relevant to them
        n = Notification.query.filter_by(id=notification_id, company_id=sess.company_id).first()
        if not n:
            return error_response("Notification not found", 404)
        
        # Check if this notification is relevant to the advocate
        from src.models.user import User
        from src.models.advocate import Advocate
        
        user = User.query.get(sess.user_id)
        if not user:
            return error_response("User not found", 404)
            
        advocate = Advocate.query.filter_by(email=user.email, company_id=sess.company_id).first()
        if not advocate:
            return error_response("Advocate not found", 404)
        
        # Check relevance
        is_relevant = False
        if n.category == 'leave':
            # Check if notification mentions this advocate's name
            if advocate.name.lower() in n.message.lower():
                is_relevant = True
            # Or check if it's about their leave requests
            else:
                from src.models.leave_request import LeaveRequest
                advocate_leave_ids = [lr.id for lr in LeaveRequest.query.filter_by(advocate_id=advocate.id).all()]
                if any(f"Leave request #{leave_id}" in n.message for leave_id in advocate_leave_ids):
                    is_relevant = True
        
        if not is_relevant:
            return error_response("Notification not accessible", 403)
    else:
        return error_response("Forbidden", 403)
        
    if not n:
        return error_response("Notification not found", 404)

    # Create or update read status for this specific user
    read_status = NotificationRead.query.filter_by(
        notification_id=notification_id,
        user_id=sess.user_id
    ).first()
    
    if read_status:
        read_status.is_read = True
        read_status.updated_at = datetime.utcnow()
    else:
        read_status = NotificationRead(
            notification_id=notification_id,
            user_id=sess.user_id,
            is_read=True
        )
        db.session.add(read_status)
    
    db.session.commit()
    return success_response("Notification marked read")


@notifications_bp.put("/read-all")
@require_auth
def mark_all_read():
    sess = current_session()
    assert sess is not None

    # Get notifications based on role
    if sess.role == "super_admin":
        notifications = Notification.query.filter(Notification.company_id.is_(None)).all()
    elif sess.role == "admin":
        notifications = Notification.query.filter(Notification.company_id == sess.company_id).all()
    elif sess.role == "advocate":
        # Get only notifications relevant to this advocate
        notifications = Notification.query.filter(Notification.company_id == sess.company_id).all()
        
        # Filter by relevance
        from src.models.user import User
        from src.models.advocate import Advocate
        
        user = User.query.get(sess.user_id)
        if not user:
            return error_response("User not found", 404)
            
        advocate = Advocate.query.filter_by(email=user.email, company_id=sess.company_id).first()
        if not advocate:
            return error_response("Advocate not found", 404)
        
        # Get leave requests for this advocate
        from src.models.leave_request import LeaveRequest
        advocate_leave_ids = [lr.id for lr in LeaveRequest.query.filter_by(advocate_id=advocate.id).all()]
        
        # Filter notifications by relevance
        relevant_notifications = []
        for notif in notifications:
            if notif.category == 'leave':
                # Check if notification mentions this advocate's name
                if advocate.name.lower() in notif.message.lower():
                    relevant_notifications.append(notif)
                # Or if it's about their leave requests
                elif any(f"Leave request #{leave_id}" in notif.message for leave_id in advocate_leave_ids):
                    relevant_notifications.append(notif)
        
        notifications = relevant_notifications
    else:
        return error_response("Forbidden", 403)

    # Mark all relevant notifications as read for this specific user
    for notif in notifications:
        read_status = NotificationRead.query.filter_by(
            notification_id=notif.id,
            user_id=sess.user_id
        ).first()
        
        if not read_status:
            read_status = NotificationRead(
                notification_id=notif.id,
                user_id=sess.user_id,
                is_read=True
            )
            db.session.add(read_status)
        elif not read_status.is_read:
            read_status.is_read = True
            read_status.updated_at = datetime.utcnow()

    db.session.commit()
    return success_response("All notifications marked read")
