"""
API routes for server metrics
"""
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Server, ServerMetrics
from app.schemas import (
    MetricsSubmit,
    MetricsResponse,
    MetricsHistoryResponse,
    AgentTokenResponse,
)

router = APIRouter(prefix="/metrics", tags=["metrics"])

# How long to keep metrics (in hours)
METRICS_RETENTION_HOURS = 24


async def get_server_by_token(
    x_agent_token: str = Header(..., alias="X-Agent-Token"),
    db: AsyncSession = Depends(get_db),
) -> Server:
    """Get server by agent token from header"""
    result = await db.execute(
        select(Server).where(Server.agent_token == x_agent_token)
    )
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=401, detail="Invalid agent token")
    return server


@router.post("/submit", status_code=201)
async def submit_metrics(
    metrics: MetricsSubmit,
    server: Server = Depends(get_server_by_token),
    db: AsyncSession = Depends(get_db),
):
    """Submit metrics from agent (called by agent on monitored server)"""
    # Create metrics record
    db_metrics = ServerMetrics(
        server_id=server.id,
        cpu_percent=metrics.cpu_percent,
        memory_percent=metrics.memory_percent,
        memory_used_mb=metrics.memory_used_mb,
        memory_total_mb=metrics.memory_total_mb,
        disk_percent=metrics.disk_percent,
        disk_used_gb=metrics.disk_used_gb,
        disk_total_gb=metrics.disk_total_gb,
        uptime_seconds=metrics.uptime_seconds,
        load_avg_1=metrics.load_avg_1,
        load_avg_5=metrics.load_avg_5,
        load_avg_15=metrics.load_avg_15,
    )
    db.add(db_metrics)

    # Update server status to online (agent is reporting)
    server.status = "online"
    server.last_check = datetime.utcnow()

    await db.commit()

    # Cleanup old metrics (older than retention period)
    cutoff = datetime.utcnow() - timedelta(hours=METRICS_RETENTION_HOURS)
    await db.execute(
        delete(ServerMetrics).where(
            ServerMetrics.server_id == server.id,
            ServerMetrics.collected_at < cutoff
        )
    )
    await db.commit()

    return {"status": "ok", "server_id": server.id}


@router.get("/current/all")
async def get_all_current_metrics(
    db: AsyncSession = Depends(get_db),
):
    """Get current (latest) metrics for all servers"""
    # Subquery to get the latest metric for each server
    from sqlalchemy import and_

    # Get all servers
    servers_result = await db.execute(select(Server))
    servers = servers_result.scalars().all()

    result = {}
    for server in servers:
        # Get latest metric for this server
        metric_result = await db.execute(
            select(ServerMetrics)
            .where(ServerMetrics.server_id == server.id)
            .order_by(ServerMetrics.collected_at.desc())
            .limit(1)
        )
        metric = metric_result.scalar_one_or_none()

        if metric:
            result[str(server.id)] = {
                "cpu_percent": metric.cpu_percent,
                "memory_percent": metric.memory_percent,
                "memory_used_mb": metric.memory_used_mb,
                "memory_total_mb": metric.memory_total_mb,
                "disk_percent": metric.disk_percent,
                "collected_at": metric.collected_at.isoformat(),
            }

    return result


@router.get("/{server_id}", response_model=MetricsHistoryResponse)
async def get_server_metrics(
    server_id: int,
    hours: int = 12,
    db: AsyncSession = Depends(get_db),
):
    """Get metrics history for a server"""
    # Get server
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    # Get metrics for last N hours
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    result = await db.execute(
        select(ServerMetrics)
        .where(ServerMetrics.server_id == server_id)
        .where(ServerMetrics.collected_at >= cutoff)
        .order_by(ServerMetrics.collected_at.desc())
    )
    metrics_list = result.scalars().all()

    # Current metrics (most recent)
    current = metrics_list[0] if metrics_list else None

    # Calculate averages
    avg_cpu_12h = None
    avg_memory_12h = None
    if metrics_list:
        avg_cpu_12h = sum(m.cpu_percent for m in metrics_list) / len(metrics_list)
        avg_memory_12h = sum(m.memory_percent for m in metrics_list) / len(metrics_list)

    return MetricsHistoryResponse(
        server_id=server.id,
        server_name=server.name,
        current=MetricsResponse.model_validate(current) if current else None,
        history=[MetricsResponse.model_validate(m) for m in metrics_list],
        avg_cpu_12h=round(avg_cpu_12h, 1) if avg_cpu_12h else None,
        avg_memory_12h=round(avg_memory_12h, 1) if avg_memory_12h else None,
    )


@router.post("/{server_id}/token", response_model=AgentTokenResponse)
async def generate_agent_token(
    server_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Generate a new agent token for a server (regenerates if exists)"""
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    # Generate new token
    server.agent_token = secrets.token_hex(32)
    await db.commit()
    await db.refresh(server)

    return AgentTokenResponse(
        agent_token=server.agent_token,
        server_id=server.id,
        server_name=server.name,
    )


@router.get("/{server_id}/token", response_model=AgentTokenResponse)
async def get_agent_token(
    server_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get existing agent token for a server"""
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    if not server.agent_token:
        raise HTTPException(status_code=404, detail="No agent token configured. Generate one first.")

    return AgentTokenResponse(
        agent_token=server.agent_token,
        server_id=server.id,
        server_name=server.name,
    )


@router.delete("/{server_id}/token", status_code=204)
async def revoke_agent_token(
    server_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Revoke agent token for a server"""
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    server.agent_token = None
    await db.commit()
