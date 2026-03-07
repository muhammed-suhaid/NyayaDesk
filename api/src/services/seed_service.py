from __future__ import annotations

from datetime import date

from src.db import db
from src.models.company import Company
from src.models.payment import Payment
from src.models.user import User


def seed_if_needed():
    if User.query.count() > 0:
        return

    super_admin = User(
        company_id=None,
        name="Platform Owner",
        email="superadmin@nyayadesk.com",
        phone=None,
        password="super123",
        role="super_admin",
        status="active",
    )
    db.session.add(super_admin)

    sample_company = Company(
        name="Sample Kerala Law Office",
        email="office@example.com",
        phone="9999999999",
        address="Kerala, India",
        subscription_plan="basic",
        payment_status="paid",
        status="active",
    )
    db.session.add(sample_company)
    db.session.flush()

    admin = User(
        company_id=sample_company.id,
        name="Sample Admin",
        email="admin@samplefirm.com",
        phone="9999999999",
        password="admin123",
        role="admin",
        status="active",
    )
    db.session.add(admin)

    payment = Payment(
        company_id=sample_company.id,
        amount=4999,
        plan="basic",
        payment_date=date.today(),
        status="paid",
    )
    db.session.add(payment)

    db.session.commit()
