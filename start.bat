@echo off
setlocal enabledelayedexpansion

echo 🧾 Starting Multi-User Receipt OCR Handler...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Main script logic
if "%1"=="" goto start
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="logs" goto logs
if "%1"=="status" goto status
if "%1"=="db" goto db
if "%1"=="model" goto model
if "%1"=="help" goto help
goto unknown

:start
echo 🚀 Starting Multi-User Receipt OCR Handler...
docker compose up --build -d

echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

echo 📊 Checking service status...
docker compose ps

echo.
echo ✅ Services started successfully!
echo.
echo 📱 Web Interface: http://localhost:8501
echo 🗄️ Database: localhost:5432
echo 🤖 Ollama API: localhost:11435
echo.
echo 💡 Next steps:
echo 1. Open http://localhost:8501 in your browser
echo 2. Set your username in the sidebar
echo 3. Upload receipt images to get started!
echo.
echo 🔧 Useful commands:
echo   start.bat logs    - View logs
echo   start.bat status  - Check status
echo   start.bat db      - Access database
echo   start.bat help    - Show help
echo.
goto end

:stop
echo 🛑 Stopping services...
docker compose down
goto end

:restart
echo 🔄 Restarting services...
docker compose down
docker compose up --build -d
goto end

:logs
echo 📋 Viewing logs...
docker compose logs -f
goto end

:status
echo 📊 Checking container status...
docker compose ps
goto end

:db
echo 🗄️ Accessing PostgreSQL database...
docker exec -it receipt-postgres psql -U shikhar -d receipt_db
goto end

:model
echo 🤖 Pulling Ollama model...
docker exec -it receipt-ollama ollama pull llama3.2:1b
goto end

:help
echo.
echo 🧾 Multi-User Receipt OCR Handler - Usage Guide
echo.
echo 📱 Web Interface: http://localhost:8501
echo 🗄️ Database: localhost:5432 (user: shikhar, db: receipt_db)
echo 🤖 Ollama API: localhost:11435
echo.
echo 🔧 Available Commands:
echo   start     - Start all services
echo   stop      - Stop all services
echo   restart   - Restart all services
echo   logs      - View logs
echo   status    - Check container status
echo   db        - Access PostgreSQL database
echo   model     - Pull Ollama model
echo   help      - Show this help
echo.
echo 📊 Quick Start:
echo   1. Run: start.bat start
echo   2. Wait for services to start (2-3 minutes)
echo   3. Open: http://localhost:8501
echo   4. Set username in sidebar (e.g., 'alice', 'bob')
echo   5. Upload receipt images and start processing!
echo.
echo 👥 User Management:
echo   - Each user has isolated data
echo   - Use different usernames for different users
echo   - Access database for advanced user management
echo.
echo 🔍 Troubleshooting:
echo   - Check logs: start.bat logs
echo   - Restart services: start.bat restart
echo   - Access database: start.bat db
echo.
goto end

:unknown
echo ❌ Unknown command: %1
echo Use 'start.bat help' for usage information.
goto end

:end
pause
