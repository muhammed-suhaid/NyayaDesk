from __future__ import annotations

from flask import Blueprint, request

from src.db import db
from src.models.advocate import Advocate
from src.models.user import User
from src.utils.auth import current_session, require_role
from src.utils.http import error_response


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

    if not name or not email or not password:
        return error_response("name, email, password are required")

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
        bar_council_number=payload.get("barCouncilNumber"),
        role="Advocate",
        status="Active",
    )
    db.session.add(advocate)
    db.session.commit()

    return {"user": user.to_safe_dict(), "advocate": advocate.to_dict()}, 201
