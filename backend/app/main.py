"""
VPS Manager - FastAPI Backend
"""
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth_router, folders_router, servers_router, backup_router, metrics_router
from app.services import ping_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events"""
    # Startup
    print("VPS Manager API starting...")

    # Start background ping task
    ping_task = asyncio.create_task(ping_loop())

    yield

    # Shutdown
    print("VPS Manager API shutting down...")
    ping_task.cancel()
    try:
        await ping_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="VPS Manager",
    description="Personal VPS monitoring and management tool",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://vps.oblepiha-vpn.online",
        "http://vps.oblepiha-vpn.online",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(folders_router, prefix="/api")
app.include_router(servers_router, prefix="/api")
app.include_router(backup_router, prefix="/api")
app.include_router(metrics_router, prefix="/api")


@app.get("/")
async def root():
    return {"status": "ok", "message": "VPS Manager API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
