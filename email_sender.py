import os
import smtplib
import ssl
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from datetime import datetime
import configparser
import json
import sqlite3
import pdf_generator

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='server_logs.txt'
)
logger = logging.getLogger('email_sender')

# Default email configuration
DEFAULT_CONFIG = {
    'smtp_server': 'smtp.gmail.com',
    'smtp_port': 587,
    'sender_email': 'monumequeens@gmail.com',
    'sender_name': 'MonuMe performance',
    'use_tls': True,
    'auto_email_enabled': True,
    'daily_email_enabled': False,
    'weekly_email_enabled': True
}

def load_email_config():
    """Load email configuration from config file"""
    config = configparser.ConfigParser()
    config_path = os.path.join('config', 'email_config.ini')
    
    # Create default config if not exists
    if not os.path.exists(config_path):
        os.makedirs(os.path.dirname(config_path), exist_ok=True)
        config['EMAIL'] = DEFAULT_CONFIG
        with open(config_path, 'w') as f:
            config.write(f)
    
    config.read(config_path)
    
    # Return config as dictionary
    if 'EMAIL' in config:
        return {k: v for k, v in config['EMAIL'].items()}
    else:
        return DEFAULT_CONFIG

def save_email_config(settings):
    """Save email configuration to config file"""
    config = configparser.ConfigParser()
    config_path = os.path.join('config', 'email_config.ini')
    
    # Read existing config
    config.read(config_path)
    
    # Update with new settings
    if 'EMAIL' not in config:
        config['EMAIL'] = {}
    
    for key, value in settings.items():
        config['EMAIL'][key] = str(value)
    
    # Write to file
    with open(config_path, 'w') as f:
        config.write(f)
    
    return True

def log_email_activity(recipient, email_type, status, error_message=None):
    """Log email activity to database"""
    try:
        conn = sqlite3.connect('monume.db')
        cursor = conn.cursor()
        
        # Create table if not exists
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS email_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                recipient TEXT,
                type TEXT,
                status TEXT,
                error_message TEXT
            )
        ''')
        
        # Insert log entry
        cursor.execute('''
            INSERT INTO email_logs (timestamp, recipient, type, status, error_message)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            datetime.now().isoformat(),
            recipient,
            email_type,
            status,
            error_message
        ))
        
        conn.commit()
        conn.close()
        
        return True
    except Exception as e:
        logger.error(f"Failed to log email activity: {str(e)}")
        return False

def get_email_logs(limit=20):
    """Get recent email logs from the database."""
    try:
        db_path = os.path.join(os.path.dirname(__file__), 'monume.db')
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.execute(
            "SELECT timestamp, recipient, type, status FROM email_logs ORDER BY timestamp DESC LIMIT ?",
            (limit,)
        )
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        logger.error(f"Failed to get email logs: {e}")
        return []

def send_email(recipient_email, subject, html_content, pdf_path=None, email_type="system"):
    """Send email with optional PDF attachment"""
    config = load_email_config()
    
    # Check if email sending is enabled
    auto_enabled = config.get('auto_email_enabled', 'True').lower() in ('true', '1', 'yes')
    if email_type == 'performance' and not auto_enabled:
        logger.info(f"Auto emails disabled, skipping email to {recipient_email}")
        return {'success': False, 'error': 'Automatic emails are disabled'}
    
    daily_enabled = config.get('daily_email_enabled', 'False').lower() in ('true', '1', 'yes')
    if email_type == 'daily' and not daily_enabled:
        logger.info(f"Daily emails disabled, skipping email to {recipient_email}")
        return {'success': False, 'error': 'Daily emails are disabled'}
    
    weekly_enabled = config.get('weekly_email_enabled', 'True').lower() in ('true', '1', 'yes')
    if email_type == 'weekly' and not weekly_enabled:
        logger.info(f"Weekly emails disabled, skipping email to {recipient_email}")
        return {'success': False, 'error': 'Weekly emails are disabled'}
    
    try:
        # Create message container
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        
        # Use domain information if available for sender email
        domain = config.get('domain', '')
        sender_email = config.get('sender_email', 'monume.tracker@gmail.com')
        sender_name = config.get('sender_name', 'MonuMe Tracker')
        
        # If domain is set, check if sender_email should use it
        if domain and '@' in sender_email:
            # If sender email is not already using the domain, set a custom header
            if not sender_email.endswith('@' + domain):
                msg['Reply-To'] = f"info@{domain}"
                logger.info(f"Using custom domain {domain} for Reply-To header")
        
        msg['From'] = f"{sender_name} <{sender_email}>"
        msg['To'] = recipient_email
        
        # Add custom headers for domain
        if domain:
            msg['X-MonuMe-Domain'] = domain
        
        # Attach HTML content
        msg.attach(MIMEText(html_content, 'html'))
        
        # Attach PDF if provided
        if pdf_path and os.path.exists(pdf_path):
            with open(pdf_path, 'rb') as f:
                pdf_attachment = MIMEApplication(f.read(), _subtype='pdf')
                pdf_attachment.add_header('Content-Disposition', 'attachment', filename=os.path.basename(pdf_path))
                msg.attach(pdf_attachment)
        
        # Create secure connection with server and send email
        smtp_server = config.get('smtp_server', 'smtp.gmail.com')
        smtp_port = int(config.get('smtp_port', 587))
        password = config.get('password', '')
        
        context = ssl.create_default_context()
        
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.ehlo()
            if config.get('use_tls', 'True').lower() in ('true', '1', 'yes'):
                server.starttls(context=context)
                server.ehlo()
            
            # Log in if password provided
            if password:
                server.login(sender_email, password)
            
            server.sendmail(sender_email, recipient_email, msg.as_string())
        
        # Log successful email
        log_email_activity(recipient_email, email_type, 'success')
        
        logger.info(f"Email sent successfully to {recipient_email}")
        return {'success': True}
    
    except Exception as e:
        error_message = str(e)
        logger.error(f"Failed to send email to {recipient_email}: {error_message}")
        
        # Log failed email
        log_email_activity(recipient_email, email_type, 'failed', error_message)
        
        return {'success': False, 'error': error_message}

def send_test_email(recipient_email):
    """Send a test email to verify configuration"""
    subject = "MonuMe Tracker - Test Email"
    
    # Determine current timestamp for test email
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
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
            .test-notification {{
                background-color: #f8f9fa;
                border-left: 4px solid #ff9562;
                padding: 15px;
                margin-bottom: 20px;
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
                <div class="logo">MonuMe Tracker</div>
                <div>Email Configuration Test</div>
            </div>
            
            <div class="test-notification">
                <p>This is a test email to confirm your email configuration is working correctly.</p>
                <p><strong>Time sent:</strong> {current_time}</p>
            </div>
            
            <p>Congratulations! If you're seeing this message, your email configuration is working correctly.</p>
            <p>You can now use the email features in the MonuMe Tracker system:</p>
            <ul>
                <li>Performance summary emails</li>
                <li>Daily reports</li>
                <li>Weekly digests</li>
            </ul>
            
            <p>No further action is required.</p>
            
            <div class="footer">
                <p>This is an automated message from MonuMe Tracker. Please do not reply to this email.</p>
                <p>&copy; {datetime.now().year} MonuMe Tracker</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Generate a test PDF
    pdf_path = None
    try:
        from pdf_generator import generate_test_pdf
        pdf_path = generate_test_pdf()
    except Exception as e:
        logger.warning(f"Could not generate test PDF: {str(e)}")
    
    # Send the email
    return send_email(recipient_email, subject, html_content, pdf_path, "test")

def update_email_setting(setting, value):
    """Update a specific email setting"""
    try:
        config = load_email_config()
        config[setting] = value
        save_email_config(config)
        return {'success': True}
    except Exception as e:
        logger.error(f"Failed to update email setting {setting}: {str(e)}")
        return {'success': False, 'error': str(e)}

def get_email_settings():
    """Get all email settings"""
    try:
        config = load_email_config()
        
        # Convert string boolean values to actual booleans for proper JSON response
        for key in ['auto_email_enabled', 'daily_email_enabled', 'weekly_email_enabled', 'use_tls']:
            if key in config:
                config[key] = config[key].lower() in ('true', '1', 'yes')
        
        # Don't return password
        if 'password' in config:
            config['password'] = '********' if config['password'] else ''
        
        # Ensure we're returning JSON-compatible data
        settings = {
            "auto_email_enabled": config.get('auto_email_enabled', True),
            "daily_email_enabled": config.get('daily_email_enabled', False),
            "weekly_email_enabled": config.get('weekly_email_enabled', True),
            "domain": config.get('domain', '')
        }
        
        return settings
    except Exception as e:
        logger.error(f"Failed to get email settings: {str(e)}")
        # Return default settings that will work with frontend
        return {
            "auto_email_enabled": True,
            "daily_email_enabled": False,
            "weekly_email_enabled": True,
            "domain": ""
        }