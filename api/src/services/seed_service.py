from __future__ import annotations

from src.db import db
from src.models.user import User


def seed_if_needed():
    if User.query.count() > 0:
        return

    # ************************* SUPER ADMIN ************************* #
    super_admin = User(
        company_id=None,
        name="Platform Owner",
        email="suhaidshu@gmail.com",
        phone="9895757238",
        password="super123",
        role="super_admin",
        status="active",
    )

    db.session.add(super_admin)
    db.session.commit()