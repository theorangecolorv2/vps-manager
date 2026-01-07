"""
Payment service - handles payment records and summaries
"""
from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Payment, Server
from app.services.exchange import convert_to_rub, get_exchange_rates


def get_current_month() -> str:
    """Get current month in format 'YYYY-MM'"""
    return datetime.utcnow().strftime("%Y-%m")


async def create_payment(db: AsyncSession, server_id: int) -> Payment:
    """
    Create a payment record for a server.
    Uses server's price and currency, converts to RUB.
    """
    # Get server
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()

    if not server:
        raise ValueError(f"Server {server_id} not found")

    if server.price <= 0:
        raise ValueError(f"Server {server_id} has no price set")

    # Convert to RUB
    amount_rub, exchange_rate = await convert_to_rub(server.price, server.currency, db)

    # Get current month
    payment_month = get_current_month()

    # Create payment record
    payment = Payment(
        server_id=server_id,
        amount=server.price,
        currency=server.currency,
        amount_rub=amount_rub,
        exchange_rate=exchange_rate,
        payment_month=payment_month,
    )
    db.add(payment)

    # Update server's last_paid_month
    server.last_paid_month = payment_month

    await db.commit()
    await db.refresh(payment)

    return payment


async def get_payments(
    db: AsyncSession,
    month: str | None = None,
    server_id: int | None = None,
    limit: int = 50
) -> list[Payment]:
    """
    Get payment history with optional filters.
    """
    query = select(Payment).order_by(Payment.paid_at.desc())

    if month:
        query = query.where(Payment.payment_month == month)

    if server_id:
        query = query.where(Payment.server_id == server_id)

    query = query.limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


async def get_payment_summary(db: AsyncSession, month: str | None = None) -> dict:
    """
    Get payment summary for a month.
    Returns total in RUB, breakdown by currency, and count.
    """
    if month is None:
        month = get_current_month()

    # Get all payments for the month
    payments = await get_payments(db, month=month, limit=1000)

    # Calculate totals
    total_rub = 0.0
    by_currency: dict[str, float] = {"EUR": 0.0, "USD": 0.0, "RUB": 0.0}
    by_currency_rub: dict[str, float] = {"EUR": 0.0, "USD": 0.0, "RUB": 0.0}

    for payment in payments:
        total_rub += payment.amount_rub

        currency = payment.currency
        if currency in by_currency:
            by_currency[currency] += payment.amount
            by_currency_rub[currency] += payment.amount_rub

    return {
        "total_rub": round(total_rub, 2),
        "by_currency": {k: round(v, 2) for k, v in by_currency.items()},
        "by_currency_rub": {k: round(v, 2) for k, v in by_currency_rub.items()},
        "payments_count": len(payments),
        "month": month,
    }


async def delete_payment(db: AsyncSession, payment_id: int) -> bool:
    """
    Delete a payment record.
    Also resets server's last_paid_month if this was the only payment this month.
    """
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()

    if not payment:
        return False

    server_id = payment.server_id
    payment_month = payment.payment_month

    await db.delete(payment)

    # Check if there are other payments for this server this month
    result = await db.execute(
        select(Payment).where(
            Payment.server_id == server_id,
            Payment.payment_month == payment_month
        )
    )
    other_payments = result.scalars().all()

    if not other_payments:
        # Reset server's last_paid_month
        result = await db.execute(select(Server).where(Server.id == server_id))
        server = result.scalar_one_or_none()
        if server and server.last_paid_month == payment_month:
            server.last_paid_month = None

    await db.commit()
    return True
