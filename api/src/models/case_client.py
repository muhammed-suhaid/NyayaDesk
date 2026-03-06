from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db import db


class CaseClient(db.Model):
    __tablename__ = "case_clients"

    __table_args__ = (UniqueConstraint("case_id", "client_id", name="uq_case_client"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("cases.id"), nullable=False)
    client_id: Mapped[int] = mapped_column(Integer, ForeignKey("clients.id"), nullable=False)

    case = relationship("Case", back_populates="client_links")
    client = relationship("Client", back_populates="case_links")
