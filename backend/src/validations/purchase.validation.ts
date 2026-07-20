import { z } from "zod";
const money=z.coerce.number().nonnegative();
export const createPurchaseSchema=z.object({supplierId:z.string().min(1),expectedDeliveryDate:z.coerce.date().optional(),notes:z.string().trim().optional().nullable(),items:z.array(z.object({inventoryItemId:z.string().min(1),godownId:z.string().min(1),quantity:z.coerce.number().positive(),rate:money,discountRate:z.coerce.number().min(0).max(100).default(0),gstRate:z.coerce.number().min(0).max(100).default(0)})).min(1)});
export const receivePurchaseSchema=z.object({items:z.array(z.object({purchaseOrderItemId:z.string().min(1),quantity:z.coerce.number().positive(),godownId:z.string().min(1).optional()})).min(1),notes:z.string().trim().optional(),idempotencyKey:z.string().uuid()});
export const purchasePaymentSchema=z.object({amount:z.coerce.number().positive(),paymentMode:z.enum(["CASH","BANK","UPI","OTHER"]),paymentDate:z.coerce.date().optional(),notes:z.string().trim().optional(),idempotencyKey:z.string().uuid()});
export const reversePurchasePaymentSchema=z.object({reason:z.string().trim().min(1,"Reversal reason is required.").max(500)});
