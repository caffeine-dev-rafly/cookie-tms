# Use Python 3.10 Slim
FROM python:3.10-slim

# Set work directory
WORKDIR /app

# Install system dependencies (GCC for Postgres, Docker CLI for monitoring)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python Docker library (To control containers)
RUN pip install --upgrade pip
RUN pip install django djangorestframework psycopg2-binary django-cors-headers docker

# Copy project
COPY . /app/

# Expose port 8000 (Internal)
EXPOSE 8000

# Run Command
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]