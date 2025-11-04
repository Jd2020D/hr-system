## Example Deployment

```bash
# Deploy from main branch
sudo node deploy-production.js \
  https://github.com/company/hr-system.git \
  hr.company.com \
  api.company.com \
  4000 \
  main \
  admin@company.com

# Deploy from production branch
sudo node deploy-production.js \
  https://github.com/company/hr-system.git \
  hr.company.com \
  api.company.com \
  4000 \
  production \
  devops@company.com

# Deploy with SAME domain (API accessible via /api)
sudo node deploy-production.js \
  https://github.com/company/hr-system.git \
  hr.company.com \
  hr.company.com \
  4000 \
  main \
  admin@company.com
```

## Same Domain Deployment

If you want to use the same domain for both frontend and API (API accessible at `/api`):

### Example Command

```bash
sudo node deploy-production.js \
  https://github.com/your-username/hr-system.git \
  app.example.com \
  app.example.com \
  4000 \
  main \
  admin@example.com
```

**What this does:**

- Frontend is accessible at: `https://app.example.com`
- API is accessible at: `https://app.example.com/api`
- Both share the same SSL certificate
- Nginx automatically proxies `/api/*` requests to the API container
- Frontend requests are served by the web container

### Configuration

When using the same domain, ensure your `.env.production` has:

```env
FRONTEND_URL=https://app.example.com
API_BASE_URL=https://app.example.com
```

The Nginx configuration will automatically:

- Serve frontend at `/`
- Proxy API requests from `/api` to the API container
- Handle client-side routing for the frontend

### Frontend Configuration

Make sure your frontend's API client is configured to use relative paths:

```typescript
// In your frontend code, use relative API URL
const API_URL = "/api"; // Instead of full URL
```

## Post-Deployment

### Verify Deployment

```bash
# Check container status
cd /var/www/hr-system
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Test API health (same domain)
curl https://app.example.com/api/health

# Test frontend
curl -I https://app.example.com
```

### Access the Application

**For same domain deployment:**

- **Frontend**: https://app.example.com
- **API**: https://app.example.com/api
- **Default Login**:
  - Email: `admin@hrsystem.com`
  - Password: `Admin@123`
  - ⚠️ **Change immediately after first login!**

**For separate domains:**

- **Frontend**: https://app.example.com
- **API**: https://api.example.com
- **Default Login**:
  - Email: `admin@hrsystem.com`
  - Password: `Admin@123`
  - ⚠️ **Change immediately after first login!**

## Updating Deployment

To update your deployment with latest code:

```bash
# The script handles updates automatically
sudo node deploy-production.js \
  https://github.com/your-username/hr-system.git \
  app.example.com \
  app.example.com \
  4000 \
  main
```

The script will:

- Pull latest code from the specified branch
- Rebuild Docker images
- Restart containers with zero downtime
- Keep your database and volumes intact

## Troubleshooting

### Issue: "Please run as root or with sudo"

**Solution:**

```bash
sudo node deploy-production.js ...
```

### Issue: ".env.production contains placeholder values"

**Solution:**

```bash
# Edit the environment file
nano /var/www/hr-system/.env.production
# Replace all CHANGE_ME values with actual configuration
```

### Issue: "Cannot connect to MySQL"

**Solution:**

```bash
# Check MySQL container logs
cd /var/www/hr-system
docker compose -f docker-compose.prod.yml logs mysql

# Check if MySQL is running
docker compose -f docker-compose.prod.yml ps mysql
```

### Issue: "SSL certificate failed"

**Solution:**

```bash
# Ensure domains point to your server IP
dig app.example.com
dig api.example.com

# Manually obtain certificate
certbot --nginx -d app.example.com -d api.example.com
```

### Issue: "Port already in use"

**Solution:**

```bash
# Check what's using the port
lsof -i :4000
lsof -i :80

# Stop conflicting services or change ports in .env.production
```

### Issue: "Nginx configuration test failed"

**Solution:**

```bash
# Test nginx configuration
nginx -t

# Check nginx error logs
tail -f /var/log/nginx/error.log

# Review generated configs
cat /etc/nginx/sites-available/app.example.com
cat /etc/nginx/sites-available/api.example.com
```

## Manual Operations

### View Logs

```bash
cd /var/www/hr-system

# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f mysql
```

### Restart Services

```bash
cd /var/www/hr-system

# Restart all
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart api
```

### Stop Services

```bash
cd /var/www/hr-system
docker compose -f docker-compose.prod.yml down
```

### Backup Database

```bash
cd /var/www/hr-system
docker compose -f docker-compose.prod.yml exec mysql mysqldump \
  -uroot -p$MYSQL_ROOT_PASSWORD \
  hr_system > backup-$(date +%Y%m%d).sql
```

### Database Migrations

```bash
cd /var/www/hr-system

# Run migrations
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# Or push schema directly
docker compose -f docker-compose.prod.yml exec api npx prisma db push
```

## Security Best Practices

1. **Strong Passwords**: Use strong passwords for database and JWT secrets
2. **Firewall**: Configure UFW or iptables to only allow necessary ports
3. **SSH Keys**: Use SSH keys instead of passwords for server access
4. **Regular Updates**: Keep Docker, Nginx, and system packages updated
5. **Backups**: Set up automated database backups
6. **Monitoring**: Monitor logs and set up alerts for critical issues
7. **Change Defaults**: Change default admin password immediately

## Advanced Configuration

### Custom Ports

If you need to use different ports:

1. Update `.env.production`:

   ```env
   API_PORT=5000
   WEB_PORT=8080
   ```

2. Update firewall rules:

   ```bash
   ufw allow 5000/tcp
   ufw allow 8080/tcp
   ```

3. Run deployment script with custom port:
   ```bash
   sudo node deploy-production.js ... app.example.com api.example.com 5000
   ```

## Support

For issues:

1. Check logs: `docker compose -f docker-compose.prod.yml logs -f`
2. Review this documentation
3. Check [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
4. Review [PRODUCTION_README.md](./PRODUCTION_README.md)

## License

MIT License - See LICENSE file
