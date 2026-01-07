"""Initial migration - create tables

Revision ID: 001
Revises:
Create Date: 2025-01-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users table (for auth)
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # Folders table
    op.create_table(
        'folders',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('color', sa.String(7), server_default='#6b7280'),
        sa.Column('position', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # Servers table
    op.create_table(
        'servers',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('folder_id', sa.Integer(), sa.ForeignKey('folders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('ip', sa.String(45), nullable=False),
        sa.Column('provider', sa.String(50), server_default=''),
        sa.Column('price', sa.Float(), server_default='0.0'),
        sa.Column('currency', sa.String(3), server_default='USD'),
        sa.Column('payment_date', sa.String(10), server_default='-'),
        sa.Column('status', sa.String(10), server_default='unknown'),
        sa.Column('last_ping', sa.Integer(), nullable=True),
        sa.Column('last_check', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # Index for faster folder lookups
    op.create_index('ix_servers_folder_id', 'servers', ['folder_id'])


def downgrade() -> None:
    op.drop_index('ix_servers_folder_id', 'servers')
    op.drop_table('servers')
    op.drop_table('folders')
    op.drop_table('users')
