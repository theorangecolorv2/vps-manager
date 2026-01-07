"""
Exchange rates service - fetches and caches currency rates from CBR
"""
from datetime import datetime, timedelta

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models import ExchangeRate
from app.config import settings


# Fallback rates if API is unavailable and no cache exists
FALLBACK_RATES = {
    "EUR": 100.0,
    "USD": 95.0,
    "RUB": 1.0,
}


async def fetch_rates_from_cbr() -> dict[str, float]:
    """
    Fetch exchange rates from CBR (Central Bank of Russia) API.
    Returns dict with rates to RUB.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(settings.exchange_api_url)
            response.raise_for_status()
            data = response.json()

            rates = {"RUB": 1.0}

            # CBR API returns rates in format: {"Valute": {"USD": {"Value": 95.5}, "EUR": {"Value": 105.2}}}
            valute = data.get("Valute", {})

            if "USD" in valute:
                rates["USD"] = valute["USD"]["Value"] + 5  # +5 RUB commission
            if "EUR" in valute:
                rates["EUR"] = valute["EUR"]["Value"] + 5  # +5 RUB commission

            return rates
    except Exception as e:
        print(f"Failed to fetch rates from CBR: {e}")
        return None


async def get_cached_rates(db: AsyncSession) -> tuple[dict[str, float], datetime | None]:
    """
    Get rates from database cache.
    Returns (rates_dict, updated_at) or (None, None) if not cached.
    """
    result = await db.execute(select(ExchangeRate))
    cached = result.scalars().all()

    if not cached:
        return None, None

    rates = {"RUB": 1.0}
    updated_at = None

    for rate in cached:
        rates[rate.currency] = rate.rate_to_rub
        if updated_at is None or rate.updated_at > updated_at:
            updated_at = rate.updated_at

    return rates, updated_at


async def update_cache(db: AsyncSession, rates: dict[str, float]) -> None:
    """Update exchange rates in database cache."""
    now = datetime.utcnow()

    for currency, rate in rates.items():
        if currency == "RUB":
            continue

        result = await db.execute(
            select(ExchangeRate).where(ExchangeRate.currency == currency)
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.rate_to_rub = rate
            existing.updated_at = now
        else:
            db.add(ExchangeRate(
                currency=currency,
                rate_to_rub=rate,
                updated_at=now
            ))

    await db.commit()


async def get_exchange_rates(db: AsyncSession = None, force_refresh: bool = False) -> tuple[dict[str, float], datetime | None]:
    """
    Get exchange rates with caching.
    Returns (rates_dict, updated_at).
    Uses TTL-based caching - fetches from API only if cache is stale.
    """
    close_db = False
    if db is None:
        db = async_session()
        close_db = True

    try:
        # Check cache first
        cached_rates, updated_at = await get_cached_rates(db)
        ttl = timedelta(seconds=settings.exchange_rate_ttl_seconds)

        # Return cached if fresh and not forcing refresh
        if cached_rates and updated_at and not force_refresh:
            if datetime.utcnow() - updated_at < ttl:
                return cached_rates, updated_at

        # Fetch fresh rates from API
        fresh_rates = await fetch_rates_from_cbr()

        if fresh_rates:
            await update_cache(db, fresh_rates)
            return fresh_rates, datetime.utcnow()

        # API failed - return cached or fallback
        if cached_rates:
            return cached_rates, updated_at

        return FALLBACK_RATES.copy(), None

    finally:
        if close_db:
            await db.close()


async def convert_to_rub(amount: float, currency: str, db: AsyncSession = None) -> tuple[float, float]:
    """
    Convert amount to RUB.
    Returns (amount_rub, exchange_rate).
    """
    if currency == "RUB":
        return amount, 1.0

    rates, _ = await get_exchange_rates(db)
    rate = rates.get(currency, FALLBACK_RATES.get(currency, 1.0))

    return amount * rate, rate
