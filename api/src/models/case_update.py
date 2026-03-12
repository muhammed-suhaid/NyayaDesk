from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db import db

class CaseUpdate(db.Model):
    __tablename__ = "case_updates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    company_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("cases.id"), nullable=False)
    
    author_name: Mapped[str] = mapped_column(String(200), nullable=False)
    update_text: Mapped[str] = mapped_column(Text, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    case = relationship("Case", back_populates="updates")

    def to_dict(self):
        return {
            "id": self.id,
            "caseId": self.case_id,
            "authorName": self.author_name,
            "updateText": self.update_text,
            "createdAt": self.created_at.isoformat() + "Z",
        }
