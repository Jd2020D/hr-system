# Projects Module - Quick Start Guide

## ✅ Module Status: **FULLY FUNCTIONAL**

The Projects module is complete and ready to use!

## 🚀 Quick Access

1. **Login** to the HR System
2. Navigate to **Projects** from the sidebar (📁 icon)
3. You'll see the Projects list page

## 📋 Sample Data

The seed script includes 4 sample projects:

1. **PROJ001** - Company Website Redesign (RUNNING)
   - Has resources, expenses, invoices, and payments
   
2. **PROJ002** - Mobile Banking App (PLANNING)

3. **PROJ003** - E-Commerce Platform (LEAD)

4. **PROJ004** - Internal HR System (COMPLETED)
   - Has expenses, invoices, and payments

**To load sample data:**
```bash
# If you need fresh data, clear the database first, then:
docker-compose exec api npm run seed
```

**Or create projects manually via the UI!**

## 🎯 Quick Actions

### Create a New Project
1. Click **"+ Add Project"** button
2. Fill in:
   - Project Name & Code (required)
   - Status (LEAD, PLANNING, RUNNING, etc.)
   - Budget & Currency
   - Start/End Dates
   - Client Information
   - Project Manager
3. Click **"Create"**

### View Project Details
1. Click **"View"** on any project
2. You'll see:
   - **Overview Tab**: Project summary, budget, expenses, invoices, payments
   - **Resources Tab**: Assigned employees
   - **Expenses Tab**: Project expenses
   - **Invoices Tab**: Client invoices
   - **Payments Tab**: Payment records

### Add Resources (Employees)
1. Open a project (click "View")
2. Go to **Resources** tab
3. Click **"+ Add Resource"**
4. Select employee, set role, allocation %, hourly rate
5. Click **"Add"**

### Track Expenses
1. Open a project
2. Go to **Expenses** tab
3. Click **"+ Add Expense"**
4. Fill in category, description, amount, vendor
5. Optional: Add receipt URL
6. Click **"Add"**

### Create Invoices
1. Open a project
2. Go to **Invoices** tab
3. Click **"+ Add Invoice"**
4. Enter invoice number, amount, dates, status
5. Click **"Create"**

### Record Payments
1. Open a project
2. Go to **Payments** tab
3. Click **"+ Add Payment"**
4. Select invoice (optional), enter amount, payment method
5. Add reference number
6. Click **"Record"**

## 📊 Project Statuses

- **LEAD**: Initial inquiry/potential project
- **PLANNING**: Project being planned
- **RUNNING**: Active project
- **ON_HOLD**: Temporarily paused
- **COMPLETED**: Successfully finished
- **CANCELLED**: Project cancelled

## 💰 Currency Support

All financial fields support:
- **USD** (US Dollar)
- **JD** (Jordanian Dinar)
- **AED** (UAE Dirham) - Default

## 🔐 Permissions

- **View**: All authenticated users
- **Create/Edit**: Admin, HR, Manager
- **Delete**: Admin, HR only

## 📈 Financial Summary

Each project shows a real-time summary:
- **Budget**: Total project budget
- **Expenses**: Total expenses tracked
- **Invoices**: Total invoices issued
- **Payments**: Total payments received
- **Outstanding**: Invoices - Payments

## 🎨 Features

- ✅ Filter projects by status
- ✅ Search projects by name, code, or client
- ✅ Pagination for large lists
- ✅ Color-coded status badges
- ✅ Full CRUD for all entities
- ✅ Real-time financial calculations
- ✅ Employee resource allocation
- ✅ Invoice and payment tracking

## 🐛 Troubleshooting

**Projects page not loading?**
- Check if API is running: `docker-compose ps`
- Check API logs: `docker-compose logs api`

**Can't see Projects menu?**
- Make sure you're logged in as Admin, HR, or Manager
- Check browser console for errors

**No sample data?**
- Create projects manually via the UI
- Or run the seed script on a fresh database

---

**Ready to start? Navigate to the Projects page and create your first project!** 🚀
