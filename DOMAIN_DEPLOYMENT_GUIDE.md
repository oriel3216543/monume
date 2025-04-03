# MonuMe Tracker - Domain Deployment Guide

This guide provides detailed instructions for deploying the MonuMe Tracker application with your own custom domain.

## Deployment Options

There are two main deployment options:

1. **Static Site + API Server**: Deploy the frontend as a static site (GitHub Pages, Netlify, Vercel) and run the backend API server separately.
2. **Full-Stack Deployment**: Deploy the complete application on a single server with both frontend and backend.

## Option 1: Static Site + API Server

### Step 1: Deploy the Frontend to GitHub Pages

1. Create a repository on GitHub and push your code
2. In your repository settings, enable GitHub Pages:
   - Go to Settings > Pages
   - Select the branch to deploy (typically 'main')
   - Save your settings

3. Update `static_config.js`:
   ```javascript
   const STATIC_CONFIG = {
     isStaticDeployment: true,
     basePath: "/your-repo-name", // Add your repository name
     apiBaseUrl: "https://your-api-server.com", // Add your API server URL
     demoMode: false // Set to false when using a real backend
   };
   ```

4. GitHub Actions will automatically deploy your site when you push to the main branch

### Step 2: Deploy the API Server

1. Set up a server (AWS EC2, DigitalOcean, Heroku, etc.)
2. Upload the server files (server.py, deploy.py, and related files)
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   python deploy.py --production --domain your-api-domain.com --port 8080
   ```
5. Set up a reverse proxy with Nginx or Apache to handle HTTPS

### Step 3: Configure CORS

Modify `server.py` to allow cross-origin requests from your frontend domain:

```python
from flask_cors import CORS

# In the app initialization section:
CORS(app, origins=["https://your-frontend-domain.com"])
```

## Option 2: Full-Stack Deployment (Recommended for Custom Domain)

### Step 1: Register a Domain

1. Register a domain through a provider like Namecheap, GoDaddy, or Google Domains
2. Configure DNS settings to point to your server's IP address:
   - Create an A record for your domain pointing to your server's IP
   - Create another A record for the "www" subdomain

### Step 2: Set Up a VPS

1. Create a VPS (Virtual Private Server) on AWS, DigitalOcean, Linode, etc.
2. Connect via SSH and update the system:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
3. Install required packages:
   ```bash
   sudo apt install python3 python3-pip python3-venv nginx certbot python3-certbot-nginx -y
   ```

### Step 3: Clone the Repository and Set Up the Application

1. Clone your repository:
   ```bash
   git clone https://github.com/yourusername/MonuMe_Tracker.git
   cd MonuMe_Tracker
   ```

2. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Step 4: Set Up SSL with Let's Encrypt

1. Configure Nginx as a reverse proxy:
   ```bash
   sudo nano /etc/nginx/sites-available/monume
   ```

2. Add the following configuration:
   ```nginx
   server {
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://localhost:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/monume /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. Obtain SSL certificate:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

### Step 5: Run the Application with Domain Settings

1. Start the application in production mode:
   ```bash
   python deploy.py --production --domain yourdomain.com --port 8080 --ssl-cert /etc/letsencrypt/live/yourdomain.com/fullchain.pem --ssl-key /etc/letsencrypt/live/yourdomain.com/privkey.pem
   ```

2. Set up a systemd service to ensure the application runs on boot and restarts if it crashes:
   ```bash
   sudo nano /etc/systemd/system/monume.service
   ```
   
   Add the following content:
   ```
   [Unit]
   Description=MonuMe Tracker
   After=network.target

   [Service]
   User=ubuntu
   WorkingDirectory=/path/to/MonuMe_Tracker
   ExecStart=/path/to/MonuMe_Tracker/venv/bin/python deploy.py --production --domain yourdomain.com --port 8080 --ssl-cert /etc/letsencrypt/live/yourdomain.com/fullchain.pem --ssl-key /etc/letsencrypt/live/yourdomain.com/privkey.pem
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl enable monume
   sudo systemctl start monume
   ```

## Option 3: PaaS Deployment (Heroku, Render, etc.)

For simplicity, you can also deploy to platforms like Heroku or Render:

### Heroku Deployment

1. Create a Heroku account and install the Heroku CLI
2. Add a `Procfile` to your repository:
   ```
   web: python deploy.py --production --domain 0.0.0.0 --port $PORT
   ```
3. Deploy to Heroku:
   ```bash
   heroku create your-app-name
   git push heroku main
   ```
4. Set up a custom domain in the Heroku dashboard

### Render Deployment

1. Create an account on Render
2. Create a new Web Service and link to your GitHub repository
3. Configure as a Python application
4. Set the start command to:
   ```
   python deploy.py --production --domain 0.0.0.0 --port $PORT
   ```
5. Add your custom domain in the Render settings

## Troubleshooting

### Common Issues

1. **File paths not resolving correctly**
   - Check the `BASE_PATH` setting in server.py
   - Update static references in HTML/JS files

2. **API calls failing**
   - Verify CORS is properly configured
   - Check network tab in browser dev tools for specific errors

3. **SSL certificate issues**
   - Renew certificate: `sudo certbot renew`
   - Check certificate path in deploy.py command

4. **Database not initializing**
   - Ensure database file is writable
   - Check server logs for database errors

For additional support, please open an issue on the GitHub repository.