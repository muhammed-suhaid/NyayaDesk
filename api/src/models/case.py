from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db import db


class Case(db.Model):
    __tablename__ = "cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    case_number: Mapped[str | None] = mapped_column(String(100))
    case_type: Mapped[str | None] = mapped_column(String(100))
    case_group: Mapped[str | None] = mapped_column(String(50))
    court_name: Mapped[str | None] = mapped_column(String(200))
    district: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str] = mapped_column(String(50), default="Kerala", nullable=False)
    next_hearing_date: Mapped[date | None] = mapped_column(Date)
    current_status: Mapped[str | None] = mapped_column(String(50))
    next_purpose: Mapped[str | None] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)

    assigned_advocate_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("advocates.id"))

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    assigned_advocate = relationship("Advocate", back_populates="cases")
    client_links = relationship("CaseClient", back_populates="case", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")

    def to_dict(self, include_clients: bool = False, include_advocate: bool = False):
        data = {
            "id": self.id,
            "title": self.title,
            "caseNumber": self.case_number,
            "caseType": self.case_type,
            "caseGroup": self.case_group,
            "courtName": self.court_name,
            "district": self.district,
            "state": self.state,
            "nextHearingDate": self.next_hearing_date.isoformat() if self.next_hearing_date else None,
            "currentStatus": self.current_status,
            "nextPurpose": self.next_purpose,
            "description": self.description,
            "assignedAdvocateId": self.assigned_advocate_id,
            "createdAt": self.created_at.isoformat() + "Z",
            "updatedAt": self.updated_at.isoformat() + "Z",
        }

        if include_advocate:
            data["assignedAdvocate"] = self.assigned_advocate.to_dict() if self.assigned_advocate else None

        if include_clients:
            data["clients"] = [link.client.to_dict(False) for link in self.client_links]

        return data
