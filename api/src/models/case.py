from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db import db


class Case(db.Model):
    __tablename__ = "cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    company_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)
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

    disposal_date: Mapped[date | None] = mapped_column(Date)
    disposal_reason: Mapped[str | None] = mapped_column(Text)
    outcome: Mapped[str | None] = mapped_column(Text)

    assigned_advocate_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("advocates.id"))

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    assigned_advocate = relationship("Advocate", back_populates="cases")
    client_links = relationship("CaseClient", back_populates="case", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")
    hearings = relationship("Hearing", back_populates="case", cascade="all, delete-orphan", order_by="Hearing.hearing_date")
    updates = relationship("CaseUpdate", back_populates="case", cascade="all, delete-orphan", order_by="desc(CaseUpdate.created_at)")

    def to_dict(self, include_clients: bool = False, include_advocate: bool = False, include_details: bool = False):
        data = {
            "id": self.id,
            "companyId": self.company_id,
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
            "disposalDate": self.disposal_date.isoformat() if self.disposal_date else None,
            "disposalReason": self.disposal_reason,
            "outcome": self.outcome,
            "assignedAdvocateId": self.assigned_advocate_id,
            "createdAt": self.created_at.isoformat() + "Z",
            "updatedAt": self.updated_at.isoformat() + "Z",
        }

        if include_advocate:
            data["assignedAdvocate"] = self.assigned_advocate.to_dict() if self.assigned_advocate else None

        if include_clients:
            data["clients"] = [link.client.to_dict(False) for link in self.client_links]

        if include_details:
            data["hearings"] = [h.to_dict() for h in self.hearings]
            data["updates"] = [u.to_dict() for u in self.updates]
            data["documents"] = [d.to_dict() for d in self.documents]

        return data
