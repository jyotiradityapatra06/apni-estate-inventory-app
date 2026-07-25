import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import { nextDocumentNumber } from "./numberSequence.service";

export const getAll = async (businessId: string) => {
  return prisma.delivery.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true } },
      dispatchedBy: { select: { id: true, name: true } },
      completedBy: { select: { id: true, name: true } },
    },
  });
};

export const getById = async (businessId: string, id: string) => {
  return prisma.delivery.findFirst({
    where: { id, businessId },
    include: {
      items: true,
      salesOrder: { select: { id: true, orderNumber: true } },
      invoice: { select: { id: true, invoiceNumber: true } },
      createdBy: { select: { id: true, name: true } },
      dispatchedBy: { select: { id: true, name: true } },
      completedBy: { select: { id: true, name: true } },
    },
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
  return prisma.$transaction(async (tx) => {
    const deliveryNumber = `DEL-${Math.floor(10000 + Math.random() * 90000)}`;
    const challanNumber = await nextDocumentNumber(tx, businessId, "DELIVERY_CHALLAN", "DC");
    const scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null;

    return tx.delivery.create({
      data: {
        deliveryNumber,
        challanNumber,
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
    vehicleNumber?: string | null;
    vehicleType?: string | null;
    driverName?: string | null;
    driverPhone?: string | null;
    receiverName?: string | null;
    proofOfDeliveryReference?: string | null;
    deliveryNotes?: string | null;
    cancellationReason?: string | null;
  },
  userRole: string,
  userId?: string
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

  // Dispatch & Driver Details
  if (data.vehicleNumber !== undefined) updateData.vehicleNumber = data.vehicleNumber;
  if (data.vehicleType !== undefined) updateData.vehicleType = data.vehicleType;
  if (data.driverName !== undefined) updateData.driverName = data.driverName;
  if (data.driverPhone !== undefined) updateData.driverPhone = data.driverPhone;
  if (data.receiverName !== undefined) updateData.receiverName = data.receiverName;
  if (data.proofOfDeliveryReference !== undefined) updateData.proofOfDeliveryReference = data.proofOfDeliveryReference;
  if (data.deliveryNotes !== undefined) updateData.deliveryNotes = data.deliveryNotes;
  if (data.cancellationReason !== undefined) updateData.cancellationReason = data.cancellationReason;

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

    const ALLOWED_STATUSES = ["PENDING", "ASSIGNED", "DISPATCHED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
    if (!ALLOWED_STATUSES.includes(nextStatus)) {
      throw new ApiError(400, `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(", ")}`);
    }

    if (nextStatus !== currentStatus) {
      const role = userRole.toUpperCase();
      if (role !== "OWNER") {
        // Sequential transition rules for MANAGER / STAFF
        const isValidSequential =
          (currentStatus === "PENDING" && (nextStatus === "ASSIGNED" || nextStatus === "DISPATCHED" || nextStatus === "OUT_FOR_DELIVERY" || nextStatus === "CANCELLED")) ||
          (currentStatus === "ASSIGNED" && (nextStatus === "DISPATCHED" || nextStatus === "OUT_FOR_DELIVERY" || nextStatus === "CANCELLED")) ||
          (currentStatus === "DISPATCHED" && (nextStatus === "OUT_FOR_DELIVERY" || nextStatus === "DELIVERED" || nextStatus === "CANCELLED")) ||
          (currentStatus === "OUT_FOR_DELIVERY" && (nextStatus === "DELIVERED" || nextStatus === "CANCELLED"));

        if (!isValidSequential) {
          throw new ApiError(403, "Invalid status transition. Sequential workflow: PENDING -> ASSIGNED -> DISPATCHED -> OUT_FOR_DELIVERY -> DELIVERED. Owner approval required for corrections.");
        }
      }

      updateData.status = nextStatus;

      if (nextStatus === "DISPATCHED" && !delivery.dispatchedAt) {
        updateData.dispatchedAt = new Date();
        if (userId) updateData.dispatchedById = userId;
      }
      if (nextStatus === "DELIVERED" && !delivery.deliveredAt) {
        updateData.deliveredAt = new Date();
        if (userId) updateData.completedById = userId;
      }
      if (nextStatus === "CANCELLED" && !delivery.cancelledAt) {
        updateData.cancelledAt = new Date();
        if (userId) updateData.cancelledById = userId;
      }
    }
  }

  return prisma.delivery.update({
    where: { id },
    data: updateData,
  });
};

export const remove = async (businessId: string, id: string) => {
  const delivery = await prisma.delivery.findFirst({
    where: { id, businessId, fulfilmentMode: "LEGACY" },
  });

  if (!delivery) {
    throw new ApiError(404, "Delivery not found.");
  }

  return prisma.delivery.delete({
    where: { id },
  });
};
