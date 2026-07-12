import { z } from "zod";

export const createDeliverySchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required"),
  customerPhone: z.string().trim().optional().nullable(),
  deliveryAddress: z.string().trim().min(1, "Delivery address is required"),
  materialName: z.string().trim().min(1, "Material name is required"),
  quantity: z.number().gt(0, "Quantity must be greater than zero"),
  unit: z.string().trim().min(1, "Unit is required"),
  scheduledDate: z.preprocess((val) => {
    if (typeof val === "string" && val !== "") return new Date(val);
    return val;
  }, z.date().optional().nullable()),
  notes: z.string().trim().optional().nullable(),
});

export const updateDeliverySchema = createDeliverySchema.partial();

export const assignDriverSchema = z.object({
  driverId: z.string().uuid("Invalid driver ID format"),
  vehicleNumber: z.string().trim().min(1, "Vehicle number is required"),
});

export const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "ASSIGNED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"], {
    errorMap: () => ({ message: "Status must be PENDING, ASSIGNED, OUT_FOR_DELIVERY, DELIVERED, or CANCELLED" }),
  }),
});
