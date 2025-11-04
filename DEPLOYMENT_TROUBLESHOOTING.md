# Deployment Troubleshooting Guide

Common issues and solutions when deploying the HR System.

## Docker Build Issues

### Issue: `npm ci` requires package-lock.json

**Error:**
```
npm error The `npm ci` command can only install with an existing package-lock.json
```

**Solution:**
The Dockerfiles have been updated to handle missing `package-lock.json` files. They will automatically fall back to `npm install` if the lock file doesn't exist.

However, for better reproducibility, you should generate lock files:

```bash
# Generate package-lock.json for API
cd apps/api
npm install
git add package-lock.json
git commit -m "Add package-lock.json for API"

# Generate package-lock.json for Web
cd ../web
npm install
git add package-lock.json
git commit -m "Add package-lock.json for Web"
```

**Note:** The deployment should work without lock files, but having them ensures consistent builds.

## Database Issues

### Issue: Cannot connect to MySQL

**Error:**
```
Error: connect ECONNREFUSED
```

**Solution:**
```bash
# Check MySQL container status
docker compose -f docker-compose.prod.yml ps mysql

# Check MySQL logs
docker compose -f docker-compose.prod.yml logs mysql

# Restart MySQL
docker compose -f docker-compose.prod.yml restart mysql
```

### Issue: MySQL takes too long to start

**Solution:**
The deployment script waits up to 60 seconds. If MySQL takes longer:
1. Check server resources (RAM, CPU)
2. Check MySQL logs for errors
3. Increase timeout in deployment script if needed

## Nginx Issues

### Issue: Nginx configuration test failed

**Error:**
```
nginx: configuration file /etc/nginx/nginx.conf test failed
```

**Solution:**
```bash
# Test nginx configuration
nginx -t

# Check error logs
tail -f /var/log/nginx/error.log

# Review generated configs
cat /etc/nginx/sites-available/your-domain.com
```

### Issue: 502 Bad Gateway

**Solution:**
1. Check if containers are running:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```

2. Check container logs:
   ```bash
   docker compose -f docker-compose.prod.yml logs api
   docker compose -f docker-compose.prod.yml logs web
   ```

3. Verify ports are correct in docker-compose.prod.yml

## SSL Certificate Issues

### Issue: Let's Encrypt certificate failed

**Error:**
```
Failed to obtain certificate
```

**Solution:**
1. Ensure domains point to your server IP:
   ```bash
   dig your-domain.com
   ```

2. Ensure ports 80 and 443 are open:
   ```bash
   ufw allow 80/tcp
   ufw allow 443/tcp
   ```

3. Manually obtain certificate:
   ```bash
   certbot --nginx -d your-domain.com
   ```

## Git Issues

### Issue: Branch not found

**Error:**
```
error: pathspec 'branch-name' did not match any file(s) known to git
```

**Solution:**
```bash
# List available branches
git branch -a

# Check current branch
git branch

# Fetch all branches
git fetch --all
```

## Environment Variables

### Issue: CHANGE_ME values found

**Error:**
```
.env.production contains placeholder values
```

**Solution:**
```bash
# Check for remaining placeholders
grep -i "CHANGE_ME" .env.production

# Edit and replace all values
nano .env.production
```

### Issue: JWT secret too short

**Solution:**
```bash
# Generate longer secret
openssl rand -base64 48
```

## Container Issues

### Issue: Container keeps restarting

**Solution:**
```bash
# Check logs for errors
docker compose -f docker-compose.prod.yml logs -f api

# Check container status
docker compose -f docker-compose.prod.yml ps

# Restart specific container
docker compose -f docker-compose.prod.yml restart api
```

### Issue: Out of memory

**Solution:**
1. Check server memory:
   ```bash
   free -h
   ```

2. Increase server resources or optimize containers

3. Check Docker resource limits

## Permission Issues

### Issue: Permission denied errors

**Solution:**
```bash
# Ensure running as root or with sudo
sudo node deploy-production.js ...

# Fix file permissions
sudo chown -R root:root /var/www/hr-system
sudo chmod 600 .env.production
```

## Network Issues

### Issue: Cannot pull Docker images

**Solution:**
```bash
# Check internet connection
ping 8.8.8.8

# Restart Docker daemon
sudo systemctl restart docker

# Try pulling manually
docker pull node:18-alpine
```

## Quick Fixes

### Restart Everything

```bash
cd /var/www/hr-system
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### Rebuild Everything

```bash
cd /var/www/hr-system
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

### Clean Start

```bash
cd /var/www/hr-system
docker compose -f docker-compose.prod.yml down -v
docker system prune -f
# Then run deployment script again
```

## Getting Help

1. Check all logs: `docker compose -f docker-compose.prod.yml logs -f`
2. Verify environment: `cat .env.production`
3. Check system resources: `df -h`, `free -h`, `docker stats`
4. Review deployment logs from the script output
