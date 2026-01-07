"""
Server ping service using TCP connection
"""
import asyncio
import time
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models import Server
from app.config import settings


async def ping_server(ip: str, port: int = 22, timeout: float = None) -> tuple[bool, int | None]:
    """
    Ping a server using TCP connect.
    Returns (is_online, latency_ms)
    """
    if timeout is None:
        timeout = settings.ping_timeout_seconds

    start_time = time.time()
    try:
        # Try to connect to port 22 (SSH) or 80 (HTTP)
        _, writer = await asyncio.wait_for(
            asyncio.open_connection(ip, port),
            timeout=timeout
        )
        latency_ms = int((time.time() - start_time) * 1000)
        writer.close()
        await writer.wait_closed()
        return True, latency_ms
    except (asyncio.TimeoutError, OSError, ConnectionRefusedError):
        return False, None


async def ping_server_multi_port(ip: str, ports: list[int] = None) -> tuple[bool, int | None]:
    """
    Try to ping server on multiple ports.
    Returns first successful result or offline.
    """
    if ports is None:
        ports = [22, 80, 443, 8080]

    for port in ports:
        is_online, latency = await ping_server(ip, port)
        if is_online:
            return True, latency

    return False, None


async def update_server_status(db: AsyncSession, server: Server) -> None:
    """Update a single server's status in the database"""
    is_online, latency = await ping_server_multi_port(server.ip)

    server.status = "online" if is_online else "offline"
    server.last_ping = latency
    server.last_check = datetime.utcnow()

    await db.commit()


async def ping_all_servers() -> dict:
    """Ping all servers and update their status"""
    async with async_session() as db:
        result = await db.execute(select(Server))
        servers = result.scalars().all()

        results = {"total": len(servers), "online": 0, "offline": 0}

        # Ping all servers concurrently
        tasks = []
        for server in servers:
            tasks.append(ping_server_multi_port(server.ip))

        ping_results = await asyncio.gather(*tasks, return_exceptions=True)

        # Update database
        for server, ping_result in zip(servers, ping_results):
            if isinstance(ping_result, Exception):
                server.status = "offline"
                server.last_ping = None
                results["offline"] += 1
            else:
                is_online, latency = ping_result
                server.status = "online" if is_online else "offline"
                server.last_ping = latency
                if is_online:
                    results["online"] += 1
                else:
                    results["offline"] += 1

            server.last_check = datetime.utcnow()

        await db.commit()

        return results


async def ping_loop():
    """Background task that pings all servers periodically"""
    print(f"Starting ping loop (interval: {settings.ping_interval_seconds}s)")
    while True:
        try:
            results = await ping_all_servers()
            print(f"Ping complete: {results['online']}/{results['total']} servers online")
        except Exception as e:
            print(f"Ping error: {e}")

        await asyncio.sleep(settings.ping_interval_seconds)
