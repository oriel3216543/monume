# MonuMe Tracker Deployment Guide

This guide provides step-by-step instructions for deploying the MonuMe Tracker application to a production server with a custom domain name.

## Prerequisites

- A server with Python 3.7+ installed
- A domain name (e.g., monumetracker.com)
- Basic knowledge of server administration
- Access to your domain's DNS settings

## Deployment Steps

### 1. Server Preparation

1. **Update your server:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install required system packages:**
   ```bash
   sudo apt install -y python3-pip python3-venv nginx
   ```

3. **Set up a firewall (optional but recommended):**
   ```bash
   sudo ufw allow 'Nginx Full'
   sudo ufw allow ssh
   sudo ufw enable
   ```

### 2. Application Setup

1. **Create a dedicated user for the application (optional but recommended):**
   ```bash
   sudo adduser monume
   sudo usermod -aG sudo monume
   ```

2. **Clone or upload the application to the server:**
   
   Option A - Clone from Git repository:
   ```bash
   git clone <your-repo-url> /home/monume/MonuMe_Tracker
   ```
   
   Option B - Upload using SCP:
   ```bash
   scp -r /path/to/MonuMe_Tracker user@your_server:/home/monume/
   ```

3. **Navigate to the application directory:**
   ```bash
   cd /home/monume/MonuMe_Tracker
   ```

4. **Create a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

5. **Install dependencies and initialize:**
   ```bash
   python install_dependencies.py
   ```
   
   Or manually:
   ```bash
   pip install -r requirements.txt
   python init_db.py
   ```

### 3. Configure Environment Variables

Create an environment file (.env) with secure settings:

```bash
echo "SECRET_KEY=$(openssl rand -hex 32)" > .env
echo "DOMAIN=0.0.0.0" >> .env
echo "PORT=8000" >> .env
echo "FLASK_ENV=production" >> .env
```

### 4. Set Up Nginx as a Reverse Proxy

1. **Create an Nginx configuration file:**
   ```bash
   sudo nano /etc/nginx/sites-available/monumetracker
   ```

2. **Add the following configuration (replace `yourdomain.com` with your actual domain):**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Enable the Nginx configuration:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/monumetracker /etc/nginx/sites-enabled/
   sudo nginx -t  # Check for syntax errors
   sudo systemctl restart nginx
   ```

### 5. Set Up SSL with Let's Encrypt (HTTPS)

1. **Install Certbot:**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. **Obtain and install SSL certificate:**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

### 6. Run the Application with Systemd

1. **Create a systemd service file:**
   ```bash
   sudo nano /etc/systemd/system/monumetracker.service
   ```

2. **Add the following configuration:**
   ```ini
   [Unit]
   Description=MonuMe Tracker Service
   After=network.target

   [Service]
   User=monume
   WorkingDirectory=/home/monume/MonuMe_Tracker
   ExecStart=/home/monume/MonuMe_Tracker/venv/bin/python deploy.py
   Restart=always
   Environment="PATH=/home/monume/MonuMe_Tracker/venv/bin"
   Environment="SECRET_KEY=your_secret_key"
   Environment="DOMAIN=0.0.0.0"
   Environment="PORT=8000"

   [Install]
   WantedBy=multi-user.target
   ```

3. **Enable and start the service:**
   ```bash
   sudo systemctl enable monumetracker
   sudo systemctl start monumetracker
   sudo systemctl status monumetracker
   ```

### 7. Domain Configuration

1. **Update your DNS settings:**
   - Add an A record pointing to your server's IP address
   - Example: `yourdomain.com. IN A 123.45.67.89`
   - Example: `www.yourdomain.com. IN A 123.45.67.89`

2. **Wait for DNS propagation:**
   - DNS changes can take 24-48 hours to fully propagate

### 8. Monitor and Maintain

1. **Check application logs:**
   ```bash
   sudo journalctl -u monumetracker -f
   ```

2. **View real-time server logs:**
   ```bash
   tail -f /home/monume/MonuMe_Tracker/server_logs.txt
   ```

3. **Set up regular database backups:**
   ```bash
   # Add to crontab
   crontab -e
   
   # Add this line to back up database daily at 1 AM
   0 1 * * * sqlite3 /home/monume/MonuMe_Tracker/monume.db .dump > /home/monume/backups/monume_$(date +\%Y\%m\%d).sql
   ```

## Troubleshooting

### Common Issues

1. **Application doesn't start:**
   - Check service status: `sudo systemctl status monumetracker`
   - View logs: `sudo journalctl -u monumetracker -e`

2. **Can't access the site:**
   - Check Nginx status: `sudo systemctl status nginx`
   - Check Nginx error logs: `sudo cat /var/log/nginx/error.log`

3. **SSL certificate issues:**
   - Renew certificate: `sudo certbot renew`

## Security Recommendations

1. **Set up automatic security updates:**
   ```bash
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

2. **Use a strong SECRET_KEY:**
   - Update the SECRET_KEY in your systemd service file
   - Never share or expose your SECRET_KEY

3. **Regular backups:**
   - Implement regular automated backups of the database
   - Store backups in multiple secure locations

4. **Database security:**
   - Ensure database file permissions are secure
   - Consider SQLite encryption for sensitive data

## Updating the Application

1. **Pull the latest code:**
   ```bash
   cd /home/monume/MonuMe_Tracker
   git pull origin main  # If using Git
   ```

2. **Apply any database migrations:**
   ```bash
   python init_db.py
   ```

3. **Restart the service:**
   ```bash
   sudo systemctl restart monumetracker
   ```

---

For additional support, please contact the development team.