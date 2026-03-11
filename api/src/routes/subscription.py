from __future__ import annotations

import os
from datetime import date, timedelta

from flask import Blueprint, request

from src.db import db
from src.models.company import Company
from src.models.payment import Payment
from src.utils.auth import current_session, require_auth, require_role
from src.utils.http import error_response, success_response

subscription_bp = Blueprint("subscription", __name__)

PLANS = {
    "free": {
        "id": "free",
        "name": "Free",
        "price": 0,
        "period": "forever",
        "billingCycle": "none",
        "limits": {"users": 3, "cases": 10, "storage": "1 GB"},
        "features": ["1 Admin", "2 Advocates", "10 Cases", "Basic reports"],
        "includesAI": False,
    },
    "standard": {
        "id": "standard",
        "name": "Standard",
        "price": 999,
        "period": "per month",
        "billingCycle": "monthly",
        "limits": {"users": 11, "cases": None, "storage": "5 GB"},
        "features": [
            "1 Admin", "10 Advocates", "Unlimited cases",
            "Advanced reports", "Email notifications", "Document upload",
        ],
        "includesAI": False,
    },
    "premium": {
        "id": "premium",
        "name": "Premium",
        "price": 1999,
        "period": "per month",
        "billingCycle": "monthly",
        "limits": {"users": None, "cases": None, "storage": "20 GB"},
        "features": [
            "Unlimited Advocates", "Unlimited cases",
            "AI Law Point Generator", "Advanced analytics",
            "Priority support", "Custom branding", "20 GB storage",
        ],
        "includesAI": True,
    },
}


def _next_renewal(cycle: str) -> str:
    today = date.today()
    if cycle == "yearly":
        return (today.replace(year=today.year + 1)).strftime("%d %b %Y")
    if cycle == "monthly":
        return (today + timedelta(days=30)).strftime("%d %b %Y")
    return "N/A"


def _get_company(sess):
    company = Company.query.get(sess.company_id)
    if not company:
        return None, error_response("Company not found", 404)
    return company, None


# ---------------------------------------------------------------------------
# GET /api/subscription          — current plan
# ---------------------------------------------------------------------------
@subscription_bp.get("")
@require_auth
def get_current():
    sess = current_session()
    assert sess is not None

    company, err = _get_company(sess)
    if err:
        return err

    plan_key = (company.subscription_plan or "free").lower()
    plan = PLANS.get(plan_key, PLANS["free"])

    return success_response("Subscription details", subscription={
        "planId":       plan_key,
        "planName":     plan["name"],
        "status":       company.payment_status or "Active",
        "billingCycle": plan["billingCycle"].capitalize() if plan["billingCycle"] != "none" else "N/A",
        "renewalDate":  _next_renewal(plan["billingCycle"]),
        "price":        f"₹{plan['price']:,}" if plan["price"] > 0 else "Free",
        "period":       plan["period"],
        "limits":       plan["limits"],
        "includesAI":   plan["includesAI"],
        "isActive":     company.payment_status not in [None, "Cancelled", "Expired"],
    })


# ---------------------------------------------------------------------------
# GET /api/subscription/plans    — all plans
# ---------------------------------------------------------------------------
@subscription_bp.get("/plans")
@require_auth
def get_plans():
    sess = current_session()
    assert sess is not None

    company, err = _get_company(sess)
    if err:
        return err

    current_plan_key = (company.subscription_plan or "free").lower()
    plans_list = []
    for p in PLANS.values():
        item = dict(p)
        item["isCurrent"] = (p["id"] == current_plan_key)
        item["isActive"]  = (
            item["isCurrent"] and company.payment_status not in [None, "Cancelled", "Expired"]
        )
        plans_list.append(item)

    return success_response("Plans", plans=plans_list)


# ---------------------------------------------------------------------------
# POST /api/subscription/activate  — dummy payment: activate plan directly
# ---------------------------------------------------------------------------
@subscription_bp.post("/activate")
@require_role("admin")
def activate():
    sess = current_session()
    assert sess is not None

    payload = request.get_json(silent=True) or {}
    plan_id = (payload.get("planId") or "").lower()

    if plan_id not in PLANS or plan_id == "free":
        return error_response("Invalid plan selected")

    company, err = _get_company(sess)
    if err:
        return err

    plan = PLANS[plan_id]

    company.subscription_plan = plan_id
    company.payment_status    = "Active"

    payment = Payment(
        company_id   = sess.company_id,
        amount       = plan["price"],
        plan         = plan_id,
        payment_date = date.today(),
        status       = "paid",
    )
    db.session.add(payment)
    db.session.commit()

    return success_response("Subscription activated!", plan={
        "planId":   plan_id,
        "planName": plan["name"],
    })


# ---------------------------------------------------------------------------
# POST /api/subscription/reset  — clear active plan (for testing)
# ---------------------------------------------------------------------------
@subscription_bp.post("/reset")
@require_role("admin")
def reset():
    sess = current_session()
    assert sess is not None

    company, err = _get_company(sess)
    if err:
        return err

    company.subscription_plan = None
    company.payment_status    = None
    db.session.commit()

    return success_response("Subscription reset to Free plan.")


# ---------------------------------------------------------------------------
# GET /api/subscription/invoices — billing history
# ---------------------------------------------------------------------------
@subscription_bp.get("/invoices")
@require_auth
def get_invoices():
    sess = current_session()
    assert sess is not None

    payments = (
        Payment.query
        .filter_by(company_id=sess.company_id)
        .order_by(Payment.payment_date.desc())
        .all()
    )

    invoices = []
    for p in payments:
        invoices.append({
            "id":        p.id,
            "invoiceId": f"INV-{p.id:04d}",
            "date":      p.payment_date.strftime("%d %b %Y"),
            "amount":    f"₹{p.amount:,}",
            "plan":      p.plan.capitalize(),
            "status":    p.status.capitalize() if p.status else "Paid",
        })

    return success_response("Invoices", invoices=invoices)
