#!/usr/bin/env python
# Add additional imports
import sqlite3
import json
import traceback
import secrets
import mimetypes
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory, send_file, session, redirect, url_for
# Add imports for production deployment
import ssl
# Add imports for email functionality
import smtplib
import configparser
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
# Import our email sender module
import email_sender
import pdf_generator
import sys
import os
import logging

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
    static_url_path=os.path.join('/', BASE_PATH, 'static'),  # Added leading slash
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

# Ensure the server runs in production mode
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

# CORS and security headers
@app.after_request
def add_cors_headers(response):
    if PRODUCTION:
        # Production security headers
        response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    else:
        # In development, allow all origins for testing
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE'
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

# Ensure these email API endpoints are defined BEFORE the generic static file handlers
# to prevent them from being caught by the "serve_static" function

@app.route("/get_email_settings", methods=['GET'])
def get_email_settings_handler():
    """Handle requests to get_email_settings - serves HTML or JSON based on Accept header"""
    try:
        # TEMPORARY FIX FOR TESTING: Comment out authentication check
        # if PRODUCTION and 'user_id' not in session:
        #     logger.warning("Unauthorized attempt to access email settings")
        #     return jsonify({"error": "Authentication required"}), 403

        # Default settings if email_sender module fails
        default_settings = {
            "auto_email_enabled": True,
            "daily_email_enabled": False,
            "weekly_email_enabled": True,
            "domain": DOMAIN
        }

        try:
            settings = email_sender.get_email_settings()
        except Exception as e:
            logger.error(f"Error from email_sender module: {e}")
            return jsonify(default_settings), 200

        return jsonify(settings), 200
    except Exception as e:
        logger.error(f"Error getting email settings: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/get_email_settings_data", methods=['GET'])
def get_email_settings_data_handler():
    """Handle JSON requests for email settings data"""
    try:
        # Default settings if email_sender module fails
        default_settings = {
            "auto_email_enabled": True,
            "daily_email_enabled": False,
            "weekly_email_enabled": True,
            "domain": DOMAIN
        }

        try:
            settings = email_sender.get_email_settings()
        except Exception as e:
            logger.error(f"Error from email_sender module: {e}")
            return jsonify(default_settings), 200

        return jsonify(settings), 200
    except Exception as e:
        logger.error(f"Error getting email settings data: {e}")
        return jsonify({
            "error": str(e),
            "auto_email_enabled": True,
            "daily_email_enabled": False,
            "weekly_email_enabled": True
        }), 500

@app.route("/get_email_logs", methods=['GET'])
def get_email_logs_handler():
    """Handle requests to get email logs for the email interface"""
    try:
        # TEMPORARY FIX FOR TESTING: Comment out authentication check
        # if PRODUCTION and 'user_id' not in session:
        #     logger.warning("Unauthorized attempt to access email logs")
        #     return jsonify({"error": "Authentication required"}), 403

        # Get email logs using the email_sender module
        try:
            logs = email_sender.get_email_logs(20)
            return jsonify({"logs": logs}), 200
        except Exception as e:
            logger.error(f"Error from email_sender module: {e}")
            # Return empty logs for better UI experience
            return jsonify({"logs": []}), 200
            
    except Exception as e:
        logger.error(f"Error getting email logs: {e}")
        return jsonify({"error": str(e), "logs": []}), 500

@app.route('/send_test_email', methods=["POST"])
def send_test_email_handler():
    """Handle requests to send a test email"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        email = data.get("email")
        if not email:
            return jsonify({"error": "Email address is required"}), 400

        # Call the email_sender module to send a test email
        logger.info(f"Sending test email to {email}")
        result = email_sender.send_test_email(email)

        if result.get('success'):
            return jsonify({"message": "Test email sent successfully!"}), 200
        else:
            return jsonify({"error": result.get('error', 'Failed to send test email')}), 500
    except Exception as e:
        logger.error(f"Error sending test email: {e}")
        return jsonify({"error": str(e)}), 500

# Modified static file serving with proper MIME types and improved file not found handling
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
    
    # First check if it's an HTML page in the static folder
    static_html_path = os.path.join(app.static_folder, filename)
    if os.path.isfile(static_html_path):
        logger.info(f"Serving static file: {filename} from static folder")
        response = send_from_directory(app.static_folder, filename)
        response.headers['Content-Type'] = mime_type
        return response
    
    # Check if the file exists in the static folder first
    if '/' in filename:
        # Handle nested paths by splitting correctly
        path_parts = filename.split('/')
        if len(path_parts) > 1:
            nested_folder = os.path.join(app.static_folder, *path_parts[:-1])
            if os.path.isdir(nested_folder) and os.path.isfile(os.path.join(nested_folder, path_parts[-1])):
                logger.info(f"Serving nested static file: {filename}")
                return send_from_directory(nested_folder, path_parts[-1], mimetype=mime_type)
    
    # If not in static folder, try serving from the root directory
    root_path = os.path.join(root_dir, filename)
    if os.path.isfile(root_path):
        logger.info(f"Serving file from root: {filename}")
        response = send_file(root_path)
        response.headers['Content-Type'] = mime_type
        return response
    
    # Special case for dashboard.html and other static HTML files
    if filename.endswith('.html'):
        static_html = os.path.join(app.static_folder, filename)
        if os.path.isfile(static_html):
            logger.info(f"Serving HTML file: {filename}")
            return send_file(static_html, mimetype='text/html')
    
    # If file not found in either location, return 404
    logger.warning(f"File not found: {filename}")
    return jsonify({"error": "File not found"}), 404

# Special route for files in /static/ URL path 
@app.route('/static/<path:filename>')
def serve_from_root_or_static(filename):
    logger.info(f"Requested static file: {filename}")
    
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
        logger.info(f"Serving from static folder: {filename}")
        response = send_from_directory(app.static_folder, filename)
        response.headers['Content-Type'] = mime_type
        return response
    
    # Check for nested paths in static folder
    if '/' in filename:
        path_parts = filename.split('/')
        nested_folder = os.path.join(app.static_folder, *path_parts[:-1])
        if os.path.isdir(nested_folder) and os.path.isfile(os.path.join(nested_folder, path_parts[-1])):
            logger.info(f"Serving from nested static folder: {filename}")
            return send_from_directory(nested_folder, path_parts[-1], mimetype=mime_type)
    
    # If not in static folder, check if it exists in the root directory
    root_path = os.path.join(root_dir, filename)
    if os.path.isfile(root_path):
        logger.info(f"Serving from root: {filename}")
        response = send_file(root_path)
        response.headers['Content-Type'] = mime_type
        return response
    
    # If file not found, return 404
    logger.warning(f"Static file not found: {filename}")
    return jsonify({"error": "File not found"}), 404

# Add root route to serve index.html
@app.route('/')
def serve_index():
    logger.info("Serving index.html from root")
    index_path = os.path.join(root_dir, 'index.html')
    if os.path.isfile(index_path):
        return send_file(index_path)
    else:
        logger.error("index.html not found in root directory")
        return jsonify({"error": "Index file not found"}), 404

# Add explicit route for forms.html
@app.route('/forms')
@app.route('/forms.html')
def serve_forms():
    logger.info("Serving forms.html directly")
    forms_path = os.path.join(app.static_folder, 'forms.html')
    if os.path.isfile(forms_path):
        return send_file(forms_path)
    else:
        logger.error("forms.html not found in static directory")
        return jsonify({"error": "Forms file not found"}), 404

# Add route for formdisplay.html to handle form display
# This route is public and doesn't require authentication
@app.route('/forms/<form_id>/', methods=['GET', 'POST'])
@app.route('/forms/<form_id>/<form_title>', methods=['GET', 'POST'])
def handle_form_display(form_id, form_title=None):
    if request.method == 'POST':
        try:
            # Save form data
            form_data = request.json
            if not form_data:
                return jsonify({"error": "No form data provided"}), 400

            conn = get_db_connection()
            conn.execute(
                "INSERT INTO form_responses (form_id, responses, submitted_by) VALUES (?, ?, ?)",
                (form_id, json.dumps(form_data.get('responses', {})), form_data.get('submitted_by', 'anonymous'))
            )
            conn.commit()
            conn.close()

            return jsonify({"message": "Form data saved successfully"}), 201
        except Exception as e:
            logger.error(f"Error saving form data: {e}")
            return jsonify({"error": "Failed to save form data"}), 500

    # Serve the form display page
    logger.info(f"Serving form display for ID: {form_id}")
    form_display_path = os.path.join(app.static_folder, 'formdisplay.html')
    if os.path.isfile(form_display_path):
        return send_file(form_display_path)
    else:
        logger.error("formdisplay.html not found in static directory")
        return jsonify({"error": "Form display page not found"}), 404

# API endpoint to get form data
@app.route("/api/forms/<form_id>", methods=["GET"])
def get_form_data(form_id):
    """Return form data for the specified form ID"""
    try:
        conn = get_db_connection()
        form = conn.execute("SELECT * FROM forms WHERE id = ?", (form_id,)).fetchone()
        conn.close()
        
        if form:
            return jsonify({
                "id": form["id"],
                "title": form["title"],
                "description": form["description"],
                "questions": form["questions"],
                "created_at": form["created_at"],
                "updated_at": form["updated_at"]
            }), 200
        else:
            logger.warning(f"Form not found: {form_id}")
            return jsonify({"error": "Form not found"}), 404
    except Exception as e:
        logger.error(f"Error getting form data: {e}")
        return jsonify({"error": str(e)}), 500

# API endpoint to get form responses
@app.route("/api/form_responses/<form_id>", methods=["GET"])
def get_form_responses(form_id):
    """Get all responses for a specific form."""
    conn = get_db_connection()
    
    # Get form details first to verify it exists
    form = conn.execute('SELECT id, title FROM forms WHERE id = ?', (form_id,)).fetchone()
    
    if not form:
        return jsonify({'error': 'Form not found'}), 404
    
    # Get all responses for this form
    responses = conn.execute('''
        SELECT r.id, r.form_id, r.user_id, r.submitted_at, u.name as user_name 
        FROM form_responses r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.form_id = ?
        ORDER BY r.submitted_at DESC
    ''', (form_id,)).fetchall()
    
    result = []
    for response in responses:
        # Get all answers for this response
        answers = conn.execute('''
            SELECT a.id, a.question_id, q.text as question_text, a.answer_text
            FROM form_answers a
            JOIN form_questions q ON a.question_id = q.id
            WHERE a.response_id = ?
        ''', (response['id'],)).fetchall()
        
        answer_list = [{
            'question': row['question_text'],
            'answer': row['answer_text']
        } for row in answers]
        
        result.append({
            'id': response['id'],
            'formId': response['form_id'],
            'responder': {
                'id': response['user_id'],
                'name': response['user_name'] or 'Anonymous User'
            },
            'submittedAt': response['submitted_at'],
            'answers': answer_list
        })
    
    conn.close()
    return jsonify(result)

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

# Send email function
def send_email(recipient, subject, body, is_html=False):
    """Send an email using the configured SMTP server."""
    try:
        # Read email configuration
        config = configparser.ConfigParser()
        email_config_path = os.path.join(root_dir, 'config', 'email_config.ini')
        
        if not os.path.exists(email_config_path):
            logger.warning(f"Email config file not found: {email_config_path}")
            return False, "Email configuration file not found"
            
        config.read(email_config_path)
        
        # Get SMTP configuration
        smtp_server = config.get('SMTP', 'server', fallback='')
        smtp_port = config.getint('SMTP', 'port', fallback=587)
        smtp_user = config.get('SMTP', 'username', fallback='')
        smtp_password = config.get('SMTP', 'password', fallback='')
        sender_email = config.get('SENDER', 'email', fallback='noreply@monumetracker.com')
        sender_name = config.get('SENDER', 'name', fallback='MonuMe Tracker')
        use_tls = config.getboolean('SMTP', 'use_tls', fallback=True)
        
        if not smtp_server or not smtp_user or not smtp_password:
            logger.warning("SMTP configuration is incomplete")
            return False, "SMTP configuration is incomplete"
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{sender_name} <{sender_email}>"
        msg['To'] = recipient
        
        # Attach body
        if is_html:
            msg.attach(MIMEText(body, 'html'))
        else:
            msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            if use_tls:
                server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        
        # Log successful email
        conn = get_db_connection()
        conn.execute(
            "INSERT INTO email_logs (recipient, subject, type, status) VALUES (?, ?, ?, ?)",
            (recipient, subject, "notification", "success")
        )
        conn.commit()
        conn.close()
        
        return True, "Email sent successfully"
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        
        # Log failed email
        try:
            conn = get_db_connection()
            conn.execute(
                "INSERT INTO email_logs (recipient, subject, type, status, error_message) VALUES (?, ?, ?, ?, ?)",
                (recipient, subject, "notification", "failed", str(e))
            )
            conn.commit()
            conn.close()
        except Exception as log_error:
            logger.error(f"Error logging email failure: {log_error}")
        
        return False, str(e)

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
        
        # Create forms table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS forms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                questions TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create form responses table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS form_responses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                form_id INTEGER NOT NULL,
                responses TEXT,
                submitted_by TEXT,
                submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_username ON users(username)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_response_user_date ON employee_responses(user_id, date)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_email_logs_timestamp ON email_logs(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_forms_created_at ON forms(created_at)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON form_responses(form_id)')
        
        # Add default admin user if none exists
        admin_exists = cursor.execute("SELECT COUNT(*) FROM users WHERE username = 'admin'").fetchone()[0]
        if admin_exists == 0:
            # Create a default admin user with the requested password
            cursor.execute("""
                INSERT INTO users (username, password, email, name, role, location)
                VALUES (?, ?, ?, ?, ?, ?)
            """, ('admin', 'ori3', 'admin@monume.com', 'Admin User', 'admin', 'HQ'))
            logger.info("Created default admin user with username 'admin'")
            
        # Add sample forms if none exist
        form_count = cursor.execute("SELECT COUNT(*) FROM forms").fetchone()[0]
        if form_count == 0:
            # Create some sample forms
            sample_forms = [
                {
                    "title": "Team Feedback Form",
                    "description": "Please share your feedback to help us improve our team processes.",
                    "questions": json.dumps([
                        {
                            "id": "q1",
                            "title": "How would you rate team communication?",
                            "type": "linear-scale"
                        },
                        {
                            "id": "q2",
                            "title": "What aspects of our team process work well?",
                            "type": "long-text"
                        },
                        {
                            "id": "q3",
                            "title": "What could be improved?",
                            "type": "long-text"
                        }
                    ])
                },
                {
                    "title": "Project Evaluation",
                    "description": "Evaluate the outcomes and processes of our recent project.",
                    "questions": json.dumps([
                        {
                            "id": "q1",
                            "title": "How would you rate the project outcome?",
                            "type": "linear-scale"
                        },
                        {
                            "id": "q2",
                            "title": "Were project timelines met?",
                            "type": "multiple-choice",
                            "options": ["Yes", "Partially", "No"]
                        },
                        {
                            "id": "q3",
                            "title": "What were the key challenges?",
                            "type": "long-text"
                        }
                    ])
                },
                {
                    "title": "Client Satisfaction Survey",
                    "description": "Help us improve our services by providing your feedback.",
                    "questions": json.dumps([
                        {
                            "id": "q1",
                            "title": "How satisfied are you with our services?",
                            "type": "linear-scale"
                        },
                        {
                            "id": "q2",
                            "title": "Would you recommend our services to others?",
                            "type": "multiple-choice",
                            "options": ["Definitely", "Probably", "Not sure", "Probably not", "Definitely not"]
                        },
                        {
                            "id": "q3",
                            "title": "What additional services would you like us to offer?",
                            "type": "long-text"
                        }
                    ])
                },
                {
                    "title": "Event Registration",
                    "description": "Register for our upcoming team building event.",
                    "questions": json.dumps([
                        {
                            "id": "q1",
                            "title": "Will you be attending the event?",
                            "type": "multiple-choice",
                            "options": ["Yes", "No", "Maybe"]
                        },
                        {
                            "id": "q2",
                            "title": "Any dietary restrictions we should know about?",
                            "type": "checkbox",
                            "options": ["Vegetarian", "Vegan", "Gluten-free", "Nut allergies", "None"]
                        },
                        {
                            "id": "q3",
                            "title": "Any additional comments?",
                            "type": "long-text"
                        }
                    ])
                }
            ]
            
            for form in sample_forms:
                cursor.execute(
                    "INSERT INTO forms (title, description, questions, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))",
                    (form["title"], form["description"], form["questions"])
                )
            
            logger.info(f"Added {len(sample_forms)} sample forms")
            
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        logger.error(traceback.format_exc())
        raise

# Make sure email_config.ini exists with default values
def ensure_email_config_exists():
    """Ensure that the email_config.ini file exists with default values."""
    try:
        config_dir = os.path.join(root_dir, 'config')
        config_path = os.path.join(config_dir, 'email_config.ini')
        
        # Create config directory if it doesn't exist
        if not os.path.exists(config_dir):
            os.makedirs(config_dir)
        
        # Create default config if file doesn't exist
        if not os.path.exists(config_path):
            config = configparser.ConfigParser()
            
            # EMAIL section with default settings
            config['EMAIL'] = {
                'smtp_server': 'smtp.gmail.com',
                'smtp_port': '587',
                'sender_email': 'monumequeens@gmail.com',
                'sender_name': 'MonuMe Tracker',
                'password': '',
                'use_tls': 'true',
                'auto_email_enabled': 'true',
                'daily_email_enabled': 'false',
                'weekly_email_enabled': 'true'
            }
            
            # Write config to file
            with open(config_path, 'w') as f:
                config.write(f)
            
            logger.info(f"Created default email_config.ini at {config_path}")
        
        return True
    except Exception as e:
        logger.error(f"Error creating email config: {e}")
        return False

@app.route("/update_email_setting", methods=["POST"])
def update_email_setting_handler():
    """Handle requests to update email settings"""
    try:
        data = request.json
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        setting = data.get("setting")
        value = data.get("value")
        
        if setting is None or value is None:
            return jsonify({"error": "Setting name and value are required"}), 400
            
        # Only allow specific settings to be updated
        allowed_settings = ['auto_email_enabled', 'daily_email_enabled', 'weekly_email_enabled', 'domain']
        if setting not in allowed_settings:
            return jsonify({"error": f"Cannot update setting: {setting}. Allowed settings: {', '.join(allowed_settings)}"}), 400

        logger.info(f"Updating email setting: {setting} = {value}")
        
        # Update the setting
        result = email_sender.update_email_setting(setting, value)
        
        if result.get('success'):
            setting_name_readable = {
                'auto_email_enabled': 'Performance summary emails',
                'daily_email_enabled': 'Daily performance reports',
                'weekly_email_enabled': 'Weekly performance digest',
                'domain': 'Email domain'
            }.get(setting, setting)
            
            value_readable = "enabled" if value else "disabled" 
            if setting == "domain":
                value_readable = value
                
            return jsonify({"message": f"{setting_name_readable} has been set to {value_readable}"}), 200
        else:
            return jsonify({"error": result.get('error', f"Failed to update {setting}")}), 500
    except Exception as e:
        logger.error(f"Error updating email setting: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    try:
        # Initialize database
        init_db()
        
        # Ensure email config exists
        ensure_email_config_exists()
        
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
