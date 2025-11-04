# 🚀 START HERE - Get Running in 5 Minutes!

Welcome to the HR Management System! Follow these simple steps:

## ✅ Prerequisites

Make sure you have:
- **Docker Desktop** installed and running
  - Download: https://www.docker.com/products/docker-desktop
  - Start Docker Desktop before proceeding

## 🎯 Quickest Way to Run

### Option 1: One Command Setup (Recommended)

```bash
./run.sh
```

That's it! The script will:
- ✅ Check Docker is running
- ✅ Copy environment files
- ✅ Start all containers
- ✅ Setup database
- ✅ Load sample data

When it finishes, open **http://localhost:5174** in your browser!

**Login**: admin@hrsystem.com / Admin@123

---

### Option 2: Manual Steps

If the script doesn't work, follow these steps:

```bash
# 1. Copy environment files
cp apps/api/.env.example apps/api/.env

# 2. Start Docker containers
docker-compose up -d

# 3. Wait 30-60 seconds for MySQL to initialize

# 4. Setup database
docker-compose exec api npx prisma generate
docker-compose exec api npx prisma migrate deploy
docker-compose exec api npm run seed

# 5. Open http://localhost:5174 in your browser
```

---

## 📍 Access Points

Once running, you can access:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5174 | Main HR application |
| **Backend API** | http://localhost:4000 | REST API |
| **Adminer** | http://localhost:8080 | Database admin |
| **Prisma Studio** | http://localhost:5555 | Database GUI |

---

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hrsystem.com | Admin@123 |
| HR | hr@hrsystem.com | Admin@123 |
| Manager | ahmed.mansoori@hrsystem.com | Admin@123 |
| Employee | (any employee email) | Admin@123 |

---

## 📊 Useful Commands

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api      # Backend
docker-compose logs -f web      # Frontend
docker-compose logs -f mysql    # Database

# Check status
docker-compose ps

# Stop everything
docker-compose down

# Stop and remove all data
docker-compose down -v

# Restart everything
docker-compose restart
```

---

## ❌ Troubleshooting

### "Docker is not running"
- Open Docker Desktop
- Wait for it to fully start
- Try again

### "Cannot connect to MySQL"
- MySQL takes 30-60 seconds to initialize
- Wait longer or check: `docker-compose logs mysql`

### "Port already in use"
- Stop other services using ports 4000, 5174, 3306, or 8080
- Or change ports in docker-compose.yml

### Still stuck?
- See [INSTALL_INSTRUCTIONS.md](./INSTALL_INSTRUCTIONS.md) for detailed troubleshooting
- Check [QUICK_START.md](./QUICK_START.md) for alternatives
- Review [README.md](./README.md) for full documentation

---

## 📚 Next Steps

Once running, explore:
- 👥 **Employees**: Manage employee profiles
- ⏰ **Attendance**: Clock in/out and track time
- 🏖️ **Leaves**: Request and approve time off
- 💰 **Payroll**: Generate and manage payroll
- 📊 **Reports**: View analytics and exports

---

## 🎉 You're Ready!

Open http://localhost:5174 and start exploring the HR Management System!

For more information:
- [README.md](./README.md) - Full documentation
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup guide
- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) - Technical details
- [API_REFERENCE.md](./API_REFERENCE.md) - API documentation

---

**Need Help?** Check the logs: `docker-compose logs -f`
