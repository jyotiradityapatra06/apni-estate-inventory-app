import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import { createSalesOrderSchema, listSalesOrderQuerySchema } from "../validations/salesOrder.validation";
import { calculateInvoice } from "./invoiceCalculation.service";
import { stateCodeFromGstin } from "./gstCalculation.service";
import { nextDocumentNumber } from "./numberSequence.service";

const detailInclude = {
  customer: { select: { id: true, customerCode: true, name: true, phone: true } },
  createdBy: { select: { id: true, name: true } },
  items: { include: { inventoryItem: { select: { id: true, materialName: true, quantity: true } }, godown: { select: { id: true, name: true, godownCode: true } } } },
  invoices: { select: { id: true, invoiceNumber: true, status: true, totalAmount: true } },
  deliveries: { select: { id: true, deliveryNumber: true, status: true } },
};

export const getAll = async (businessId: string, rawQuery: unknown) => {
  const query = listSalesOrderQuerySchema.parse(rawQuery);
  const where: Prisma.SalesOrderWhereInput = { businessId };
  if (query.status) where.status = query.status.toUpperCase();
  if (query.customerId) where.customerId = query.customerId;
  if (query.search) where.OR = [
    { orderNumber: { contains: query.search } },
    { customerName: { contains: query.search } },
  ];
  return prisma.salesOrder.findMany({ where, include: detailInclude, orderBy: { orderDate: "desc" } });
};

export const getById = async (businessId: string, id: string) => {
  const order = await prisma.salesOrder.findFirst({ where: { id, businessId }, include: detailInclude });
  if (!order) throw new ApiError(404, "Sales Order not found.");
  return order;
};

export const create = async (businessId: string, userId: string, input: unknown) => {
  const data = createSalesOrderSchema.parse(input);
  const [business, customer] = await Promise.all([
    prisma.business.findUnique({ where: { id: businessId } }),
    prisma.customer.findFirst({ where: { id: data.customerId, businessId, isActive: true } }),
  ]);
  if (!business) throw new ApiError(404, "Business not found.");
  if (!customer) throw new ApiError(404, "Customer not found or inactive.");

  const materialIds = Array.from(new Set(data.items.map((item) => item.inventoryItemId)));
  const godownIds = Array.from(new Set(data.items.map((item) => item.godownId)));
  const [materials, godowns] = await Promise.all([
    prisma.inventoryItem.findMany({ where: { businessId, id: { in: materialIds }, isActive: true } }),
    prisma.godown.findMany({ where: { businessId, id: { in: godownIds }, isActive: true } }),
  ]);
  if (materials.length !== materialIds.length) throw new ApiError(400, "One or more materials are invalid or inactive.");
  if (godowns.length !== godownIds.length) throw new ApiError(400, "One or more godowns are invalid or inactive.");

  const materialMap = new Map(materials.map((material) => [material.id, material]));
  const sellerStateCode = stateCodeFromGstin(business.gstNumber);
  const placeOfSupplyCode = data.placeOfSupplyCode || stateCodeFromGstin(customer.gstin) || sellerStateCode;
  const calculation = calculateInvoice(data.items.map((line, index) => {
    const material = materialMap.get(line.inventoryItemId)!;
    const rate = line.rate ?? material.sellingPrice;
    if (rate === null || rate === undefined) throw new ApiError(400, `Selling rate is required for ${material.materialName}.`);
    return {
      key: String(index), quantity: line.quantity, rate, discountRate: line.discountRate ?? 0,
      gstRate: line.gstRate ?? material.taxRate ?? 0, invoiceType: data.taxMode,
      sellerStateCode, placeOfSupplyCode,
    };
  }), data.roundToRupee);

  return prisma.$transaction(async (tx) => {
    const orderNumber = await nextDocumentNumber(tx, businessId, "SALES_ORDER", "SO");
    return tx.salesOrder.create({
      data: {
        orderNumber,
        orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
        taxMode: data.taxMode,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerGstin: customer.gstin,
        billingAddress: data.billingAddress ?? customer.billingAddress,
        deliveryAddress: data.deliveryAddress ?? customer.shippingAddress,
        placeOfSupplyCode,
        subtotal: calculation.subtotal,
        discountTotal: calculation.discountTotal,
        taxableTotal: calculation.taxableTotal,
        cgstTotal: calculation.cgstTotal,
        sgstTotal: calculation.sgstTotal,
        igstTotal: calculation.igstTotal,
        totalAmount: calculation.totalAmount,
        notes: data.notes,
        terms: data.terms,
        businessId,
        createdById: userId,
        items: {
          create: data.items.map((line, index) => {
            const material = materialMap.get(line.inventoryItemId)!;
            const calculated = calculation.calculatedLines[index];
            return {
              inventoryItemId: material.id, godownId: line.godownId,
              materialName: material.materialName, sku: material.sku, hsnCode: material.hsnCode, unit: material.unit,
              quantity: calculated.quantity, rate: calculated.rate, grossAmount: calculated.grossAmount,
              discountRate: calculated.discountRate, discountAmount: calculated.discountAmount,
              taxableAmount: calculated.taxableAmount, gstRate: calculated.gstRate,
              cgstRate: calculated.cgstRate, sgstRate: calculated.sgstRate, igstRate: calculated.igstRate,
              cgstAmount: calculated.cgstAmount, sgstAmount: calculated.sgstAmount, igstAmount: calculated.igstAmount,
              lineTotal: calculated.lineTotal,
            };
          }),
        },
      },
      include: detailInclude,
    });
  });
};

export const confirm = async (businessId: string, id: string, overrideCreditLimit = false) => prisma.$transaction(async (tx) => {
  const order = await tx.salesOrder.findFirst({ where: { id, businessId }, include: { items: true } });
  if (!order) throw new ApiError(404, "Sales Order not found.");
  if (order.status !== "DRAFT") throw new ApiError(400, "Only draft Sales Orders can be confirmed.");
  const customer = await tx.customer.findFirst({ where: { id: order.customerId, businessId } });
  if (!customer) throw new ApiError(404, "Customer not found.");
  if (customer.creditLimit > 0 && customer.outstandingBalance + Number(order.totalAmount) > customer.creditLimit && !overrideCreditLimit) {
    throw new ApiError(409, "Customer credit limit exceeded. Owner or Manager approval is required.");
  }

  for (const item of order.items) {
    const balance = await tx.godownStock.findUnique({
      where: { businessId_godownId_inventoryItemId: { businessId, godownId: item.godownId, inventoryItemId: item.inventoryItemId } },
    });
    const requested = Number(item.quantity.toString());
    const available = (balance?.quantity || 0) - (balance?.reservedQuantity || 0);
    if (!balance || available < requested) throw new ApiError(400, `Insufficient available stock for ${item.materialName}. Available: ${available} ${item.unit}.`);
  }

  for (const item of order.items) {
    const requested = Number(item.quantity.toString());
    await tx.godownStock.update({
      where: { businessId_godownId_inventoryItemId: { businessId, godownId: item.godownId, inventoryItemId: item.inventoryItemId } },
      data: { reservedQuantity: { increment: requested } },
    });
    await tx.salesOrderItem.update({ where: { id: item.id }, data: { reservedQuantity: item.quantity } });
  }
  await tx.salesOrder.update({ where: { id }, data: { status: "CONFIRMED", confirmedAt: new Date() } });
  return tx.salesOrder.findUniqueOrThrow({ where: { id }, include: detailInclude });
});

export const cancel = async (businessId: string, id: string) => prisma.$transaction(async (tx) => {
  const order = await tx.salesOrder.findFirst({ where: { id, businessId }, include: { items: true, invoices: { where: { status: { not: "CANCELLED" } } } } });
  if (!order) throw new ApiError(404, "Sales Order not found.");
  if (order.status === "CANCELLED" || order.status === "FULFILLED") throw new ApiError(400, "This Sales Order cannot be cancelled.");
  if (order.invoices.length) throw new ApiError(400, "Cancel active invoices before cancelling this Sales Order.");
  if (order.status !== "DRAFT") {
    for (const item of order.items) {
      const reserved = Number(item.reservedQuantity.toString());
      if (reserved > 0) {
        await tx.godownStock.update({
          where: { businessId_godownId_inventoryItemId: { businessId, godownId: item.godownId, inventoryItemId: item.inventoryItemId } },
          data: { reservedQuantity: { decrement: reserved } },
        });
        await tx.salesOrderItem.update({ where: { id: item.id }, data: { reservedQuantity: 0 } });
      }
    }
  }
  await tx.salesOrder.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
  return tx.salesOrder.findUniqueOrThrow({ where: { id }, include: detailInclude });
});
