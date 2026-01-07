"""
API routes for servers
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Server, Folder
from app.schemas import ServerCreate, ServerUpdate, ServerResponse

router = APIRouter(prefix="/servers", tags=["servers"])


@router.get("", response_model=list[ServerResponse])
async def get_servers(
    folder_id: int | None = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all servers, optionally filtered by folder"""
    query = select(Server)
    if folder_id is not None:
        query = query.where(Server.folder_id == folder_id)
    query = query.order_by(Server.id)

    result = await db.execute(query)
    servers = result.scalars().all()
    return servers


@router.post("", response_model=ServerResponse, status_code=201)
async def create_server(server: ServerCreate, db: AsyncSession = Depends(get_db)):
    """Create a new server"""
    # Check folder exists
    result = await db.execute(select(Folder).where(Folder.id == server.folder_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Folder not found")

    db_server = Server(
        folder_id=server.folder_id,
        name=server.name,
        ip=server.ip,
        provider=server.provider,
        price=server.price,
        currency=server.currency,
        payment_date=server.payment_date,
    )
    db.add(db_server)
    await db.commit()
    await db.refresh(db_server)
    return db_server


@router.get("/{server_id}", response_model=ServerResponse)
async def get_server(server_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single server by ID"""
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    return server


@router.put("/{server_id}", response_model=ServerResponse)
async def update_server(
    server_id: int,
    server_update: ServerUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a server"""
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    update_data = server_update.model_dump(exclude_unset=True)

    # If changing folder, verify new folder exists
    if "folder_id" in update_data:
        result = await db.execute(
            select(Folder).where(Folder.id == update_data["folder_id"])
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Target folder not found")

    for field, value in update_data.items():
        setattr(server, field, value)

    await db.commit()
    await db.refresh(server)
    return server


@router.delete("/{server_id}", status_code=204)
async def delete_server(server_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a server"""
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    await db.delete(server)
    await db.commit()
