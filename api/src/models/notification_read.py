from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from src.db import db


class NotificationRead(db.Model):
    __tablename__ = "notification_reads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    notification_id: Mapped[int] = mapped_column(Integer, ForeignKey("notifications.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Add unique constraint to prevent duplicate entries
    __table_args__ = (
        db.UniqueConstraint('notification_id', 'user_id', name='unique_notification_user_read'),
    )
