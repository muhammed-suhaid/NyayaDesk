from __future__ import annotations

from flask import Blueprint, request

from src.db import db
from src.models.company import Company
from src.models.user import User
from src.services.auth_service import create_token_for_user, revoke_token
from src.utils.auth import require_auth, current_session
from src.utils.http import error_response, success_response


auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not email or not password:
        return error_response("Email and password are required")

    user = User.query.filter(User.email == email).first()
    if not user or user.password != password:
        return error_response("Invalid credentials", 401)

    if user.status != "active":
        return error_response("User is inactive", 403)

    if user.role != "super_admin" and user.company_id is None:
        return error_response("User company not set", 400)

    if user.role != "super_admin":
        company = Company.query.get(user.company_id)
        if not company or company.status != "active":
            return error_response("Company is inactive", 403)

    user_data = user.to_safe_dict()
    if user.role == "advocate":
        from src.models.advocate import Advocate
        advocate = Advocate.query.filter_by(email=user.email, company_id=user.company_id).first()
        if advocate:
            user_data["barCouncilNumber"] = advocate.bar_council_number

    token = create_token_for_user(user.id, user.role, user.company_id)
    return {"token": token, "user": user_data}


@auth_bp.post("/register-admin")
def register_admin_company():
    payload = request.get_json(silent=True) or {}

    company_name = (payload.get("companyName") or "").strip()
    company_email = (payload.get("companyEmail") or "").strip()
    company_phone = (payload.get("companyPhone") or "").strip()
    company_address = (payload.get("companyAddress") or "").strip()

    admin_name = (payload.get("name") or "").strip()
    admin_email = (payload.get("email") or "").strip().lower()
    admin_phone = (payload.get("phone") or "").strip()
    password = payload.get("password") or ""

    if not company_name:
        return error_response("companyName is required")
    if not admin_name or not admin_email or not password:
        return error_response("name, email and password are required")

    existing = User.query.filter(User.email == admin_email).first()
    if existing:
        return error_response("Email already registered", 409)

    company = Company(
        name=company_name,
        email=company_email or None,
        phone=company_phone or None,
        address=company_address or None,
        subscription_plan=payload.get("subscriptionPlan") or "basic",
        payment_status=payload.get("paymentStatus") or "unpaid",
        status="active",
    )
    db.session.add(company)
    db.session.flush()

    admin = User(
        company_id=company.id,
        name=admin_name,
        email=admin_email,
        phone=admin_phone or None,
        password=password,
        role="admin",
        status="active",
    )
    db.session.add(admin)
    db.session.commit()

    return {"company": company.to_dict(), "admin": admin.to_safe_dict()}, 201


@auth_bp.post("/logout")
@require_auth
def logout():
    sess = current_session()
    token = (request.headers.get("Authorization") or "").split(" ", 1)[1].strip()
    revoke_token(token)
    return success_response("Logged out")


@auth_bp.put("/profile")
@require_auth
def update_profile():
    sess = current_session()
    assert sess is not None

    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    phone = (payload.get("phone") or "").strip()
    password = payload.get("password")

    user = User.query.get(sess.user_id)
    if not user:
        return error_response("User not found", 404)

    old_email = user.email
    old_role = user.role

    if name:
        user.name = name
    if phone:
        user.phone = phone
    if password is not None:
        if not str(password).strip():
            return error_response("password cannot be empty")
        if len(str(password)) < 6:
            return error_response("password must be at least 6 characters")
        user.password = str(password)

    # Sync with Advocate table if user is an advocate
    if user.role == "advocate":
        from src.models.advocate import Advocate
        advocate = Advocate.query.filter_by(email=old_email, company_id=sess.company_id).first()
        if advocate:
            if name:
                advocate.name = name
            if phone:
                advocate.phone = phone
            
            bar_council = (payload.get("barCouncilNumber") or "").strip()
            if bar_council:
                advocate.bar_council_number = bar_council

    db.session.commit()

    user_data = user.to_safe_dict()
    if user.role == "advocate":
        from src.models.advocate import Advocate
        advocate = Advocate.query.filter_by(email=user.email, company_id=user.company_id).first()
        if advocate:
            user_data["barCouncilNumber"] = advocate.bar_council_number

    return success_response("Profile updated", user=user_data)
