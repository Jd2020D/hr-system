# HR Management System

A production-ready HR module built with **MERN stack (React + Node/Express)** and **MySQL** database.

## 🚀 Features

- 👥 **Employee Management**: Profiles, roles, departments, job titles
- ⏰ **Attendance Tracking**: Clock-In/Clock-Out with breaks, late/early detection
- 🏖️ **Leave Management**: Request approval workflow, balance tracking, holidays
- 💰 **Payroll**: Salary management, payroll runs (draft → approve → paid)
- 📊 **Reports & Dashboards**: Hours worked, late arrivals, absences, leave balances
- 🔐 **Security**: JWT auth, RBAC (Admin, HR, Manager, Employee), audit logs
- 📱 **Responsive UI**: Clean, modern interface built with React + TailwindCSS

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (LTS)
- **Framework**: Express.js with TypeScript
- **Database**: MySQL 8.x
- **ORM**: Prisma
- **Validation**: Zod
- **Documentation**: OpenAPI/Swagger
- **Testing**: Jest

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Forms**: React Hook Form + Zod
- **State**: TanStack Query + Zustand
- **Charts**: Recharts
- **Calendar**: FullCalendar
- **Testing**: Vitest + React Testing Library

### DevOps
- **Containers**: Docker & Docker Compose
- **DB Admin**: Adminer (port 8080)
- **CI**: GitHub Actions

## 📋 Prerequisites

- **Node.js** >= 18.x
- **Docker** & **Docker Compose**
- **npm** >= 9.x

## 🏃 Quick Start (Docker)

The fastest way to get started:

```bash
# Clone or navigate to the project
cd /path/to/hr-system

# Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Start all services
docker-compose up -d

# Run migrations and seed data
npm run db:migrate
npm run db:seed
```

**Access:**
- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:4000
- **API Docs**: http://localhost:4000/api-docs
- **Adminer (DB)**: http://localhost:8080

**Default Login:**
- Email: `admin@hrsystem.com`
- Password: `Admin@123`

## 📦 Manual Setup (Non-Docker)

### 1. Database Setup

```bash
# Install MySQL 8.x or use Docker for MySQL only
docker run -d \
  --name hr-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=hr_system \
  -p 3306:3306 \
  mysql:8.0
```

### 2. Backend Setup

```bash
# Navigate to API
cd apps/api

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DB credentials

# Generate Prisma client
npm run prisma:generate

# Run migrations
npx prisma migrate dev

# Seed database
npm run seed

# Start dev server
npm run dev
```

### 3. Frontend Setup

```bash
# Navigate to web
cd apps/web

# Install dependencies
npm install

# Configure environment (if needed)
cp .env.example .env

# Start dev server
npm run dev
```

### 4. Run Both

From root:

```bash
npm run dev
```

## 🔑 Environment Variables

### Backend (apps/api/.env)

```env
# Server
NODE_ENV=development
PORT=4000
API_BASE_URL=http://localhost:4000

# Database
DATABASE_URL="mysql://root:rootpass@localhost:3306/hr_system"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5174

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Email (for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend (apps/web/.env)

```env
VITE_API_URL=http://localhost:4000
VITE_APP_NAME=HR Management System
```

## 📁 Project Structure

```
hr-system-monorepo/
├── apps/
│   ├── api/                    # Backend API
│   │   ├── src/
│   │   │   ├── config/         # Configuration
│   │   │   ├── controllers/    # Route controllers
│   │   │   ├── middleware/     # Auth, RBAC, validation
│   │   │   ├── models/         # Prisma models
│   │   │   ├── routes/         # API routes
│   │   │   ├── services/       # Business logic
│   │   │   ├── types/          # TypeScript types
│   │   │   ├── utils/          # Helpers
│   │   │   └── app.ts          # Express app
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   └── seed.ts         # Seed data
│   │   ├── tests/
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                    # Frontend React app
│       ├── public/
│       ├── src/
│       │   ├── components/     # Reusable components
│       │   ├── features/       # Feature modules
│       │   ├── hooks/          # Custom hooks
│       │   ├── lib/            # Utilities
│       │   ├── pages/          # Page components
│       │   ├── routes/         # Route config
│       │   ├── store/          # State management
│       │   ├── types/          # TypeScript types
│       │   └── App.tsx
│       ├── tests/
│       ├── .env.example
│       ├── package.json
│       ├── tailwind.config.js
│       └── vite.config.ts
│
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml              # CI pipeline
├── SYSTEM_ARCHITECTURE.md      # ERD & diagrams
├── API_REFERENCE.md            # API docs
├── REPORTS_SPEC.md             # Reporting specs
├── package.json
└── README.md
```

## 🧪 Running Tests

```bash
# All tests
npm test

# Backend only
npm run test:api

# Frontend only
npm run test:web

# With coverage
npm run test:api -- --coverage
```

## 📝 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both API and web in development |
| `npm run build` | Build both for production |
| `npm run test` | Run all tests |
| `npm run lint` | Lint all code |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed database |
| `npm run db:generate` | Generate Prisma client |

## 🔐 Authentication & Roles

### Roles
- **ADMIN**: Full system access
- **HR**: Employee, attendance, leave, payroll management
- **MANAGER**: Team attendance, leave approvals
- **EMPLOYEE**: Personal attendance, leave requests

### JWT Flow
1. Login → Access token (15min) + Refresh token (7 days)
2. Access token in `Authorization` header
3. Refresh token in HTTP-only cookie
4. Auto-refresh before expiry

## 📊 API Documentation

Interactive Swagger docs available at `/api-docs` when API is running.

See `API_REFERENCE.md` for detailed endpoint documentation with examples.

## 📈 Reports

Available reports:
- **Hours Worked**: By employee and date range
- **Late Arrivals**: Summary with counts
- **Early Leaves**: Summary with counts
- **Absence Days**: Unplanned absences
- **Leave Balances**: Current balances by type
- **Attendance Rate**: Present/working days ratio

Export formats: CSV, PDF

See `REPORTS_SPEC.md` for detailed specifications.

## 🔍 Code Quality

- **ESLint** for linting
- **Prettier** for formatting
- **Husky** for pre-commit hooks
- **Jest** for unit/integration tests
- **TypeScript** for type safety

## 🐳 Docker Services

```yaml
Services:
- api:       Backend API (port 4000)
- web:       Frontend React app (port 5174)
- mysql:     MySQL 8.0 database (port 3306)
- adminer:   Database admin UI (port 8080)
```

## 📚 Additional Documentation

- **[SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)**: ERD, sequence diagrams
- **[API_REFERENCE.md](API_REFERENCE.md)**: Complete API documentation
- **[REPORTS_SPEC.md](REPORTS_SPEC.md)**: Reporting logic and queries

## 🚢 Deployment

See deployment guides in the docs directory for:
- VPS/Cloud deployment
- Docker production setup
- Environment configuration
- SSL/TLS setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push and create a PR

## 📄 License

MIT License - see LICENSE file

## 👥 Authors

HR Management System Team

---

**Need help?** Open an issue or check the documentation.

