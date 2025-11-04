# Namecheap Deployment Guide

This guide will help you deploy the HR Management System to Namecheap hosting.

## Prerequisites

Before starting, ensure you have:

1. **Namecheap VPS or Managed Node.js Hosting**
   - This application requires Node.js, Docker, and MySQL
   - Shared hosting is NOT suitable for this application
   - Recommended: Namecheap VPS with at least 2GB RAM

2. **Domain name** (optional but recommended)
   - Point your domain to your Namecheap server IP

3. **SSH access** to your server

## Deployment Options

### Option 1: VPS with Docker (Recommended)

If you have a VPS, use Docker Compose for the easiest deployment.

#### Step 1: Prepare Your Server

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

#### Step 2: Upload Project Files

```bash
# Create project directory
mkdir -p /var/www/hr-system
cd /var/www/hr-system

# Upload project files (using SCP, SFTP, or Git)
# Option A: Using Git
git clone <your-repository-url> .

# Option B: Using SCP (from your local machine)
# scp -r /path/to/hr-system/* root@your-server-ip:/var/www/hr-system/
```

#### Step 3: Configure Environment

```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit environment file
nano .env.production
```

Update the following values in `.env.production`:

```env
# Database
MYSQL_ROOT_PASSWORD=your-strong-password-here
MYSQL_DATABASE=hr_system
MYSQL_USER=hruser
MYSQL_PASSWORD=your-strong-password-here

# Application URLs (replace with your domain)
FRONTEND_URL=https://yourdomain.com
API_BASE_URL=https://api.yourdomain.com

# JWT Secrets (generate strong random strings)
JWT_SECRET=generate-a-very-long-random-string-minimum-32-characters
JWT_REFRESH_SECRET=generate-another-very-long-random-string-minimum-32-characters

# Ports (80 for HTTP, 443 for HTTPS with SSL)
WEB_PORT=80
API_PORT=4000
```

**Generate JWT Secrets:**
```bash
# Generate random secrets
openssl rand -base64 32
openssl rand -base64 32
```

#### Step 4: Deploy

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

Or manually:

```bash
# Build and start containers
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# Seed database (first time only)
docker-compose -f docker-compose.prod.yml exec api npm run seed
```

#### Step 5: Setup SSL with Let's Encrypt

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# If using Nginx reverse proxy (recommended)
certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

#### Step 6: Configure Firewall

```bash
# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp  # SSH
ufw enable
```

### Option 2: VPS without Docker (Manual Setup)

If you prefer not to use Docker:

#### Step 1: Install Node.js and MySQL

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install MySQL
apt install -y mysql-server
mysql_secure_installation

# Create database
mysql -u root -p
```

```sql
CREATE DATABASE hr_system;
CREATE USER 'hruser'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON hr_system.* TO 'hruser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Step 2: Setup Backend API

```bash
cd /var/www/hr-system/apps/api

# Install dependencies
npm ci --production

# Configure environment
cp .env.example .env
nano .env
```

Update `.env`:
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=mysql://hruser:your-password@localhost:3306/hr_system
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=https://yourdomain.com
API_BASE_URL=https://api.yourdomain.com
```

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build
npm run build

# Setup PM2 for process management
npm install -g pm2
pm2 start dist/server.js --name hr-api
pm2 startup
pm2 save
```

#### Step 3: Setup Frontend

```bash
cd /var/www/hr-system/apps/web

# Install dependencies
npm ci

# Configure environment
nano .env.production
```

```env
VITE_API_URL=https://api.yourdomain.com
```

```bash
# Build
npm run build

# Install Nginx
apt install -y nginx

# Configure Nginx
nano /etc/nginx/sites-available/hr-system
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/hr-system/apps/web/dist;
    index index.html;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
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
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/hr-system /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Option 3: Namecheap Managed Node.js Hosting

If Namecheap offers managed Node.js hosting:

1. **Upload files** via cPanel File Manager or FTP
2. **Set Node.js version** to 18.x in cPanel
3. **Configure environment variables** in cPanel
4. **Set startup command**: `npm start` (for API) and `npm run build` (for frontend)
5. **Point domain** to the Node.js application

**Note:** This option may have limitations with MySQL and Docker. Consider using an external database service.

## Post-Deployment

### 1. Verify Deployment

```bash
# Check containers/services are running
docker-compose -f docker-compose.prod.yml ps

# Or for PM2
pm2 list

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
# Or
pm2 logs hr-api
```

### 2. Test Application

- Visit `https://yourdomain.com`
- Login with default credentials:
  - Email: `admin@hrsystem.com`
  - Password: `Admin@123`
- **Change the default password immediately!**

### 3. Setup Backup

```bash
# Create backup script
nano /usr/local/bin/backup-hr-system.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backups/hr-system"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker-compose -f /var/www/hr-system/docker-compose.prod.yml exec -T mysql mysqldump -uroot -p$MYSQL_ROOT_PASSWORD hr_system > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/hr-system/uploads

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

```bash
chmod +x /usr/local/bin/backup-hr-system.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-hr-system.sh
```

### 4. Monitor Application

```bash
# Check health endpoints
curl http://localhost:4000/api/health
curl http://localhost/health

# Monitor resources
docker stats
# Or
pm2 monit
```

## Troubleshooting

### Issue: Cannot connect to database

**Solution:**
```bash
# Check MySQL container/service
docker-compose -f docker-compose.prod.yml logs mysql

# Or
systemctl status mysql

# Test connection
mysql -u hruser -p hr_system
```

### Issue: Port already in use

**Solution:**
```bash
# Find process using port
lsof -i :4000
lsof -i :80

# Kill process or change port in .env.production
```

### Issue: SSL certificate errors

**Solution:**
```bash
# Renew certificate
certbot renew --dry-run

# Check Nginx configuration
nginx -t
systemctl reload nginx
```

### Issue: Build failures

**Solution:**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose -f docker-compose.prod.yml build --no-cache
```

## Security Checklist

- [ ] Changed default admin password
- [ ] Generated strong JWT secrets
- [ ] Setup SSL/HTTPS
- [ ] Configured firewall
- [ ] Enabled automatic backups
- [ ] Restricted database access
- [ ] Updated system packages
- [ ] Configured rate limiting
- [ ] Setup monitoring/logging
- [ ] Regular security updates

## Maintenance

### Update Application

```bash
cd /var/www/hr-system

# Pull latest changes
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f web
docker-compose -f docker-compose.prod.yml logs -f mysql
```

## Support

For issues:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify environment variables
3. Check database connectivity
4. Review firewall settings

## Additional Resources

- [Namecheap Knowledge Base](https://www.namecheap.com/support/knowledgebase/)
- [Docker Documentation](https://docs.docker.com/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

