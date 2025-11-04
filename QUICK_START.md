# Quick Start

Get the HR Management System running in 5 minutes!

## One-Command Setup (Easiest!)

```bash
# Just run this script:
./run.sh
```

This automates everything! See [INSTALL_INSTRUCTIONS.md](./INSTALL_INSTRUCTIONS.md) for details.

## Docker (Manual)

```bash
# 1. Copy environment files
cp apps/api/.env.example apps/api/.env

# 2. Start services
docker-compose up -d

# 3. Wait 30 seconds for MySQL, then setup database
docker-compose exec api npx prisma generate
docker-compose exec api npx prisma migrate deploy
docker-compose exec api npm run seed

# 4. Done! Access at:
# Frontend: http://localhost:5174
# API: http://localhost:4000
# Adminer: http://localhost:8080
```

**Login**: admin@hrsystem.com / Admin@123

**View logs**: `docker-compose logs -f`

## Manual Setup

```bash
# Backend
cd apps/api
npm install
cp .env.example .env
npm run prisma:generate
npx prisma migrate dev
npm run seed
npm run dev  # Runs on port 4000

# Frontend (new terminal)
cd apps/web
npm install
npm run dev  # Runs on port 5174
```

That's it! See [README.md](./README.md) for more details.

