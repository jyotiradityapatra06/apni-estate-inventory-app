import app from "../src/app";
import { prisma } from "../src/config/db";

const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };

async function main() {
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Unable to start test server");
  const base = `http://127.0.0.1:${address.port}`;
  const call = async (method: string, path: string, token?: string, body?: unknown) => {
    const response = await fetch(`${base}${path}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const json: any = await response.json();
    return { status: response.status, json };
  };
  try {
    const login = await call("POST", "/api/auth/login", undefined, { email: "owner@apniestate.com", password: "Admin@123" });
    assert(login.status === 200, "Owner login failed");
    const token = login.json.data.token as string;
    const businessId = login.json.data.user.businessId as string;
    await prisma.customer.deleteMany({ where: { businessId, customerCode: "CUS-P2B" } });
    const customer = await prisma.customer.create({ data: { customerCode: "CUS-P2B", name: "Phase 2B Site", phone: "9876543210", businessId } });
    const cement = await prisma.inventoryItem.findFirstOrThrow({ where: { businessId, sku: "CEM-OPC-53" } });
    const plywood = await prisma.inventoryItem.findFirstOrThrow({ where: { businessId, sku: "PLY-COM-19" } });
    const cementStock = await prisma.godownStock.findFirstOrThrow({ where: { businessId, inventoryItemId: cement.id } });
    const plywoodStock = await prisma.godownStock.findFirstOrThrow({ where: { businessId, inventoryItemId: plywood.id } });

    const createOrder = async (items: Array<{ materialId: string; godownId: string; quantity: number; rate: number }>) => {
      const response = await call("POST", "/api/sales-orders", token, { customerId: customer.id, taxMode: "GST", placeOfSupplyCode: "27", items: items.map((i) => ({ inventoryItemId: i.materialId, godownId: i.godownId, quantity: i.quantity, rate: i.rate, gstRate: 18 })) });
      assert(response.status === 201, `Sales Order creation failed: ${JSON.stringify(response.json)}`);
      const confirmed = await call("POST", `/api/sales-orders/${response.json.data.id}/confirm`, token);
      assert(confirmed.status === 200, `Sales Order confirmation failed: ${JSON.stringify(confirmed.json)}`);
      return confirmed.json.data;
    };
    const createDelivery = async (order: any, quantities: number[]) => {
      const response = await call("POST", "/api/linked-deliveries", token, { salesOrderId: order.id, scheduledDate: new Date().toISOString(), items: order.items.map((item: any, index: number) => ({ salesOrderItemId: item.id, quantity: quantities[index] })) });
      assert(response.status === 201, `Linked delivery creation failed: ${JSON.stringify(response.json)}`);
      const ready = await call("POST", `/api/linked-deliveries/${response.json.data.id}/ready`, token, { vehicleNumber: "MH12TEST1", driverName: "Test Driver" });
      assert(ready.status === 200, "Mark ready failed");
      return ready.json.data;
    };

    // Full delivery, stock posting, duplicate dispatch, completion, and fulfilment.
    const fullOrder = await createOrder([{ materialId: cement.id, godownId: cementStock.godownId, quantity: 100, rate: 420 }]);
    const fullDelivery = await createDelivery(fullOrder, [100]);
    const beforeFull = await prisma.godownStock.findUniqueOrThrow({ where: { id: cementStock.id } });
    const dispatched = await call("POST", `/api/linked-deliveries/${fullDelivery.id}/dispatch`, token, {});
    assert(dispatched.status === 200 && !dispatched.json.idempotentReplay, "Full dispatch failed");
    const duplicateDispatch = await call("POST", `/api/linked-deliveries/${fullDelivery.id}/dispatch`, token, {});
    assert(duplicateDispatch.status === 200 && duplicateDispatch.json.idempotentReplay, "Duplicate dispatch was not idempotent");
    const afterFull = await prisma.godownStock.findUniqueOrThrow({ where: { id: cementStock.id } });
    assert(beforeFull.quantity - afterFull.quantity === 100 && beforeFull.reservedQuantity - afterFull.reservedQuantity === 100, "Dispatch stock movement is incorrect");
    const completion = await call("POST", `/api/linked-deliveries/${fullDelivery.id}/complete`, token, { receiverName: "Site Receiver", items: [{ deliveryItemId: dispatched.json.data.items[0].id, receivedQuantity: 100, rejectedQuantity: 0 }] });
    assert(completion.status === 200 && completion.json.data.status === "DELIVERED", "Full completion failed");
    assert((await prisma.salesOrder.findUniqueOrThrow({ where: { id: fullOrder.id } })).status === "FULFILLED", "Full order was not fulfilled");

    // Partial and multiple deliveries, including rejected quantity.
    const partialOrder = await createOrder([{ materialId: cement.id, godownId: cementStock.godownId, quantity: 200, rate: 420 }]);
    const partOne = await createDelivery(partialOrder, [120]);
    const partOneDispatch = await call("POST", `/api/linked-deliveries/${partOne.id}/dispatch`, token, {});
    await call("POST", `/api/linked-deliveries/${partOne.id}/complete`, token, { receiverName: "Receiver", items: [{ deliveryItemId: partOneDispatch.json.data.items[0].id, receivedQuantity: 110, rejectedQuantity: 10 }] });
    assert((await prisma.salesOrder.findUniqueOrThrow({ where: { id: partialOrder.id } })).status === "PARTIALLY_DELIVERED", "Partial order status incorrect");
    const available = await call("GET", `/api/sales-orders/${partialOrder.id}/deliverable-items`, token);
    assert(Number(available.json.data.items[0].availableToPlan) === 90, "Rejected quantity was not released for redelivery");
    const refreshedPartial = await call("GET", `/api/sales-orders/${partialOrder.id}`, token);
    const partTwo = await createDelivery(refreshedPartial.json.data, [80]);
    const partTwoDispatch = await call("POST", `/api/linked-deliveries/${partTwo.id}/dispatch`, token, {});
    await call("POST", `/api/linked-deliveries/${partTwo.id}/complete`, token, { receiverName: "Receiver", items: [{ deliveryItemId: partTwoDispatch.json.data.items[0].id, receivedQuantity: 80, rejectedQuantity: 0 }] });
    assert((await prisma.salesOrder.findUniqueOrThrow({ where: { id: partialOrder.id } })).status === "PARTIALLY_DELIVERED", "Rejected quantity incorrectly fulfilled the order");
    const refreshedAfterRejected = await call("GET", `/api/sales-orders/${partialOrder.id}`, token);
    const replacement = await createDelivery(refreshedAfterRejected.json.data, [10]);
    const replacementDispatch = await call("POST", `/api/linked-deliveries/${replacement.id}/dispatch`, token, {});
    await call("POST", `/api/linked-deliveries/${replacement.id}/complete`, token, { receiverName: "Receiver", items: [{ deliveryItemId: replacementDispatch.json.data.items[0].id, receivedQuantity: 10, rejectedQuantity: 0 }] });
    assert((await prisma.salesOrder.findUniqueOrThrow({ where: { id: partialOrder.id } })).status === "FULFILLED", "Replacement delivery did not fulfil rejected quantity");

    // Insufficient stock and multi-line atomic rollback.
    const rollbackOrder = await createOrder([
      { materialId: cement.id, godownId: cementStock.godownId, quantity: 10, rate: 420 },
      { materialId: plywood.id, godownId: plywoodStock.godownId, quantity: 10, rate: 2200 },
    ]);
    const rollbackDelivery = await createDelivery(rollbackOrder, [10, 10]);
    const cementBeforeRollback = await prisma.godownStock.findUniqueOrThrow({ where: { id: cementStock.id } });
    const originalPlywood = await prisma.godownStock.findUniqueOrThrow({ where: { id: plywoodStock.id } });
    await prisma.godownStock.update({ where: { id: plywoodStock.id }, data: { quantity: 0 } });
    const rollbackDispatch = await call("POST", `/api/linked-deliveries/${rollbackDelivery.id}/dispatch`, token, {});
    assert(rollbackDispatch.status === 400, "Insufficient stock dispatch did not fail");
    assert((await prisma.godownStock.findUniqueOrThrow({ where: { id: cementStock.id } })).quantity === cementBeforeRollback.quantity, "Dispatch transaction did not roll back");
    assert((await prisma.stockTransaction.count({ where: { referenceId: rollbackDelivery.id } })) === 0, "Rollback left stock transactions");
    await prisma.godownStock.update({ where: { id: plywoodStock.id }, data: { quantity: originalPlywood.quantity } });

    // Reversal and duplicate reversal.
    const reverseOrder = await createOrder([{ materialId: cement.id, godownId: cementStock.godownId, quantity: 20, rate: 420 }]);
    const reverseDelivery = await createDelivery(reverseOrder, [20]);
    await call("POST", `/api/linked-deliveries/${reverseDelivery.id}/dispatch`, token, {});
    const beforeReverse = await prisma.godownStock.findUniqueOrThrow({ where: { id: cementStock.id } });
    const reversed = await call("POST", `/api/linked-deliveries/${reverseDelivery.id}/reverse-dispatch`, token, { reason: "Verification reversal" });
    assert(reversed.status === 200 && !reversed.json.idempotentReplay, "Dispatch reversal failed");
    const duplicateReverse = await call("POST", `/api/linked-deliveries/${reverseDelivery.id}/reverse-dispatch`, token, { reason: "Verification reversal" });
    assert(duplicateReverse.status === 200 && duplicateReverse.json.idempotentReplay, "Duplicate reversal was not idempotent");
    assert((await prisma.godownStock.findUniqueOrThrow({ where: { id: cementStock.id } })).quantity - beforeReverse.quantity === 20, "Reversal did not restore physical stock once");

    // Cancellation before dispatch.
    const cancelOrder = await createOrder([{ materialId: cement.id, godownId: cementStock.godownId, quantity: 5, rate: 420 }]);
    const cancelCreate = await call("POST", "/api/linked-deliveries", token, { salesOrderId: cancelOrder.id, items: [{ salesOrderItemId: cancelOrder.items[0].id, quantity: 5 }] });
    const cancelled = await call("POST", `/api/linked-deliveries/${cancelCreate.json.data.id}/cancel`, token, { reason: "Verification cancellation" });
    assert(cancelled.status === 200 && cancelled.json.data.status === "CANCELLED", "Pre-dispatch cancellation failed");
    const overDelivery = await call("POST", "/api/linked-deliveries", token, { salesOrderId: cancelOrder.id, items: [{ salesOrderItemId: cancelOrder.items[0].id, quantity: 6 }] });
    assert(overDelivery.status === 400, "Over-delivery was not rejected");

    // Invoice-linked creation validates InvoiceItem to SalesOrderItem linkage.
    const invoiceOrder = await createOrder([{ materialId: cement.id, godownId: cementStock.godownId, quantity: 6, rate: 420 }]);
    const invoice = await call("POST", "/api/invoices", token, { salesOrderId: invoiceOrder.id, items: [{ salesOrderItemId: invoiceOrder.items[0].id, quantity: 6 }] });
    assert(invoice.status === 201, "Draft invoice creation failed");
    const invoiceLinked = await call("POST", "/api/linked-deliveries", token, { salesOrderId: invoiceOrder.id, invoiceId: invoice.json.data.id, items: [{ salesOrderItemId: invoiceOrder.items[0].id, invoiceItemId: invoice.json.data.items[0].id, quantity: 6 }] });
    assert(invoiceLinked.status === 201 && invoiceLinked.json.data.invoiceId === invoice.json.data.id, "Invoice-linked delivery creation failed");
    await call("POST", `/api/linked-deliveries/${invoiceLinked.json.data.id}/cancel`, token, { reason: "Invoice-link verification complete" });

    // Tenant isolation and role protection.
    const tenant = await call("POST", "/api/auth/register", undefined, { name: "Tenant Owner", email: "tenant-p2b@example.com", password: "Tenant@123", businessName: "Other Tenant" });
    assert(tenant.status === 201, "Second tenant registration failed");
    const foreignRead = await call("GET", `/api/linked-deliveries/${fullDelivery.id}`, tenant.json.data.token);
    assert(foreignRead.status === 404, "Tenant isolation failed");
    const staffLogin = await call("POST", "/api/auth/login", undefined, { email: "staff@apniestate.com", password: "Admin@123" });
    const staffRead = await call("GET", "/api/linked-deliveries", staffLogin.json.data.token);
    assert(staffRead.status === 403, "Staff unexpectedly received linked-delivery access");
    const managerLogin = await call("POST", "/api/auth/login", undefined, { email: "manager@apniestate.com", password: "Admin@123" });
    const managerReverse = await call("POST", `/api/linked-deliveries/${fullDelivery.id}/reverse-dispatch`, managerLogin.json.data.token, { reason: "Must be denied" });
    assert(managerReverse.status === 403, "Manager unexpectedly received reversal permission");

    const legacyDeleteLinked = await call("DELETE", `/api/deliveries/${fullDelivery.id}`, token);
    assert(legacyDeleteLinked.status === 404, "Legacy route could delete linked delivery history");

    // Legacy delivery compatibility and no automatic stock movement.
    const stockBeforeLegacy = (await prisma.inventoryItem.findUniqueOrThrow({ where: { id: cement.id } })).quantity;
    const legacy = await call("POST", "/api/deliveries", token, { customerName: "Legacy Customer", deliveryAddress: "Legacy Address", materialName: "Cement", quantity: 2, unit: "Bags" });
    assert(legacy.status === 201 && legacy.json.data.fulfilmentMode === "LEGACY", "Legacy delivery compatibility failed");
    assert((await prisma.inventoryItem.findUniqueOrThrow({ where: { id: cement.id } })).quantity === stockBeforeLegacy, "Legacy delivery changed stock");

    console.log(JSON.stringify({ success: true, checks: ["login", "full delivery", "partial delivery", "multiple deliveries", "rejected quantity", "insufficient stock", "transaction rollback", "duplicate dispatch", "reversal", "duplicate reversal", "cancellation", "over-delivery rejection", "invoice-linked delivery", "tenant isolation", "staff denial", "legacy compatibility", "sales order statuses"] }, null, 2));
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
