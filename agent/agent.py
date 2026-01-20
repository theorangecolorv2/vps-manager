#!/usr/bin/env python3
"""
VPS Manager Agent - Lightweight metrics collector
Collects CPU, RAM, disk usage and sends to VPS Manager API
"""
import os
import sys
import time
import json
import signal
import logging
from datetime import datetime

import psutil
import requests

# Configuration from environment
API_URL = os.environ.get("API_URL", "").rstrip("/")
AGENT_TOKEN = os.environ.get("AGENT_TOKEN", "")
INTERVAL = int(os.environ.get("INTERVAL", "60"))  # seconds
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")

# Setup logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper()),
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# Graceful shutdown
running = True


def signal_handler(signum, frame):
    global running
    logger.info("Shutdown signal received, stopping...")
    running = False


signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)


def get_metrics() -> dict:
    """Collect system metrics"""
    # CPU percent (average over 1 second)
    cpu_percent = psutil.cpu_percent(interval=1)

    # Memory
    mem = psutil.virtual_memory()
    memory_percent = mem.percent
    memory_used_mb = mem.used // (1024 * 1024)
    memory_total_mb = mem.total // (1024 * 1024)

    # Disk (root partition)
    disk = psutil.disk_usage("/")
    disk_percent = disk.percent
    disk_used_gb = round(disk.used / (1024 ** 3), 2)
    disk_total_gb = round(disk.total / (1024 ** 3), 2)

    # Uptime
    boot_time = psutil.boot_time()
    uptime_seconds = int(time.time() - boot_time)

    # Load average (Linux/Unix only)
    load_avg_1 = None
    load_avg_5 = None
    load_avg_15 = None
    try:
        load = os.getloadavg()
        load_avg_1 = round(load[0], 2)
        load_avg_5 = round(load[1], 2)
        load_avg_15 = round(load[2], 2)
    except (OSError, AttributeError):
        # Windows doesn't have getloadavg
        pass

    return {
        "cpu_percent": cpu_percent,
        "memory_percent": memory_percent,
        "memory_used_mb": memory_used_mb,
        "memory_total_mb": memory_total_mb,
        "disk_percent": disk_percent,
        "disk_used_gb": disk_used_gb,
        "disk_total_gb": disk_total_gb,
        "uptime_seconds": uptime_seconds,
        "load_avg_1": load_avg_1,
        "load_avg_5": load_avg_5,
        "load_avg_15": load_avg_15,
    }


def send_metrics(metrics: dict) -> bool:
    """Send metrics to API"""
    url = f"{API_URL}/api/metrics/submit"
    headers = {
        "Content-Type": "application/json",
        "X-Agent-Token": AGENT_TOKEN,
    }

    try:
        response = requests.post(url, json=metrics, headers=headers, timeout=10)
        if response.status_code == 201:
            logger.debug(f"Metrics sent successfully: CPU={metrics['cpu_percent']}%, RAM={metrics['memory_percent']}%")
            return True
        else:
            logger.error(f"Failed to send metrics: {response.status_code} - {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to connect to API: {e}")
        return False


def main():
    # Validate configuration
    if not API_URL:
        logger.error("API_URL environment variable is required")
        sys.exit(1)
    if not AGENT_TOKEN:
        logger.error("AGENT_TOKEN environment variable is required")
        sys.exit(1)

    logger.info(f"VPS Manager Agent starting...")
    logger.info(f"API URL: {API_URL}")
    logger.info(f"Interval: {INTERVAL} seconds")

    # Initial collection
    logger.info("Collecting initial metrics...")

    consecutive_failures = 0
    max_failures = 5

    while running:
        try:
            metrics = get_metrics()
            success = send_metrics(metrics)

            if success:
                consecutive_failures = 0
            else:
                consecutive_failures += 1
                if consecutive_failures >= max_failures:
                    logger.warning(f"Failed to send metrics {consecutive_failures} times in a row")

        except Exception as e:
            logger.error(f"Error collecting metrics: {e}")
            consecutive_failures += 1

        # Wait for next interval (check running flag every second)
        for _ in range(INTERVAL):
            if not running:
                break
            time.sleep(1)

    logger.info("Agent stopped")


if __name__ == "__main__":
    main()
