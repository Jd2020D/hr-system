#!/bin/bash
set -e

echo "🚀 HR System - Production Deployment"
echo "===================================="
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "📝 Please copy .env.production.example to .env.production and configure it."
    exit 1
fi

# Load production environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo "✅ Environment file loaded"

# Check Docker
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker."
    exit 1
fi

echo "✅ Docker is running"

# Build production images
echo ""
echo "🔨 Building production images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Stop existing containers
echo ""
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Start production containers
echo ""
echo "🚀 Starting production containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for MySQL to be ready
echo ""
echo "⏳ Waiting for MySQL to be ready..."
sleep 15

# Check MySQL health
for i in {1..30}; do
    if docker-compose -f docker-compose.prod.yml exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
        echo "✅ MySQL is ready"
        break
    fi
    sleep 2
done

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy || docker-compose -f docker-compose.prod.yml exec -T api npx prisma db push

# Seed database (only if empty)
echo ""
echo "🌱 Checking if database needs seeding..."
if docker-compose -f docker-compose.prod.yml exec -T api npx prisma db seed 2>/dev/null; then
    echo "✅ Database seeded"
else
    echo "ℹ️  Database already has data, skipping seed"
fi

echo ""
echo "===================================="
echo "✅ Deployment Complete!"
echo ""
echo "📍 Services:"
echo "   Frontend: http://localhost:${WEB_PORT:-80}"
echo "   Backend:  http://localhost:${API_PORT:-4000}"
echo ""
echo "📊 View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "🛑 Stop:     docker-compose -f docker-compose.prod.yml down"
echo "===================================="
