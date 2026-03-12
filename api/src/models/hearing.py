from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db import db

class Hearing(db.Model):
    __tablename__ = "hearings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    company_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("cases.id"), nullable=False)
    
    hearing_date: Mapped[date] = mapped_column(Date, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    outcome: Mapped[str | None] = mapped_column(Text)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    case = relationship("Case", back_populates="hearings")

    def to_dict(self):
        return {
            "id": self.id,
            "caseId": self.case_id,
            "hearingDate": self.hearing_date.isoformat() if self.hearing_date else None,
            "notes": self.notes,
            "outcome": self.outcome,
            "createdAt": self.created_at.isoformat() + "Z",
        }
