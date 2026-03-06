from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db import db


class Attendance(db.Model):
    __tablename__ = "attendance"

    __table_args__ = (UniqueConstraint("advocate_id", "day", name="uq_attendance_day"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    advocate_id: Mapped[int] = mapped_column(Integer, ForeignKey("advocates.id"), nullable=False)
    day: Mapped[date] = mapped_column(Date, nullable=False)
    check_in_time: Mapped[time | None] = mapped_column(Time)
    check_out_time: Mapped[time | None] = mapped_column(Time)
    status: Mapped[str] = mapped_column(Enum("present", "absent", name="attendance_status"), default="present", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    advocate = relationship("Advocate", back_populates="attendance_records")

    def to_dict(self):
        return {
            "id": self.id,
            "advocateId": self.advocate_id,
            "advocateName": self.advocate.name if self.advocate else None,
            "date": self.day.isoformat(),
            "checkInTime": self.check_in_time.isoformat() if self.check_in_time else None,
            "checkOutTime": self.check_out_time.isoformat() if self.check_out_time else None,
            "status": self.status,
        }
