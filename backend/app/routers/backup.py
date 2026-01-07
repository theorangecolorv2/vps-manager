"""
API routes for backup (export/import)
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Folder, Server
from app.schemas import ExportData, ImportData, FolderExport, ServerExport

router = APIRouter(prefix="/backup", tags=["backup"])


@router.get("/export", response_model=ExportData)
async def export_data(db: AsyncSession = Depends(get_db)):
    """Export all folders and servers as JSON"""
    result = await db.execute(
        select(Folder)
        .options(selectinload(Folder.servers))
        .order_by(Folder.position, Folder.id)
    )
    folders = result.scalars().all()

    export_folders = []
    for folder in folders:
        export_servers = [
            ServerExport(
                name=s.name,
                ip=s.ip,
                provider=s.provider,
                price=s.price,
                currency=s.currency,
                payment_date=s.payment_date,
            )
            for s in folder.servers
        ]
        export_folders.append(
            FolderExport(
                name=folder.name,
                color=folder.color,
                servers=export_servers,
            )
        )

    return ExportData(
        version="1.0",
        exported_at=datetime.utcnow(),
        folders=export_folders,
    )


@router.post("/import", status_code=200)
async def import_data(
    data: ImportData,
    replace: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """
    Import folders and servers from JSON.
    If replace=True (default), all existing data will be deleted first.
    If replace=False, data will be added to existing.
    """
    if data.version != "1.0":
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported import version: {data.version}"
        )

    if replace:
        # Delete all existing data
        await db.execute(delete(Server))
        await db.execute(delete(Folder))
        await db.commit()

    # Import folders and servers
    for position, folder_data in enumerate(data.folders):
        db_folder = Folder(
            name=folder_data.name,
            color=folder_data.color,
            position=position,
        )
        db.add(db_folder)
        await db.flush()  # Get folder ID

        for server_data in folder_data.servers:
            db_server = Server(
                folder_id=db_folder.id,
                name=server_data.name,
                ip=server_data.ip,
                provider=server_data.provider,
                price=server_data.price,
                currency=server_data.currency,
                payment_date=server_data.payment_date,
            )
            db.add(db_server)

    await db.commit()

    return {
        "status": "ok",
        "imported_folders": len(data.folders),
        "imported_servers": sum(len(f.servers) for f in data.folders),
    }
