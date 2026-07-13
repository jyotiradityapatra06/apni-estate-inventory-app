import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";

export const getAll = async (businessId: string) => {
  return prisma.delivery.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });
};

export const getById = async (businessId: string, id: string) => {
  return prisma.delivery.findFirst({
    where: { id, businessId },
  });
};

export const create = async (
  businessId: string,
  data: {
    customerName: string;
    customerPhone?: string | null;
    deliveryAddress: string;
    materialName: string;
    quantity: number;
    unit: string;
    scheduledDate?: string | null;
    notes?: string | null;
    paymentStatus?: string;
  }
) => {
  const deliveryNumber = `DEL-${Math.floor(10000 + Math.random() * 90000)}`;

  const scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null;

  return prisma.delivery.create({
    data: {
      deliveryNumber,
      customerName: data.customerName,
      customerPhone: data.customerPhone || null,
      deliveryAddress: data.deliveryAddress,
      materialName: data.materialName,
      quantity: Number(data.quantity),
      unit: data.unit,
      scheduledDate,
      notes: data.notes || null,
      status: "PENDING",
      paymentStatus: data.paymentStatus || "PENDING",
      businessId,
    },
  });
};

export const update = async (
  businessId: string,
  id: string,
  data: {
    customerName?: string;
    customerPhone?: string | null;
    deliveryAddress?: string;
    materialName?: string;
    quantity?: number;
    unit?: string;
    scheduledDate?: string | null;
    notes?: string | null;
    status?: string;
    paymentStatus?: string;
  },
  userRole: string
) => {
  const delivery = await prisma.delivery.findFirst({
    where: { id, businessId },
  });

  if (!delivery) {
    throw new ApiError(404, "Delivery not found.");
  }

  const updateData: any = {};

  if (data.customerName !== undefined) updateData.customerName = data.customerName;
  if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone;
  if (data.deliveryAddress !== undefined) updateData.deliveryAddress = data.deliveryAddress;
  if (data.materialName !== undefined) updateData.materialName = data.materialName;
  if (data.quantity !== undefined) updateData.quantity = Number(data.quantity);
  if (data.unit !== undefined) updateData.unit = data.unit;
  if (data.scheduledDate !== undefined) {
    updateData.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null;
  }
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.paymentStatus !== undefined) {
    const payStatus = data.paymentStatus.toUpperCase();
    if (payStatus !== "PENDING" && payStatus !== "RECEIVED") {
      throw new ApiError(400, "Invalid payment status. Must be PENDING or RECEIVED.");
    }
    updateData.paymentStatus = payStatus;
  }

  if (data.status !== undefined) {
    const nextStatus = data.status.toUpperCase();
    const currentStatus = delivery.status.toUpperCase();

    if (nextStatus !== "PENDING" && nextStatus !== "OUT_FOR_DELIVERY" && nextStatus !== "DELIVERED") {
      throw new ApiError(400, "Invalid status. Must be PENDING, OUT_FOR_DELIVERY, or DELIVERED.");
    }

    if (nextStatus !== currentStatus) {
      const role = userRole.toUpperCase();
      if (role !== "OWNER") {
        // MANAGER validation rules
        // Progressive transitions: PENDING -> OUT_FOR_DELIVERY -> DELIVERED
        // Or direct PENDING -> DELIVERED
        const isAllowed =
          (currentStatus === "PENDING" && nextStatus === "OUT_FOR_DELIVERY") ||
          (currentStatus === "PENDING" && nextStatus === "DELIVERED") ||
          (currentStatus === "OUT_FOR_DELIVERY" && nextStatus === "DELIVERED");

        if (!isAllowed) {
          throw new ApiError(403, "Only the business OWNER can revert or correct delivery status transitions.");
        }
      }
      updateData.status = nextStatus;
    }
  }

  return prisma.delivery.update({
    where: { id },
    data: updateData,
  });
};

export const remove = async (businessId: string, id: string) => {
  const delivery = await prisma.delivery.findFirst({
    where: { id, businessId },
  });

  if (!delivery) {
    throw new ApiError(404, "Delivery not found.");
  }

  return prisma.delivery.delete({
    where: { id },
  });
};
