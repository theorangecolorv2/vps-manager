# Используем slim-версию Python - баланс между размером и функциональностью
# alpine меньше, но могут быть проблемы с компиляцией пакетов
FROM python:3.12-slim

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Переменные окружения Python
# PYTHONDONTWRITEBYTECODE=1 - не создавать .pyc файлы
# PYTHONUNBUFFERED=1 - логи сразу в stdout (важно для Docker)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Сначала копируем ТОЛЬКО requirements.txt
# Это позволяет Docker кэшировать слой с зависимостями
# Пока requirements.txt не изменится - зависимости не переустанавливаются
COPY requirements.txt .

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем alembic конфигурацию и миграции
COPY alembic.ini .
COPY alembic ./alembic

# Копируем код приложения
# В dev-режиме это перезаписывается volume из docker-compose
COPY ./app ./app

# Копируем скрипт запуска
COPY start.sh .
RUN chmod +x start.sh

# Порт, который слушает приложение (документация)
EXPOSE 8000

# Команда по умолчанию (переопределяется в docker-compose для dev)
CMD ["./start.sh"]
