#!/usr/bin/env python
# Add additional imports
import sys
import os
import logging
import sqlite3
import json
import traceback
import secrets
import mimetypes
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory, send_file, session, redirect, url_for
# Add imports for production deployment
import ssl
# Make waitress import conditional
try:
    from waitress import serve
    HAS_WAITRESS = True
except ImportError:
    HAS_WAITRESS = False
    # No need to print error here as deploy.py will handle this

# Improve logging configuration
logging.basicConfig(
    level=logging.INFO,  # Changed to INFO for production
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('server_logs.txt', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("MonuMeServer")

# Get the current working directory and base URL path
root_dir = os.path.dirname(os.path.abspath(__file__))
BASE_PATH = os.environ.get('BASE_PATH', '')  # For GitHub Pages or subdirectory deployment

# Configure Flask app with proper error handling and static file serving
app = Flask(__name__, 
    static_url_path=os.path.join(BASE_PATH, 'static'),
    static_folder='static',
    template_folder='static'
)

# Generate a strong secret key if not provided
if not os.environ.get('SECRET_KEY'):
    # Only generate a new one if not already set
    if not app.secret_key or app.secret_key == 'monume_tracker_9522021_secure_key':
        os.environ['SECRET_KEY'] = secrets.token_hex(24)

# Use a stronger secret key for production - set from environment variable
app.secret_key = os.environ.get('SECRET_KEY', 'monume_tracker_9522021_secure_key')

# Get port from environment variable or use default
PORT = int(os.environ.get('PORT', 5000))

# Get domain configuration
DOMAIN = os.environ.get('DOMAIN', '0.0.0.0')  # Changed from localhost to 0.0.0.0 for production

# Set production flag
PRODUCTION = os.environ.get('PRODUCTION', 'false').lower() == 'true'

# SSL Certificate paths (for HTTPS)
SSL_CERT = os.environ.get('SSL_CERT', '')
SSL_KEY = os.environ.get('SSL_KEY', '')

# Session configuration
app.config['SESSION_COOKIE_SECURE'] = PRODUCTION  # Only send cookies over HTTPS in production
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Prevent JavaScript access to cookies
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Restrict cross-site cookie usage
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=1)  # Session timeout
if BASE_PATH:
    app.config['APPLICATION_ROOT'] = BASE_PATH

# Production security headers
@app.after_request
def add_security_headers(response):
    if PRODUCTION:
        # Content Security Policy
        response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
        # XSS Protection
        response.headers['X-XSS-Protection'] = '1; mode=block'
        # Content Type Options
        response.headers['X-Content-Type-Options'] = 'nosniff'
        # Frame Options
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        # Referrer Policy
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response

# Custom error handler to prevent server crashing
@app.errorhandler(Exception)
def handle_error(error):
    logger.error(f"Unhandled error: {error}")
    logger.error(traceback.format_exc())
    return jsonify({"error": "Internal server error"}), 500

# Enhanced database connection with better error handling
def get_db_connection():
    try:
        conn = sqlite3.connect('monume.db', timeout=20)  # Increased timeout
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        logger.error(f"Database connection error: {e}")
        raise

# Creates a full URL path including the BASE_PATH if defined
def full_path(path):
    if BASE_PATH and not path.startswith(BASE_PATH):
        return os.path.join(BASE_PATH, path.lstrip('/'))
    return path

# Add proper MIME type mappings
mimetypes.add_type('text/javascript', '.js')
mimetypes.add_type('text/css', '.css')

# Serve static files with proper MIME types
@app.route('/<path:path>')
def serve_file(path):
    if os.path.exists(path):
        return send_from_directory('.', path, mimetype=mimetypes.guess_type(path)[0])
    elif os.path.exists(os.path.join('static', path)):
        return send_from_directory('static', path, mimetype=mimetypes.guess_type(path)[0])
    return 'File not found', 404

# Modified static file serving with proper MIME types
@app.route('/<path:filename>')
def serve_static(filename):
    # Map file extensions to MIME types
    mime_types = {
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.html': 'text/html',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.ico': 'image/x-icon'
    }
    
    # Get file extension
    ext = os.path.splitext(filename)[1].lower()
    mime_type = mime_types.get(ext, 'application/octet-stream')
    
    # Check if the file exists in the static folder first
    static_path = os.path.join(app.static_folder, filename)
    if os.path.isfile(static_path):
        response = send_from_directory(app.static_folder, filename)
        response.headers['Content-Type'] = mime_type
        return response
    
    # If not in static folder, try serving from the root directory
    root_path = os.path.join(root_dir, filename)
    if os.path.isfile(root_path):
        response = send_file(root_path)
        response.headers['Content-Type'] = mime_type
        return response
    
    # If file not found in either location, return 404
    logger.warning(f"File not found: {filename}")
    return jsonify({"error": "File not found"}), 404

# Special route for files in /static/ URL path that are actually in root
@app.route('/static/<path:filename>')
def serve_from_root_or_static(filename):
    # Map file extensions to MIME types
    mime_types = {
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.html': 'text/html',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.ico': 'image/x-icon'
    }
    
    # Get file extension
    ext = os.path.splitext(filename)[1].lower()
    mime_type = mime_types.get(ext, 'application/octet-stream')
    
    # First check if file exists in the static folder
    static_path = os.path.join(app.static_folder, filename)
    if os.path.isfile(static_path):
        response = send_from_directory(app.static_folder, filename)
        response.headers['Content-Type'] = mime_type
        return response
    
    # If not in static folder, check if it exists in the root directory
    root_path = os.path.join(root_dir, filename)
    if os.path.isfile(root_path):
        response = send_file(root_path)
        response.headers['Content-Type'] = mime_type
        return response
    
    # If file not found in either location, return 404
    logger.warning(f"File not found in static or root: {filename}")
    return jsonify({"error": "File not found"}), 404

# Add root route to serve index.html
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

# Add favicon route
@app.route('/favicon.ico')
def favicon():
    return send_file('favicon.ico') if os.path.isfile('favicon.ico') else ('', 204)

# Add robots.txt route
@app.route('/robots.txt')
def robots():
    return send_file('robots.txt') if os.path.isfile('robots.txt') else ('', 204)

# Add .well-known route for SSL validation and domain ownership verification
@app.route('/.well-known/<path:filename>')
def well_known(filename):
    well_known_dir = os.path.join(root_dir, '.well-known')
    if os.path.exists(os.path.join(well_known_dir, filename)):
        return send_from_directory(well_known_dir, filename)
    return '', 404

# Serve all HTML pages
@app.route('/<path:page>.html')
def serve_html_page(page):
    if page + '.html' in os.listdir(app.static_folder):
        return send_from_directory(app.static_folder, page + '.html')
    return jsonify({"error": "Page not found"}), 404

# Update the login route to properly return user data and set session
@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        if not data:
            logger.error("No JSON data received")
            return jsonify({"error": "No JSON data received"}), 400

        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            logger.error("Username or password not provided")
            return jsonify({"error": "Username and password are required"}), 400

        logger.debug(f"Login attempt: {username}")

        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE username = ? AND password = ?', (username, password)).fetchone()
        conn.close()

        if user:
            logger.debug(f"Login successful: {username}, Role: {user['role']}")
            # Set session data
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']
            session['location'] = user['location']
            session['login_time'] = datetime.now().isoformat()
            session.permanent = True
            
            # Return complete user information
            return jsonify({
                "username": user["username"],
                "role": user["role"],
                "location": user["location"],
                "user_id": user["id"]
            }), 200
        else:
            logger.debug(f"Login failed: Invalid username or password for {username}")
            return jsonify({"error": "Invalid username or password"}), 401
            
    except sqlite3.Error as db_error:
        logger.error(f"Database error: {db_error}")
        response = jsonify({"error": f"Database error: {db_error}"})
        response.status_code = 500
        return response
    except KeyError as key_error:
        logger.error(f"Missing key in request data: {key_error}")
        response = jsonify({"error": f"Missing key in request data: {key_error}"})
        response.status_code = 400
        return response
    except Exception as e:
        logger.error(f"Unexpected server error: {e}")
        response = jsonify({"error": f"Unexpected server error: {e}"})
        response.status_code = 500
        return response

# Add logout endpoint
@app.route('/logout', methods=['POST'])
def logout():
    try:
        # Clear session data
        session.clear()
        return jsonify({"message": "Logged out successfully"}), 200
    except Exception as e:
        logger.error(f"Error in logout: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Add the current user endpoint
@app.route("/get_current_user")
def get_current_user():
    try:
        # Check if user is authenticated
        if 'user_id' not in session:
            return jsonify({"error": "Not authenticated"}), 401
            
        # Return the user data from session
        return jsonify({
            "username": session.get("username"), 
            "role": session.get("role"),
            "location": session.get("location"),
            "user_id": session.get("user_id")
        }), 200
    except Exception as e:
        logger.error(f"Error in get_current_user: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Modify get_history to include user role check
@app.route("/get_history")
def get_history():
    try:
        logger.debug("Fetching history data...")
        
        # Authorization check - only allow logged in users
        if 'user_id' not in session:
            logger.warning("Unauthorized attempt to access history")
            return jsonify({"error": "Authentication required"}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT 
                u.username,
                u.location,
                strftime('%Y-%m-%d', e.date) as date,
                e.opal_demos,
                e.opal_sales,
                e.scan_demos,
                e.scan_sold,
                e.net_sales,
                e.hours_worked
            FROM employee_responses e
            INNER JOIN users u ON e.user_id = u.id
            ORDER BY e.date DESC
        """

        cursor.execute(query)
        rows = cursor.fetchall()
        logger.debug(f"Found {len(rows)} history records")

        history = []
        for row in rows:
            history_item = {
                'username': row['username'],
                'location': row['location'],
                'date': row['date'],
                'opal_demos': int(row['opal_demos'] or 0),
                'opal_sales': int(row['opal_sales'] or 0),
                'scan_demos': int(row['scan_demos'] or 0),
                'scan_sold': int(row['scan_sold'] or 0),
                'net_sales': float(row['net_sales'] or 0),
                'hours_worked': float(row['hours_worked'] or 0)
            }
            history.append(history_item)

        conn.close()
        return jsonify({"history": history})

    except Exception as e:
        logger.error(f"Error in get_history: {str(e)}")
        return jsonify({"error": str(e), "history": []}), 500

@app.route("/save_tracking_data", methods=["POST"])
def save_tracking_data():
    """Save tracking data."""
    try:
        # Authentication check
        if 'user_id' not in session:
            logger.warning("Unauthorized attempt to save tracking data")
            return jsonify({"error": "Authentication required"}), 401
            
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Get user_id from session instead of relying on client
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"error": "User not authenticated properly"}), 401

        # Get today's date
        today = datetime.now().strftime('%Y-%m-%d')
        
        conn = get_db_connection()
        try:
            # Save tracking data
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO employee_responses (
                    user_id, date, opal_demos, opal_sales, 
                    scan_demos, scan_sold, net_sales, hours_worked
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                today,
                data.get("opal_demos", 0),
                data.get("opal_sales", 0),
                data.get("scan_demos", 0),
                data.get("scan_sold", 0),
                data.get("net_sales", 0),
                data.get("hours_worked", 0)
            ))
            
            # Get user data for email
            user = cursor.execute(
                "SELECT username, email, name, role, location FROM users WHERE id = ?", 
                (user_id,)
            ).fetchone()
            
            conn.commit()
            
            return jsonify({
                "message": "Tracking data saved successfully", 
                "date": today
            }), 201
            
        finally:
            conn.close()

    except sqlite3.Error as db_error:
        logger.error(f"Database error: {db_error}")
        return jsonify({"error": f"Database error: {str(db_error)}"}), 500
    except Exception as e:
        logger.error(f"Error saving tracking data: {e}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

# Add health check endpoint for monitoring
@app.route("/health")
def health_check():
    try:
        # Test database connection
        conn = get_db_connection()
        conn.execute("SELECT 1").fetchone()
        conn.close()
        
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0"
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

# Add authorization middleware for admin routes
def admin_required(f):
    """Decorator to restrict access to admin users."""
    def decorated_function(*args, **kwargs):
        if 'role' not in session or session['role'] != 'admin':
            logger.warning(f"Unauthorized admin access attempt by {session.get('username', 'unknown')}")
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

# Add authorization middleware for manager or admin routes
def manager_required(f):
    """Decorator to restrict access to manager or admin users."""
    def decorated_function(*args, **kwargs):
        if 'role' not in session or session['role'] not in ['admin', 'manager']:
            logger.warning(f"Unauthorized manager access attempt by {session.get('username', 'unknown')}")
            return jsonify({"error": "Manager access required"}), 403
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@app.route("/create_user", methods=["POST"])
@manager_required
def create_user():
    try:
        data = request.json
        username = data.get("username")
        email = data.get("email")
        passcode = data.get("passcode")
        role = data.get("role")
        location = data.get("location")

        if not username or not email or not passcode or not role or not location:
            return jsonify({"error": "All fields are required"}), 400

        logger.debug(f"Creating user with username: {username}, email: {email}, role: {role}, location: {location}")

        conn = get_db_connection()
        existing_user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        if existing_user:
            conn.close()
            return jsonify({"error": "Username already exists"}), 400

        conn.execute("""
            INSERT INTO users (username, password, email, name, role, location)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (username, passcode, email, username, role, location))
        conn.commit()
        conn.close()

        logger.debug(f"User created successfully: {username}")
        return jsonify({"message": "User created successfully"}), 201
    except sqlite3.Error as db_error:
        logger.error(f"Database error: {db_error}")
        return jsonify({"error": f"Database error: {db_error}"}), 500
    except Exception as e:
        logger.error(f"Unexpected server error: {e}")
        return jsonify({"error": f"Unexpected server error: {e}"}), 500

@app.route("/remove_user", methods=["POST"])
@manager_required
def remove_user():
    try:
        data = request.json
        user_id = data.get("user_id")

        if not user_id:
            return jsonify({"error": "User ID is required"}), 400

        # Don't allow deleting yourself
        if str(user_id) == str(session.get('user_id')):
            return jsonify({"error": "Cannot delete your own account"}), 400

        logger.debug(f"Removing user with ID: {user_id}")

        conn = get_db_connection()
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        conn.close()

        logger.debug(f"User removed successfully: {user_id}")
        return jsonify({"message": "User removed successfully"}), 200
    except sqlite3.Error as db_error:
        logger.error(f"Database error: {db_error}")
        return jsonify({"error": f"Database error: {db_error}"}), 500
    except Exception as e:
        logger.error(f"Unexpected server error: {e}")
        return jsonify({"error": f"Unexpected server error: {e}"}), 500

@app.route("/change_passcode", methods=["POST"])
def change_passcode():
    try:
        data = request.json
        user_id = data.get("user_id")
        new_passcode = data.get("new_passcode")
        current_passcode = data.get("current_passcode")

        if not user_id or not new_passcode:
            return jsonify({"error": "User ID and new passcode are required"}), 400

        # If changing someone else's passcode, require manager role
        if str(user_id) != str(session.get('user_id')):
            if session.get('role') not in ['admin', 'manager']:
                return jsonify({"error": "Only managers can change other users' passcodes"}), 403
        # If changing own passcode, verify current one
        elif not current_passcode:
            return jsonify({"error": "Current passcode is required"}), 400

        logger.debug(f"Changing passcode for user ID: {user_id}")

        conn = get_db_connection()
        
        # If changing own passcode, verify current one
        if str(user_id) == str(session.get('user_id')) and current_passcode:
            user = conn.execute("SELECT * FROM users WHERE id = ? AND password = ?", 
                             (user_id, current_passcode)).fetchone()
            if not user:
                conn.close()
                return jsonify({"error": "Current passcode is incorrect"}), 401
        
        conn.execute("UPDATE users SET password = ? WHERE id = ?", (new_passcode, user_id))
        conn.commit()
        conn.close()

        logger.debug(f"Passcode updated successfully for user ID: {user_id}")
        return jsonify({"message": "Passcode updated successfully"}), 200
    except sqlite3.Error as db_error:
        logger.error(f"Database error: {db_error}")
        return jsonify({"error": f"Database error: {db_error}"}), 500
    except Exception as e:
        logger.error(f"Unexpected server error: {e}")
        return jsonify({"error": f"Unexpected server error: {e}"}), 500

@app.route("/update_user", methods=["POST"])
@manager_required
def update_user():
    data = request.json

    required_fields = ["user_id", "username", "email", "passcode", "name", "role", "location"]
    missing_fields = [field for field in required_fields if field not in data or not data[field]]

    if missing_fields:
        return jsonify({"error": "Missing fields: " + ", ".join(missing_fields)}), 400

    user_id = data.get("user_id")
    username = data.get("username")
    email = data.get("email")
    password = data.get("passcode")
    name = data.get("name")
    role = data.get("role")
    location = data.get("location")

    # Only admin can create admin users
    if role == 'admin' and session.get('role') != 'admin':
        return jsonify({"error": "Only admins can create or modify admin users"}), 403

    try:
        conn = get_db_connection()
        conn.execute('''
            UPDATE users SET username=?, email=?, password=?, name=?, role=?, location=?
            WHERE id=?
        ''', (username, email, password, name, role, location, user_id))
        conn.commit()
        conn.close()
        return jsonify({"message": "User updated successfully"}), 200
    except sqlite3.Error as db_error:
        return jsonify({"error": f"Database error: {db_error}"}), 500
    except Exception as e:
        return jsonify({"error": f"Unexpected server error: {e}"}), 500

# Modify get_users to be more explicit about user roles
@app.route("/get_users", methods=["GET"])
@manager_required
def get_users():
    try:
        conn = get_db_connection()
        
        # Regular managers only see users in their location
        if session.get('role') == 'manager':
            location = session.get('location')
            users = conn.execute(
                "SELECT id, username, email, password, name, role, location FROM users WHERE location = ?", 
                (location,)
            ).fetchall()
        # Admins see all users
        else:
            users = conn.execute(
                "SELECT id, username, email, password, name, role, location FROM users"
            ).fetchall()
            
        conn.close()
        
        return jsonify({"users": [dict(user) for user in users]}), 200
    except sqlite3.Error as db_error:
        logger.error(f"Database error: {db_error}")
        return jsonify({"error": f"Database error: {db_error}"}), 500
    except Exception as e:
        logger.error(f"Unexpected server error: {e}")
        return jsonify({"error": f"Unexpected server error: {e}"}), 500

@app.route("/confirm_passcode", methods=["POST"])
def confirm_passcode():
    try:
        data = request.json
        user_id = data.get("user_id")
        passcode = data.get("passcode")

        if not user_id or not passcode:
            return jsonify({"error": "User ID and passcode are required"}), 400

        logger.debug(f"Confirming passcode for user ID: {user_id}")

        conn = get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE id = ? AND password = ?", (user_id, passcode)).fetchone()
        conn.close()

        if user:
            logger.debug(f"Passcode confirmed for user ID: {user_id}")
            return jsonify({"message": "Passcode confirmed"}), 200
        else:
            logger.debug(f"Passcode confirmation failed for user ID: {user_id}")
            return jsonify({"error": "Invalid user ID or passcode"}), 401
    except sqlite3.Error as db_error:
        logger.error(f"Database error: {db_error}")
        return jsonify({"error": f"Database error: {db_error}"}), 500
    except Exception as e:
        logger.error(f"Unexpected server error: {e}")
        return jsonify({"error": f"Unexpected server error: {e}"}), 500

@app.route("/get_locations", methods=["GET"])
def get_locations():
    try:
        conn = get_db_connection()
        locations = conn.execute("SELECT * FROM locations").fetchall()
        conn.close()
        return jsonify({"locations": [dict(location) for location in locations]}), 200
    except sqlite3.Error as db_error:
        logger.error(f"Database error: {db_error}")
        return jsonify({"error": f"Database error: {db_error}"}), 500
    except Exception as e:
        logger.error(f"Unexpected server error: {e}")
        return jsonify({"error": f"Unexpected server error: {e}"}), 500

@app.route("/add_location", methods=["POST"])
def add_location():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        location_name = data.get("location_name")
        mall = data.get("mall")

        if not location_name or not mall:
            return jsonify({"error": "Location name and mall are required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO locations (location_name, mall) VALUES (?, ?)", 
                      (location_name, mall))
        conn.commit()
        
        # Get the ID of the newly inserted location
        location_id = cursor.lastrowid
        
        conn.close()
        return jsonify({
            "message": "Location added successfully",
            "location": {
                "id": location_id,
                "location_name": location_name,
                "mall": mall
            }
        }), 201
    except Exception as e:
        print(f"Error adding location: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/remove_location", methods=["POST"])
@admin_required
def remove_location():
    try:
        data = request.json
        location_id = data.get("location_id")

        if not location_id:
            return jsonify({"error": "Location ID is required"}), 400

        conn = get_db_connection()
        conn.execute("DELETE FROM locations WHERE id = ?", (location_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Location removed successfully"}), 200
    except sqlite3.Error as db_error:
        logger.error(f"Database error: {db_error}")
        return jsonify({"error": f"Database error: {db_error}"}), 500
    except Exception as e:
        logger.error(f"Unexpected server error: {e}")
        return jsonify({"error": f"Unexpected server error: {e}"}), 500

@app.route("/update_location", methods=["POST"])
@admin_required
def update_location():
    try:
        data = request.json
        location_id = data.get("location_id")
        location_name = data.get("location_name")
        mall = data.get("mall")

        if not location_id or not location_name or not mall:
            return jsonify({"error": "Location ID, name, and mall are required"}), 400

        conn = get_db_connection()
        conn.execute("UPDATE locations SET location_name = ?, mall = ? WHERE id = ?", (location_name, mall, location_id))
        conn.commit()
        conn.close()
        return jsonify({"message": "Location updated successfully"}), 200
    except sqlite3.Error as db_error:
        logger.error(f"Database error: {db_error}")
        return jsonify({"error": f"Database error: {db_error}"}), 500
    except Exception as e:
        logger.error(f"Unexpected server error: {e}")
        return jsonify({"error": f"Unexpected server error: {e}"}), 500

@app.route("/get_location/<int:location_id>", methods=["GET"])
def get_location(location_id):
    conn = get_db_connection()
    location = conn.execute("SELECT * FROM locations WHERE id = ?", (location_id,)).fetchone()
    conn.close()
    if location:
        return jsonify(dict(location)), 200
    else:
        return jsonify({"error": "Location not found"}), 404

# Add a new route to verify password for management access
@app.route("/verify_password", methods=["POST"])
def verify_password():
    try:
        data = request.json
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            logger.error("Username or password not provided")
            return jsonify({"error": "Username and password are required"}), 400

        logger.debug(f"Verifying password for: {username}")

        conn = get_db_connection()
        user = conn.execute('SELECT role FROM users WHERE username = ? AND password = ?', 
                           (username, password)).fetchone()
        conn.close()

        if user:
            role = user["role"]
            # Only allow admin or manager to access management
            if role in ['admin', 'manager']:
                logger.debug(f"Password verification successful for: {username}")
                return jsonify({"message": "Password verified", "role": role}), 200
            else:
                logger.debug(f"Insufficient permissions for: {username}, role: {role}")
                return jsonify({"error": "Insufficient permissions to access management"}), 403
        else:
            logger.debug(f"Password verification failed for: {username}")
            return jsonify({"error": "Invalid username or password"}), 401
            
    except Exception as e:
        logger.error(f"Error verifying password: {e}")
        return jsonify({"error": f"Server error: {e}"}), 500

# Add new routes for location synchronization
@app.route("/sync_history_location", methods=["POST"])
@admin_required
def sync_history_location():
    try:
        data = request.json
        location_name = data.get("location_name")
        
        if not location_name:
            return jsonify({"error": "Location name is required"}), 400

        # Update history records with new location
        conn = get_db_connection()
        conn.execute("""
            UPDATE employee_responses 
            SET location = ? 
            WHERE location IS NULL
        """, (location_name,))
        conn.commit()
        conn.close()
        
        return jsonify({"message": "History synchronized with new location"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/sync_users_location", methods=["POST"])
@admin_required
def sync_users_location():
    try:
        data = request.json
        location_name = data.get("location_name")
        
        if not location_name:
            return jsonify({"error": "Location name is required"}), 400

        # Update users table with new location option
        conn = get_db_connection()
        # Add any necessary user location updates here
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Users synchronized with new location"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Email API endpoints
@app.route("/get_email_settings")
@manager_required
def get_email_settings():
    try:
        # For now, return some default values
        return jsonify({
            "auto_email_enabled": True,
            "daily_email_enabled": False,
            "weekly_email_enabled": True
        }), 200
    except Exception as e:
        logger.error(f"Error getting email settings: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/get_email_sender_config")
@admin_required
def get_email_sender_config():
    try:
        # Return default email configuration
        return jsonify({
            "sender_name": "MonuMe Tracker",
            "sender_email": "noreply@monumetracker.com",
            "smtp_server": "",
            "smtp_port": 587,
            "smtp_username": "",
            "use_tls": True
        }), 200
    except Exception as e:
        logger.error(f"Error getting email sender config: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/save_email_sender_config", methods=["POST"])
@admin_required
def save_email_sender_config():
    try:
        data = request.json
        # In a real app, you would save this to a config file or database
        logger.info(f"Email config saved: {data}")
        return jsonify({"message": "Email configuration saved successfully"}), 200
    except Exception as e:
        logger.error(f"Error saving email sender config: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/update_email_setting", methods=["POST"])
@manager_required
def update_email_setting():
    try:
        data = request.json
        # In a real app, you would save this to a config file or database
        logger.info(f"Email setting updated: {data}")
        return jsonify({"message": "Setting updated successfully"}), 200
    except Exception as e:
        logger.error(f"Error updating email setting: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/send_test_email", methods=["POST"])
@manager_required
def send_test_email():
    try:
        data = request.json
        email = data.get("email")
        subject = data.get("subject", "Test Email from MonuMe Tracker")
        message = data.get("message", "This is a test email from the MonuMe Tracker system.")
        
        if not email:
            return jsonify({"error": "Email address is required"}), 400
        
        # In a real app, you would actually send an email here
        # For now, just log it and pretend it worked
        logger.info(f"Test email would be sent to: {email}")
        
        # Add a log entry
        conn = get_db_connection()
        conn.execute(
            "INSERT INTO email_logs (recipient, subject, type, status) VALUES (?, ?, ?, ?)",
            (email, subject, "test", "success")
        )
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Test email sent successfully"}), 200
    except Exception as e:
        logger.error(f"Error sending test email: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/get_email_logs")
@manager_required
def get_email_logs():
    try:
        conn = get_db_connection()
        logs = conn.execute("SELECT * FROM email_logs ORDER BY timestamp DESC LIMIT 20").fetchall()
        conn.close()
        
        return jsonify({"logs": [dict(log) for log in logs]}), 200
    except Exception as e:
        logger.error(f"Error getting email logs: {e}")
        return jsonify({"error": str(e), "logs": []}), 500

# Generate PDF preview for templates
@app.route('/generate_preview', methods=['POST'])
def generate_preview():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        # In a production environment, you would generate a real PDF here
        # For now, just return the placeholder image
        preview_url = '/static/images/pdf_placeholder.png'
        
        return jsonify({"previewUrl": preview_url}), 200
    except Exception as e:
        logger.error(f"Error generating preview: {e}")
        return jsonify({"error": str(e)}), 500

# Add new endpoint to get usernames without revealing sensitive information
@app.route("/get_usernames", methods=["GET"])
def get_usernames():
    try:
        conn = get_db_connection()
        usernames = conn.execute("SELECT username FROM users").fetchall()
        conn.close()
        
        # Extract usernames from row objects
        username_list = [user['username'] for user in usernames]
        
        return jsonify({"usernames": username_list}), 200
    except sqlite3.Error as db_error:
        logger.error(f"Database error when fetching usernames: {db_error}")
        return jsonify({"error": "Database error", "usernames": []}), 500
    except Exception as e:
        logger.error(f"Error fetching usernames: {e}")
        return jsonify({"error": "Server error", "usernames": []}), 500

# Initialize database tables on startup
def init_db():
    """Initialize database tables with better error handling."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create tables with proper foreign key constraints
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
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS locations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location_name TEXT NOT NULL,
                mall TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
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
        
        # Add default admin user if none exists
        admin_exists = cursor.execute("SELECT COUNT(*) FROM users WHERE username = 'admin'").fetchone()[0]
        if admin_exists == 0:
            # Create a default admin user with the requested password
            cursor.execute("""
                INSERT INTO users (username, password, email, name, role, location)
                VALUES (?, ?, ?, ?, ?, ?)
            """, ('admin', 'ori3', 'admin@monume.com', 'Admin User', 'admin', 'HQ'))
            logger.info("Created default admin user with username 'admin'")
            
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        logger.error(traceback.format_exc())
        raise

if __name__ == '__main__':
    try:
        # Initialize database
        init_db()
        
        # Configure app for production
        if PRODUCTION:
            app.config['SERVER_NAME'] = DOMAIN
            app.config['PREFERRED_URL_SCHEME'] = 'https'
            app.config['SESSION_COOKIE_SECURE'] = True  # Only send cookies over HTTPS
            app.config['SESSION_COOKIE_HTTPONLY'] = True  # Prevent JavaScript from reading cookies
            app.config['PERMANENT_SESSION_LIFETIME'] = 1800  # Session timeout in seconds (30 min)
        else:
            # Development settings
            app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Disable caching
        
        # Common settings
        app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Limit file size to 16MB
        
        # Start server
        logger.info(f"Starting MonuMe Tracker server in {'PRODUCTION' if PRODUCTION else 'DEVELOPMENT'} mode...")
        logger.info(f"Listening on {DOMAIN}:{PORT}")
        
        if PRODUCTION and SSL_CERT and SSL_KEY and os.path.exists(SSL_CERT) and os.path.exists(SSL_KEY):
            # Create SSL context for HTTPS
            context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            context.load_cert_chain(SSL_CERT, SSL_KEY)
            logger.info("Using SSL for secure HTTPS connections")
            
            # Start waitress with SSL
            from waitress.server import create_server
            server = create_server(app, host=DOMAIN, port=PORT, url_scheme='https')
            server.run()
        else:
            # Start waitress without SSL
            if PRODUCTION and (not SSL_CERT or not SSL_KEY):
                logger.warning("Running in PRODUCTION without SSL certificates!")
                
            serve(app, host=DOMAIN, port=PORT)
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        logger.error(traceback.format_exc())
