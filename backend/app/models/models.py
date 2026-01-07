"""
SQLAlchemy models for VPS Manager
"""
from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    """Single user for authentication (password only, no registration)"""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Folder(Base):
    """Folder to group servers"""
    __tablename__ = "folders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str] = mapped_column(String(7), default="#6b7280")  # hex color
    position: Mapped[int] = mapped_column(Integer, default=0)  # for ordering
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    servers: Mapped[list["Server"]] = relationship(
        "Server", back_populates="folder", cascade="all, delete-orphan"
    )


class Server(Base):
    """VPS server information"""
    __tablename__ = "servers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    folder_id: Mapped[int] = mapped_column(Integer, ForeignKey("folders.id"), nullable=False)

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    ip: Mapped[str] = mapped_column(String(45), nullable=False)  # supports IPv6
    provider: Mapped[str] = mapped_column(String(50), default="")

    price: Mapped[float] = mapped_column(Float, default=0.0)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    payment_date: Mapped[str] = mapped_column(String(10), default="-")  # day of month or "-"

    # Ping/status info (updated by background task)
    status: Mapped[str] = mapped_column(String(10), default="unknown")  # online/offline/unknown
    last_ping: Mapped[int | None] = mapped_column(Integer, nullable=True)  # ms
    last_check: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    folder: Mapped["Folder"] = relationship("Folder", back_populates="servers")
