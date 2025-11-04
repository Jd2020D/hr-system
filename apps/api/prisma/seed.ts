import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create departments
  console.log('Creating departments...');
  const deptIT = await prisma.department.upsert({
    where: { code: 'IT' },
    update: {},
    create: {
      name: 'Information Technology',
      code: 'IT',
    },
  });

  const deptHR = await prisma.department.upsert({
    where: { code: 'HR' },
    update: {},
    create: {
      name: 'Human Resources',
      code: 'HR',
    },
  });

  console.log('Departments created:', { deptIT, deptHR });

  // Create employees
  console.log('Creating employees...');
  const employees = [];

  // IT Manager
  const itManager = await prisma.employee.create({
    data: {
      code: 'EMP001',
      firstName: 'Ahmed',
      lastName: 'Al-Mansoori',
      email: 'ahmed.mansoori@hrsystem.com',
      phone: '+971501234567',
      gender: 'Male',
      dob: new Date('1985-05-15'),
      hireDate: new Date('2020-01-15'),
      status: 'ACTIVE',
      departmentId: deptIT.id,
      jobTitle: 'IT Manager',
      address: 'Dubai, UAE',
      nationalId: '784-1985-1234567-1',
      emergencyContact: {
        name: 'Sara Al-Mansoori',
        phone: '+971501234568',
        relation: 'Wife',
      },
    },
  });

  // HR Manager
  const hrManager = await prisma.employee.create({
    data: {
      code: 'EMP002',
      firstName: 'Fatima',
      lastName: 'Al-Zahra',
      email: 'fatima.zahra@hrsystem.com',
      phone: '+971509876543',
      gender: 'Female',
      dob: new Date('1988-08-20'),
      hireDate: new Date('2019-03-01'),
      status: 'ACTIVE',
      departmentId: deptHR.id,
      jobTitle: 'HR Manager',
      address: 'Abu Dhabi, UAE',
      nationalId: '784-1988-9876543-2',
      emergencyContact: {
        name: 'Khalid Al-Zahra',
        phone: '+971509876544',
        relation: 'Brother',
      },
    },
  });

  employees.push(itManager, hrManager);

  // Create regular employees
  const employeeData = [
    { code: 'EMP003', firstName: 'Mohammed', lastName: 'Hassan', dept: deptIT, manager: itManager },
    { code: 'EMP004', firstName: 'Sarah', lastName: 'Ibrahim', dept: deptIT, manager: itManager },
    { code: 'EMP005', firstName: 'Omar', lastName: 'Ali', dept: deptIT, manager: itManager },
    { code: 'EMP006', firstName: 'Layla', lastName: 'Mahmoud', dept: deptIT, manager: itManager },
    { code: 'EMP007', firstName: 'Yusuf', lastName: 'Ahmed', dept: deptIT, manager: itManager },
    { code: 'EMP008', firstName: 'Aisha', lastName: 'Salem', dept: deptHR, manager: hrManager },
    { code: 'EMP009', firstName: 'Khalil', lastName: 'Nasser', dept: deptHR, manager: hrManager },
    { code: 'EMP010', firstName: 'Nour', lastName: 'Faisal', dept: deptHR, manager: hrManager },
    { code: 'EMP011', firstName: 'Zain', lastName: 'Youssef', dept: deptHR, manager: hrManager },
    { code: 'EMP012', firstName: 'Rania', lastName: 'Tarek', dept: deptHR, manager: hrManager },
  ];

  for (const emp of employeeData) {
    const employee = await prisma.employee.create({
      data: {
        code: emp.code,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}@hrsystem.com`,
        phone: `+9715${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        dob: new Date(1985 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        hireDate: new Date(2021 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        status: 'ACTIVE',
        departmentId: emp.dept.id,
        jobTitle: emp.dept.code === 'IT' ? 'Software Developer' : 'HR Specialist',
        managerEmployeeId: emp.manager.id,
        address: `${Math.random() > 0.5 ? 'Dubai' : 'Abu Dhabi'}, UAE`,
        nationalId: `784-${Math.floor(Math.random() * 10000000)}-${Math.floor(Math.random() * 10000000)}`,
        emergencyContact: {
          name: `${emp.firstName}'s Contact`,
          phone: `+9715${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
          relation: 'Family',
        },
      },
    });
    employees.push(employee);
  }

  console.log('Employees created:', employees.length);

  // Update departments with managers
  await prisma.department.update({
    where: { id: deptIT.id },
    data: { managerEmployeeId: itManager.id },
  });

  await prisma.department.update({
    where: { id: deptHR.id },
    data: { managerEmployeeId: hrManager.id },
  });

  // Create users
  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const users = [
    { email: 'admin@hrsystem.com', role: 'ADMIN' as const, employeeId: null },
    { email: 'hr@hrsystem.com', role: 'HR' as const, employeeId: hrManager.id },
    { email: 'ahmed.mansoori@hrsystem.com', role: 'MANAGER' as const, employeeId: itManager.id },
  ];

  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        passwordHash,
        role: userData.role,
        employeeId: userData.employeeId,
      },
    });
  }

  // Create employee users
  for (let i = 2; i < employees.length; i++) {
    await prisma.user.create({
      data: {
        email: employees[i].email,
        passwordHash,
        role: 'EMPLOYEE',
        employeeId: employees[i].id,
      },
    });
  }

  console.log('Users created');

  // Create shifts
  console.log('Creating shifts...');
  const defaultShift = await prisma.shift.create({
    data: {
      name: 'Standard Shift',
      startTime: '09:00',
      endTime: '17:00',
      graceMinutesIn: 15,
      graceMinutesOut: 15,
      isDefault: true,
    },
  });
  console.log('Shifts created:', defaultShift);

  // Create leave types
  console.log('Creating leave types...');
  const leaveTypes = await Promise.all([
    prisma.leaveType.create({
      data: {
        name: 'Annual Leave',
        code: 'ANNUAL',
        defaultDaysPerYear: 21,
        requiresAttachment: false,
      },
    }),
    prisma.leaveType.create({
      data: {
        name: 'Sick Leave',
        code: 'SICK',
        defaultDaysPerYear: 7,
        requiresAttachment: true,
      },
    }),
    prisma.leaveType.create({
      data: {
        name: 'Unpaid Leave',
        code: 'UNPAID',
        defaultDaysPerYear: 30,
        requiresAttachment: false,
      },
    }),
  ]);
  console.log('Leave types created:', leaveTypes.length);

  // Create leave balances
  console.log('Creating leave balances...');
  const currentYear = new Date().getFullYear();
  for (const employee of employees) {
    for (const leaveType of leaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          employeeId: employee.id,
          leaveTypeId: leaveType.id,
          year: currentYear,
          allocatedDays: leaveType.defaultDaysPerYear,
          carriedOverDays: 0,
          takenDays: 0,
          remainingDays: leaveType.defaultDaysPerYear,
        },
      });
    }
  }
  console.log('Leave balances created');

  // Create salaries
  console.log('Creating salaries...');
  const baseSalaries = [
    { role: 'Manager', min: 15000, max: 20000 },
    { role: 'Developer', min: 8000, max: 12000 },
    { role: 'HR Specialist', min: 7000, max: 10000 },
  ];

  for (const employee of employees) {
    let salaryRange = baseSalaries[0];
    if (employee.jobTitle.includes('Developer')) salaryRange = baseSalaries[1];
    else if (employee.jobTitle.includes('Specialist')) salaryRange = baseSalaries[2];

    const baseSalary = salaryRange.min + Math.random() * (salaryRange.max - salaryRange.min);
    const allowance = baseSalary * 0.1;
    const deduction = baseSalary * 0.02;

    await prisma.salary.create({
      data: {
        employeeId: employee.id,
        baseSalary,
        allowance,
        deduction,
        effectiveFrom: employee.hireDate,
      },
    });
  }
  console.log('Salaries created');

  // Create holidays
  console.log('Creating holidays...');
  const holidays2024 = [
    { date: new Date('2024-01-01'), name: 'New Year\'s Day' },
    { date: new Date('2024-06-17'), name: 'Eid al-Adha' },
    { date: new Date('2024-07-07'), name: 'Islamic New Year' },
    { date: new Date('2024-09-15'), name: 'Prophet Muhammad Birthday' },
    { date: new Date('2024-12-02'), name: 'UAE National Day' },
  ];

  for (const holiday of holidays2024) {
    await prisma.holiday.create({
      data: {
        date: holiday.date,
        name: holiday.name,
        countryCode: 'AE',
      },
    });
  }
  console.log('Holidays created');

  // Create sample attendance logs (last 30 days for a few employees)
  console.log('Creating attendance logs...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Skip weekends (Friday and Saturday in UAE)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) continue;

    for (let j = 0; j < Math.min(8, employees.length); j++) {
      const employee = employees[j];
      const clockIn = new Date(date);
      clockIn.setHours(9, Math.floor(Math.random() * 20), 0, 0);

      const clockOut = new Date(date);
      clockOut.setHours(17, Math.floor(Math.random() * 20), 0, 0);

      await prisma.attendanceLog.create({
        data: {
          employeeId: employee.id,
          date,
          clockIn,
          clockOut,
          breaksMinutes: 60,
          source: 'WEB',
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          deviceInfo: 'Chrome/Windows',
        },
      });
    }
  }
  console.log('Attendance logs created');

  // Create sample projects
  console.log('Creating sample projects...');
  const projects = [];

  // Project 1: Website Development
  const project1 = await prisma.project.upsert({
    where: { code: 'PROJ001' },
    update: {},
    create: {
      name: 'Company Website Redesign',
      code: 'PROJ001',
      description: 'Complete redesign of company website with modern UI/UX',
      status: 'RUNNING',
      budget: 50000,
      currency: 'USD',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-06-30'),
      clientName: 'Tech Corp Inc.',
      clientEmail: 'contact@techcorp.com',
      managerEmployeeId: itManager.id,
      notes: 'High priority project with aggressive timeline',
    },
  });
  projects.push(project1);

  // Add resources to project 1 (only if not exists)
  const existingResource1 = await prisma.projectResource.findFirst({
    where: {
      projectId: project1.id,
      employeeId: itManager.id,
    },
  });
  if (!existingResource1) {
    await prisma.projectResource.create({
      data: {
        projectId: project1.id,
        employeeId: itManager.id,
        role: 'Project Manager',
        allocation: 50,
        hourlyRate: 75,
        startDate: new Date('2024-01-15'),
        notes: 'Lead project manager',
      },
    });
  }

  // Add expenses to project 1 (only if not exists)
  const existingExpense1 = await prisma.projectExpense.findFirst({
    where: {
      projectId: project1.id,
      description: 'Adobe Creative Cloud License',
    },
  });
  if (!existingExpense1) {
    await prisma.projectExpense.create({
      data: {
        projectId: project1.id,
        category: 'Software',
        description: 'Adobe Creative Cloud License',
        amount: 600,
        currency: 'USD',
        expenseDate: new Date('2024-02-01'),
        vendor: 'Adobe Inc.',
        notes: 'Annual license',
      },
    });
  }

  const existingExpense2 = await prisma.projectExpense.findFirst({
    where: {
      projectId: project1.id,
      description: 'Development Server',
    },
  });
  if (!existingExpense2) {
    await prisma.projectExpense.create({
      data: {
        projectId: project1.id,
        category: 'Hardware',
        description: 'Development Server',
        amount: 2500,
        currency: 'USD',
        expenseDate: new Date('2024-01-20'),
        vendor: 'Cloud Hosting Co.',
        notes: 'Monthly server costs',
      },
    });
  }

  // Add invoice to project 1
  const invoice1 = await prisma.projectInvoice.upsert({
    where: { invoiceNumber: 'INV-2024-001' },
    update: {},
    create: {
      projectId: project1.id,
      invoiceNumber: 'INV-2024-001',
      amount: 25000,
      currency: 'USD',
      issueDate: new Date('2024-02-01'),
      dueDate: new Date('2024-02-15'),
      description: 'Milestone 1 - Design Phase',
      status: 'PAID',
      notes: 'Design and wireframes completed',
    },
  });

  // Add payment for invoice (only if not exists)
  const existingPayment1 = await prisma.projectPayment.findFirst({
    where: {
      invoiceId: invoice1.id,
      reference: 'TXN-2024-00210',
    },
  });
  if (!existingPayment1) {
    await prisma.projectPayment.create({
      data: {
        projectId: project1.id,
        invoiceId: invoice1.id,
        amount: 25000,
        currency: 'USD',
        paymentDate: new Date('2024-02-10'),
        paymentMethod: 'Bank Transfer',
        reference: 'TXN-2024-00210',
        notes: 'Payment received on time',
      },
    });
  }

  // Project 2: Mobile App Development
  const project2 = await prisma.project.upsert({
    where: { code: 'PROJ002' },
    update: {},
    create: {
      name: 'Mobile Banking App',
      code: 'PROJ002',
      description: 'Cross-platform mobile banking application',
      status: 'PLANNING',
      budget: 75000,
      currency: 'AED',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-09-30'),
      clientName: 'First National Bank',
      clientEmail: 'projects@fnb.ae',
      managerEmployeeId: hrManager.id,
      notes: 'Requires security compliance certification',
    },
  });
  projects.push(project2);

  // Project 3: Lead Project
  const project3 = await prisma.project.upsert({
    where: { code: 'PROJ003' },
    update: {},
    create: {
      name: 'E-Commerce Platform',
      code: 'PROJ003',
      description: 'Full-featured e-commerce platform with payment gateway',
      status: 'LEAD',
      budget: 100000,
      currency: 'USD',
      clientName: 'Retail Solutions LLC',
      clientEmail: 'sales@retailsolutions.com',
      notes: 'Initial inquiry - pending contract',
    },
  });
  projects.push(project3);

  // Project 4: Completed Project
  const project4 = await prisma.project.upsert({
    where: { code: 'PROJ004' },
    update: {},
    create: {
      name: 'Internal HR System',
      code: 'PROJ004',
      description: 'HR management system for internal use',
      status: 'COMPLETED',
      budget: 30000,
      currency: 'AED',
      startDate: new Date('2023-06-01'),
      endDate: new Date('2023-12-31'),
      managerEmployeeId: hrManager.id,
      notes: 'Successfully delivered on time',
    },
  });
  projects.push(project4);

  // Add expenses to completed project (only if not exists)
  const existingExpense3 = await prisma.projectExpense.findFirst({
    where: {
      projectId: project4.id,
      description: 'Third-party API integration',
    },
  });
  if (!existingExpense3) {
    await prisma.projectExpense.create({
      data: {
        projectId: project4.id,
        category: 'Development',
        description: 'Third-party API integration',
        amount: 5000,
        currency: 'AED',
        expenseDate: new Date('2023-08-15'),
        vendor: 'API Provider Inc.',
        notes: 'Payment gateway integration',
      },
    });
  }

  // Add invoice to completed project
  const invoice2 = await prisma.projectInvoice.upsert({
    where: { invoiceNumber: 'INV-2023-045' },
    update: {},
    create: {
      projectId: project4.id,
      invoiceNumber: 'INV-2023-045',
      amount: 30000,
      currency: 'AED',
      issueDate: new Date('2024-01-01'),
      dueDate: new Date('2024-01-31'),
      description: 'Final payment - Project completion',
      status: 'PAID',
      notes: 'Full payment received',
    },
  });

  // Add payment for completed project (only if not exists)
  const existingPayment2 = await prisma.projectPayment.findFirst({
    where: {
      invoiceId: invoice2.id,
      reference: 'TXN-2024-00115',
    },
  });
  if (!existingPayment2) {
    await prisma.projectPayment.create({
      data: {
        projectId: project4.id,
        invoiceId: invoice2.id,
        amount: 30000,
        currency: 'AED',
        paymentDate: new Date('2024-01-15'),
        paymentMethod: 'Bank Transfer',
        reference: 'TXN-2024-00115',
        notes: 'Final payment',
      },
    });
  }

  console.log(`Projects created: ${projects.length}`);

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

