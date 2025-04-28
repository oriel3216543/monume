# MonuMe Email Endpoint Deployment Guide for monumevip.com

This guide will help you fix the 404 and 405 errors you're seeing with email-related endpoints on your production domain.

## Step 1: Deploy the Updated Server Configuration

1. Connect to your production server via SSH:
   ```
   ssh user@your-server-ip
   ```

2. Copy the updated Nginx configuration file to your server:
   ```
   scp nginx_monumevip.conf user@your-server-ip:/tmp/
   ```

3. Move the file to Nginx's configuration directory:
   ```
   sudo mv /tmp/nginx_monumevip.conf /etc/nginx/sites-available/monumevip.com.conf
   ```

4. Enable the site:
   ```
   sudo ln -s /etc/nginx/sites-available/monumevip.com.conf /etc/nginx/sites-enabled/
   ```

5. Test Nginx configuration:
   ```
   sudo nginx -t
   ```

6. Reload Nginx:
   ```
   sudo systemctl reload nginx
   ```

## Step 2: Ensure Flask Application is Running Correctly

1. Upload the latest version of your application code to the server:
   ```
   scp -r ./* user@your-server-ip:/path/to/MonuMe_Tracker/
   ```

2. On your server, stop any running instances of your application:
   ```
   sudo systemctl stop monume  # If using systemd
   # OR
   pkill -f "python deploy.py"  # If running directly
   ```

3. Start the application with the correct production parameters:
   ```
   cd /path/to/MonuMe_Tracker/
   python deploy.py --domain monumevip.com --port 8080
   ```

   If you're using SSL certificates:
   ```
   python deploy.py --domain monumevip.com --port 8080 --ssl-cert /path/to/fullchain.pem --ssl-key /path/to/privkey.pem
   ```

4. To run it as a background service, create a systemd service file:
   ```
   sudo nano /etc/systemd/system/monume.service
   ```

   Add the following content:
   ```
   [Unit]
   Description=MonuMe Tracker
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/path/to/MonuMe_Tracker
   ExecStart=/usr/bin/python3 /path/to/MonuMe_Tracker/deploy.py --domain monumevip.com --port 8080
   Restart=always
   Environment=PRODUCTION=true

   [Install]
   WantedBy=multi-user.target
   ```

5. Start and enable the service:
   ```
   sudo systemctl daemon-reload
   sudo systemctl enable monume
   sudo systemctl start monume
   ```

## Step 3: Verify the Email Endpoints

1. Check if the application is running:
   ```
   sudo systemctl status monume
   ```

2. Check the logs for any errors:
   ```
   tail -f /path/to/MonuMe_Tracker/server_logs.txt
   ```

3. Test the endpoints directly on the server:
   ```
   curl -v http://localhost:8080/get_email_settings
   curl -v http://localhost:8080/get_email_logs
   curl -v -X POST -H "Content-Type: application/json" -d '{"email":"test@example.com"}' http://localhost:8080/send_test_email
   ```

4. If you can access the endpoints on localhost but not through the domain, check Nginx logs:
   ```
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/nginx/access.log
   ```

## Common Issues and Solutions

1. **Nginx not forwarding requests properly**
   - Check that your server is listening on the port specified in the Nginx configuration (8080 by default)
   - Ensure there are no firewall rules blocking communication between Nginx and your application

2. **404 errors for API endpoints**
   - Make sure your Flask application is correctly loading all routes
   - Verify the PRODUCTION environment variable is set properly

3. **405 Method Not Allowed errors**
   - Check that your Flask route is accepting the correct HTTP methods (GET, POST, etc.)
   - Ensure CORS is configured correctly in your server.py

4. **Invalid JSON responses**
   - This often happens when an HTML error page is returned instead of JSON
   - Check your Flask error handlers and make sure they return proper JSON responses

By following this guide, your email endpoints should work correctly on monumevip.com.