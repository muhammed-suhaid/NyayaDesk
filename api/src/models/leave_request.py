from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db import db


class LeaveRequest(db.Model):
    __tablename__ = "leave_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    advocate_id: Mapped[int] = mapped_column(Integer, ForeignKey("advocates.id"), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Enum("pending", "approved", "rejected", name="leave_status"), default="pending", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    advocate = relationship("Advocate", back_populates="leave_requests")

    def to_dict(self):
        return {
            "id": self.id,
            "advocateId": self.advocate_id,
            "advocateName": self.advocate.name if self.advocate else None,
            "startDate": self.start_date.isoformat(),
            "endDate": self.end_date.isoformat(),
            "reason": self.reason,
            "status": self.status,
            "createdAt": self.created_at.isoformat() + "Z",
        }
