import { prisma } from "../config/db";
import { createWorkerSchema, updateWorkerSchema } from "../validations/team.validation";
import { ApiError } from "../utils/apiError";
import * as bcrypt from "bcrypt";

export const countActiveWorkers = async (businessId: string): Promise<number> => {
  return prisma.user.count({
    where: {
      businessId,
      isActive: true,
      role: {
        in: ["MANAGER", "STAFF", "DRIVER"],
      },
    },
  });
};

export const getAllWorkers = async (
  businessId: string,
  filters: { search?: string; role?: string; status?: string }
) => {
  const where: any = {
    businessId,
    role: {
      in: ["MANAGER", "STAFF", "DRIVER"],
    },
  };

  if (filters.role) {
    where.role = filters.role;
  }

  if (filters.status) {
    where.isActive = filters.status === "active";
  }

  if (filters.search) {
    const searchVal = filters.search.trim();
    where.OR = [
      { name: { contains: searchVal } },
      { email: { contains: searchVal } },
      { phone: { contains: searchVal } },
    ];
  }

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      joiningDate: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getWorkerById = async (businessId: string, id: string) => {
  const worker = await prisma.user.findFirst({
    where: {
      id,
      businessId,
      role: {
        in: ["MANAGER", "STAFF", "DRIVER"],
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      joiningDate: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!worker) {
    throw new ApiError(404, "Worker not found or not part of your business.");
  }

  return worker;
};

export const createWorker = async (businessId: string, input: any) => {
  const data = createWorkerSchema.parse(input);

  // Seat Limit Validation
  const activeCount = await countActiveWorkers(businessId);
  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });

  if (!business) {
    throw new ApiError(404, "Business not found.");
  }

  if (data.isActive !== false && activeCount >= business.workerSeatLimit) {
    throw new ApiError(
      403,
      "Worker limit reached. Contact APNI ESTATE administrator to increase your limit."
    );
  }

  // Email Uniqueness check
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new ApiError(409, "A user with this email address already exists.");
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.password, salt);

  const newWorker = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: data.role,
      isActive: data.isActive !== false,
      businessId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      joiningDate: true,
      lastLogin: true,
    },
  });

  return newWorker;
};

export const updateWorker = async (businessId: string, id: string, input: any) => {
  const data = updateWorkerSchema.parse(input);

  // Check if worker exists
  const worker = await prisma.user.findFirst({
    where: {
      id,
      businessId,
      role: {
        in: ["MANAGER", "STAFF", "DRIVER"],
      },
    },
  });

  if (!worker) {
    throw new ApiError(404, "Worker not found.");
  }

  // If email is being changed, check uniqueness
  if (data.email && data.email !== worker.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ApiError(409, "A user with this email address already exists.");
    }
  }

  // If status is changed to active, check seat limit!
  if (data.isActive === true && !worker.isActive) {
    const activeCount = await countActiveWorkers(businessId);
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });
    if (business && activeCount >= business.workerSeatLimit) {
      throw new ApiError(
        403,
        "Worker limit reached. Contact APNI ESTATE administrator to increase your limit."
      );
    }
  }

  const updateData: any = { ...data };

  // Hash password if we are resetting it
  if (data.password) {
    const salt = await bcrypt.genSalt(10);
    updateData.passwordHash = await bcrypt.hash(data.password, salt);
    delete updateData.password;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      joiningDate: true,
      lastLogin: true,
    },
  });

  return updated;
};

export const updateWorkerStatus = async (businessId: string, id: string, isActive: boolean) => {
  const worker = await prisma.user.findFirst({
    where: {
      id,
      businessId,
      role: {
        in: ["MANAGER", "STAFF", "DRIVER"],
      },
    },
  });

  if (!worker) {
    throw new ApiError(404, "Worker not found.");
  }

  if (isActive && !worker.isActive) {
    const activeCount = await countActiveWorkers(businessId);
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });
    if (business && activeCount >= business.workerSeatLimit) {
      throw new ApiError(
        403,
        "Worker limit reached. Contact APNI ESTATE administrator to increase your limit."
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
    },
  });

  return updated;
};

export const deleteWorker = async (businessId: string, id: string) => {
  const worker = await prisma.user.findFirst({
    where: {
      id,
      businessId,
      role: {
        in: ["MANAGER", "STAFF", "DRIVER"],
      },
    },
  });

  if (!worker) {
    throw new ApiError(404, "Worker not found or not part of your business.");
  }

  // Prevent permanent deletion if user has transaction history
  const hasHistory = await prisma.stockTransaction.findFirst({
    where: { userId: id },
  });

  if (hasHistory) {
    throw new ApiError(
      400,
      "Cannot permanently delete worker with transaction history. Please deactivate their account instead."
    );
  }

  return prisma.user.delete({
    where: { id },
  });
};
