"""Add server metrics table and agent token

Revision ID: 003
Revises: 002
Create Date: 2026-01-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add agent_token to servers for agent authentication
    op.add_column('servers', sa.Column('agent_token', sa.String(64), nullable=True, unique=True))
    op.create_index('ix_servers_agent_token', 'servers', ['agent_token'])

    # Server metrics table
    op.create_table(
        'server_metrics',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('server_id', sa.Integer(), sa.ForeignKey('servers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('cpu_percent', sa.Float(), nullable=False),
        sa.Column('memory_percent', sa.Float(), nullable=False),
        sa.Column('memory_used_mb', sa.Integer(), nullable=False),
        sa.Column('memory_total_mb', sa.Integer(), nullable=False),
        sa.Column('disk_percent', sa.Float(), nullable=False),
        sa.Column('disk_used_gb', sa.Float(), nullable=False),
        sa.Column('disk_total_gb', sa.Float(), nullable=False),
        sa.Column('uptime_seconds', sa.Integer(), nullable=False),
        sa.Column('load_avg_1', sa.Float(), nullable=True),
        sa.Column('load_avg_5', sa.Float(), nullable=True),
        sa.Column('load_avg_15', sa.Float(), nullable=True),
        sa.Column('collected_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # Index for faster metrics lookups
    op.create_index('ix_server_metrics_server_id', 'server_metrics', ['server_id'])
    op.create_index('ix_server_metrics_collected_at', 'server_metrics', ['collected_at'])


def downgrade() -> None:
    op.drop_index('ix_server_metrics_collected_at', 'server_metrics')
    op.drop_index('ix_server_metrics_server_id', 'server_metrics')
    op.drop_table('server_metrics')
    op.drop_index('ix_servers_agent_token', 'servers')
    op.drop_column('servers', 'agent_token')
