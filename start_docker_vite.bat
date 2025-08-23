@echo off
echo Starting Docker services with Vite...
echo.

echo Building and starting services...
docker-compose up --build

echo.
echo Services are starting up...
echo Frontend (Vite): http://localhost:5173
echo Django API: http://localhost:8000
echo PostgreSQL: localhost:5432
echo Ollama: http://localhost:11435
echo.
echo Press Ctrl+C to stop all services
