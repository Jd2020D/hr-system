import { prisma } from '../config/database';
import { AppError } from '../utils/error';
import { Prisma, Project, ProjectStatus } from '@prisma/client';
import { PaginatedResult } from '../types';

export interface ProjectFilter {
  page?: number;
  limit?: number;
  status?: ProjectStatus;
  managerId?: string;
  search?: string;
}

export interface ProjectExpenseFilter {
  page?: number;
  limit?: number;
  category?: string;
  from?: string;
  to?: string;
}

export interface ProjectInvoiceFilter {
  page?: number;
  limit?: number;
  status?: string;
  from?: string;
  to?: string;
}

export interface ProjectPaymentFilter {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}

export const projectService = {
  // ===== PROJECTS =====
  async findAll(filters: ProjectFilter): Promise<PaginatedResult<Project>> {
    const { page = 1, limit = 20, status, managerId, search } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (managerId) {
      where.managerEmployeeId = managerId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { clientName: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              resources: true,
              expenses: true,
              invoices: true,
              payments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      data: data as any,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string): Promise<any> {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        resources: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                jobTitle: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    return project;
  },

  async create(data: Prisma.ProjectCreateInput): Promise<Project> {
    // Check if project code exists
    const existingCode = await prisma.project.findUnique({
      where: { code: data.code as string },
    });
    if (existingCode) {
      throw new AppError(409, 'Project code already exists');
    }

    return prisma.project.create({
      data,
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  },

  async update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project> {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, 'Project not found');
    }

    // Check code uniqueness if updating code
    if (data.code) {
      const existingCode = await prisma.project.findUnique({
        where: { code: data.code as string },
      });
      if (existingCode && existingCode.id !== id) {
        throw new AppError(409, 'Project code already exists');
      }
    }

    return prisma.project.update({
      where: { id },
      data,
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  },

  async delete(id: string): Promise<void> {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, 'Project not found');
    }

    await prisma.project.delete({ where: { id } });
  },

  // ===== PROJECT RESOURCES =====
  async getResources(projectId: string) {
    return prisma.projectResource.findMany({
      where: { projectId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async addResource(projectId: string, data: Prisma.ProjectResourceCreateInput) {
    return prisma.projectResource.create({
      data: {
        ...data,
        project: { connect: { id: projectId } },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
          },
        },
      },
    });
  },

  async updateResource(id: string, data: Prisma.ProjectResourceUpdateInput) {
    return prisma.projectResource.update({
      where: { id },
      data,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
          },
        },
      },
    });
  },

  async deleteResource(id: string) {
    await prisma.projectResource.delete({ where: { id } });
  },

  // ===== PROJECT EXPENSES =====
  async getExpenses(projectId: string, filters: ProjectExpenseFilter): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, category, from, to } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectExpenseWhereInput = { projectId };

    if (category) {
      where.category = category;
    }

    if (from || to) {
      where.expenseDate = {};
      if (from) where.expenseDate.gte = new Date(from);
      if (to) where.expenseDate.lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      prisma.projectExpense.findMany({
        where,
        skip,
        take: limit,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { expenseDate: 'desc' },
      }),
      prisma.projectExpense.count({ where }),
    ]);

    return {
      data: data as any,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async addExpense(projectId: string, data: Prisma.ProjectExpenseCreateInput) {
    return prisma.projectExpense.create({
      data: {
        ...data,
        project: { connect: { id: projectId } },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  },

  async updateExpense(id: string, data: Prisma.ProjectExpenseUpdateInput) {
    return prisma.projectExpense.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  },

  async deleteExpense(id: string) {
    await prisma.projectExpense.delete({ where: { id } });
  },

  // ===== PROJECT INVOICES =====
  async getInvoices(projectId: string, filters: ProjectInvoiceFilter): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, status, from, to } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectInvoiceWhereInput = { projectId };

    if (status) {
      where.status = status;
    }

    if (from || to) {
      where.issueDate = {};
      if (from) where.issueDate.gte = new Date(from);
      if (to) where.issueDate.lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      prisma.projectInvoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { payments: true },
          },
        },
        orderBy: { issueDate: 'desc' },
      }),
      prisma.projectInvoice.count({ where }),
    ]);

    return {
      data: data as any,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async addInvoice(projectId: string, data: Prisma.ProjectInvoiceCreateInput) {
    // Check if invoice number exists
    if (data.invoiceNumber) {
      const existing = await prisma.projectInvoice.findUnique({
        where: { invoiceNumber: data.invoiceNumber as string },
      });
      if (existing) {
        throw new AppError(409, 'Invoice number already exists');
      }
    }

    return prisma.projectInvoice.create({
      data: {
        ...data,
        project: { connect: { id: projectId } },
      },
    });
  },

  async updateInvoice(id: string, data: Prisma.ProjectInvoiceUpdateInput) {
    const existing = await prisma.projectInvoice.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, 'Invoice not found');
    }

    if (data.invoiceNumber) {
      const existingNumber = await prisma.projectInvoice.findUnique({
        where: { invoiceNumber: data.invoiceNumber as string },
      });
      if (existingNumber && existingNumber.id !== id) {
        throw new AppError(409, 'Invoice number already exists');
      }
    }

    return prisma.projectInvoice.update({
      where: { id },
      data,
    });
  },

  async deleteInvoice(id: string) {
    await prisma.projectInvoice.delete({ where: { id } });
  },

  // ===== PROJECT PAYMENTS =====
  async getPayments(projectId: string, filters: ProjectPaymentFilter): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, from, to } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectPaymentWhereInput = { projectId };

    if (from || to) {
      where.paymentDate = {};
      if (from) where.paymentDate.gte = new Date(from);
      if (to) where.paymentDate.lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      prisma.projectPayment.findMany({
        where,
        skip,
        take: limit,
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              amount: true,
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
      }),
      prisma.projectPayment.count({ where }),
    ]);

    return {
      data: data as any,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async addPayment(projectId: string, data: Prisma.ProjectPaymentCreateInput) {
    return prisma.projectPayment.create({
      data: {
        ...data,
        project: { connect: { id: projectId } },
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
          },
        },
      },
    });
  },

  async updatePayment(id: string, data: Prisma.ProjectPaymentUpdateInput) {
    return prisma.projectPayment.update({
      where: { id },
      data,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
          },
        },
      },
    });
  },

  async deletePayment(id: string) {
    await prisma.projectPayment.delete({ where: { id } });
  },

  // ===== PROJECT SUMMARY =====
  async getSummary(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        expenses: true,
        invoices: true,
        payments: true,
        resources: true,
      },
    });

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    const totalExpenses = project.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const totalInvoices = project.invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const totalPayments = project.payments.reduce((sum, pay) => sum + Number(pay.amount), 0);

    return {
      project: {
        id: project.id,
        name: project.name,
        code: project.code,
        budget: Number(project.budget),
        currency: project.currency,
        status: project.status,
      },
      expenses: {
        total: totalExpenses,
        count: project.expenses.length,
      },
      invoices: {
        total: totalInvoices,
        count: project.invoices.length,
        paid: totalPayments,
        outstanding: totalInvoices - totalPayments,
      },
      resources: {
        count: project.resources.length,
      },
    };
  },
};
