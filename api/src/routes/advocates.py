from flask import Blueprint, request

from src.db import db
from src.models.advocate import Advocate
from src.models.case import Case
from src.utils.auth import current_session, require_role, require_auth
from src.utils.http import error_response, success_response


advocates_bp = Blueprint("advocates", __name__)


@advocates_bp.post("")
@require_role("admin")
def create_advocate():
    return success_response("Use /admin/users to create advocates", 400)


@advocates_bp.get("")
@require_auth
def list_advocates():
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin must use /superadmin endpoints", 403)

    advocates = Advocate.query.filter(Advocate.company_id == sess.company_id).order_by(Advocate.created_at.desc()).all()

    include_workload = request.args.get("includeWorkload") == "1"
    if not include_workload:
        return [a.to_dict() for a in advocates]

    result = []
    for a in advocates:
        open_cases = (
            Case.query.filter(Case.company_id == sess.company_id)
            .filter(Case.assigned_advocate_id == a.id)
            .filter(Case.current_status != "Closed")
            .count()
        )
        from src.models.user import User
        user = User.query.filter_by(email=a.email, company_id=sess.company_id).first()
        data = a.to_dict()
        data["openCaseCount"] = open_cases
        data["userId"] = user.id if user else None
        result.append(data)

    return result


@advocates_bp.put("/<int:advocate_id>")
@require_auth
def update_advocate(advocate_id: int):
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin cannot update advocates", 403)

    a = Advocate.query.filter_by(id=advocate_id, company_id=sess.company_id).first()
    if not a:
        return error_response("Advocate not found", 404)

    payload = request.get_json(silent=True) or {}

    if "name" in payload:
        name = (payload.get("name") or "").strip()
        if not name:
            return error_response("Advocate name cannot be empty")
        a.name = name

    for field, attr in [
        ("phone", "phone"),
        ("email", "email"),
        ("barCouncilNumber", "bar_council_number"),
        ("role", "role"),
        ("status", "status"),
    ]:
        if field in payload:
            setattr(a, attr, payload.get(field))

    db.session.commit()
    return success_response("Advocate updated", advocate=a.to_dict())


@advocates_bp.delete("/<int:advocate_id>")
@require_auth
def delete_advocate(advocate_id: int):
    sess = current_session()
    assert sess is not None
    if sess.role == "super_admin":
        return error_response("Super admin cannot delete advocates", 403)
    if sess.role != "admin":
        return error_response("Only admin can delete advocates", 403)

    a = Advocate.query.filter_by(id=advocate_id, company_id=sess.company_id).first()
    if not a:
        return error_response("Advocate not found", 404)

    # Protect Admin users from deletion
    if a.role == "Admin":
        return error_response(f"❌ Security Restriction: Staff members with the '{a.role}' role cannot be deleted. You can set their status to Inactive if they are no longer part of the firm.", 403)

    # Check if advocate has associated cases
    from src.models.case import Case
    case_count = Case.query.filter_by(assigned_advocate_id=advocate_id).count()
    if case_count > 0:
        return error_response(f"⚠️ Cannot delete advocate '{a.name}' because they are assigned to {case_count} case(s). Please reassign all cases to other advocates first.", 400)

    # Check if advocate has attendance records
    from src.models.attendance import Attendance
    attendance_count = Attendance.query.filter_by(advocate_id=advocate_id).count()
    if attendance_count > 0:
        return error_response(f"⚠️ Cannot delete advocate '{a.name}' because they have {attendance_count} attendance record(s). Please handle attendance records first.", 400)

    # Delete the corresponding user record
    from src.models.user import User
    user = User.query.filter_by(email=a.email, company_id=sess.company_id).first()
    
    try:
        # Add notification before deletion
        from src.models.notification import Notification
        db.session.add(
            Notification(
                company_id=sess.company_id,
                title="Advocate deleted",
                message=f"Advocate '{a.name}' was deleted from the firm.",
                category="user",
            )
        )
        
        # Delete user first (if exists), then advocate
        if user:
            db.session.delete(user)
        db.session.delete(a)
        db.session.commit()
        return success_response("Advocate deleted")
    except Exception as e:
        db.session.rollback()
        return error_response(f"Failed to delete advocate: {str(e)}", 500)
