#!/bin/bash
set -e  # Exit on error

# Print startup message
echo "Starting MonuMe Tracker application..."

# Start Nginx in the background (with sudo since we're running as non-root)
sudo nginx || echo "Warning: Could not start nginx, continuing with application startup"

# Create required directories if they don't exist
mkdir -p /app/temp

# Set proper permissions for database file
touch /app/monume.db 2>/dev/null || true
chmod 600 /app/monume.db 2>/dev/null || true

# Check if DB exists, if not initialize it
if [ ! -s /app/monume.db ]; then
    echo "Initializing database..."
    python init_db.py
    # Set proper permissions for the newly created database
    chmod 600 /app/monume.db
fi

# Start the Flask application with proper production settings
echo "Starting Flask application with Waitress..."
exec python deploy.py --production
