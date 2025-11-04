# Setup Guide

This guide will help you set up and run the HR Management System locally.

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher
- **Docker**: Latest version (for containerized setup)
- **Docker Compose**: Latest version
- **MySQL**: 8.0+ (if not using Docker)

## Quick Start (Docker)

The fastest way to get started is using Docker Compose:

```bash
# 1. Clone the repository
cd /path/to/hr-system

# 2. Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Start all services
docker-compose up -d

# 4. Wait for MySQL to be ready (30-60 seconds)
docker-compose logs -f mysql

# 5. Run database migrations
docker-compose exec api npx prisma migrate deploy

# 6. Seed the database
docker-compose exec api npm run seed

# 7. Verify everything is running
docker-compose ps
```

**Access the application:**
- Frontend: http://localhost:5174
- Backend API: http://localhost:4000
- Adminer (DB Admin): http://localhost:8080

**Login credentials:**
- **Admin**: admin@hrsystem.com / Admin@123
- **HR**: hr@hrsystem.com / Admin@123
- **Manager**: ahmed.mansoori@hrsystem.com / Admin@123

---

## Manual Setup (Non-Docker)

### Backend Setup

```bash
# 1. Navigate to API directory
cd apps/api

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings

# 4. Generate Prisma client
npm run prisma:generate

# 5. Run database migrations
npx prisma migrate dev

# 6. Seed the database
npm run seed

# 7. Start the development server
npm run dev
```

The API will be available at http://localhost:4000

### Frontend Setup

```bash
# 1. Navigate to web directory
cd apps/web

# 2. Install dependencies
npm install

# 3. Configure environment (if needed)
cp .env.example .env
# Edit .env if needed

# 4. Start the development server
npm run dev
```

The frontend will be available at http://localhost:5174

### MySQL Database Setup

If not using Docker:

```bash
# Install MySQL
# On macOS:
brew install mysql

# Start MySQL
brew services start mysql

# Create database
mysql -u root -p
```

```sql
CREATE DATABASE hr_system;
CREATE USER 'hruser'@'localhost' IDENTIFIED BY 'hrpass';
GRANT ALL PRIVILEGES ON hr_system.* TO 'hruser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Update `apps/api/.env`:
```env
DATABASE_URL="mysql://hruser:hrpass@localhost:3306/hr_system"
```

---

## Development Commands

### Root Level

```bash
npm run dev          # Start both API and web
npm run build        # Build both for production
npm run test         # Run all tests
npm run lint         # Lint all code
npm run db:migrate   # Run Prisma migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
```

### Backend (apps/api)

```bash
npm run dev          # Start development server with auto-reload
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests
npm run lint         # Lint code
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
npm run seed             # Seed database
```

### Frontend (apps/web)

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run lint         # Lint code
```

---

## Database Management

### Accessing the Database

**Via Prisma Studio:**
```bash
cd apps/api
npm run prisma:studio
```
Opens at http://localhost:5555

**Via Adminer (Docker):**
http://localhost:8080
- Server: mysql
- Username: root
- Password: rootpass
- Database: hr_system

**Via MySQL CLI:**
```bash
docker-compose exec mysql mysql -uroot -prootpass hr_system
```

### Running Migrations

```bash
# Development mode (creates migration file)
cd apps/api
npx prisma migrate dev

# Production mode (applies existing migrations)
npx prisma migrate deploy

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

### Seeding Data

```bash
cd apps/api
npm run seed
```

**Seed Data Includes:**
- 1 Admin user
- 1 HR user
- 2 Manager users
- 10 Employee users
- 2 Departments (IT, HR)
- Default shift (9:00-17:00)
- Leave types (Annual, Sick, Unpaid)
- Leave balances for all employees
- Sample salaries
- Sample attendance logs (30 days)
- UAE holidays for 2024

---

## Troubleshooting

### Issue: "Cannot connect to database"

**Solution:**
```bash
# Check if MySQL is running
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# If MySQL fails, restart it
docker-compose restart mysql
```

### Issue: "Prisma client not generated"

**Solution:**
```bash
cd apps/api
npx prisma generate
```

### Issue: "Port already in use"

**Solution:**
```bash
# Find the process using the port
lsof -i :4000  # for backend
lsof -i :5174  # for frontend

# Kill the process
kill -9 <PID>
```

### Issue: "Module not found" errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Do this for both apps/api and apps/web
```

### Issue: "JWT token errors"

**Solution:**
Ensure `.env` files have valid JWT secrets:
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars
```

---

## Production Deployment

### Building for Production

```bash
# Build backend
cd apps/api
npm run build

# Build frontend
cd apps/web
npm run build
```

### Docker Production Setup

Create a `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: hr_system
    volumes:
      - mysql_data:/var/lib/mysql

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile.prod
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    depends_on:
      - mysql

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile.prod
    depends_on:
      - api

volumes:
  mysql_data:
```

### Environment Variables

Create `.env.production`:

```env
# Database
DATABASE_URL=mysql://user:password@mysql:3306/hr_system

# JWT
JWT_SECRET=<generate-strong-secret>
JWT_REFRESH_SECRET=<generate-strong-secret>

# Frontend
VITE_API_URL=https://api.yourdomain.com
```

---

## Testing

### Run All Tests

```bash
# From root
npm test

# Or individually
cd apps/api && npm test
cd apps/web && npm test
```

### Run Tests with Coverage

```bash
cd apps/api
npm test -- --coverage
```

### Integration Tests

```bash
cd apps/api
npm test -- --grep "Integration"
```

---

## Code Quality

### Linting

```bash
# Check all code
npm run lint

# Fix auto-fixable issues
cd apps/api && npm run lint:fix
cd apps/web && npm run lint:fix
```

### Formatting

```bash
# Install Prettier globally
npm install -g prettier

# Format all code
prettier --write "**/*.{ts,tsx,js,jsx,json}"
```

---

## Additional Resources

- [System Architecture](./SYSTEM_ARCHITECTURE.md)
- [API Reference](./API_REFERENCE.md)
- [Reports Specification](./REPORTS_SPEC.md)
- [README](./README.md)

---

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the documentation files
3. Check Docker logs: `docker-compose logs -f`
4. Open an issue on the repository

---

## License

MIT License - See LICENSE file

