#!/bin/bash
set -e

echo "🚀 HR Management System - Quick Setup"
echo "======================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"

# Copy .env files if they don't exist
if [ ! -f apps/api/.env ]; then
    echo "📝 Creating apps/api/.env..."
    cp apps/api/.env.example apps/api/.env
fi

if [ ! -f apps/web/.env ]; then
    echo "📝 Creating apps/web/.env..."
    cp apps/web/.env.example apps/web/.env
fi

# Start Docker Compose
echo ""
echo "🐳 Starting Docker containers..."
docker compose up -d

# Wait for MySQL to be ready
echo ""
echo "⏳ Waiting for MySQL to be ready..."
sleep 10

# Check if MySQL is ready
for i in {1..30}; do
    if docker compose exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
        echo "✅ MySQL is ready"
        break
    fi
    sleep 2
done

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
docker compose exec -T api npx prisma migrate deploy 2>/dev/null || docker compose exec -T api npx prisma migrate dev --name init

# Seed database
echo ""
echo "🌱 Seeding database..."
docker compose exec -T api npm run seed

echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo ""
echo "🎉 Your HR Management System is ready!"
echo ""
echo "📍 Access points:"
echo "   Frontend: http://localhost:5175"
echo "   Backend:  http://localhost:4001"
echo "   Adminer:  http://localhost:8081"
echo ""
echo "🔑 Login credentials:"
echo "   Email:    admin@hrsystem.com"
echo "   Password: Admin@123"
echo ""
echo "📊 View logs: docker compose logs -f"
echo "🛑 Stop:     docker compose down"
echo "======================================"
