from __future__ import annotations

from flask import Blueprint, request

from src.db import db
from src.models.company import Company
from src.models.payment import Payment
from src.models.user import User
from src.utils.auth import require_role
from src.utils.http import error_response


superadmin_bp = Blueprint("superadmin", __name__)


@superadmin_bp.get("/companies")
@require_role("super_admin")
def list_companies():
    companies = Company.query.order_by(Company.created_at.desc()).all()
    return [c.to_dict() for c in companies]


@superadmin_bp.get("/companies/<int:company_id>")
@require_role("super_admin")
def get_company(company_id: int):
    company = Company.query.get(company_id)
    if not company:
        return error_response("Company not found", 404)

    users = User.query.filter(User.company_id == company_id).order_by(User.created_at.desc()).all()
    payments = Payment.query.filter(Payment.company_id == company_id).order_by(Payment.created_at.desc()).all()

    return {
        "company": company.to_dict(),
        "users": [u.to_safe_dict() for u in users],
        "payments": [p.to_dict() for p in payments],
    }


@superadmin_bp.put("/companies/<int:company_id>/status")
@require_role("super_admin")
def set_company_status(company_id: int):
    payload = request.get_json(silent=True) or {}
    status = payload.get("status")
    if status not in {"active", "inactive"}:
        return error_response("status must be active or inactive")

    company = Company.query.get(company_id)
    if not company:
        return error_response("Company not found", 404)

    company.status = status
    db.session.commit()
    return company.to_dict()
