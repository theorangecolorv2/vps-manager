"""
Exchange rates API endpoints
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth import get_current_user
from app.schemas import ExchangeRatesResponse
from app.services.exchange import get_exchange_rates

router = APIRouter(prefix="/exchange", tags=["exchange"])


@router.get("/rates", response_model=ExchangeRatesResponse)
async def get_rates(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(get_current_user),
):
    """Get current exchange rates (cached, TTL 1 hour)"""
    rates, updated_at = await get_exchange_rates(db)
    return ExchangeRatesResponse(rates=rates, updated_at=updated_at)


@router.post("/rates/refresh", response_model=ExchangeRatesResponse)
async def refresh_rates(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(get_current_user),
):
    """Force refresh exchange rates from CBR API"""
    rates, updated_at = await get_exchange_rates(db, force_refresh=True)
    return ExchangeRatesResponse(rates=rates, updated_at=updated_at)
