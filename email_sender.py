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
    'sender_email': 'monume.tracker@gmail.com',
    'sender_name': 'MonuMe Tracker',
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
        conn = sqlite3.connect('monume_tracker.db')
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
    """Get recent email logs from database"""
    try:
        conn = sqlite3.connect('monume_tracker.db')
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
        
        # Get logs ordered by timestamp (most recent first)
        cursor.execute('''
            SELECT timestamp, recipient, type, status, error_message
            FROM email_logs
            ORDER BY timestamp DESC
            LIMIT ?
        ''', (limit,))
        
        logs = cursor.fetchall()
        conn.close()
        
        # Format logs as list of dictionaries
        formatted_logs = []
        for log in logs:
            formatted_logs.append({
                'timestamp': log[0],
                'recipient': log[1],
                'type': log[2],
                'status': log[3],
                'error_message': log[4]
            })
        
        return formatted_logs
    except Exception as e:
        logger.error(f"Failed to get email logs: {str(e)}")
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
        msg['From'] = f"{config.get('sender_name', 'MonuMe Tracker')} <{config.get('sender_email', 'monume.tracker@gmail.com')}>"
        msg['To'] = recipient_email
        
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
        sender_email = config.get('sender_email', 'monume.tracker@gmail.com')
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
        
        return config
    except Exception as e:
        logger.error(f"Failed to get email settings: {str(e)}")
        return DEFAULT_CONFIG