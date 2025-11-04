# Direct Deployment to Namecheap Hosting (Without Docker)

This guide covers deploying the HR Management System directly to Namecheap hosting without using Docker.

## Prerequisites

1. **Namecheap VPS or Shared Hosting with Node.js Support**
   - VPS recommended for better control
   - Minimum: 2GB RAM, 2 CPU cores
   - Node.js 18.x or higher
   - MySQL 8.0 or higher
   - Nginx or Apache web server

2. **Domain name** configured to point to your server

3. **SSH access** to your server

## Step 1: Server Preparation

### 1.1 Connect to Your Server

```bash
ssh root@your-server-ip
# Or use your Namecheap cPanel SSH access
```

### 1.2 Update System

```bash
# Ubuntu/Debian
apt update && apt upgrade -y

# CentOS/RHEL
yum update -y
```

### 1.3 Install Node.js 18.x

```bash
# Using NodeSource repository (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify installation
node --version  # Should be v18.x or higher
npm --version
```

### 1.4 Install MySQL

```bash
# Ubuntu/Debian
apt install -y mysql-server

# CentOS/RHEL
yum install -y mysql-server

# Start MySQL
systemctl start mysql
systemctl enable mysql

# Secure MySQL installation
mysql_secure_installation
```

### 1.5 Create Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE hr_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hruser'@'localhost' IDENTIFIED BY 'your-strong-password-here';
GRANT ALL PRIVILEGES ON hr_system.* TO 'hruser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 1.6 Install PM2 (Process Manager)

```bash
npm install -g pm2
```

### 1.7 Install Nginx

```bash
# Ubuntu/Debian
apt install -y nginx

# CentOS/RHEL
yum install -y nginx

# Start Nginx
systemctl start nginx
systemctl enable nginx
```

## Step 2: Upload Project Files

### Option A: Using Git (Recommended)

```bash
# Install Git if not installed
apt install -y git  # or yum install -y git

# Create project directory
mkdir -p /var/www/hr-system
cd /var/www/hr-system

# Clone repository
git clone <your-repository-url> .

# Or if you need to pull latest
git pull origin main
```

### Option B: Using SCP (from your local machine)

```bash
# From your local machine
scp -r /path/to/hr-system/* root@your-server-ip:/var/www/hr-system/
```

### Option C: Using SFTP/FTP

Use FileZilla or any FTP client to upload files to `/var/www/hr-system/`

## Step 3: Backend API Setup

### 3.1 Navigate to API Directory

```bash
cd /var/www/hr-system/apps/api
```

### 3.2 Install Dependencies

```bash
npm install --production
```

### 3.3 Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

Update `.env` with your production values:

```env
NODE_ENV=production
PORT=4000
API_BASE_URL=https://api.yourdomain.com

# Database - use the credentials you created
DATABASE_URL=mysql://hruser:your-password@localhost:3306/hr_system

# JWT Secrets - generate strong random strings
JWT_SECRET=generate-a-very-long-random-string-minimum-32-characters
JWT_REFRESH_SECRET=generate-another-very-long-random-string-minimum-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

**Generate JWT Secrets:**
```bash
openssl rand -base64 32
openssl rand -base64 32
```

### 3.4 Generate Prisma Client

```bash
npx prisma generate
```

### 3.5 Run Database Migrations

```bash
npx prisma migrate deploy
```

### 3.6 Build TypeScript

```bash
npm run build
```

### 3.7 Seed Database (First Time Only)

```bash
npm run seed
```

### 3.8 Create Uploads Directory

```bash
mkdir -p uploads
chmod 755 uploads
```

### 3.9 Setup PM2

```bash
# Start the API with PM2
pm2 start dist/server.js --name hr-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions provided by the command above
```

### 3.10 Verify API is Running

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs hr-api

# Test API
curl http://localhost:4000/api/health
```

## Step 4: Frontend Setup

### 4.1 Navigate to Web Directory

```bash
cd /var/www/hr-system/apps/web
```

### 4.2 Install Dependencies

```bash
npm install
```

### 4.3 Configure Environment

```bash
# Create production environment file
nano .env.production
```

Add:

```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=HR Management System
```

### 4.4 Build Frontend

```bash
npm run build
```

The built files will be in the `dist` directory.

## Step 5: Configure Nginx

### 5.1 Create Nginx Configuration

```bash
nano /etc/nginx/sites-available/hr-system
```

Add the following configuration:

```nginx
# Redirect HTTP to HTTPS (optional, after SSL setup)
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    
    # For Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# Frontend (HTTPS)
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration (update after certificate setup)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Document root - frontend build
    root /var/www/hr-system/apps/web/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to Node.js backend
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Handle React Router (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# API Subdomain (HTTPS)
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy all requests to Node.js backend
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**For HTTP only (before SSL setup), use this simpler version:**

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/hr-system/apps/web/dist;
    index index.html;

    # Proxy API requests
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# API Subdomain
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5.2 Enable Site

```bash
# Create symlink
ln -s /etc/nginx/sites-available/hr-system /etc/nginx/sites-enabled/

# Remove default site (optional)
rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

## Step 6: Setup SSL Certificate (Let's Encrypt)

### 6.1 Install Certbot

```bash
apt install -y certbot python3-certbot-nginx
# or for CentOS: yum install -y certbot python3-certbot-nginx
```

### 6.2 Obtain SSL Certificate

```bash
# For both domain and subdomain
certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Follow the prompts to enter your email and agree to terms
```

### 6.3 Auto-Renewal Setup

```bash
# Test renewal
certbot renew --dry-run

# Certbot automatically sets up a cron job for renewal
```

## Step 7: Configure Firewall

```bash
# Install UFW if not installed
apt install -y ufw

# Allow HTTP, HTTPS, and SSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

## Step 8: Verify Deployment

### 8.1 Check Services

```bash
# Check PM2
pm2 status
pm2 logs hr-api

# Check Nginx
systemctl status nginx

# Check MySQL
systemctl status mysql
```

### 8.2 Test Application

1. Visit `https://yourdomain.com` in your browser
2. Login with default credentials:
   - Email: `admin@hrsystem.com`
   - Password: `Admin@123`
3. **Change the default password immediately!**

### 8.3 Test API

```bash
# Health check
curl https://api.yourdomain.com/api/health

# Or from browser
# https://api.yourdomain.com/api/health
```

## Step 9: Setup Backups

### 9.1 Create Backup Script

```bash
nano /usr/local/bin/backup-hr-system.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backups/hr-system"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u hruser -p'your-password' hr_system > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/hr-system/apps/api/uploads

# Backup environment files
cp /var/www/hr-system/apps/api/.env $BACKUP_DIR/env_$DATE.backup

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.backup" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
chmod +x /usr/local/bin/backup-hr-system.sh

# Test backup
/usr/local/bin/backup-hr-system.sh
```

### 9.2 Setup Cron Job

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-hr-system.sh
```

## Step 10: Monitoring

### 10.1 PM2 Monitoring

```bash
# Monitor in real-time
pm2 monit

# View logs
pm2 logs hr-api

# View detailed info
pm2 show hr-api

# Restart if needed
pm2 restart hr-api
```

### 10.2 System Monitoring

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
top
```

## Troubleshooting

### API Not Starting

```bash
# Check PM2 logs
pm2 logs hr-api --lines 50

# Check if port is in use
lsof -i :4000

# Restart PM2
pm2 restart hr-api
```

### Database Connection Issues

```bash
# Test MySQL connection
mysql -u hruser -p hr_system

# Check MySQL status
systemctl status mysql

# Check DATABASE_URL in .env
cat /var/www/hr-system/apps/api/.env | grep DATABASE_URL
```

### Nginx Errors

```bash
# Check Nginx error log
tail -f /var/log/nginx/error.log

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

### Frontend Not Loading

```bash
# Check if dist folder exists
ls -la /var/www/hr-system/apps/web/dist

# Rebuild frontend
cd /var/www/hr-system/apps/web
npm run build

# Check Nginx root path in configuration
```

## Updating the Application

```bash
cd /var/www/hr-system

# Pull latest changes (if using Git)
git pull origin main

# Update backend
cd apps/api
npm install --production
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart hr-api

# Update frontend
cd ../web
npm install
npm run build

# Restart Nginx (usually not needed)
systemctl reload nginx
```

## Security Checklist

- [ ] Changed default admin password
- [ ] Generated strong JWT secrets
- [ ] SSL/HTTPS enabled
- [ ] Firewall configured
- [ ] Database user has limited privileges
- [ ] Environment file has restricted permissions: `chmod 600 .env`
- [ ] Regular backups configured
- [ ] System packages updated
- [ ] PM2 auto-restart on system boot configured

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---

**Your application should now be live at https://yourdomain.com**
