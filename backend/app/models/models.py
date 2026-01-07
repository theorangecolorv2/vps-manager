"""
SQLAlchemy models for VPS Manager
"""
from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey
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

    # Payment tracking
    last_paid_month: Mapped[str | None] = mapped_column(String(7), nullable=True)  # "2026-01"

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    folder: Mapped["Folder"] = relationship("Folder", back_populates="servers")
    payments: Mapped[list["Payment"]] = relationship(
        "Payment", back_populates="server", cascade="all, delete-orphan"
    )


class Payment(Base):
    """Payment history record"""
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    server_id: Mapped[int] = mapped_column(Integer, ForeignKey("servers.id"), nullable=False)

    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)  # EUR, USD, RUB
    amount_rub: Mapped[float] = mapped_column(Float, nullable=False)  # converted amount
    exchange_rate: Mapped[float] = mapped_column(Float, nullable=False)  # rate at payment time

    paid_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    payment_month: Mapped[str] = mapped_column(String(7), nullable=False)  # "2026-01" for filtering

    server: Mapped["Server"] = relationship("Server", back_populates="payments")


class ExchangeRate(Base):
    """Cached exchange rates"""
    __tablename__ = "exchange_rates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, unique=True)  # EUR, USD
    rate_to_rub: Mapped[float] = mapped_column(Float, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
