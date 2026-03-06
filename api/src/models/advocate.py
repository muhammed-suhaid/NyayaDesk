from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db import db


class Advocate(db.Model):
    __tablename__ = "advocates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    company_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(30))
    email: Mapped[str | None] = mapped_column(String(200))
    bar_council_number: Mapped[str | None] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(Enum("Admin", "Advocate", name="advocate_role"), default="Advocate", nullable=False)
    status: Mapped[str] = mapped_column(Enum("Active", "Inactive", name="advocate_status"), default="Active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    cases = relationship("Case", back_populates="assigned_advocate")
    attendance_records = relationship("Attendance", back_populates="advocate")
    leave_requests = relationship("LeaveRequest", back_populates="advocate")

    def to_dict(self):
        return {
            "id": self.id,
            "companyId": self.company_id,
            "name": self.name,
            "phone": self.phone,
            "email": self.email,
            "barCouncilNumber": self.bar_council_number,
            "role": self.role,
            "status": self.status,
            "createdAt": self.created_at.isoformat() + "Z",
        }
