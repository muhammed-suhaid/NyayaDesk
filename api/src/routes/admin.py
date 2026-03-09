from __future__ import annotations

from flask import Blueprint, request

from src.db import db
from src.models.advocate import Advocate
from src.models.user import User
from src.utils.auth import current_session, require_role
from src.utils.http import error_response, success_response


admin_bp = Blueprint("admin", __name__)


@admin_bp.post("/users")
@require_role("admin")
def create_advocate_user():
    sess = current_session()
    assert sess is not None

    payload = request.get_json(silent=True) or {}

    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    phone = (payload.get("phone") or "").strip()
    password = payload.get("password") or ""
    bar_council_number = (payload.get("barCouncilNumber") or "").strip()

    missing = []
    if not name:
        missing.append("name")
    if not email:
        missing.append("email")
    if not phone:
        missing.append("phone")
    if not password:
        missing.append("password")
    if not bar_council_number:
        missing.append("barCouncilNumber")
    if missing:
        return error_response(f"Missing required fields: {', '.join(missing)}")

    if len(password) < 6:
        return error_response("password must be at least 6 characters")

    existing = User.query.filter(User.email == email).first()
    if existing:
        return error_response("Email already exists", 409)

    user = User(
        company_id=sess.company_id,
        name=name,
        email=email,
        phone=phone or None,
        password=password,
        role="advocate",
        status="active",
    )
    db.session.add(user)
    db.session.flush()

    advocate = Advocate(
        company_id=sess.company_id,
        name=name,
        email=email,
        phone=phone or None,
        bar_council_number=bar_council_number,
        role="Advocate",
        status="Active",
    )
    db.session.add(advocate)
    db.session.commit()

    return success_response("Advocate created", 201, user=user.to_safe_dict(), advocate=advocate.to_dict())


@admin_bp.delete("/users/<int:user_id>")
@require_role("admin")
def delete_user(user_id: int):
    sess = current_session()
    assert sess is not None

    user = User.query.filter_by(id=user_id, company_id=sess.company_id).first()
    if not user:
        return error_response("User not found", 404)
    
    if user.role == "admin":
        return error_response("Cannot delete admin users", 403)

    # Check if advocate has associated cases
    if user.role == "advocate":
        from src.models.case import Case
        from src.models.advocate import Advocate
        
        advocate = Advocate.query.filter_by(email=user.email, company_id=sess.company_id).first()
        if advocate:
            case_count = Case.query.filter_by(assigned_advocate_id=advocate.id).count()
            if case_count > 0:
                return error_response(f"⚠️ Cannot delete advocate '{advocate.name}' because they are assigned to {case_count} case(s). Please reassign all cases to other advocates first.", 400)
            
            # Check if advocate has attendance records
            from src.models.attendance import Attendance
            attendance_count = Attendance.query.filter_by(advocate_id=advocate.id).count()
            if attendance_count > 0:
                return error_response(f"⚠️ Cannot delete advocate '{advocate.name}' because they have {attendance_count} attendance record(s). Please handle attendance records first.", 400)

    # Delete the advocate record if exists
    if user.role == "advocate":
        advocate = Advocate.query.filter_by(email=user.email, company_id=sess.company_id).first()
        if advocate:
            db.session.delete(advocate)
    
    # Delete the user record
    try:
        # Add notification before deletion
        from src.models.notification import Notification
        db.session.add(
            Notification(
                company_id=sess.company_id,
                title="User deleted",
                message=f"User '{user.name}' was removed from the firm.",
                category="user",
            )
        )
        
        db.session.delete(user)
        db.session.commit()
        return success_response("User deleted")
    except Exception as e:
        db.session.rollback()
        return error_response(f"Failed to delete user: {str(e)}", 500)


@admin_bp.put("/users/<int:user_id>")
@require_role("admin")
def update_user(user_id: int):
    sess = current_session()
    assert sess is not None

    user = User.query.filter_by(id=user_id, company_id=sess.company_id).first()
    if not user:
        return error_response("User not found", 404)
    
    if user.role == "admin":
        return error_response("Cannot modify admin users", 403)

    payload = request.get_json(silent=True) or {}
    
    # Update user fields
    if "name" in payload:
        name = (payload.get("name") or "").strip()
        if not name:
            return error_response("Name cannot be empty")
        user.name = name
    
    if "phone" in payload:
        user.phone = payload.get("phone") or None
    
    if "email" in payload:
        email = (payload.get("email") or "").strip().lower()
        if not email:
            return error_response("Email cannot be empty")
        # Check if email is already used by another user
        existing_user = User.query.filter(User.email == email, User.id != user_id).first()
        if existing_user:
            return error_response("Email is already in use", 400)
        user.email = email
    
    if "password" in payload:
        password = payload.get("password")
        if not password or len(password) < 6:
            return error_response("Password must be at least 6 characters", 400)
        user.password = password
    
    if "status" in payload:
        status = payload.get("status")
        if status not in ["active", "inactive"]:
            return error_response("Invalid status. Must be 'active' or 'inactive'", 400)
        user.status = status

    # Update corresponding advocate record if exists
    if user.role == "advocate":
        advocate = Advocate.query.filter_by(email=user.email, company_id=sess.company_id).first()
        if advocate:
            if "name" in payload:
                advocate.name = user.name
            if "phone" in payload:
                advocate.phone = user.phone
            if "email" in payload:
                advocate.email = user.email
            if "barCouncilNumber" in payload:
                bar_council_number = (payload.get("barCouncilNumber") or "").strip()
                if not bar_council_number:
                    return error_response("Bar council number cannot be empty", 400)
                advocate.bar_council_number = bar_council_number
            if "status" in payload:
                advocate.status = "Active" if user.status == "active" else "Inactive"

    db.session.commit()
    return success_response("User updated", user=user.to_safe_dict())
