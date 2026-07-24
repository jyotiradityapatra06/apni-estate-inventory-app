import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import {
  completeLinkedDeliverySchema,
  createLinkedDeliverySchema,
  deliveryReasonSchema,
  dispatchLinkedDeliverySchema,
  listLinkedDeliveryQuerySchema,
  readyLinkedDeliverySchema,
} from "../validations/linkedDelivery.validation";
import { quantityDecimal } from "./gstCalculation.service";
import { nextDocumentNumber } from "./numberSequence.service";
import { syncMaterialAggregate } from "./stockBalance.service";

const LINKED_MODE = "LINKED_SALES_ORDER";
const activeOrderStatuses = ["CONFIRMED", "PARTIALLY_INVOICED", "INVOICED", "PARTIALLY_DELIVERED"];

const detailInclude = {
  customer: { select: { id: true, customerCode: true, name: true, phone: true } },
  salesOrder: { select: { id: true, orderNumber: true, status: true } },
  invoice: { select: { id: true, invoiceNumber: true, status: true } },
  godown: { select: { id: true, godownCode: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  dispatchedBy: { select: { id: true, name: true } },
  completedBy: { select: { id: true, name: true } },
  cancelledBy: { select: { id: true, name: true } },
  reversedBy: { select: { id: true, name: true } },
  items: {
    include: {
      inventoryItem: { select: { id: true, materialName: true, sku: true, unit: true } },
      godown: { select: { id: true, godownCode: true, name: true } },
    },
  },
} as const;

const linkedWhere = (businessId: string, id: string) => ({ id, businessId, fulfilmentMode: LINKED_MODE });

export const getAll = async (
  businessId: string,
  rawQuery: unknown,
  currentUser?: { userId: string; role: string; name?: string; phone?: string }
) => {
  const query = listLinkedDeliveryQuerySchema.parse(rawQuery);
  const where: Prisma.DeliveryWhereInput = { businessId, fulfilmentMode: LINKED_MODE };
  if (query.status) where.status = query.status.toUpperCase();
  if (query.salesOrderId) where.salesOrderId = query.salesOrderId;
  if (query.invoiceId) where.invoiceId = query.invoiceId;
  if (query.customerId) where.customerId = query.customerId;
  if (query.challanNumber) where.challanNumber = query.challanNumber;

  if (currentUser && currentUser.role.toUpperCase() === "DRIVER") {
    const driverOr: Prisma.DeliveryWhereInput[] = [
      { dispatchedById: currentUser.userId },
      { createdById: currentUser.userId },
    ];
    if (currentUser.phone) driverOr.push({ driverPhone: currentUser.phone });
    if (currentUser.name) driverOr.push({ driverName: currentUser.name });
    where.OR = driverOr;
  }

  return prisma.delivery.findMany({ where, include: detailInclude, orderBy: { createdAt: "desc" } });
};

export const getById = async (
  businessId: string,
  id: string,
  currentUser?: { userId: string; role: string; name?: string; phone?: string }
) => {
  const where: Prisma.DeliveryWhereInput = linkedWhere(businessId, id);

  if (currentUser && currentUser.role.toUpperCase() === "DRIVER") {
    const driverOr: Prisma.DeliveryWhereInput[] = [
      { dispatchedById: currentUser.userId },
      { createdById: currentUser.userId },
    ];
    if (currentUser.phone) driverOr.push({ driverPhone: currentUser.phone });
    if (currentUser.name) driverOr.push({ driverName: currentUser.name });
    where.OR = driverOr;
  }

  const delivery = await prisma.delivery.findFirst({ where, include: detailInclude });
  if (!delivery) throw new ApiError(404, "Linked delivery not found.");
  return delivery;
};

const plannedForOrder = async (businessId: string, salesOrderId: string) => {
  const rows = await prisma.deliveryItem.findMany({
    where: {
      delivery: { businessId, salesOrderId, fulfilmentMode: LINKED_MODE, status: { not: "CANCELLED" } },
    },
    select: { salesOrderItemId: true, plannedQuantity: true, rejectedQuantity: true },
  });
  const totals = new Map<string, Prisma.Decimal>();
  for (const row of rows) {
    if (!row.salesOrderItemId) continue;
    const committedQuantity = Prisma.Decimal.max(0, row.plannedQuantity.minus(row.rejectedQuantity));
    totals.set(row.salesOrderItemId, (totals.get(row.salesOrderItemId) || new Prisma.Decimal(0)).plus(committedQuantity));
  }
  return totals;
};

const reservationAllocatedForOrder = async (businessId: string, salesOrderId: string) => {
  const rows = await prisma.deliveryItem.findMany({
    where: { delivery: { businessId, salesOrderId, fulfilmentMode: LINKED_MODE, status: { in: ["PENDING", "READY_FOR_DISPATCH"] } } },
    select: { salesOrderItemId: true, plannedQuantity: true },
  });
  const totals = new Map<string, Prisma.Decimal>();
  for (const row of rows) {
    if (row.salesOrderItemId) totals.set(row.salesOrderItemId, (totals.get(row.salesOrderItemId) || new Prisma.Decimal(0)).plus(row.plannedQuantity));
  }
  return totals;
};

export const getDeliverableItems = async (businessId: string, salesOrderId: string) => {
  const order = await prisma.salesOrder.findFirst({
    where: { id: salesOrderId, businessId },
    include: { customer: { select: { id: true, name: true } }, items: { include: { godown: { select: { id: true, name: true, godownCode: true } } } } },
  });
  if (!order) throw new ApiError(404, "Sales Order not found.");
  if (!activeOrderStatuses.includes(order.status)) throw new ApiError(400, "This Sales Order is not available for delivery.");
  const planned = await plannedForOrder(businessId, order.id);
  return {
    salesOrderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    customer: order.customer,
    items: order.items.map((item) => {
      const activePlanned = planned.get(item.id) || new Prisma.Decimal(0);
      return {
        salesOrderItemId: item.id,
        inventoryItemId: item.inventoryItemId,
        materialName: item.materialName,
        godown: item.godown,
        orderedQuantity: item.quantity,
        reservedQuantity: item.reservedQuantity,
        plannedInActiveDeliveries: activePlanned,
        deliveredQuantity: item.deliveredQuantity,
        availableToPlan: Prisma.Decimal.max(0, item.quantity.minus(activePlanned)),
        unit: item.unit,
      };
    }),
  };
};

export const create = async (businessId: string, userId: string, input: unknown) => {
  const data = createLinkedDeliverySchema.parse(input);
  if (new Set(data.items.map((item) => item.salesOrderItemId)).size !== data.items.length) {
    throw new ApiError(400, "A Sales Order item can only appear once in a delivery.");
  }
  const order = await prisma.salesOrder.findFirst({
    where: { id: data.salesOrderId, businessId },
    include: { customer: true, items: true },
  });
  if (!order) throw new ApiError(404, "Sales Order not found.");
  if (!activeOrderStatuses.includes(order.status)) throw new ApiError(400, "Cancelled, draft, or fulfilled Sales Orders cannot create deliveries.");
  if (order.customer.businessId !== businessId) throw new ApiError(400, "The Sales Order customer is invalid.");

  const invoice = data.invoiceId
    ? await prisma.invoice.findFirst({ where: { id: data.invoiceId, businessId, salesOrderId: order.id }, include: { items: true } })
    : null;
  if (data.invoiceId && !invoice) throw new ApiError(404, "Invoice not found for this Sales Order.");
  if (invoice?.status === "CANCELLED") throw new ApiError(400, "Cancelled invoices cannot create deliveries.");

  const [planned, allocatedReservations] = await Promise.all([
    plannedForOrder(businessId, order.id),
    reservationAllocatedForOrder(businessId, order.id),
  ]);
  const selected = data.items.map((requested) => {
    const orderItem = order.items.find((item) => item.id === requested.salesOrderItemId);
    if (!orderItem) throw new ApiError(400, "One or more selected items do not belong to the Sales Order.");
    const quantity = quantityDecimal(requested.quantity);
    if (quantity.lte(0)) throw new ApiError(400, `Delivery quantity must be greater than zero for ${orderItem.materialName}.`);
    const remaining = orderItem.quantity.minus(planned.get(orderItem.id) || 0);
    if (quantity.gt(remaining)) throw new ApiError(400, `Delivery quantity exceeds the remaining quantity for ${orderItem.materialName}. Available: ${remaining}.`);
    const unallocatedReservation = Prisma.Decimal.max(0, orderItem.reservedQuantity.minus(allocatedReservations.get(orderItem.id) || 0));
    const reservationShortfall = Prisma.Decimal.max(0, quantity.minus(unallocatedReservation));
    let invoiceItemId: string | null = null;
    if (requested.invoiceItemId) {
      const invoiceItem = invoice?.items.find((item) => item.id === requested.invoiceItemId);
      if (!invoiceItem || invoiceItem.salesOrderItemId !== orderItem.id) throw new ApiError(400, "Invoice item does not match the selected Sales Order item.");
      if (quantity.gt(invoiceItem.quantity)) throw new ApiError(400, `Delivery quantity exceeds the linked invoice quantity for ${orderItem.materialName}.`);
      invoiceItemId = invoiceItem.id;
    }
    return { orderItem, quantity, invoiceItemId, reservationShortfall };
  });

  const godownIds = Array.from(new Set(selected.map(({ orderItem }) => orderItem.godownId)));
  const godownCount = await prisma.godown.count({ where: { businessId, id: { in: godownIds }, isActive: true } });
  if (godownCount !== godownIds.length) throw new ApiError(400, "One or more reserved godowns are invalid or inactive.");

  return prisma.$transaction(async (tx) => {
    for (const { orderItem, reservationShortfall } of selected) {
      if (reservationShortfall.lte(0)) continue;
      const stock = await tx.godownStock.findUnique({
        where: { businessId_godownId_inventoryItemId: { businessId, godownId: orderItem.godownId, inventoryItemId: orderItem.inventoryItemId } },
      });
      const available = stock ? new Prisma.Decimal(stock.quantity).minus(stock.reservedQuantity) : new Prisma.Decimal(0);
      if (!stock || available.lt(reservationShortfall)) throw new ApiError(400, `Unreserved replacement stock is insufficient for ${orderItem.materialName}.`);
      await tx.godownStock.update({ where: { id: stock.id }, data: { reservedQuantity: { increment: Number(reservationShortfall.toString()) } } });
      await tx.salesOrderItem.update({ where: { id: orderItem.id }, data: { reservedQuantity: { increment: reservationShortfall } } });
    }
    const deliveryNumber = await nextDocumentNumber(tx, businessId, "LINKED_DELIVERY", "DEL");
    const challanNumber = await nextDocumentNumber(tx, businessId, "DELIVERY_CHALLAN", "DC");
    const total = selected.reduce((sum, item) => sum.plus(item.quantity), new Prisma.Decimal(0));
    const mixedUnits = new Set(selected.map(({ orderItem }) => orderItem.unit)).size > 1;
    return tx.delivery.create({
      data: {
        deliveryNumber,
        challanNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress || order.billingAddress || order.customer.shippingAddress || order.customer.billingAddress || "Address not provided",
        materialName: selected.length === 1 ? selected[0].orderItem.materialName : "Multiple Materials",
        quantity: Number(total.toString()),
        unit: mixedUnits ? "Mixed" : selected[0].orderItem.unit,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
        notes: data.notes,
        status: "PENDING",
        fulfilmentMode: LINKED_MODE,
        businessId,
        customerId: order.customerId,
        salesOrderId: order.id,
        invoiceId: invoice?.id || null,
        godownId: godownIds.length === 1 ? godownIds[0] : null,
        vehicleNumber: data.vehicleNumber,
        vehicleType: data.vehicleType,
        driverName: data.driverName,
        driverPhone: data.driverPhone,
        createdById: userId,
        items: { create: selected.map(({ orderItem, quantity, invoiceItemId }) => ({
          salesOrderItemId: orderItem.id,
          invoiceItemId,
          inventoryItemId: orderItem.inventoryItemId,
          godownId: orderItem.godownId,
          materialName: orderItem.materialName,
          sku: orderItem.sku,
          unit: orderItem.unit,
          plannedQuantity: quantity,
        })) },
      },
      include: detailInclude,
    });
  });
};

export const markReady = async (businessId: string, id: string, input: unknown) => {
  const data = readyLinkedDeliverySchema.parse(input);
  const delivery = await prisma.delivery.findFirst({ where: linkedWhere(businessId, id), include: { items: true } });
  if (!delivery) throw new ApiError(404, "Linked delivery not found.");
  if (delivery.status !== "PENDING") throw new ApiError(400, "Only pending deliveries can be marked ready.");
  if (!delivery.items.length) throw new ApiError(400, "Add at least one material before dispatch.");
  return prisma.delivery.update({
    where: { id },
    data: {
      status: "READY_FOR_DISPATCH", readyAt: new Date(),
      scheduledDate: data.scheduledDate === undefined ? delivery.scheduledDate : data.scheduledDate ? new Date(data.scheduledDate) : null,
      vehicleNumber: data.vehicleNumber === undefined ? delivery.vehicleNumber : data.vehicleNumber,
      vehicleType: data.vehicleType === undefined ? delivery.vehicleType : data.vehicleType,
      driverName: data.driverName === undefined ? delivery.driverName : data.driverName,
      driverPhone: data.driverPhone === undefined ? delivery.driverPhone : data.driverPhone,
    },
    include: detailInclude,
  });
};

export const dispatch = async (businessId: string, userId: string, id: string, input: unknown) => {
  const data = dispatchLinkedDeliverySchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const delivery = await tx.delivery.findFirst({ where: linkedWhere(businessId, id), include: { items: true, salesOrder: true } });
    if (!delivery) throw new ApiError(404, "Linked delivery not found.");
    if (delivery.stockPostedAt && !delivery.stockReversedAt) {
      return { delivery: await tx.delivery.findUniqueOrThrow({ where: { id }, include: detailInclude }), idempotentReplay: true };
    }
    if (delivery.stockReversedAt) throw new ApiError(409, "A reversed dispatch cannot be posted again.");
    if (delivery.status !== "READY_FOR_DISPATCH") throw new ApiError(400, "Only ready deliveries can be dispatched.");
    if (!delivery.salesOrder || !activeOrderStatuses.includes(delivery.salesOrder.status)) throw new ApiError(400, "The linked Sales Order is not eligible for dispatch.");
    if (!delivery.items.length) throw new ApiError(400, "Delivery has no materials.");

    const requestedMap = new Map((data.items || []).map((item) => [item.deliveryItemId, quantityDecimal(item.dispatchQuantity)]));
    if (data.items && requestedMap.size !== delivery.items.length) throw new ApiError(400, "Dispatch must include every delivery item.");
    const lines = delivery.items.map((item) => {
      const quantity = data.items ? requestedMap.get(item.id) : item.plannedQuantity;
      if (!quantity) throw new ApiError(400, "One or more dispatch items are invalid.");
      if (!quantity.eq(item.plannedQuantity)) throw new ApiError(400, "Dispatch quantity must equal the planned delivery quantity. Use a separate delivery for another partial shipment.");
      return { item, quantity };
    });

    for (const { item, quantity } of lines) {
      if (!item.salesOrderItemId) throw new ApiError(400, "Delivery item is not linked to a Sales Order item.");
      const [orderItem, stock] = await Promise.all([
        tx.salesOrderItem.findFirst({ where: { id: item.salesOrderItemId, salesOrderId: delivery.salesOrderId! } }),
        tx.godownStock.findUnique({ where: { businessId_godownId_inventoryItemId: { businessId, godownId: item.godownId, inventoryItemId: item.inventoryItemId } } }),
      ]);
      if (!orderItem || orderItem.godownId !== item.godownId || orderItem.inventoryItemId !== item.inventoryItemId) throw new ApiError(400, `Reservation location mismatch for ${item.materialName}.`);
      if (!stock || new Prisma.Decimal(stock.quantity).lt(quantity)) throw new ApiError(400, `Insufficient physical stock for ${item.materialName}.`);
      if (new Prisma.Decimal(stock.reservedQuantity).lt(quantity) || orderItem.reservedQuantity.lt(quantity)) throw new ApiError(400, `Insufficient reserved stock for ${item.materialName}.`);
    }

    for (const { item, quantity } of lines) {
      const numericQuantity = Number(quantity.toString());
      await tx.godownStock.update({
        where: { businessId_godownId_inventoryItemId: { businessId, godownId: item.godownId, inventoryItemId: item.inventoryItemId } },
        data: { quantity: { decrement: numericQuantity }, reservedQuantity: { decrement: numericQuantity } },
      });
      await tx.salesOrderItem.update({ where: { id: item.salesOrderItemId! }, data: { reservedQuantity: { decrement: quantity } } });
      await tx.deliveryItem.update({ where: { id: item.id }, data: { dispatchedQuantity: quantity } });
      await tx.stockTransaction.create({ data: {
        type: "OUT", quantity: numericQuantity, note: `Dispatch ${delivery.deliveryNumber}`,
        reason: "SALES_DELIVERY", referenceType: "DELIVERY", referenceId: delivery.id,
        idempotencyKey: `DELIVERY:${delivery.id}:DISPATCH:${item.id}`,
        inventoryItemId: item.inventoryItemId, godownId: item.godownId, userId, businessId,
      } });
      await syncMaterialAggregate(tx, businessId, item.inventoryItemId);
    }
    await tx.delivery.update({ where: { id }, data: { status: "OUT_FOR_DELIVERY", stockPostedAt: new Date(), dispatchedAt: new Date(), dispatchedById: userId } });
    return { delivery: await tx.delivery.findUniqueOrThrow({ where: { id }, include: detailInclude }), idempotentReplay: false };
  });
};

const recalculateOrderStatus = async (tx: Prisma.TransactionClient, salesOrderId: string) => {
  const items = await tx.salesOrderItem.findMany({ where: { salesOrderId } });
  const delivered = items.reduce((sum, item) => sum.plus(item.deliveredQuantity), new Prisma.Decimal(0));
  const ordered = items.reduce((sum, item) => sum.plus(item.quantity), new Prisma.Decimal(0));
  if (delivered.gt(0)) await tx.salesOrder.update({ where: { id: salesOrderId }, data: { status: delivered.gte(ordered) ? "FULFILLED" : "PARTIALLY_DELIVERED" } });
};

export const complete = async (businessId: string, userId: string, id: string, input: unknown) => {
  const data = completeLinkedDeliverySchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const delivery = await tx.delivery.findFirst({ where: linkedWhere(businessId, id), include: { items: true } });
    if (!delivery) throw new ApiError(404, "Linked delivery not found.");
    if (!delivery.stockPostedAt || delivery.stockReversedAt) throw new ApiError(400, "Only an active dispatched delivery can be completed.");
    if (!["OUT_FOR_DELIVERY", "PARTIALLY_DELIVERED"].includes(delivery.status)) throw new ApiError(400, "This delivery cannot be completed.");
    if (new Set(data.items.map((item) => item.deliveryItemId)).size !== data.items.length) throw new ApiError(400, "A delivery item can only appear once.");

    for (const requested of data.items) {
      const item = delivery.items.find((line) => line.id === requested.deliveryItemId);
      if (!item || !item.salesOrderItemId) throw new ApiError(400, "One or more completion items are invalid.");
      const received = quantityDecimal(requested.receivedQuantity);
      const rejected = quantityDecimal(requested.rejectedQuantity);
      if (received.lt(0) || rejected.lt(0)) throw new ApiError(400, "Received and rejected quantities cannot be negative.");
      if (received.lt(item.receivedQuantity) || rejected.lt(item.rejectedQuantity)) throw new ApiError(400, "Recorded delivery quantities cannot be reduced.");
      if (received.plus(rejected).gt(item.dispatchedQuantity)) throw new ApiError(400, `Received plus rejected quantity exceeds dispatched quantity for ${item.materialName}.`);
      const receivedDelta = received.minus(item.receivedQuantity);
      await tx.deliveryItem.update({ where: { id: item.id }, data: {
        receivedQuantity: received, rejectedQuantity: rejected,
        deliveredQuantity: received.plus(rejected), completionNotes: requested.notes,
      } });
      if (receivedDelta.gt(0)) await tx.salesOrderItem.update({ where: { id: item.salesOrderItemId }, data: { deliveredQuantity: { increment: receivedDelta } } });
    }

    const currentItems = await tx.deliveryItem.findMany({ where: { deliveryId: id } });
    const fullyAccounted = currentItems.every((item) => item.receivedQuantity.plus(item.rejectedQuantity).eq(item.dispatchedQuantity));
    const anyAccounted = currentItems.some((item) => item.receivedQuantity.plus(item.rejectedQuantity).gt(0));
    const now = data.confirmedAt ? new Date(data.confirmedAt) : new Date();
    await tx.delivery.update({ where: { id }, data: {
      status: fullyAccounted ? "DELIVERED" : anyAccounted ? "PARTIALLY_DELIVERED" : "OUT_FOR_DELIVERY",
      receiverName: data.receiverName, proofOfDeliveryReference: data.proofOfDeliveryReference,
      deliveryNotes: data.deliveryNotes, completedById: userId,
      deliveredAt: fullyAccounted ? now : null, confirmedAt: fullyAccounted ? now : null,
    } });
    if (delivery.salesOrderId) await recalculateOrderStatus(tx, delivery.salesOrderId);
    return tx.delivery.findUniqueOrThrow({ where: { id }, include: detailInclude });
  });
};

export const cancel = async (businessId: string, userId: string, id: string, input: unknown) => {
  const data = deliveryReasonSchema.parse(input);
  const delivery = await prisma.delivery.findFirst({ where: linkedWhere(businessId, id) });
  if (!delivery) throw new ApiError(404, "Linked delivery not found.");
  if (delivery.stockPostedAt && !delivery.stockReversedAt) throw new ApiError(400, "A posted delivery must use dispatch reversal; it cannot be cancelled directly.");
  if (!["PENDING", "READY_FOR_DISPATCH"].includes(delivery.status)) throw new ApiError(400, "Only an undispatched delivery can be cancelled.");
  return prisma.delivery.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: new Date(), cancelledById: userId, cancellationReason: data.reason }, include: detailInclude });
};

export const reverseDispatch = async (businessId: string, userId: string, id: string, input: unknown) => {
  const data = deliveryReasonSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const delivery = await tx.delivery.findFirst({ where: linkedWhere(businessId, id), include: { items: true, salesOrder: true } });
    if (!delivery) throw new ApiError(404, "Linked delivery not found.");
    if (delivery.stockReversedAt) return { delivery: await tx.delivery.findUniqueOrThrow({ where: { id }, include: detailInclude }), idempotentReplay: true };
    if (!delivery.stockPostedAt) throw new ApiError(400, "This delivery has not posted stock.");
    if (delivery.items.some((item) => item.receivedQuantity.gt(0) || item.rejectedQuantity.gt(0) || item.deliveredQuantity.gt(0))) {
      throw new ApiError(400, "A delivery with site-confirmed quantities cannot be reversed. Use a sales return workflow.");
    }
    for (const item of delivery.items) {
      if (item.dispatchedQuantity.lte(0) || !item.salesOrderItemId) throw new ApiError(400, "Delivery dispatch history is incomplete.");
      const numericQuantity = Number(item.dispatchedQuantity.toString());
      await tx.godownStock.update({
        where: { businessId_godownId_inventoryItemId: { businessId, godownId: item.godownId, inventoryItemId: item.inventoryItemId } },
        data: { quantity: { increment: numericQuantity } },
      });
      const orderItem = await tx.salesOrderItem.findUniqueOrThrow({ where: { id: item.salesOrderItemId } });
      let restoreReservation = new Prisma.Decimal(0);
      if (delivery.salesOrder && !["CANCELLED", "FULFILLED"].includes(delivery.salesOrder.status)) {
        const capacity = Prisma.Decimal.max(0, orderItem.quantity.minus(orderItem.deliveredQuantity).minus(orderItem.reservedQuantity));
        restoreReservation = Prisma.Decimal.min(item.dispatchedQuantity, capacity);
        if (restoreReservation.gt(0)) {
          await tx.godownStock.update({
            where: { businessId_godownId_inventoryItemId: { businessId, godownId: item.godownId, inventoryItemId: item.inventoryItemId } },
            data: { reservedQuantity: { increment: Number(restoreReservation.toString()) } },
          });
          await tx.salesOrderItem.update({ where: { id: item.salesOrderItemId }, data: { reservedQuantity: { increment: restoreReservation } } });
        }
      }
      await tx.deliveryItem.update({ where: { id: item.id }, data: { reversedQuantity: item.dispatchedQuantity } });
      await tx.stockTransaction.create({ data: {
        type: "IN", quantity: numericQuantity, note: `Reversal ${delivery.deliveryNumber}: ${data.reason}`,
        reason: "SALES_DELIVERY_REVERSAL", referenceType: "DELIVERY", referenceId: delivery.id,
        idempotencyKey: `DELIVERY:${delivery.id}:REVERSAL:${item.id}`,
        inventoryItemId: item.inventoryItemId, godownId: item.godownId, userId, businessId,
      } });
      await syncMaterialAggregate(tx, businessId, item.inventoryItemId);
    }
    await tx.delivery.update({ where: { id }, data: {
      status: "CANCELLED", stockReversedAt: new Date(), reversedById: userId,
      reversalReason: data.reason, cancelledAt: new Date(), cancelledById: userId,
    } });
    return { delivery: await tx.delivery.findUniqueOrThrow({ where: { id }, include: detailInclude }), idempotentReplay: false };
  });
};
