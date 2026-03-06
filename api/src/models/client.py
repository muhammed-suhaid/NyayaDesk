from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db import db


class Client(db.Model):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    company_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(30))
    email: Mapped[str | None] = mapped_column(String(200))
    address: Mapped[str | None] = mapped_column(String(500))
    district: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    case_links = relationship("CaseClient", back_populates="client", cascade="all, delete-orphan")

    def to_dict(self, include_cases: bool = False):
        data = {
            "id": self.id,
            "companyId": self.company_id,
            "name": self.name,
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
            "district": self.district,
            "createdAt": self.created_at.isoformat() + "Z",
        }

        if include_cases:
            data["cases"] = [
                {
                    "id": link.case.id,
                    "title": link.case.title,
                    "caseNumber": link.case.case_number,
                }
                for link in self.case_links
            ]

        return data
