FROM python:3.11-alpine

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir psutil requests

# Copy agent script
COPY agent.py .

# Run as non-root user
RUN adduser -D -u 1000 agent
USER agent

# Environment variables (to be set at runtime)
ENV API_URL=""
ENV AGENT_TOKEN=""
ENV INTERVAL="60"
ENV LOG_LEVEL="INFO"

CMD ["python", "-u", "agent.py"]
