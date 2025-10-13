#!/usr/bin/env bash
set -e

# применяем миграции перед стартом приложения
alembic upgrade head

# запускаем uvicorn
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
