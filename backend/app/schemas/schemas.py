"""
Pydantic schemas for API validation
"""
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


# ============ Auth ============

class LoginRequest(BaseModel):
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ============ Server ============

ServerStatus = Literal["online", "offline", "unknown"]


class ServerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    ip: str = Field(..., min_length=1, max_length=45)
    provider: str = Field(default="", max_length=50)
    price: float = Field(default=0.0, ge=0)
    currency: str = Field(default="USD", max_length=3)
    payment_date: str = Field(default="-", max_length=10)


class ServerCreate(ServerBase):
    folder_id: int


class ServerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    ip: str | None = Field(default=None, min_length=1, max_length=45)
    provider: str | None = Field(default=None, max_length=50)
    price: float | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, max_length=3)
    payment_date: str | None = Field(default=None, max_length=10)
    folder_id: int | None = None


class ServerResponse(ServerBase):
    id: int
    folder_id: int
    status: ServerStatus = "unknown"
    last_ping: int | None = None
    last_check: datetime | None = None
    last_paid_month: str | None = None

    class Config:
        from_attributes = True


# ============ Folder ============

class FolderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(default="#6b7280", pattern=r"^#[0-9a-fA-F]{6}$")


class FolderCreate(FolderBase):
    pass


class FolderUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    position: int | None = None


class FolderResponse(FolderBase):
    id: int
    position: int
    servers: list[ServerResponse] = []

    class Config:
        from_attributes = True


class FolderListResponse(FolderBase):
    """Folder without servers (for list view)"""
    id: int
    position: int

    class Config:
        from_attributes = True


# ============ Backup/Export ============

class ServerExport(BaseModel):
    """Server data for export (without IDs and status)"""
    name: str
    ip: str
    provider: str
    price: float
    currency: str
    payment_date: str


class FolderExport(BaseModel):
    """Folder data for export"""
    name: str
    color: str
    servers: list[ServerExport]


class ExportData(BaseModel):
    """Full export format"""
    version: str = "1.0"
    exported_at: datetime
    folders: list[FolderExport]


class ImportData(BaseModel):
    """Import format (same as export)"""
    version: str = "1.0"
    folders: list[FolderExport]


# ============ Payments ============

class PaymentCreate(BaseModel):
    """Create payment request (amount/currency taken from server)"""
    pass  # No fields needed - amount and currency come from server


class PaymentResponse(BaseModel):
    id: int
    server_id: int
    server_name: str
    amount: float
    currency: str
    amount_rub: float
    exchange_rate: float
    paid_at: datetime
    payment_month: str

    class Config:
        from_attributes = True


class PaymentSummary(BaseModel):
    """Monthly payment summary"""
    total_rub: float
    by_currency: dict[str, float]  # {"EUR": 50.0, "USD": 100.0, "RUB": 0.0}
    by_currency_rub: dict[str, float]  # {"EUR": 5200.0, "USD": 10220.0, "RUB": 0.0}
    payments_count: int
    month: str  # "2026-01"


# ============ Exchange Rates ============

class ExchangeRatesResponse(BaseModel):
    rates: dict[str, float]  # {"EUR": 104.0, "USD": 102.2, "RUB": 1.0}
    updated_at: datetime | None


# ============ Server Metrics ============

class MetricsSubmit(BaseModel):
    """Metrics submitted by agent"""
    cpu_percent: float = Field(..., ge=0, le=100)
    memory_percent: float = Field(..., ge=0, le=100)
    memory_used_mb: int = Field(..., ge=0)
    memory_total_mb: int = Field(..., ge=0)
    disk_percent: float = Field(..., ge=0, le=100)
    disk_used_gb: float = Field(..., ge=0)
    disk_total_gb: float = Field(..., ge=0)
    uptime_seconds: int = Field(..., ge=0)
    load_avg_1: float | None = None
    load_avg_5: float | None = None
    load_avg_15: float | None = None


class MetricsResponse(BaseModel):
    """Single metrics record"""
    cpu_percent: float
    memory_percent: float
    memory_used_mb: int
    memory_total_mb: int
    disk_percent: float
    disk_used_gb: float
    disk_total_gb: float
    uptime_seconds: int
    load_avg_1: float | None
    load_avg_5: float | None
    load_avg_15: float | None
    collected_at: datetime

    class Config:
        from_attributes = True


class MetricsHistoryResponse(BaseModel):
    """Metrics history for a server"""
    server_id: int
    server_name: str
    current: MetricsResponse | None
    history: list[MetricsResponse]
    avg_cpu_12h: float | None
    avg_memory_12h: float | None


class AgentTokenResponse(BaseModel):
    """Response with agent token"""
    agent_token: str
    server_id: int
    server_name: str
