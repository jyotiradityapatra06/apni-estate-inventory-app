import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { AddressInfo } from "net";

const dbPath = path.join(__dirname, "../prisma/test-313.db");
const journal = `${dbPath}-journal`;
process.env.DATABASE_URL = `file:${dbPath}`;

import app from "../src/app";
import { prisma } from "../src/config/db";
import { generateToken } from "../src/utils/jwt";
import { syncMaterialAggregate } from "../src/services/stockBalance.service";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const n = (val: any) => {
  if (val === null || val === undefined) return 0;
  return Number(val);
};

async function main() {
  console.log("=== Starting Phase 3.13 Returns Management Verification ===");
  
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  if (fs.existsSync(journal)) fs.unlinkSync(journal);

  console.log("1. Running database migrations...");
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });

  // Create isolated Business A and Business B
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const businessA = await prisma.business.create({ data: { name: `Scenario A ${suffix}`, gstNumber: "27AABFR5987M1ZP" } });
  const businessB = await prisma.business.create({ data: { name: `Scenario B ${suffix}`, gstNumber: "27BCAFR5987M1ZP" } });

  // Create users
  const ownerA = await prisma.user.create({ data: { name: "Owner A", email: `owner-a-${suffix}@test.local`, passwordHash: "dummy", role: "OWNER", businessId: businessA.id } });
  const staffA = await prisma.user.create({ data: { name: "Staff A", email: `staff-a-${suffix}@test.local`, passwordHash: "dummy", role: "STAFF", businessId: businessA.id } });
  const ownerB = await prisma.user.create({ data: { name: "Owner B", email: `owner-b-${suffix}@test.local`, passwordHash: "dummy", role: "OWNER", businessId: businessB.id } });

  // Setup default godowns
  const defaultGodownA = await prisma.godown.create({ data: { godownCode: "MAIN", name: "Main Godown", businessId: businessA.id, isActive: true } });
  const defaultGodownB = await prisma.godown.create({ data: { godownCode: "MAIN", name: "Main Godown", businessId: businessB.id, isActive: true } });

  // Setup materials
  const cement = await prisma.inventoryItem.create({
    data: {
      materialName: "ACC Cement",
      category: "Cement",
      sku: "ACC-CEM",
      unit: "Bags",
      reorderLevel: 20,
      location: "Main Godown",
      costPrice: 100,
      sellingPrice: 200,
      taxRate: 18,
      businessId: businessA.id,
    }
  });

  // Initialize stock for Business A
  await prisma.godownStock.create({
    data: {
      businessId: businessA.id,
      godownId: defaultGodownA.id,
      inventoryItemId: cement.id,
      quantity: 10,
    }
  });
  await syncMaterialAggregate(prisma, businessA.id, cement.id);

  // Setup customer & supplier
  const customer = await prisma.customer.create({
    data: {
      customerCode: "C-100",
      name: "Customer A",
      phone: "9876543210",
      businessId: businessA.id,
    }
  });

  const supplier = await prisma.supplier.create({
    data: {
      supplierCode: "S-100",
      name: "Supplier A",
      phone: "8765432109",
      businessId: businessA.id,
    }
  });

  // Setup Sales Order & Invoice
  const salesOrder = await prisma.salesOrder.create({
    data: {
      orderNumber: "SO-100",
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      status: "CONFIRMED",
      taxMode: "GST",
      taxableTotal: 2000,
      totalAmount: 2360,
      businessId: businessA.id,
      createdById: ownerA.id,
      items: {
        create: {
          inventoryItemId: cement.id,
          godownId: defaultGodownA.id,
          materialName: cement.materialName,
          sku: cement.sku,
          unit: cement.unit,
          quantity: 10,
          rate: 200,
          discountRate: 0,
          gstRate: 18,
          lineTotal: 2360,
          grossAmount: 2000,
          taxableAmount: 2000,
        }
      }
    },
    include: { items: true }
  }) as any;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-100",
      status: "ISSUED",
      invoiceType: "GST",
      salesOrderId: salesOrder.id,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      businessName: businessA.name,
      taxableTotal: 2000,
      taxTotal: 360,
      totalAmount: 2360,
      balanceDue: 2360,
      businessId: businessA.id,
      createdById: ownerA.id,
      items: {
        create: {
          salesOrderItemId: salesOrder.items[0].id,
          inventoryItemId: cement.id,
          materialName: cement.materialName,
          sku: cement.sku,
          unit: cement.unit,
          quantity: 10,
          rate: 200,
          discountRate: 0,
          gstRate: 18,
          lineTotal: 2360,
          cgstRate: 9,
          sgstRate: 9,
          igstRate: 0,
          cgstAmount: 180,
          sgstAmount: 180,
          igstAmount: 0,
          taxableAmount: 2000,
          grossAmount: 2000,
        }
      }
    },
    include: { items: true }
  }) as any;

  await prisma.salesOrderItem.update({
    where: { id: salesOrder.items[0].id },
    data: { invoicedQuantity: 10 }
  });
  await prisma.salesOrder.update({
    where: { id: salesOrder.id },
    data: { status: "INVOICED" }
  });
  await prisma.customer.update({
    where: { id: customer.id },
    data: { outstandingBalance: { increment: 2360 } }
  });

  // Setup Purchase Order
  const po = await prisma.purchaseOrder.create({
    data: {
      purchaseOrderNumber: "PO-100",
      status: "RECEIVED",
      paymentStatus: "PENDING",
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierPhone: supplier.phone,
      taxableTotal: 1000,
      taxTotal: 180,
      totalAmount: 1180,
      receivedAmount: 1180,
      amountPaid: 0,
      balanceDue: 1180,
      businessId: businessA.id,
      createdById: ownerA.id,
      items: {
        create: {
          inventoryItemId: cement.id,
          godownId: defaultGodownA.id,
          materialName: cement.materialName,
          sku: cement.sku,
          unit: cement.unit,
          quantity: 10,
          receivedQuantity: 10,
          rate: 100,
          discountRate: 0,
          gstRate: 18,
          taxAmount: 180,
          lineTotal: 1180,
          grossAmount: 1000,
          taxableAmount: 1000,
        }
      }
    },
    include: { items: true }
  }) as any;
  await prisma.supplier.update({
    where: { id: supplier.id },
    data: { pendingPayments: { increment: 1180 } }
  });

  // Setup server and call helpers
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const port = (server.address() as AddressInfo).port;
  const base = `http://127.0.0.1:${port}/api`;
  const token = (u: any) => generateToken({ userId: u.id, businessId: u.businessId, role: u.role });
  
  const call = async (method: string, pathStr: string, u: any, body?: unknown) => {
    const r = await fetch(`${base}${pathStr}`, {
      method,
      headers: {
        authorization: `Bearer ${token(u)}`,
        "content-type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await r.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch {}
    return { status: r.status, json, text };
  };

  try {
    console.log("2. Verifying Sales Returns Lifecycle...");
    // 2.1 Verify validation - return quantity cannot exceed sold
    const invalidSrRes = await call("POST", "/sales-returns", ownerA, {
      invoiceId: invoice.id,
      reason: "Customer changed mind",
      notes: "Invalid return test",
      idempotencyKey: crypto.randomUUID(),
      items: [
        { invoiceItemId: invoice.items[0].id, quantity: 11, godownId: defaultGodownA.id }
      ]
    });
    assert(invalidSrRes.status === 400, "Should reject sales return exceeding sold quantity");

    // 2.2 Create draft Sales Return (6 units)
    const keyA = crypto.randomUUID();
    const srRes = await call("POST", "/sales-returns", ownerA, {
      invoiceId: invoice.id,
      reason: "Defective batch",
      notes: "Returning 6 bags",
      idempotencyKey: keyA,
      items: [
        { invoiceItemId: invoice.items[0].id, quantity: 6, godownId: defaultGodownA.id }
      ]
    });
    assert(srRes.status === 201, `Failed to create draft sales return: ${srRes.text}`);
    const sr = srRes.json.data;
    assert(sr.status === "DRAFT", "Initial return status should be DRAFT");

    // 2.3 Staff RBAC check - STAFF can view and create, but cannot post or cancel
    const staffPost = await call("POST", `/sales-returns/${sr.id}/post`, staffA);
    assert(staffPost.status === 403, "Staff should be blocked from completing returns");

    // 2.4 Complete Sales Return
    const postRes = await call("POST", `/sales-returns/${sr.id}/post`, ownerA);
    assert(postRes.status === 200, `Failed to complete sales return: ${postRes.text}`);
    const completedSr = postRes.json.data;
    assert(completedSr.status === "COMPLETED", "Completed return status should be COMPLETED");

    // Verify stock is restored in default godown (+6)
    const stockA = await prisma.godownStock.findUniqueOrThrow({
      where: { businessId_godownId_inventoryItemId: { businessId: businessA.id, godownId: defaultGodownA.id, inventoryItemId: cement.id } }
    });
    // 10 initial stock + 6 returned = 16
    assert(stockA.quantity === 16, `Stock should be 16, got ${stockA.quantity}`);

    // Verify customer outstanding balance is decremented (-1416)
    const updatedCust = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
    // 2360 initial - 1416 (6 * 200 * 1.18) = 944
    assert(n(updatedCust.outstandingBalance) === 944, `Customer balance should be 944, got ${updatedCust.outstandingBalance}`);

    // Verify ledger entry is posted
    const ledgerEntry = await prisma.ledgerEntry.findFirst({
      where: { businessId: businessA.id, referenceType: "SALES_RETURN", referenceId: sr.id }
    });
    assert(ledgerEntry !== null, "Ledger entry should be posted");
    assert(n(ledgerEntry?.creditAmount) === 1416, "Credit amount should be 1416");

    // 2.5 Verify Idempotency - double completion blocks stock/balance modification
    const duplicatePost = await call("POST", `/sales-returns/${sr.id}/post`, ownerA);
    assert(duplicatePost.status === 400, "Should block duplicate completion of Sales Return");

    console.log("3. Verifying Purchase Returns Lifecycle...");
    // 3.1 Verify validation - return quantity cannot exceed received
    const invalidPrRes = await call("POST", "/purchase-returns", ownerA, {
      purchaseOrderId: po.id,
      reason: "Defective",
      idempotencyKey: crypto.randomUUID(),
      items: [
        { purchaseOrderItemId: po.items[0].id, quantity: 11, godownId: defaultGodownA.id }
      ]
    });
    assert(invalidPrRes.status === 400, "Should reject purchase return exceeding received quantity");

    // 3.2 Create draft Purchase Return (4 units)
    const prKey = crypto.randomUUID();
    const prRes = await call("POST", "/purchase-returns", ownerA, {
      purchaseOrderId: po.id,
      reason: "Supplier return",
      idempotencyKey: prKey,
      items: [
        { purchaseOrderItemId: po.items[0].id, quantity: 4, godownId: defaultGodownA.id }
      ]
    });
    assert(prRes.status === 201, `Failed to create draft purchase return: ${prRes.text}`);
    const pr = prRes.json.data;

    // 3.3 Complete Purchase Return
    const postPrRes = await call("POST", `/purchase-returns/${pr.id}/post`, ownerA);
    assert(postPrRes.status === 200, `Failed to complete purchase return: ${postPrRes.text}`);

    // Verify stock is deducted from default godown (-4)
    const stockAPost = await prisma.godownStock.findUniqueOrThrow({
      where: { businessId_godownId_inventoryItemId: { businessId: businessA.id, godownId: defaultGodownA.id, inventoryItemId: cement.id } }
    });
    // 16 - 4 = 12
    assert(stockAPost.quantity === 12, `Stock should be 12, got ${stockAPost.quantity}`);

    // Verify supplier outstanding balance is decremented (-472)
    const updatedSupp = await prisma.supplier.findUniqueOrThrow({ where: { id: supplier.id } });
    // 1180 initial - 472 (4 * 100 * 1.18) = 708
    assert(n(updatedSupp.pendingPayments) === 708, `Supplier pendingPayments should be 708, got ${updatedSupp.pendingPayments}`);

    // Verify ledger entry is posted
    const ledgerPrEntry = await prisma.ledgerEntry.findFirst({
      where: { businessId: businessA.id, referenceType: "PURCHASE_RETURN", referenceId: pr.id }
    });
    assert(ledgerPrEntry !== null, "Ledger entry for purchase return should be posted");
    assert(n(ledgerPrEntry?.debitAmount) === 472, "Debit amount should be 472");

    console.log("4. Verifying Cross-Business Isolation...");
    const crossSr = await call("GET", `/sales-returns/${sr.id}`, ownerB);
    assert(crossSr.status === 404, "Should block cross-business return views with 404");

    const crossPr = await call("POST", `/purchase-returns/${pr.id}/post`, ownerB);
    assert(crossPr.status === 404, "Should block cross-business return operations with 404");

    console.log("5. Verifying Reports Adjustments...");
    const repSales = await call("GET", "/reports/sales", ownerA);
    // Adjusted total sales: 2360 initial - 1416 returned = 944
    assert(repSales.json.summary.totalSales === 944, `Report totalSales should be 944, got ${repSales.json.summary.totalSales}`);

    const repPurch = await call("GET", "/reports/purchases", ownerA);
    // Adjusted received purchases: 1180 - 472 returned = 708
    assert(repPurch.json.summary.receivedPurchaseValue === 708, `Report received purchases should be 708, got ${repPurch.json.summary.receivedPurchaseValue}`);

    const repGst = await call("GET", "/reports/gst-summary", ownerA);
    // Sales taxable: 2000 - 1200 returned = 800. Output GST: 360 - 216 returned = 144
    assert(repGst.json.summary.salesGst.taxableSales === 800, `Report taxable sales should be 800, got ${repGst.json.summary.salesGst.taxableSales}`);
    assert(repGst.json.summary.salesGst.outputGst === 144, `Report output GST should be 144, got ${repGst.json.summary.salesGst.outputGst}`);

    console.log("=== All Phase 3.13 Returns Management Verification Passed! ===");
  } finally {
    server.close();
    // Manual cleanups
    try {
      await prisma.salesReturnItem.deleteMany({ where: { salesReturn: { businessId: { in: [businessA.id, businessB.id] } } } });
      await prisma.salesReturn.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.purchaseReturnItem.deleteMany({ where: { purchaseReturn: { businessId: { in: [businessA.id, businessB.id] } } } });
      await prisma.purchaseReturn.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.ledgerEntry.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.purchaseOrder.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.invoice.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.salesOrder.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.stockTransaction.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.godownStock.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.inventoryItem.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.godown.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.customer.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.supplier.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.user.deleteMany({ where: { businessId: { in: [businessA.id, businessB.id] } } });
      await prisma.business.deleteMany({ where: { id: { in: [businessA.id, businessB.id] } } });
    } catch (e) {}
    await prisma.$disconnect();
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    if (fs.existsSync(journal)) fs.unlinkSync(journal);
  }
}

main().catch(e => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
