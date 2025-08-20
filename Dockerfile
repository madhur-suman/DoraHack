# syntax=docker/dockerfile:1

FROM python:3.11-slim as base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.ai/install.sh | sh

# Create app dir
WORKDIR /app

# Install Python deps first for layer caching
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy source code
COPY *.py /app/
COPY *.md /app/

# Create necessary directories
RUN mkdir -p /app/uploads

# Expose port for Streamlit
EXPOSE 8501

# Default command runs the Streamlit app
CMD ["streamlit", "run", "receipt_app.py", "--server.address", "0.0.0.0", "--server.port", "8501", "--server.headless", "true"]

