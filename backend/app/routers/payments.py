"""
Payments API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import get_current_user
from app.models import Server
from app.schemas import PaymentResponse, PaymentSummary
from app.services.payments import (
    create_payment,
    get_payments,
    get_payment_summary,
    delete_payment,
    get_current_month,
)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/{server_id}", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def record_payment(
    server_id: int,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(get_current_user),
):
    """Record a payment for a server (marks as paid this month)"""
    try:
        payment = await create_payment(db, server_id)

        # Get server name for response
        result = await db.execute(select(Server).where(Server.id == server_id))
        server = result.scalar_one()

        return PaymentResponse(
            id=payment.id,
            server_id=payment.server_id,
            server_name=server.name,
            amount=payment.amount,
            currency=payment.currency,
            amount_rub=payment.amount_rub,
            exchange_rate=payment.exchange_rate,
            paid_at=payment.paid_at,
            payment_month=payment.payment_month,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=list[PaymentResponse])
async def list_payments(
    month: str | None = None,
    server_id: int | None = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(get_current_user),
):
    """Get payment history with optional filters"""
    payments = await get_payments(db, month=month, server_id=server_id, limit=limit)

    # Build response with server names
    result = []
    for payment in payments:
        server_result = await db.execute(select(Server).where(Server.id == payment.server_id))
        server = server_result.scalar_one_or_none()
        server_name = server.name if server else f"Server #{payment.server_id}"

        result.append(PaymentResponse(
            id=payment.id,
            server_id=payment.server_id,
            server_name=server_name,
            amount=payment.amount,
            currency=payment.currency,
            amount_rub=payment.amount_rub,
            exchange_rate=payment.exchange_rate,
            paid_at=payment.paid_at,
            payment_month=payment.payment_month,
        ))

    return result


@router.get("/summary", response_model=PaymentSummary)
async def payment_summary(
    month: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(get_current_user),
):
    """Get payment summary for a month (default: current month)"""
    summary = await get_payment_summary(db, month=month)
    return PaymentSummary(**summary)


@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(get_current_user),
):
    """Delete a payment record (undo payment)"""
    deleted = await delete_payment(db, payment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Payment not found")
