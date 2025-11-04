#!/bin/bash
set -e

echo "🚀 HR System - Direct Deployment (No Docker)"
echo "=============================================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root or with sudo"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18.x first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18.x or higher. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check MySQL
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL is not installed. Please install MySQL first."
    echo "   Run: apt install mysql-server (or yum install mysql-server)"
    exit 1
fi

echo "✅ MySQL detected"

# Check PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

echo "✅ PM2 detected"

# Set project directory
PROJECT_DIR="/var/www/hr-system"
API_DIR="$PROJECT_DIR/apps/api"
WEB_DIR="$PROJECT_DIR/apps/web"

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Project directory not found: $PROJECT_DIR"
    echo "   Please upload project files first."
    exit 1
fi

echo "✅ Project directory found"

# Backend Setup
echo ""
echo "🔧 Setting up Backend API..."
cd $API_DIR

# Check if .env exists
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "📝 Creating .env from .env.example..."
        cp .env.example .env
        echo "⚠️  Please edit $API_DIR/.env with your production values!"
        echo "   Then run this script again."
        exit 1
    else
        echo "❌ .env file not found and no .env.example available"
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install --production

# Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy || npx prisma db push

# Build
echo "🔨 Building TypeScript..."
npm run build

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Restart PM2 process
echo "🚀 Starting/Restarting API with PM2..."
pm2 delete hr-api 2>/dev/null || true
pm2 start dist/server.js --name hr-api
pm2 save

echo "✅ Backend API setup complete"

# Frontend Setup
echo ""
echo "🎨 Setting up Frontend..."
cd $WEB_DIR

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "📝 Creating .env.production..."
    cat > .env.production << EOF
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=HR Management System
EOF
    echo "⚠️  Please edit $WEB_DIR/.env.production with your API URL!"
fi

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build
echo "🔨 Building frontend..."
npm run build

echo "✅ Frontend setup complete"

# Check Nginx
if command -v nginx &> /dev/null; then
    echo ""
    echo "🌐 Nginx detected"
    echo "   Please configure Nginx as described in DIRECT_DEPLOYMENT.md"
    echo "   Configuration file: /etc/nginx/sites-available/hr-system"
else
    echo ""
    echo "⚠️  Nginx not found. Please install and configure Nginx:"
    echo "   apt install nginx (or yum install nginx)"
fi

echo ""
echo "=============================================="
echo "✅ Direct Deployment Complete!"
echo ""
echo "📍 Next Steps:"
echo "   1. Configure Nginx (see DIRECT_DEPLOYMENT.md)"
echo "   2. Setup SSL certificate (certbot --nginx)"
echo "   3. Configure firewall (ufw allow 80,443,22)"
echo "   4. Test your application"
echo ""
echo "📊 Useful Commands:"
echo "   PM2 Status:   pm2 status"
echo "   PM2 Logs:     pm2 logs hr-api"
echo "   Restart API:  pm2 restart hr-api"
echo "   Nginx Test:   nginx -t"
echo "   Nginx Reload: systemctl reload nginx"
echo "=============================================="
