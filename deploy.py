#!/usr/bin/env python
"""
Production deployment script for MonuMe Tracker.
This script runs the Flask application using the Waitress production server.
"""
import os
import sys
import ssl
import logging
import argparse
import subprocess
import warnings
from pathlib import Path

# Set up basic logging first before importing other modules
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('server_logs.txt', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
basic_logger = logging.getLogger("MonuMeServer")

# Try to import the application but handle cases where the server module is not found
try:
    from server import app, logger, init_db
except ImportError as e:
    basic_logger.error(f"Error importing server module: {e}")
    print(f"Error: Cannot import server module: {e}")
    print("Make sure you are running this script from the correct directory.")
    sys.exit(1)

# Define a function to try and import Waitress or install it
def try_import_waitress():
    try:
        import waitress
        return waitress
    except ImportError:
        print("Waitress WSGI server not found. Attempting to install it...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "waitress"])
            import waitress
            print("Successfully installed waitress!")
            return waitress
        except Exception as e:
            print(f"Failed to install waitress: {e}")
            print("Will use Flask's built-in server instead. NOT recommended for production!")
            return None

# Configure production-specific settings
def configure_production(args):
    """Configure the application for production environment."""
    # Set environment variables from command line args
    if args.port:
        os.environ['PORT'] = str(args.port)
    if args.domain:
        os.environ['DOMAIN'] = args.domain
    if args.ssl_cert:
        os.environ['SSL_CERT'] = args.ssl_cert
    if args.ssl_key:
        os.environ['SSL_KEY'] = args.ssl_key
    if args.production:
        os.environ['PRODUCTION'] = 'true'
    if args.secret_key:
        os.environ['SECRET_KEY'] = args.secret_key
    
    # Get environment variables with defaults
    port = int(os.environ.get('PORT', 8080))
    host = os.environ.get('DOMAIN', '0.0.0.0')
    threads = int(os.environ.get('THREADS', 4))
    ssl_cert = os.environ.get('SSL_CERT', '')
    ssl_key = os.environ.get('SSL_KEY', '')
    
    # Set Flask to production mode
    os.environ['FLASK_ENV'] = 'production'
    
    return {
        'host': host,
        'port': port,
        'threads': threads,
        'ssl_cert': ssl_cert,
        'ssl_key': ssl_key
    }

def check_dependencies():
    """Check if all required dependencies are installed."""
    try:
        import flask
        logger.info("Flask successfully imported.")
        
        # Check sqlite3
        import sqlite3
        logger.info("SQLite3 successfully imported.")
        
        # Try to install or import Waitress, but don't make it critical
        waitress = try_import_waitress()
        if waitress:
            logger.info("Waitress successfully imported.")
        else:
            logger.warning("Waitress is not available. Using Flask's development server instead.")
            logger.warning("This is NOT recommended for production use.")
        
        return True
    except ImportError as e:
        logger.error(f"Missing dependency: {e}")
        print(f"Error: Missing dependency: {e}")
        print("Please run: pip install -r requirements.txt")
        return False

def create_well_known_dir():
    """Create .well-known directory for SSL certification if it doesn't exist."""
    well_known_dir = Path('.well-known')
    if not well_known_dir.exists():
        well_known_dir.mkdir()
        logger.info("Created .well-known directory for SSL certification.")
    return well_known_dir

def setup_ssl_context(config):
    """Set up SSL context if certificates are provided."""
    if config['ssl_cert'] and config['ssl_key']:
        cert_path = Path(config['ssl_cert'])
        key_path = Path(config['ssl_key'])
        
        if not cert_path.exists() or not key_path.exists():
            logger.warning(f"SSL certificate or key not found: {cert_path} / {key_path}")
            return None
            
        try:
            context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            context.load_cert_chain(config['ssl_cert'], config['ssl_key'])
            logger.info("SSL context created successfully.")
            return context
        except Exception as e:
            logger.error(f"Failed to create SSL context: {e}")
            return None
    return None

def main():
    """Run the application in production mode."""
    parser = argparse.ArgumentParser(description='MonuMe Tracker Production Server')
    parser.add_argument('--port', '-p', type=int, help='Port to run the server on')
    parser.add_argument('--domain', '-d', help='Domain name or IP address')
    parser.add_argument('--ssl-cert', help='Path to SSL certificate file')
    parser.add_argument('--ssl-key', help='Path to SSL key file')
    parser.add_argument('--production', action='store_true', help='Run in production mode')
    parser.add_argument('--threads', '-t', type=int, help='Number of worker threads')
    parser.add_argument('--secret-key', help='Secret key for session encryption')
    parser.add_argument('--use-flask', action='store_true', help='Force using Flask development server')
    args = parser.parse_args()
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    try:
        # Set up production configuration
        config = configure_production(args)
        
        # Create .well-known directory for SSL certification
        create_well_known_dir()
        
        # Initialize the database
        init_db()
        
        # Set up SSL if certificates are provided
        ssl_context = setup_ssl_context(config)
        
        # Log startup information
        logger.info("=" * 50)
        logger.info("Starting MonuMe Tracker in PRODUCTION mode")
        logger.info(f"Server will listen on {config['host']}:{config['port']}")
        
        # Determine protocol
        if ssl_context:
            logger.info("SSL enabled (HTTPS)")
            protocol = "https"
        else:
            logger.info("SSL not enabled (HTTP)")
            protocol = "http"
            
        logger.info("=" * 50)
        
        print(f"MonuMe Tracker is running at {protocol}://{config['host']}:{config['port']}")
        print("Press Ctrl+C to stop the server")
        
        # Try to use Waitress for production if available and not explicitly disabled
        waitress = None if args.use_flask else try_import_waitress()
        
        if waitress and not args.use_flask:
            # Import serve function from the waitress module we already loaded
            serve = waitress.serve
            logger.info(f"Using Waitress WSGI server with {config['threads']} threads")
            
            # Run with Waitress
            if ssl_context:
                try:
                    # Try to use create_server if available in this Waitress version
                    if hasattr(waitress, 'server'):
                        create_server = waitress.server.create_server
                        server = create_server(app, host=config['host'], port=config['port'], 
                                           threads=config['threads'], url_scheme='https')
                        server.run()
                    else:
                        # Fall back to basic serve function
                        serve(app, host=config['host'], port=config['port'], threads=config['threads'])
                except AttributeError:
                    logger.error("Could not import waitress.server module. Using serve function instead.")
                    # Fall back to basic serve function
                    serve(app, host=config['host'], port=config['port'], threads=config['threads'])
            else:
                serve(app, host=config['host'], port=config['port'], threads=config['threads'])
        else:
            # Fall back to Flask's development server with a warning
            if not args.use_flask:
                logger.warning("Waitress WSGI server not available. Using Flask's built-in server.")
                logger.warning("This is NOT recommended for production use!")
                warnings.warn("Using Flask's development server in production is not recommended", RuntimeWarning)
                
            # Use Flask's built-in server
            ssl_arg = ssl_context if ssl_context else None
            app.run(
                host=config['host'], 
                port=config['port'], 
                ssl_context=ssl_arg,
                threaded=True
            )
        
    except KeyboardInterrupt:
        logger.info("Server shutdown requested")
        print("\nServer shutdown complete")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()