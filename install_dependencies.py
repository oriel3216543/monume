#!/usr/bin/env python
"""
Installation script for MonuMe Tracker.
This script installs all required dependencies and sets up the environment.
"""
import os
import sys
import subprocess
import platform

def print_status(message):
    """Print a status message with formatting."""
    print("\n" + "=" * 60)
    print(f"  {message}")
    print("=" * 60)

def run_command(command, description):
    """Run a command with error handling."""
    print_status(description)
    try:
        process = subprocess.run(command, shell=True, check=True, text=True)
        print(f"✓ Success: {description}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Error: {e}")
        return False

def check_python_version():
    """Check if Python version is compatible."""
    print_status("Checking Python version")
    
    version = sys.version_info
    min_version = (3, 7)
    
    if version < min_version:
        print(f"✗ Error: Python {version.major}.{version.minor} detected, but MonuMe Tracker requires Python {min_version[0]}.{min_version[1]} or higher.")
        return False
    
    print(f"✓ Python {version.major}.{version.minor}.{version.micro} detected - Compatible!")
    return True

def check_pip():
    """Check if pip is installed and working."""
    return run_command("pip --version", "Checking pip installation")

def install_dependencies():
    """Install dependencies from requirements.txt."""
    return run_command("pip install -r requirements.txt", "Installing dependencies")

def init_database():
    """Initialize the database with default data."""
    return run_command("python init_db.py", "Initializing database")

def main():
    """Main installation process."""
    print_status("Starting MonuMe Tracker installation")
    
    # Check system
    system = platform.system()
    print(f"Detected OS: {system}")
    
    if not check_python_version():
        sys.exit(1)
        
    if not check_pip():
        sys.exit(1)
    
    if not install_dependencies():
        sys.exit(1)
    
    if not init_database():
        sys.exit(1)
    
    print_status("Installation completed successfully!")
    print("""
To start the server in development mode:
    python server.py

To start the server in production mode:
    python deploy.py
    
For more information, please refer to the DEPLOYMENT_GUIDE.md file.
    """)

if __name__ == "__main__":
    main()
