"""Add payments and exchange rates tables

Revision ID: 002
Revises: 001
Create Date: 2026-01-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add last_paid_month to servers
    op.add_column('servers', sa.Column('last_paid_month', sa.String(7), nullable=True))

    # Payments table
    op.create_table(
        'payments',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('server_id', sa.Integer(), sa.ForeignKey('servers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False),
        sa.Column('amount_rub', sa.Float(), nullable=False),
        sa.Column('exchange_rate', sa.Float(), nullable=False),
        sa.Column('paid_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('payment_month', sa.String(7), nullable=False),
    )

    # Index for faster payment lookups by server and month
    op.create_index('ix_payments_server_id', 'payments', ['server_id'])
    op.create_index('ix_payments_payment_month', 'payments', ['payment_month'])

    # Exchange rates table
    op.create_table(
        'exchange_rates',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('currency', sa.String(3), nullable=False, unique=True),
        sa.Column('rate_to_rub', sa.Float(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('exchange_rates')
    op.drop_index('ix_payments_payment_month', 'payments')
    op.drop_index('ix_payments_server_id', 'payments')
    op.drop_table('payments')
    op.drop_column('servers', 'last_paid_month')
