from __future__ import annotations

from flask import Blueprint, request, send_file

from src.db import db
from src.models.advocate import Advocate
from src.models.case import Case
from src.models.client import Client
from src.models.company import Company
from src.models.payment import Payment
from src.models.user import User
from src.utils.auth import require_role
from src.utils.http import error_response, success_response


superadmin_bp = Blueprint("superadmin", __name__)


@superadmin_bp.get("/companies/<int:company_id>/payments/<int:payment_id>/download")
@require_role("super_admin")
def download_payment(company_id: int, payment_id: int):
    company = Company.query.get(company_id)
    if not company:
        return error_response("Company not found", 404)

    payment = Payment.query.filter_by(id=payment_id, company_id=company_id).first()
    if not payment:
        return error_response("Payment record not found", 404)

    try:
        from src.reports.invoice_report import generate_invoice_pdf
        pdf_buffer = generate_invoice_pdf(payment.to_dict(), company.to_dict())
        
        filename = f"Invoice_INV_{payment.id:04d}.pdf"
        
        return send_file(
            pdf_buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return error_response(f"PDF Error: {str(e)}", 500)


@superadmin_bp.get("/summary")
@require_role("super_admin")
def get_summary():
    total_companies = Company.query.count()
    total_advocates = Advocate.query.count()
    total_cases = Case.query.count()
    total_users = User.query.count()
    active_companies = Company.query.filter(Company.status == "active").count()

    return {
        "totalCompanies": total_companies,
        "totalAdvocates": total_advocates,
        "totalCases": total_cases,
        "totalUsers": total_users,
        "activeCompanies": active_companies,
    }


@superadmin_bp.get("/companies")
@require_role("super_admin")
def list_companies():
    companies = Company.query.order_by(Company.created_at.desc()).all()
    out = []
    for c in companies:
        d = c.to_dict()
        d["advocatesCount"] = Advocate.query.filter(Advocate.company_id == c.id).count()
        d["casesCount"] = Case.query.filter(Case.company_id == c.id).count()
        d["clientsCount"] = Client.query.filter(Client.company_id == c.id).count()
        out.append(d)
    return out


@superadmin_bp.get("/companies/<int:company_id>")
@require_role("super_admin")
def get_company(company_id: int):
    company = Company.query.get(company_id)
    if not company:
        return error_response("Company not found", 404)

    users = User.query.filter(User.company_id == company_id).order_by(User.created_at.desc()).all()
    payments = Payment.query.filter(Payment.company_id == company_id).order_by(Payment.created_at.desc()).all()

    stats = {
        "advocatesCount": Advocate.query.filter(Advocate.company_id == company_id).count(),
        "casesCount": Case.query.filter(Case.company_id == company_id).count(),
        "clientsCount": Client.query.filter(Client.company_id == company_id).count(),
    }

    return {
        "company": company.to_dict(),
        "users": [u.to_safe_dict() for u in users],
        "payments": [p.to_dict() for p in payments],
        "stats": stats,
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
    return success_response("Company status updated", company=company.to_dict())
