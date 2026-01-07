"""
API routes for folders
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Folder, Server
from app.schemas import FolderCreate, FolderUpdate, FolderResponse

router = APIRouter(prefix="/folders", tags=["folders"])


@router.get("", response_model=list[FolderResponse])
async def get_folders(db: AsyncSession = Depends(get_db)):
    """Get all folders with their servers"""
    result = await db.execute(
        select(Folder)
        .options(selectinload(Folder.servers))
        .order_by(Folder.position, Folder.id)
    )
    folders = result.scalars().all()
    return folders


@router.post("", response_model=FolderResponse, status_code=201)
async def create_folder(folder: FolderCreate, db: AsyncSession = Depends(get_db)):
    """Create a new folder"""
    # Get max position
    result = await db.execute(select(func.max(Folder.position)))
    max_pos = result.scalar() or 0

    db_folder = Folder(
        name=folder.name,
        color=folder.color,
        position=max_pos + 1
    )
    db.add(db_folder)
    await db.commit()
    await db.refresh(db_folder)
    return db_folder


@router.get("/{folder_id}", response_model=FolderResponse)
async def get_folder(folder_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single folder by ID"""
    result = await db.execute(
        select(Folder)
        .options(selectinload(Folder.servers))
        .where(Folder.id == folder_id)
    )
    folder = result.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return folder


@router.put("/{folder_id}", response_model=FolderResponse)
async def update_folder(
    folder_id: int,
    folder_update: FolderUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a folder"""
    result = await db.execute(
        select(Folder)
        .options(selectinload(Folder.servers))
        .where(Folder.id == folder_id)
    )
    folder = result.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    update_data = folder_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(folder, field, value)

    await db.commit()
    await db.refresh(folder)
    return folder


@router.delete("/{folder_id}", status_code=204)
async def delete_folder(folder_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a folder and all its servers"""
    result = await db.execute(select(Folder).where(Folder.id == folder_id))
    folder = result.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    await db.delete(folder)
    await db.commit()


@router.post("/reorder", status_code=200)
async def reorder_folders(
    folder_ids: list[int],
    db: AsyncSession = Depends(get_db)
):
    """Reorder folders by providing ordered list of IDs"""
    for position, folder_id in enumerate(folder_ids):
        await db.execute(
            Folder.__table__.update()
            .where(Folder.id == folder_id)
            .values(position=position)
        )
    await db.commit()
    return {"status": "ok"}
