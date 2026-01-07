# API routers
from app.routers.auth import router as auth_router
from app.routers.folders import router as folders_router
from app.routers.servers import router as servers_router
from app.routers.backup import router as backup_router

__all__ = ["auth_router", "folders_router", "servers_router", "backup_router"]
