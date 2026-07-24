import { z } from "zod";
import { decimalValue } from "./salesOrder.validation";

const optionalText = z.string().trim().optional().nullable();

export const createLinkedDeliverySchema = z.object({
  salesOrderId: z.string().min(1),
  invoiceId: z.string().min(1).optional().nullable(),
  scheduledDate: z.string().datetime().optional().nullable(),
  vehicleNumber: optionalText,
  vehicleType: optionalText,
  driverName: optionalText,
  driverPhone: optionalText,
  notes: optionalText,
  items: z.array(z.object({
    salesOrderItemId: z.string().min(1),
    invoiceItemId: z.string().min(1).optional().nullable(),
    quantity: decimalValue,
  })).min(1),
});

export const listLinkedDeliveryQuerySchema = z.object({
  status: z.string().trim().optional(),
  salesOrderId: z.string().trim().optional(),
  invoiceId: z.string().trim().optional(),
  customerId: z.string().trim().optional(),
  challanNumber: z.string().trim().optional(),
});

export const readyLinkedDeliverySchema = z.object({
  scheduledDate: z.string().datetime().optional().nullable(),
  vehicleNumber: optionalText,
  vehicleType: optionalText,
  driverName: optionalText,
  driverPhone: optionalText,
});

export const dispatchLinkedDeliverySchema = z.object({
  items: z.array(z.object({
    deliveryItemId: z.string().min(1),
    dispatchQuantity: decimalValue,
  })).optional(),
});

export const completeLinkedDeliverySchema = z.object({
  receiverName: z.string().trim().min(1),
  proofOfDeliveryReference: optionalText,
  deliveryNotes: optionalText,
  confirmedAt: z.string().datetime().optional(),
  items: z.array(z.object({
    deliveryItemId: z.string().min(1),
    receivedQuantity: decimalValue,
    rejectedQuantity: decimalValue.default(0),
    notes: optionalText,
  })).min(1),
});

export const deliveryReasonSchema = z.object({ reason: z.string().trim().min(3).max(500) });
