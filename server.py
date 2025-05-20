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

@app.route('/send_appointment_email', methods=["POST"])
def send_appointment_email_handler():
    """Handle requests to send appointment confirmation emails"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Validate required fields
        email = data.get("email")
        if not email:
            return jsonify({"error": "Email address is required"}), 400
            
        subject = data.get("subject", "Appointment Confirmation")
        appointment_data = data.get("appointmentData", {})
        confirmation_link = data.get("confirmationLink", "")
        
        if not appointment_data:
            return jsonify({"error": "Appointment data is required"}), 400
            
        if not confirmation_link:
            return jsonify({"error": "Confirmation link is required"}), 400
        
        # Generate HTML content for the email
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #fff;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, #ff9562, #ff7f42);
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                    margin: -20px -20px 20px;
                }}
                .logo {{
                    font-size: 28px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }}
                .appointment-details {{
                    background-color: #f8f9fa;
                    border-left: 4px solid #ff9562;
                    padding: 15px;
                    margin-bottom: 20px;
                }}
                .confirm-button {{
                    display: inline-block;
                    background: linear-gradient(135deg, #ff9562, #ff7f42);
                    color: white;
                    padding: 12px 25px;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                    margin: 20px 0;
                }}
                .footer {{
                    margin-top: 30px;
                    text-align: center;
                    font-size: 12px;
                    color: #777;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">MonuMe</div>
                    <div>Appointment Confirmation</div>
                </div>
                
                <p>Hello {appointment_data.get('customerName', 'there')},</p>
                
                <p>Thank you for scheduling an appointment with MonuMe. Please review and confirm your appointment details below:</p>
                
                <div class="appointment-details">
                    <p><strong>Appointment:</strong> {appointment_data.get('title', 'Not specified')}</p>
                    <p><strong>Date:</strong> {appointment_data.get('date', 'Not specified')}</p>
                    <p><strong>Time:</strong> {appointment_data.get('time', 'Not specified')}</p>
                    {f"<p><strong>With:</strong> {appointment_data.get('salesRepName')}</p>" if appointment_data.get('salesRepName') else ""}
                </div>
                
                <p>To confirm your appointment, please click the button below:</p>
                
                <div style="text-align: center;">
                    <a href="{confirmation_link}" class="confirm-button">Confirm Appointment</a>
                </div>
                
                <p>Alternatively, you can copy and paste the following link into your browser:</p>
                <p style="word-break: break-all;">{confirmation_link}</p>
                
                <p>If you need to reschedule or cancel your appointment, please contact us as soon as possible.</p>
                
                <p>We look forward to seeing you!</p>
                
                <p>Best Regards,<br>The MonuMe Team</p>
                
                <div class="footer">
                    <p>This is an automated message from MonuMe. Please do not reply to this email.</p>
                    <p>&copy; {datetime.now().strftime('%Y')} MonuMe. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Call the email sender module
        logger.info(f"Sending appointment confirmation email to {email}")
        result = email_sender.send_email(
            recipient_email=email,
            subject=subject,
            html_content=html_content,
            email_type="appointment"
        )
        
        if result.get('success'):
            return jsonify({"message": "Appointment confirmation email sent successfully!"}), 200
        else:
            return jsonify({"error": result.get('error', 'Failed to send appointment email')}), 500
            
    except Exception as e:
        logger.error(f"Error sending appointment email: {e}")
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

# Serve all HTML pages in static folder
@app.route('/static/<path:page>.html')
def serve_html_page_from_static(page):
    file_path = os.path.join(app.static_folder, page + '.html')
    if os.path.isfile(file_path):
        logger.info(f"Serving HTML page from static: {page}.html")
        return send_file(file_path)
    logger.warning(f"HTML page not found in static: {page}.html")
    return jsonify({"error": "Page not found"}), 404

# Direct route for dashboard.html for better reliability
@app.route('/static/dashboard.html')
def serve_dashboard():
    dashboard_path = os.path.join(app.static_folder, 'dashboard.html')
    if os.path.isfile(dashboard_path):
        logger.info("Serving dashboard.html")
        return send_file(dashboard_path)
    logger.error("dashboard.html not found")
    return jsonify({"error": "Dashboard file not found"}), 404

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
        
        # Get SMTP configuration from the EMAIL section - updated to match existing config
        smtp_server = config.get('EMAIL', 'smtp_server', fallback='')
        smtp_port = config.getint('EMAIL', 'smtp_port', fallback=587)
        smtp_user = config.get('EMAIL', 'sender_email', fallback='')
        smtp_password = config.get('EMAIL', 'password', fallback='')
        sender_email = config.get('EMAIL', 'sender_email', fallback='noreply@monumetracker.com')
        sender_name = config.get('EMAIL', 'sender_name', fallback='MonuMe Tracker')
        use_tls = config.getboolean('EMAIL', 'use_tls', fallback=True)
        
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
        
        # Create appointment status changes table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS appointment_status_changes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT NOT NULL,
                appointment_id TEXT,
                customer_name TEXT,
                original_datetime TEXT,
                new_datetime TEXT,
                status TEXT CHECK(status IN ('scheduled', 'confirmed', 'cancelled', 'rescheduled')),
                notes TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
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
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_appointment_status_token ON appointment_status_changes(token)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_appointment_status_timestamp ON appointment_status_changes(timestamp)')
        
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

@app.route('/send_simple_email', methods=['POST'])
def send_simple_email_handler():
    try:
        data = request.get_json()
        to = data.get('to')
        subject = data.get('subject')
        body = data.get('body')
        if not to or not subject or not body:
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        # Use existing send_email function
        success, msg = send_email(to, subject, body, is_html=False)
        if success:
            return jsonify({'success': True, 'message': msg})
        else:
            return jsonify({'success': False, 'error': msg}), 500
    except Exception as e:
        logger.error(f"Error in send_simple_email_handler: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/appointment-status', methods=['GET', 'POST'])
def appointment_status_handler():
    """
    Handle appointment status updates:
    - GET: Get appointment information from token
    - POST: Update appointment status (confirm/cancel/reschedule)
    """
    if request.method == 'GET':
        token = request.args.get('token')
        if not token:
            return jsonify({'success': False, 'error': 'Token is required'}), 400
        
        # In a real implementation, this would query a database
        # For the demo, we'll redirect to the HTML page
        return redirect(url_for('serve_html_page_from_static', page='appointment-status') + f'?token={token}')
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            token = data.get('token')
            status = data.get('status')
            new_datetime = data.get('datetime')
            
            if not token or not status:
                return jsonify({'success': False, 'error': 'Token and status are required'}), 400
                
            if status not in ['confirmed', 'cancelled', 'rescheduled', 'scheduled']:
                return jsonify({'success': False, 'error': 'Invalid status value'}), 400
            
            # Store the status change in the database
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Add notes based on status
            notes = ''
            if status == 'confirmed':
                notes = 'Customer confirmed appointment via status link'
            elif status == 'cancelled':
                notes = 'Customer cancelled appointment via status link'
            elif status == 'rescheduled':
                notes = f'Customer requested reschedule via status link to {new_datetime}'
            
            # Insert into database
            cursor.execute('''
                INSERT INTO appointment_status_changes 
                (token, status, new_datetime, notes)
                VALUES (?, ?, ?, ?)
            ''', (token, status, new_datetime, notes))
            
            conn.commit()
            
            # Create status change notification data
            status_data = {
                'status': status,
                'token': token,
                'timestamp': datetime.now().isoformat()
            }
            
            # Add datetime information for rescheduling
            if status == 'rescheduled' and new_datetime:
                status_data['datetime'] = new_datetime
            
            # Send notification to staff about status change
            # Note: The appointment_data would normally be fetched from database
            # For now we'll use a minimal placeholder
            appointment_data = {'token': token}
            if new_datetime:
                appointment_data['datetime'] = new_datetime
            
            # Try to send notification in background without blocking response
            try:
                send_staff_notification(appointment_data, status_data)
            except Exception as notify_err:
                # Log error but continue with the response
                logger.error(f"Failed to send staff notification: {str(notify_err)}")
            
            return jsonify({
                'success': True,
                'message': f'Appointment status updated to {status}',
                'status': status
            })
            
        except Exception as e:
            logger.error(f"Error in appointment status handler: {str(e)}")
            return jsonify({'success': False, 'error': str(e)}), 500

def send_staff_notification(appointment_data, status_change):
    """Send notification to staff about appointment status changes."""
    try:
        # Get staff emails from database or config
        # For now, we'll use a placeholder email
        staff_email = "staff@monumevip.com"  # Replace with actual staff email or fetch from settings
        
        # Format date and time if available
        appointment_datetime = "Unknown time"
        if 'datetime' in appointment_data:
            appointment_datetime = appointment_data['datetime']
        elif 'start' in appointment_data:
            appointment_datetime = appointment_data['start']
        
        # Get customer name if available
        customer_name = "Unknown customer"
        if 'customerName' in appointment_data:
            customer_name = appointment_data['customerName']
        elif 'extendedProps' in appointment_data and 'customerName' in appointment_data['extendedProps']:
            customer_name = appointment_data['extendedProps']['customerName']
            
        # Create email subject and body
        subject = f"Appointment Status Change: {status_change['status'].upper()}"
        
        # Create HTML email content
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #ff9562; color: white; padding: 10px 20px; text-align: center;">
                <h2 style="margin: 0;">Appointment Status Update</h2>
            </div>
            
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
                <p>An appointment status has been changed by the customer.</p>
                
                <div style="background: #f9f9f9; padding: 15px; margin: 15px 0; border-left: 5px solid #ff9562;">
                    <p><strong>Customer:</strong> {customer_name}</p>
                    <p><strong>Original Time:</strong> {appointment_datetime}</p>
                    <p><strong>New Status:</strong> <span style="font-weight: bold; color: {get_status_color(status_change['status'])};">{status_change['status'].upper()}</span></p>
                    
                    {get_status_specific_message(status_change)}
                </div>
                
                <p>Please check your appointment calendar for more details.</p>
            </div>
            
            <div style="background: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #666;">
                &copy; 2025 MonuMe Inc. All rights reserved.
            </div>
        </div>
        """
        
        # Send email
        success, message = send_email(staff_email, subject, html_content, is_html=True)
        if success:
            logger.info(f"Notification sent to staff about {status_change['status']} appointment")
        else:
            logger.error(f"Failed to send staff notification: {message}")
            
        return success
    except Exception as e:
        logger.error(f"Error sending staff notification: {str(e)}")
        return False

def get_status_color(status):
    """Return color code for appointment status."""
    status_colors = {
        "confirmed": "#28a745",
        "cancelled": "#dc3545",
        "rescheduled": "#0d6efd",
        "scheduled": "#ff9900"
    }
    return status_colors.get(status.lower(), "#6c757d")

def get_status_specific_message(status_change):
    """Return additional message based on status."""
    status = status_change.get('status', '').lower()
    
    if status == 'rescheduled' and 'datetime' in status_change:
        new_time = status_change['datetime']
        return f"<p><strong>Requested New Time:</strong> {new_time}</p>"
    elif status == 'cancelled':
        return "<p>You may want to follow up with the customer to reschedule.</p>"
    elif status == 'confirmed':
        return "<p>The customer has confirmed they will attend this appointment.</p>"
    
    return ""

@app.route('/api/appointment-status-changes', methods=['GET'])
def get_appointment_status_changes():
    """Get recent appointment status changes for staff dashboard."""
    try:
        # Authentication check
        if 'user_id' not in session:
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
        
        # Get limit parameter from query string (default to 20)
        limit = request.args.get('limit', 20, type=int)
        
        # Get status filter from query string (default to all)
        status_filter = request.args.get('status', '')
        
        # Connect to database
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Build query based on filters
        query = '''
            SELECT 
                id, token, appointment_id, customer_name, original_datetime,
                new_datetime, status, notes, timestamp
            FROM appointment_status_changes
        '''
        
        params = []
        
        # Add status filter if provided
        if status_filter and status_filter.lower() in ['confirmed', 'cancelled', 'rescheduled', 'scheduled']:
            query += ' WHERE status = ?'
            params.append(status_filter.lower())
        
        # Add order by and limit
        query += ' ORDER BY timestamp DESC LIMIT ?'
        params.append(limit)
        
        # Execute query
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        # Convert rows to list of dicts
        status_changes = []
        for row in rows:
            status_changes.append(dict(row))
        
        # If no status changes found yet, return sample data for demonstration
        if not status_changes:
            # Create mock data showing different status changes
            status_changes = [
                {
                    'id': '12345',
                    'token': 'abc123def456',
                    'appointment_id': 'appt_1234',
                    'customer_name': 'John Smith',
                    'original_datetime': '2023-11-10T14:30:00',
                    'status': 'confirmed',
                    'timestamp': (datetime.now() - timedelta(hours=2)).isoformat(),
                    'notes': 'Customer confirmed via email link'
                },
                {
                    'id': '12346',
                    'token': 'ghi789jkl012',
                    'appointment_id': 'appt_1235',
                    'customer_name': 'Sarah Johnson',
                    'original_datetime': '2023-11-12T10:00:00',
                    'status': 'cancelled',
                    'timestamp': (datetime.now() - timedelta(days=1)).isoformat(),
                    'notes': 'Customer cancelled due to conflict'
                },
                {
                    'id': '12347',
                    'token': 'mno345pqr678',
                    'appointment_id': 'appt_1236',
                    'customer_name': 'Michael Wong',
                    'original_datetime': '2023-11-11T16:15:00',
                    'status': 'rescheduled',
                    'timestamp': (datetime.now() - timedelta(hours=6)).isoformat(),
                    'new_datetime': '2023-11-15T14:00:00',
                    'notes': 'Customer requested new time'
                }
            ]
        
        return jsonify({
            'success': True,
            'statusChanges': status_changes
        })
        
    except Exception as e:
        logger.error(f"Error getting appointment status changes: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
