"""
Application configuration
"""
import secrets
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@db:5432/vpsmanager"

    # Authentication
    secret_key: str = secrets.token_hex(32)  # для JWT, лучше задать в .env
    admin_password: str = "admin"  # пароль для входа, ОБЯЗАТЕЛЬНО сменить в .env
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 дней

    # Monitoring
    ping_interval_seconds: int = 60  # как часто пинговать серверы
    ping_timeout_seconds: int = 5    # таймаут пинга

    # Exchange rates
    exchange_rate_ttl_seconds: int = 3600  # 1 hour cache
    exchange_api_url: str = "https://www.cbr-xml-daily.ru/daily_json.js"

    class Config:
        env_file = ".env"


settings = Settings()
