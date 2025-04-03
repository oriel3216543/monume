#!/usr/bin/env python
"""
Database initialization script for MonuMe Tracker.
This will create and set up the SQLite database with all required tables.
"""
import os
import sqlite3
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("MonuMeDB")

def init_db():
    """Initialize database with all necessary tables for MonuMe Tracker."""
    db_file = 'monume.db'
    logger.info(f"Initializing database: {db_file}")
    
    # Check if database already exists
    db_exists = os.path.exists(db_file)
    if db_exists:
        logger.info("Database file already exists")
        backup_file = f"{db_file}.bak"
        logger.info(f"Creating backup at {backup_file}")
        try:
            import shutil
            shutil.copy2(db_file, backup_file)
        except Exception as e:
            logger.warning(f"Could not create backup: {e}")

    # Connect to database (creates it if it doesn't exist)
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        logger.info("Database connection established")
    except sqlite3.Error as e:
        logger.error(f"Failed to connect to database: {e}")
        return False

    try:
        # Enable foreign key constraints
        cursor.execute("PRAGMA foreign_keys = ON")
        
        # Create users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email TEXT,
                name TEXT,
                role TEXT CHECK(role IN ('admin', 'manager', 'employee')),
                location TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create employee responses table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS employee_responses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date TEXT DEFAULT CURRENT_DATE,
                opal_demos INTEGER DEFAULT 0,
                opal_sales INTEGER DEFAULT 0,
                scan_demos INTEGER DEFAULT 0,
                scan_sold INTEGER DEFAULT 0,
                net_sales REAL DEFAULT 0,
                hours_worked REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ''')
        
        # Create locations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS locations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location_name TEXT NOT NULL,
                mall TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create email logs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS email_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                recipient TEXT NOT NULL,
                subject TEXT,
                type TEXT,
                status TEXT,
                error_message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_username ON users(username)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_response_user_date ON employee_responses(user_id, date)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_email_logs_timestamp ON email_logs(timestamp)')
        
        # Create admin user if this is a fresh database
        if not db_exists:
            logger.info("Creating default admin user")
            cursor.execute('''
                INSERT INTO users (username, password, email, name, role, location)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', ('admin', 'admin123', 'admin@monumetracker.com', 'Administrator', 'admin', 'Main Office'))

            # Add some default locations
            logger.info("Adding default locations")
            locations = [
                ('Main Office', 'Headquarters'),
                ('Downtown', 'City Mall'),
                ('Eastside', 'East Shopping Center')
            ]
            cursor.executemany('''
                INSERT INTO locations (location_name, mall) VALUES (?, ?)
            ''', locations)
        
        # Commit changes and close connection
        conn.commit()
        logger.info("Database schema created successfully")
        
        # Verify tables were created
        tables = cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
        logger.info(f"Tables in database: {[t[0] for t in tables]}")
        
        conn.close()
        return True
        
    except sqlite3.Error as e:
        logger.error(f"Database error: {e}")
        conn.rollback()
        conn.close()
        return False

if __name__ == "__main__":
    if init_db():
        print("Database initialization completed successfully")
    else:
        print("Database initialization failed. Check the logs for details.")
