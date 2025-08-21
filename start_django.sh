#!/bin/bash

# Start Django app with Docker Compose
echo "Starting Django Receipt Manager..."

# Build and start services
docker compose up --build -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Run Django migrations
echo "Running Django migrations..."
docker compose exec django-api python manage.py makemigrations
docker compose exec django-api python manage.py migrate

# Create superuser if needed
echo "Creating superuser..."
docker compose exec django-api python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
"

echo "Django Receipt Manager is ready!"
echo "Frontend: http://localhost:3000"
echo "Django Admin: http://localhost:8000/admin"
echo "API: http://localhost:8000/api/"




