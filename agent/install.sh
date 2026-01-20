#!/bin/bash
#
# VPS Manager Agent Installer
# Usage: curl -sSL https://your-domain/install.sh | bash -s -- --api-url=https://your-api --token=xxx
#
# Or with environment variables:
# API_URL=https://your-api AGENT_TOKEN=xxx curl -sSL https://your-domain/install.sh | bash
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Defaults
CONTAINER_NAME="vps-agent"
INTERVAL="${INTERVAL:-60}"

# Parse arguments
for arg in "$@"; do
    case $arg in
        --api-url=*)
            API_URL="${arg#*=}"
            shift
            ;;
        --token=*)
            AGENT_TOKEN="${arg#*=}"
            shift
            ;;
        --interval=*)
            INTERVAL="${arg#*=}"
            shift
            ;;
        --name=*)
            CONTAINER_NAME="${arg#*=}"
            shift
            ;;
        *)
            ;;
    esac
done

echo -e "${GREEN}VPS Manager Agent Installer${NC}"
echo "================================"

# Validate required parameters
if [ -z "$API_URL" ]; then
    echo -e "${RED}Error: API_URL is required${NC}"
    echo "Usage: $0 --api-url=https://your-api --token=xxx"
    exit 1
fi

if [ -z "$AGENT_TOKEN" ]; then
    echo -e "${RED}Error: AGENT_TOKEN is required${NC}"
    echo "Usage: $0 --api-url=https://your-api --token=xxx"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${YELLOW}Configuration:${NC}"
echo "  API URL: $API_URL"
echo "  Token: ${AGENT_TOKEN:0:8}..."
echo "  Interval: ${INTERVAL}s"
echo "  Container: $CONTAINER_NAME"
echo ""

# Stop and remove existing container if exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}Stopping existing container...${NC}"
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
fi

# Create agent script
AGENT_DIR="/opt/vps-agent"
mkdir -p "$AGENT_DIR"

echo -e "${YELLOW}Downloading agent script...${NC}"
cat > "$AGENT_DIR/agent.py" << 'AGENT_SCRIPT'
#!/usr/bin/env python3
"""VPS Manager Agent - Lightweight metrics collector"""
import os, sys, time, signal, logging
import psutil, requests

API_URL = os.environ.get("API_URL", "").rstrip("/")
AGENT_TOKEN = os.environ.get("AGENT_TOKEN", "")
INTERVAL = int(os.environ.get("INTERVAL", "60"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

running = True
def signal_handler(s, f):
    global running
    running = False
signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

def get_metrics():
    cpu = psutil.cpu_percent(interval=1)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    uptime = int(time.time() - psutil.boot_time())
    load = (None, None, None)
    try:
        load = os.getloadavg()
    except:
        pass
    return {
        "cpu_percent": cpu,
        "memory_percent": mem.percent,
        "memory_used_mb": mem.used // (1024*1024),
        "memory_total_mb": mem.total // (1024*1024),
        "disk_percent": disk.percent,
        "disk_used_gb": round(disk.used / (1024**3), 2),
        "disk_total_gb": round(disk.total / (1024**3), 2),
        "uptime_seconds": uptime,
        "load_avg_1": round(load[0], 2) if load[0] else None,
        "load_avg_5": round(load[1], 2) if load[1] else None,
        "load_avg_15": round(load[2], 2) if load[2] else None,
    }

def send_metrics(m):
    try:
        r = requests.post(f"{API_URL}/api/metrics/submit", json=m,
            headers={"X-Agent-Token": AGENT_TOKEN}, timeout=10)
        if r.status_code == 201:
            logger.debug(f"Sent: CPU={m['cpu_percent']}% RAM={m['memory_percent']}%")
            return True
        logger.error(f"API error: {r.status_code}")
    except Exception as e:
        logger.error(f"Connection error: {e}")
    return False

def main():
    if not API_URL or not AGENT_TOKEN:
        logger.error("API_URL and AGENT_TOKEN required")
        sys.exit(1)
    logger.info(f"Agent starting, interval={INTERVAL}s")
    while running:
        try:
            send_metrics(get_metrics())
        except Exception as e:
            logger.error(f"Error: {e}")
        for _ in range(INTERVAL):
            if not running: break
            time.sleep(1)

if __name__ == "__main__":
    main()
AGENT_SCRIPT

# Run container
echo -e "${YELLOW}Starting agent container...${NC}"
docker run -d \
    --name "$CONTAINER_NAME" \
    --restart=always \
    --network=host \
    -e API_URL="$API_URL" \
    -e AGENT_TOKEN="$AGENT_TOKEN" \
    -e INTERVAL="$INTERVAL" \
    -v "$AGENT_DIR/agent.py:/app/agent.py:ro" \
    python:3.11-alpine \
    sh -c "pip install -q psutil requests && python -u /app/agent.py"

# Wait a bit and check status
sleep 3
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo ""
    echo -e "${GREEN}Agent installed and running!${NC}"
    echo ""
    echo "Useful commands:"
    echo "  View logs:    docker logs -f $CONTAINER_NAME"
    echo "  Stop agent:   docker stop $CONTAINER_NAME"
    echo "  Remove agent: docker rm -f $CONTAINER_NAME"
else
    echo -e "${RED}Error: Container failed to start${NC}"
    echo "Check logs: docker logs $CONTAINER_NAME"
    exit 1
fi
