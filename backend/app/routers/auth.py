"""
API routes for authentication
"""
from fastapi import APIRouter, HTTPException, status

from app.config import settings
from app.auth import verify_password, get_password_hash, create_access_token
from app.schemas import LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])

# Simple in-memory password hash (initialized on first login or from env)
_password_hash: str | None = None


def _get_password_hash() -> str:
    """Get or initialize password hash"""
    global _password_hash
    if _password_hash is None:
        _password_hash = get_password_hash(settings.admin_password)
    return _password_hash


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """
    Login with password.
    Returns JWT token on success.
    """
    password_hash = _get_password_hash()

    if not verify_password(request.password, password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token()
    return TokenResponse(access_token=access_token)


@router.get("/check")
async def check_auth():
    """
    Check if authentication is required.
    Always returns that auth is required (single-user mode).
    """
    return {"auth_required": True}
