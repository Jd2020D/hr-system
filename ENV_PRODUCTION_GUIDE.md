# Production Environment Variables Guide

Complete guide for configuring `.env.production` for your HR System deployment.

## Quick Setup

1. **Copy the example file:**

   ```bash
   cp .env.production.example .env.production
   ```

2. **Edit the file:**

   ```bash
   nano .env.production
   ```

3. **Generate secure secrets:**

   ```bash
   # Generate JWT secrets
   openssl rand -base64 32
   openssl rand -base64 32

   # Generate database passwords
   openssl rand -base64 32
   openssl rand -base64 32
   ```

## Complete Example Configuration

### For Same Domain Deployment

If deploying with the same domain (e.g., `hr.company.com` with API at `/api`):

```env
# Database Configuration
MYSQL_ROOT_PASSWORD=K8mN9pQ2rS5tV8wX1zA4bC7dE0fG3hI6j
MYSQL_DATABASE=hr_system
MYSQL_USER=hruser
MYSQL_PASSWORD=L2mN5pQ8rS1tV4wX7zA0bC3dE6fG9hI2j
MYSQL_PORT=3306

# Application URLs (Same Domain)
FRONTEND_URL=https://hr.company.com
API_BASE_URL=https://hr.company.com

# Ports
WEB_PORT=80
API_PORT=4000

# JWT Secrets (Generate your own!)
JWT_SECRET=X9kL2mN5pQ8rS1tV4wX7zA0bC3dE6fG9hI2jK5mN8pQ
JWT_REFRESH_SECRET=Y0lM3nO6qR2sU5vX8wZ1aD4eF7gH0iJ3kL6mN9pQ
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=5242880

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=hr-system@company.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=noreply@company.com

# Environment
NODE_ENV=production
```

### For Separate Domains Deployment

If deploying with separate domains (e.g., `app.company.com` and `api.company.com`):

```env
# Database Configuration
MYSQL_ROOT_PASSWORD=K8mN9pQ2rS5tV8wX1zA4bC7dE0fG3hI6j
MYSQL_DATABASE=hr_system
MYSQL_USER=hruser
MYSQL_PASSWORD=L2mN5pQ8rS1tV4wX7zA0bC3dE6fG9hI2j
MYSQL_PORT=3306

# Application URLs (Separate Domains)
FRONTEND_URL=https://app.company.com
API_BASE_URL=https://api.company.com

# Ports
WEB_PORT=80
API_PORT=4000

# JWT Secrets (Generate your own!)
JWT_SECRET=X9kL2mN5pQ8rS1tV4wX7zA0bC3dE6fG9hI2jK5mN8pQ
JWT_REFRESH_SECRET=Y0lM3nO6qR2sU5vX8wZ1aD4eF7gH0iJ3kL6mN9pQ
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=5242880

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=hr-system@company.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=noreply@company.com

# Environment
NODE_ENV=production
```

## Variable Descriptions

### Database Configuration

| Variable              | Description            | Example                             | Required           |
| --------------------- | ---------------------- | ----------------------------------- | ------------------ |
| `MYSQL_ROOT_PASSWORD` | MySQL root password    | `K8mN9pQ2rS5tV8wX1zA4bC7dE0fG3hI6j` | ✅ Yes             |
| `MYSQL_DATABASE`      | Database name          | `hr_system`                         | ✅ Yes             |
| `MYSQL_USER`          | MySQL application user | `hruser`                            | ✅ Yes             |
| `MYSQL_PASSWORD`      | MySQL user password    | `L2mN5pQ8rS1tV4wX7zA0bC3dE6fG9hI2j` | ✅ Yes             |
| `MYSQL_PORT`          | MySQL port             | `3306`                              | ⚠️ Only if changed |

**Generate passwords:**

```bash
openssl rand -base64 32
```

### Application URLs

| Variable       | Description              | Example Same Domain      | Example Separate Domains  |
| -------------- | ------------------------ | ------------------------ | ------------------------- |
| `FRONTEND_URL` | Frontend application URL | `https://hr.company.com` | `https://app.company.com` |
| `API_BASE_URL` | API base URL             | `https://hr.company.com` | `https://api.company.com` |

**Important:**

- Always use `https://` (the deployment script sets up SSL)
- For same domain, both URLs should be identical
- For separate domains, use different subdomains

### Ports

| Variable   | Description        | Default | Change Only If      |
| ---------- | ------------------ | ------- | ------------------- |
| `WEB_PORT` | Web container port | `80`    | Port 80 is in use   |
| `API_PORT` | API container port | `4000`  | Port 4000 is in use |

**Note:** These are internal ports. Nginx proxies to these ports.

### JWT Secrets

| Variable                 | Description               | Example                                       | Required |
| ------------------------ | ------------------------- | --------------------------------------------- | -------- |
| `JWT_SECRET`             | Secret for access tokens  | `X9kL2mN5pQ8rS1tV4wX7zA0bC3dE6fG9hI2jK5mN8pQ` | ✅ Yes   |
| `JWT_REFRESH_SECRET`     | Secret for refresh tokens | `Y0lM3nO6qR2sU5vX8wZ1aD4eF7gH0iJ3kL6mN9pQ`    | ✅ Yes   |
| `JWT_EXPIRES_IN`         | Access token expiration   | `15m`                                         | ✅ Yes   |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration  | `7d`                                          | ✅ Yes   |

**Generate secrets:**

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate refresh secret
openssl rand -base64 32
```

**Security Requirements:**

- Minimum 32 characters
- Must be unique and random
- Never reuse secrets between environments
- Keep secrets secure - never commit to Git

### File Upload

| Variable        | Description            | Default         | Recommended           |
| --------------- | ---------------------- | --------------- | --------------------- |
| `MAX_FILE_SIZE` | Max file size in bytes | `5242880` (5MB) | Adjust based on needs |

**Common sizes:**

- 5MB: `5242880`
- 10MB: `10485760`
- 25MB: `26214400`
- 50MB: `52428800`

### Email Configuration (Optional)

| Variable    | Description        | Example                 | Required |
| ----------- | ------------------ | ----------------------- | -------- |
| `SMTP_HOST` | SMTP server        | `smtp.gmail.com`        | ❌ No    |
| `SMTP_PORT` | SMTP port          | `587`                   | ❌ No    |
| `SMTP_USER` | SMTP username      | `hr-system@company.com` | ❌ No    |
| `SMTP_PASS` | SMTP password      | `your-app-password`     | ❌ No    |
| `SMTP_FROM` | From email address | `noreply@company.com`   | ❌ No    |

**Gmail Setup:**

1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the app password as `SMTP_PASS`

**Other SMTP Providers:**

- **SendGrid:** `smtp.sendgrid.net` (port 587)
- **Mailgun:** `smtp.mailgun.org` (port 587)
- **AWS SES:** `email-smtp.us-east-1.amazonaws.com` (port 587)

### Environment

| Variable   | Description      | Value        | Required |
| ---------- | ---------------- | ------------ | -------- |
| `NODE_ENV` | Node environment | `production` | ✅ Yes   |

**Always set to `production` for production deployments.**

## Step-by-Step Setup

### 1. Generate All Secrets

```bash
echo "# Database Passwords:"
openssl rand -base64 32  # For MYSQL_ROOT_PASSWORD
openssl rand -base64 32  # For MYSQL_PASSWORD

echo "# JWT Secrets:"
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET
```

### 2. Fill in Your Values

```bash
# Create .env.production
nano .env.production

# Or use your preferred editor
vim .env.production
```

### 3. Verify Configuration

```bash
# Check for placeholder values
grep -i "CHANGE_ME" .env.production

# Should return nothing if all values are set
```

### 4. Test Before Deployment

The deployment script will validate:

- No `CHANGE_ME` placeholders remain
- Required variables are set
- File exists

## Security Checklist

Before deploying, ensure:

- ✅ All `CHANGE_ME` values are replaced
- ✅ Database passwords are strong (32+ characters)
- ✅ JWT secrets are unique and random
- ✅ `.env.production` is NOT committed to Git
- ✅ File permissions are secure: `chmod 600 .env.production`
- ✅ Backups of `.env.production` are stored securely

## Common Mistakes to Avoid

1. **Using weak passwords** - Always use generated random strings
2. **Reusing secrets** - Generate new secrets for each environment
3. **Committing .env.production** - Add to `.gitignore`
4. **Using HTTP instead of HTTPS** - Always use `https://` in URLs
5. **Mismatched domains** - Ensure FRONTEND_URL and API_BASE_URL match your DNS

## Troubleshooting

### Issue: "CHANGE_ME values found"

**Solution:**

```bash
# Search for remaining placeholders
grep -i "CHANGE_ME" .env.production

# Replace all instances
sed -i 's/CHANGE_ME/your-actual-value/g' .env.production
```

### Issue: "JWT secret too short"

**Solution:**

```bash
# Generate a longer secret
openssl rand -base64 48  # 48 characters base64
```

### Issue: "Invalid URL format"

**Solution:**

- Ensure URLs start with `https://`
- No trailing slashes
- Valid domain format: `https://example.com`

## Example Complete File

See `.env.production.example` for a fully commented example file.

## Need Help?

1. Check the deployment script logs
2. Review this guide
3. Verify all required variables are set
4. Test configuration with the deployment script validation
