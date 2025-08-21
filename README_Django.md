# Receipt Manager - Django API & React Frontend

A full-stack receipt management application with OCR processing, natural language queries, and multi-user support.

## 🏗️ Architecture

- **Backend**: Django REST API with PostgreSQL
- **Frontend**: React with Bootstrap
- **OCR**: OCR.space API + LangChain for structured data extraction
- **AI**: Ollama (local LLM) for natural language processing
- **Containerization**: Docker & Docker Compose

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js (for local frontend development)

### 1. Start the Application
```bash
# Windows
.\start_django.bat

# Linux/Mac
chmod +x start_django.sh
./start_django.sh
```

### 2. Access the Application
- **Frontend**: http://localhost:3000
- **Django Admin**: http://localhost:8000/admin
- **API Documentation**: http://localhost:8000/api/

### 3. Default Credentials
- **Superuser**: admin / admin123
- **Regular User**: Register through the frontend

## 📋 API Endpoints

### Authentication
- `POST /api/users/register/` - User registration
- `POST /api/users/login/` - User login
- `POST /api/users/logout/` - User logout
- `GET /api/users/me/` - Get current user

### Receipt Management
- `GET /api/receipts/` - List user's receipt items
- `POST /api/receipts/` - Create new receipt item
- `GET /api/receipts/statistics/` - Get user statistics
- `GET /api/receipts/by_category/` - Get spending by category
- `GET /api/receipts/by_store/` - Get spending by store

### OCR Processing
- `POST /api/ocr/process/` - Process receipt image

### Chat/AI Queries
- `POST /api/chat/query/` - Natural language queries
- `GET /api/chat/insights/` - Quick insights

## 🎯 Features

### Core Functionality
- **Multi-user Support**: Each user has isolated data
- **OCR Processing**: Extract text from receipt images
- **Structured Data Extraction**: Convert OCR text to structured data
- **Natural Language Queries**: Ask questions about your spending
- **Receipt Management**: View, search, and analyze receipts

### Advanced Features
- **Spending Analytics**: Category and store-based analysis
- **Real-time Processing**: Immediate OCR and AI processing
- **Responsive UI**: Mobile-friendly interface
- **Data Export**: API endpoints for data integration

## 🛠️ Development

### Project Structure
```
├── receipt_api/          # Django project
│   ├── settings.py       # Django settings
│   ├── urls.py          # Main URL configuration
│   └── wsgi.py          # WSGI configuration
├── users/               # User management app
├── receipts/            # Receipt management app
├── ocr/                 # OCR processing app
├── chat/                # AI chat app
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   └── contexts/    # React contexts
└── docker-compose.yml   # Docker orchestration
```

### Local Development

#### Backend (Django)
```bash
# Install dependencies
pip install -r requirements_django.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Start development server
python manage.py runserver
```

#### Frontend (React)
```bash
cd frontend
npm install
npm start
```

### Database Schema

#### Users Table
- `id`: Primary key
- `username`: Unique username
- `email`: Email address
- `full_name`: Full name
- `is_active`: Account status
- `created_at`: Account creation date
- `updated_at`: Last update date

#### Receipt Items Table
- `id`: Primary key
- `user_id`: Foreign key to users
- `receipt_id`: Receipt identifier
- `item_name`: Item name
- `quantity`: Item quantity
- `price`: Unit price
- `total_amount`: Calculated total
- `category`: Item category
- `store_name`: Store name
- `purchase_date`: Purchase date
- `created_at`: Record creation date
- `updated_at`: Last update date

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# AI/LLM
OLLAMA_BASE_URL=http://ollama:11434

# OCR
OCR_API_KEY=your_ocr_api_key

# Django
SECRET_KEY=your_secret_key
DEBUG=True
```

### Docker Services
- **postgres**: PostgreSQL database
- **ollama**: Local LLM service
- **django-api**: Django REST API
- **frontend**: React frontend

## 📊 API Examples

### Process Receipt
```bash
curl -X POST http://localhost:8000/api/ocr/process/ \
  -F "image=@receipt.jpg"
```

### Ask Question
```bash
curl -X POST http://localhost:8000/api/chat/query/ \
  -H "Content-Type: application/json" \
  -d '{"query": "What is my total spending this month?"}'
```

### Get Statistics
```bash
curl http://localhost:8000/api/receipts/statistics/
```

## 🚀 Deployment

### Production Setup
1. Update `settings.py` for production
2. Set environment variables
3. Use production database
4. Configure static files
5. Set up reverse proxy (nginx)

### Docker Production
```bash
# Build production images
docker compose -f docker-compose.prod.yml up --build
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL service is running
   - Verify database credentials
   - Run migrations: `python manage.py migrate`

2. **OCR Processing Fails**
   - Verify OCR API key
   - Check image format (PNG/JPG)
   - Ensure image is readable

3. **AI Queries Not Working**
   - Check Ollama service is running
   - Verify model is downloaded: `ollama pull llama2`
   - Check network connectivity

4. **Frontend Not Loading**
   - Check React development server
   - Verify API proxy configuration
   - Check browser console for errors

### Logs
```bash
# View all logs
docker compose logs

# View specific service logs
docker compose logs django-api
docker compose logs frontend
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review API documentation

---

**Built with ❤️ using Django, React, and AI**



