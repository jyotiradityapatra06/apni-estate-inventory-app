import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import {
  createDeliverySchema,
  updateDeliverySchema,
  assignDriverSchema,
} from "../validations/delivery.validation";

export const getAll = async (businessId: string, status?: string) => {
  const whereClause: any = {
    businessId,
  };

  if (status && status !== "ALL") {
    whereClause.status = status;
  }

  return await prisma.delivery.findMany({
    where: whereClause,
    include: {
      driver: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getById = async (businessId: string, id: string) => {
  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: {
      driver: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!delivery || delivery.businessId !== businessId) {
    throw new ApiError(404, "Delivery not found.");
  }

  return delivery;
};

export const create = async (businessId: string, createdById: string, input: any) => {
  const data = createDeliverySchema.parse(input);

  return await prisma.$transaction(async (tx) => {
    // Generate safe sequential DEL-XXXX number for the business
    const lastDelivery = await tx.delivery.findFirst({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });

    let nextNum = 1;
    if (lastDelivery && lastDelivery.deliveryNumber) {
      const match = lastDelivery.deliveryNumber.match(/DEL-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const deliveryNumber = `DEL-${String(nextNum).padStart(4, "0")}`;

    const newDelivery = await tx.delivery.create({
      data: {
        ...data,
        deliveryNumber,
        businessId,
        createdById,
        status: "PENDING",
      },
    });

    return newDelivery;
  });
};

export const update = async (businessId: string, id: string, input: any) => {
  const data = updateDeliverySchema.parse(input);

  const delivery = await prisma.delivery.findUnique({
    where: { id },
  });

  if (!delivery || delivery.businessId !== businessId) {
    throw new ApiError(404, "Delivery not found.");
  }

  // Prevent editing basic info if not in PENDING status
  if (delivery.status !== "PENDING") {
    throw new ApiError(400, "Only pending deliveries can be edited.");
  }

  return await prisma.delivery.update({
    where: { id },
    data,
  });
};

export const assignDriver = async (
  businessId: string,
  id: string,
  input: any
) => {
  const { driverId, vehicleNumber } = assignDriverSchema.parse(input);

  const delivery = await prisma.delivery.findUnique({
    where: { id },
  });

  if (!delivery || delivery.businessId !== businessId) {
    throw new ApiError(404, "Delivery not found.");
  }

  if (delivery.status === "DELIVERED" || delivery.status === "CANCELLED") {
    throw new ApiError(400, `Cannot assign driver to a ${delivery.status.toLowerCase()} delivery.`);
  }

  // Check if driver exists, is in the same business, active, and has DRIVER role
  const driverUser = await prisma.user.findUnique({
    where: { id: driverId },
  });

  if (!driverUser || driverUser.businessId !== businessId) {
    throw new ApiError(404, "Driver not found in this business.");
  }

  if (driverUser.role !== "DRIVER") {
    throw new ApiError(400, "Selected team member is not registered as a driver.");
  }

  if (!driverUser.isActive) {
    throw new ApiError(400, "Selected driver is currently inactive.");
  }

  return await prisma.delivery.update({
    where: { id },
    data: {
      driverId,
      vehicleNumber,
      status: "ASSIGNED",
    },
    include: {
      driver: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

export const updateStatus = async (
  businessId: string,
  id: string,
  userRole: string,
  userId: string,
  newStatus: string
) => {
  const delivery = await prisma.delivery.findUnique({
    where: { id },
  });

  if (!delivery || delivery.businessId !== businessId) {
    throw new ApiError(404, "Delivery not found.");
  }

  if (userRole === "DRIVER") {
    if (delivery.driverId !== userId) {
      throw new ApiError(403, "You can only update status for deliveries assigned to you.");
    }

    const currentStatus = delivery.status;
    const isValidTransition =
      (currentStatus === "ASSIGNED" && newStatus === "OUT_FOR_DELIVERY") ||
      (currentStatus === "OUT_FOR_DELIVERY" && newStatus === "DELIVERED");

    if (!isValidTransition) {
      throw new ApiError(
        400,
        `Drivers can only transition deliveries from Assigned to Out for Delivery, or Out for Delivery to Delivered. Current: ${currentStatus}, Requested: ${newStatus}`
      );
    }
  } else {
    // Non-driver (OWNER, MANAGER, STAFF) status changes.
    // They can transition from PENDING -> ASSIGNED (usually through assignDriver endpoint),
    // cancel, or reset as needed.
    if (newStatus === "ASSIGNED" && !delivery.driverId) {
      throw new ApiError(400, "Cannot change status to Assigned without assigning a driver.");
    }
  }

  return await prisma.delivery.update({
    where: { id },
    data: { status: newStatus },
  });
};

export const remove = async (businessId: string, id: string) => {
  const delivery = await prisma.delivery.findUnique({
    where: { id },
  });

  if (!delivery || delivery.businessId !== businessId) {
    throw new ApiError(404, "Delivery not found.");
  }

  if (delivery.status !== "PENDING" && delivery.status !== "CANCELLED") {
    throw new ApiError(400, "Only pending or cancelled deliveries can be deleted.");
  }

  await prisma.delivery.delete({
    where: { id },
  });

  return { id };
};

export const getDriverDeliveries = async (businessId: string, driverId: string) => {
  return await prisma.delivery.findMany({
    where: {
      businessId,
      driverId,
    },
    include: {
      driver: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};
