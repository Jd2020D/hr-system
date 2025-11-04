# Production Deployment - Quick Reference

This is a quick reference guide for deploying the HR Management System to production.

## 🚀 Deployment Options

### Option 1: Direct Deployment (No Docker) - Recommended for Namecheap

**Best for**: Namecheap VPS or shared hosting with Node.js support

See: `DIRECT_DEPLOYMENT.md` for complete guide

Quick start:
```bash
# On your server
cd /var/www/hr-system
chmod +x deploy-direct.sh
sudo ./deploy-direct.sh
```

### Option 2: Docker Deployment

**Best for**: Full control, easier updates, containerized environment

See: `NAMECHEAP_DEPLOYMENT.md` for Docker-based deployment

Quick start:
```bash
cp .env.production.example .env.production
nano .env.production  # Edit with your values
./deploy.sh
```

## 📋 Files Overview

| File | Purpose |
|------|---------|
| `DIRECT_DEPLOYMENT.md` | **Complete guide for direct deployment (NO Docker)** |
| `NAMECHEAP_DEPLOYMENT.md` | Docker-based deployment guide |
| `deploy-direct.sh` | Automated direct deployment script |
| `docker-compose.prod.yml` | Production Docker Compose configuration |
| `.env.production` | Production environment variables |
| `deploy.sh` | Docker deployment script |
| `ecosystem.config.js` | PM2 configuration for process management |
| `DEPLOYMENT_CHECKLIST.md` | Pre-deployment checklist |

## 🔧 Direct Deployment (No Docker) - Common Commands

```bash
# Start API with PM2
pm2 start dist/server.js --name hr-api

# Check status
pm2 status
pm2 logs hr-api

# Restart API
pm2 restart hr-api

# Stop API
pm2 stop hr-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Build frontend
cd apps/web && npm run build

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

# Check services
systemctl status nginx
systemctl status mysql
pm2 status
```

## 📝 Environment Variables

### Backend (apps/api/.env)

Required variables:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=mysql://hruser:password@localhost:3306/hr_system
JWT_SECRET=required (32+ characters)
JWT_REFRESH_SECRET=required (32+ characters)
FRONTEND_URL=https://yourdomain.com
API_BASE_URL=https://api.yourdomain.com
```

### Frontend (apps/web/.env.production)

```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=HR Management System
```

## 🔐 Security Notes

1. **Change default passwords** immediately after first login
2. **Use strong JWT secrets** (generate with: `openssl rand -base64 32`)
3. **Enable SSL/HTTPS** using Let's Encrypt
4. **Configure firewall** to allow only necessary ports
5. **Regular backups** - setup automated backups
6. **Restrict file permissions**: `chmod 600 apps/api/.env`
7. **Keep system updated** - regularly update Node.js, MySQL, and system packages

## 📊 Monitoring

Health check endpoints:
- API: `https://api.yourdomain.com/api/health` or `http://localhost:4000/api/health`
- Frontend: `https://yourdomain.com/health`

PM2 monitoring:
```bash
pm2 monit          # Real-time monitoring
pm2 logs hr-api    # View logs
pm2 show hr-api    # Detailed info
```

## 🆘 Troubleshooting

### Direct Deployment Issues

```bash
# Check PM2 logs
pm2 logs hr-api --lines 50

# Check if API is running
pm2 status

# Check database connection
mysql -u hruser -p hr_system

# Check Nginx logs
tail -f /var/log/nginx/error.log

# Test Nginx config
nginx -t

# Check if port is in use
lsof -i :4000
```

### Docker Deployment Issues

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

## 📚 Full Documentation

- **Direct Deployment (No Docker)**: See `DIRECT_DEPLOYMENT.md` ⭐ **For Namecheap**
- **Docker Deployment**: See `NAMECHEAP_DEPLOYMENT.md`
- **Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **API Docs**: `API_REFERENCE.md`
- **System Architecture**: `SYSTEM_ARCHITECTURE.md`

---

## 🎯 Quick Start for Namecheap (No Docker)

1. **Prepare server** (Node.js, MySQL, Nginx, PM2)
2. **Upload project files** to `/var/www/hr-system`
3. **Configure backend**: Edit `apps/api/.env`
4. **Run deployment**: `sudo ./deploy-direct.sh`
5. **Configure Nginx**: See `DIRECT_DEPLOYMENT.md` Step 5
6. **Setup SSL**: `certbot --nginx -d yourdomain.com`
7. **Done!** Visit `https://yourdomain.com`

For detailed steps, see **`DIRECT_DEPLOYMENT.md`**
