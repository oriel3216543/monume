# Use a base image with Python pre-installed
FROM python:3.11-slim

# Install system dependencies required for reportlab
RUN apt-get update && apt-get install -y \
    libfreetype6-dev \
    libjpeg-dev \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy your project files
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port Railway will use
ENV PORT=5000
EXPOSE $PORT

# Run your server
CMD ["python", "server.py"]

