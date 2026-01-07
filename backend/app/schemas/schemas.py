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
