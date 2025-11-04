# Installation Instructions

## Option 1: Automated Setup (Recommended)

Run the automated setup script:

```bash
./run.sh
```

This will:
1. Check Docker is running
2. Copy .env files
3. Start all containers
4. Set up the database
5. Seed sample data

## Option 2: Manual Setup

### Step 1: Copy Environment Files

```bash
# Backend
cp apps/api/.env.example apps/api/.env

# Frontend
cp apps/web/.env.example apps/web/.env
```

### Step 2: Start Docker Containers

```bash
docker-compose up -d
```

### Step 3: Wait for MySQL (30-60 seconds)

Check MySQL is ready:
```bash
docker-compose logs mysql
```

Wait until you see: `MySQL init process done. Ready for start up.`

### Step 4: Setup Database

```bash
# Generate Prisma client
docker-compose exec api npx prisma generate

# Run migrations
docker-compose exec api npx prisma migrate deploy

# Seed database
docker-compose exec api npm run seed
```

### Step 5: Verify Everything is Running

```bash
# Check all services
docker-compose ps

# Should show 4 services running:
# hr-api, hr-web, hr-mysql, hr-adminer
```

### Step 6: Access the Application

Open your browser:
- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:4000
- **Database Admin**: http://localhost:8080 (Server: mysql, User: root, Pass: rootpass)

**Login**: admin@hrsystem.com / Admin@123

## Troubleshooting

### Problem: Docker containers won't start

**Solution**:
```bash
# Check Docker is running
docker info

# If not, start Docker Desktop
```

### Problem: "Cannot connect to MySQL"

**Solution**:
```bash
# Wait longer for MySQL to initialize
docker-compose logs mysql -f

# Or restart MySQL
docker-compose restart mysql
```

### Problem: "Prisma schema not found"

**Solution**:
```bash
# Generate Prisma client first
docker-compose exec api npx prisma generate
```

### Problem: Port already in use

**Solution**:
```bash
# Find what's using the port
lsof -i :4000  # or :5174, :3306, :8080

# Kill the process or change ports in docker-compose.yml
```

### Problem: Environment variables not working

**Solution**:
```bash
# Check .env files exist
ls -la apps/api/.env apps/web/.env

# If missing, copy from examples
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### Problem: Database connection failed

**Solution**:
```bash
# Check MySQL logs
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql

# Re-run migrations
docker-compose exec api npx prisma migrate deploy
```

## Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f mysql
```

## Stopping the Application

```bash
# Stop containers (keeps data)
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove everything including data
docker-compose down -v
```

## Rebuilding

If you make code changes:

```bash
# Rebuild and restart
docker-compose up -d --build

# Or specific service
docker-compose up -d --build api
docker-compose up -d --build web
```

## Database Management

### Access Prisma Studio

```bash
docker-compose exec api npx prisma studio
```
Open: http://localhost:5555

### Access Adminer

Open: http://localhost:8080
- System: MySQL
- Server: mysql
- Username: root
- Password: rootpass
- Database: hr_system

### Reset Database

```bash
# WARNING: This deletes all data
docker-compose exec api npx prisma migrate reset
```

## Development Mode

To make code changes and see them live:

```bash
# The containers are already running in dev mode
# Changes to source files will auto-reload

# View API logs
docker-compose logs -f api

# View Web logs
docker-compose logs -f web
```

## Production Deployment

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for production deployment instructions.

## Need Help?

1. Check all logs: `docker-compose logs -f`
2. Verify Docker is running: `docker info`
3. Check ports are available
4. Review [QUICK_START.md](./QUICK_START.md)
5. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md)

