"""
API routes for folders
"""
import calendar
from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Folder
from app.schemas import FolderCreate, FolderUpdate, FolderResponse

router = APIRouter(prefix="/folders", tags=["folders"])


def days_until_payment(payment_day: int, today: date, is_paid_this_month: bool) -> int:
    """
    Calculate days until payment.
    Returns number of days (0 = today, negative = overdue).
    If already paid this month, adds 30 days to push to next month.
    """
    current_day = today.day
    current_month = today.month
    current_year = today.year

    # Adjust payment_day for months with fewer days
    max_day = calendar.monthrange(current_year, current_month)[1]
    adjusted_day = min(payment_day, max_day)

    if adjusted_day >= current_day:
        # Payment is this month
        days = adjusted_day - current_day
    else:
        # Payment is next month
        next_month = current_month + 1 if current_month < 12 else 1
        next_year = current_year if current_month < 12 else current_year + 1
        next_max_day = calendar.monthrange(next_year, next_month)[1]
        next_adjusted_day = min(payment_day, next_max_day)

        days_left_this_month = max_day - current_day
        days = days_left_this_month + next_adjusted_day

    # If already paid this month, push to next month priority
    if is_paid_this_month:
        days += 30

    return days


def get_folder_urgency(folder: Folder, today: date) -> int:
    """
    Get folder urgency score based on the server with nearest payment date.
    Lower score = more urgent.
    """
    if not folder.servers:
        return float('inf')  # Empty folders go to end

    current_month = today.strftime("%Y-%m")
    min_days = float('inf')

    for server in folder.servers:
        if server.payment_date == '-' or not server.payment_date:
            continue

        try:
            payment_day = int(server.payment_date)
            if payment_day < 1 or payment_day > 31:
                continue

            is_paid = server.last_paid_month == current_month
            days = days_until_payment(payment_day, today, is_paid)
            min_days = min(min_days, days)
        except (ValueError, TypeError):
            continue

    return min_days if min_days != float('inf') else float('inf')


SortBy = Literal["position", "payment_urgency"]


@router.get("", response_model=list[FolderResponse])
async def get_folders(
    sort_by: SortBy = Query(default="position", description="Sort folders by position or payment urgency"),
    db: AsyncSession = Depends(get_db),
):
    """Get all folders with their servers"""
    result = await db.execute(
        select(Folder)
        .options(selectinload(Folder.servers))
        .order_by(Folder.position, Folder.id)
    )
    folders = list(result.scalars().all())

    if sort_by == "payment_urgency":
        today = date.today()
        folders.sort(key=lambda f: get_folder_urgency(f, today))

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

    # Reload with servers relationship
    result = await db.execute(
        select(Folder)
        .options(selectinload(Folder.servers))
        .where(Folder.id == db_folder.id)
    )
    return result.scalar_one()


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

    # Reload with servers relationship
    result = await db.execute(
        select(Folder)
        .options(selectinload(Folder.servers))
        .where(Folder.id == folder_id)
    )
    return result.scalar_one()


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
