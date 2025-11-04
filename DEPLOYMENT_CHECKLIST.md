# Production Deployment Checklist

Use this checklist before deploying to production.

## Pre-Deployment

- [ ] **Code Review**: All code reviewed and tested
- [ ] **Tests Pass**: All unit and integration tests pass
- [ ] **Security Audit**: No security vulnerabilities
- [ ] **Environment Variables**: All required variables documented
- [ ] **Database Migrations**: All migrations tested
- [ ] **Backup Plan**: Backup strategy in place
- [ ] **Monitoring**: Monitoring and logging setup

## Server Setup

- [ ] **Server Requirements**: Minimum 2GB RAM, 2 CPU cores
- [ ] **Docker Installed**: Docker and Docker Compose installed
- [ ] **Node.js Version**: Node.js 18.x installed (if not using Docker)
- [ ] **MySQL Installed**: MySQL 8.0+ installed (if not using Docker)
- [ ] **Firewall Configured**: Ports 80, 443, 22 open
- [ ] **SSH Access**: SSH keys configured

## Configuration

- [ ] **Environment File**: `.env.production` created and configured
- [ ] **Database Credentials**: Strong passwords set
- [ ] **JWT Secrets**: Strong random secrets generated (32+ characters)
- [ ] **Domain Names**: Domain(s) configured
- [ ] **SSL Certificate**: SSL certificate obtained (Let's Encrypt)
- [ ] **CORS Settings**: Frontend URL configured
- [ ] **Email Settings**: SMTP configured (if using email features)

## Deployment

- [ ] **Files Uploaded**: All project files uploaded to server
- [ ] **Docker Images Built**: Production images built successfully
- [ ] **Containers Started**: All services running
- [ ] **Database Migrations**: Migrations applied successfully
- [ ] **Database Seeded**: Initial data loaded (first deployment)
- [ ] **Health Checks**: All health endpoints responding

## Post-Deployment

- [ ] **Application Accessible**: Frontend loads correctly
- [ ] **API Working**: API endpoints responding
- [ ] **Database Connected**: Can query database
- [ ] **Login Works**: Can login with admin credentials
- [ ] **SSL Working**: HTTPS redirects working
- [ ] **Default Password Changed**: Admin password changed
- [ ] **Backups Running**: Automated backups configured
- [ ] **Monitoring Active**: Logs and metrics being collected

## Security

- [ ] **Default Passwords Changed**: All default passwords changed
- [ ] **Firewall Active**: Unnecessary ports closed
- [ ] **SSL Enabled**: HTTPS only access
- [ ] **Secrets Secured**: Environment variables not in code
- [ ] **Database Access**: Database not exposed publicly
- [ ] **Rate Limiting**: API rate limiting enabled
- [ ] **CORS Configured**: CORS properly configured
- [ ] **Security Headers**: Security headers in place

## Testing

- [ ] **Login Test**: Can login with different roles
- [ ] **CRUD Operations**: Create, read, update, delete working
- [ ] **File Uploads**: File uploads working (if applicable)
- [ ] **Reports**: Reports generating correctly
- [ ] **Email Notifications**: Emails sending (if applicable)
- [ ] **Performance**: Response times acceptable
- [ ] **Mobile Responsive**: UI works on mobile devices

## Documentation

- [ ] **Deployment Guide**: Deployment steps documented
- [ ] **Environment Variables**: All variables documented
- [ ] **Backup Procedures**: Backup and restore procedures documented
- [ ] **Troubleshooting**: Common issues and solutions documented
- [ ] **Contact Info**: Support contact information available

## Monitoring & Maintenance

- [ ] **Log Rotation**: Log rotation configured
- [ ] **Disk Space**: Sufficient disk space available
- [ ] **Backup Storage**: Backup storage configured
- [ ] **Update Schedule**: Update schedule planned
- [ ] **Maintenance Window**: Maintenance window scheduled

## Rollback Plan

- [ ] **Backup Available**: Recent backup available
- [ ] **Rollback Procedure**: Rollback steps documented
- [ ] **Data Export**: Database export available
- [ ] **Previous Version**: Previous version accessible

---

## Quick Deployment Commands

```bash
# Build and deploy
./deploy.sh

# Or manually
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop
docker-compose -f docker-compose.prod.yml down
```

---

**Last Updated**: $(date)
**Deployed By**: ________________
**Date**: ________________
