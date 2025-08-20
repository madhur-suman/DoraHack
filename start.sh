#!/bin/bash

# Multi-User Receipt OCR Handler - Startup Script
echo "🧾 Starting Multi-User Receipt OCR Handler..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Function to check if containers are running
check_containers() {
    echo "📊 Checking container status..."
    docker compose ps
}

# Function to view logs
view_logs() {
    echo "📋 Viewing logs..."
    docker compose logs -f
}

# Function to stop services
stop_services() {
    echo "🛑 Stopping services..."
    docker compose down
}

# Function to restart services
restart_services() {
    echo "🔄 Restarting services..."
    docker compose down
    docker compose up --build -d
}

# Function to access database
access_db() {
    echo "🗄️ Accessing PostgreSQL database..."
    docker exec -it receipt-postgres psql -U shikhar -d receipt_db
}

# Function to pull Ollama model
pull_model() {
    echo "🤖 Pulling Ollama model..."
    docker exec -it receipt-ollama ollama pull llama3.2:1b
}

# Function to show usage
show_usage() {
    echo "
🧾 Multi-User Receipt OCR Handler - Usage Guide

📱 Web Interface: http://localhost:8501
🗄️ Database: localhost:5432 (user: shikhar, db: receipt_db)
🤖 Ollama API: localhost:11435

🔧 Available Commands:
  start     - Start all services
  stop      - Stop all services
  restart   - Restart all services
  logs      - View logs
  status    - Check container status
  db        - Access PostgreSQL database
  model     - Pull Ollama model
  help      - Show this help

📊 Quick Start:
  1. Run: ./start.sh start
  2. Wait for services to start (2-3 minutes)
  3. Open: http://localhost:8501
  4. Set username in sidebar (e.g., 'alice', 'bob')
  5. Upload receipt images and start processing!

👥 User Management:
  - Each user has isolated data
  - Use different usernames for different users
  - Access database for advanced user management

🔍 Troubleshooting:
  - Check logs: ./start.sh logs
  - Restart services: ./start.sh restart
  - Access database: ./start.sh db
"
}

# Main script logic
case "${1:-start}" in
    "start")
        echo "🚀 Starting Multi-User Receipt OCR Handler..."
        docker compose up --build -d
        
        echo "⏳ Waiting for services to start..."
        sleep 10
        
        echo "📊 Checking service status..."
        check_containers
        
        echo "
✅ Services started successfully!

📱 Web Interface: http://localhost:8501
🗄️ Database: localhost:5432
🤖 Ollama API: localhost:11435

💡 Next steps:
1. Open http://localhost:8501 in your browser
2. Set your username in the sidebar
3. Upload receipt images to get started!

🔧 Useful commands:
  ./start.sh logs    - View logs
  ./start.sh status  - Check status
  ./start.sh db      - Access database
  ./start.sh help    - Show help
"
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "logs")
        view_logs
        ;;
    "status")
        check_containers
        ;;
    "db")
        access_db
        ;;
    "model")
        pull_model
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo "Use './start.sh help' for usage information."
        exit 1
        ;;
esac
