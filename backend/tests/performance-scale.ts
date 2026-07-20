import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { AddressInfo } from "net";

const dbPath = path.join(__dirname, "../prisma/perf-scale.db");
process.env.DATABASE_URL = `file:${dbPath}`;

import app from "../src/app";
import { prisma } from "../src/config/db";
import { generateToken } from "../src/utils/jwt";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

async function main() {
  console.log("=== Starting Performance Scale Profiling (SQLite) ===");
  
  // Cleanup any old db files
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  const journal = `${dbPath}-journal`;
  if (fs.existsSync(journal)) fs.unlinkSync(journal);

  console.log("1. Running database migrations on fresh test database...");
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });

  const business = await prisma.business.create({
    data: { name: "Scale Test Business", gstNumber: "27AABFR5987M1ZP" }
  });

  const owner = await prisma.user.create({
    data: { name: "Owner A", email: "perf-owner@t.local", passwordHash: "x", role: "OWNER", businessId: business.id }
  });

  const customer = await prisma.customer.create({
    data: { customerCode: "C-PERF", name: "Perf Customer", phone: "9876543210", businessId: business.id }
  });

  const supplier = await prisma.supplier.create({
    data: { supplierCode: "S-PERF", name: "Perf Supplier", phone: "9876543210", businessId: business.id }
  });

  const godown = await prisma.godown.create({
    data: { godownCode: "G-PERF", name: "Perf Main Godown", businessId: business.id }
  });

  const material = await prisma.inventoryItem.create({
    data: { materialName: "Perf OPC Cement", category: "Cement", sku: "PERF-CEM", unit: "Bags", quantity: 100000, location: "Perf Main Godown", businessId: business.id }
  });

  const category = await prisma.expenseCategory.create({
    data: { name: "Fuel", normalizedName: "fuel", businessId: business.id, createdById: owner.id }
  });

  console.log("2. Seeding 10,000 Invoices in memory...");
  const invoices: any[] = [];
  const invoiceItems: any[] = [];
  for (let i = 1; i <= 10000; i++) {
    const invId = crypto.randomUUID();
    invoices.push({
      id: invId,
      invoiceNumber: `INV-P-${i.toString().padStart(5, "0")}`,
      invoiceDate: new Date(),
      status: "ISSUED",
      customerId: customer.id,
      businessName: business.name,
      customerName: customer.name,
      taxableTotal: 1000,
      taxTotal: 180,
      totalAmount: 1180,
      amountPaid: 1180,
      balanceDue: 0,
      businessId: business.id,
      createdById: owner.id
    });
    invoiceItems.push({
      invoiceId: invId,
      inventoryItemId: material.id,
      materialName: material.materialName,
      sku: material.sku,
      unit: material.unit,
      quantity: 10,
      rate: 100,
      grossAmount: 1000,
      taxableAmount: 1000,
      gstRate: 18,
      lineTotal: 1180
    });
  }

  console.log("3. Seeding 10,000 Purchase Orders...");
  const purchases: any[] = [];
  for (let i = 1; i <= 10000; i++) {
    purchases.push({
      id: crypto.randomUUID(),
      purchaseOrderNumber: `PO-P-${i.toString().padStart(5, "0")}`,
      orderDate: new Date(),
      status: "RECEIVED",
      paymentStatus: "PAID",
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierPhone: supplier.phone,
      totalAmount: 1000,
      receivedAmount: 1000,
      amountPaid: 1000,
      balanceDue: 0,
      businessId: business.id,
      createdById: owner.id
    });
  }

  console.log("4. Seeding 10,000 Expenses...");
  const expenses: any[] = [];
  for (let i = 1; i <= 10000; i++) {
    expenses.push({
      id: crypto.randomUUID(),
      expenseNumber: `EXP-P-${i.toString().padStart(5, "0")}`,
      expenseDate: new Date(),
      categoryId: category.id,
      payee: "Gas Station",
      amount: 500,
      totalAmount: 500,
      paymentStatus: "PAID",
      paymentMode: "CASH",
      businessId: business.id,
      createdById: owner.id
    });
  }

  console.log("5. Seeding 50,000 ledger and stock transactions...");
  const ledgers: any[] = [];
  const stockTransactions: any[] = [];
  for (let i = 1; i <= 25000; i++) {
    ledgers.push({
      businessId: business.id,
      partyType: "CUSTOMER",
      partyId: customer.id,
      transactionType: "CUSTOMER_PAYMENT",
      referenceType: "CUSTOMER_PAYMENT",
      referenceId: crypto.randomUUID(),
      amount: 100,
      debitAmount: 0,
      creditAmount: 100,
      description: `Bulk payment customer ${i}`,
      createdById: owner.id,
      idempotencyKey: `LEDGER-C-${i}`
    });
    ledgers.push({
      businessId: business.id,
      partyType: "SUPPLIER",
      partyId: supplier.id,
      transactionType: "SUPPLIER_PAYMENT",
      referenceType: "PURCHASE_PAYMENT",
      referenceId: crypto.randomUUID(),
      amount: 100,
      debitAmount: 100,
      creditAmount: 0,
      description: `Bulk payment supplier ${i}`,
      createdById: owner.id,
      idempotencyKey: `LEDGER-S-${i}`
    });
    stockTransactions.push({
      type: "IN",
      quantity: 10,
      reason: "PURCHASE_RECEIPT",
      inventoryItemId: material.id,
      godownId: godown.id,
      userId: owner.id,
      businessId: business.id,
      idempotencyKey: `STOCK-I-${i}`
    });
    stockTransactions.push({
      type: "OUT",
      quantity: 5,
      reason: "SALE",
      inventoryItemId: material.id,
      godownId: godown.id,
      userId: owner.id,
      businessId: business.id,
      idempotencyKey: `STOCK-O-${i}`
    });
  }

  console.log("6. Performing bulk database insert (this will take a few seconds)...");
  const timeStartInsert = Date.now();
  await prisma.invoice.createMany({ data: invoices });
  await prisma.invoiceItem.createMany({ data: invoiceItems });
  await prisma.purchaseOrder.createMany({ data: purchases });
  await prisma.expense.createMany({ data: expenses });
  await prisma.ledgerEntry.createMany({ data: ledgers });
  await prisma.stockTransaction.createMany({ data: stockTransactions });
  console.log(`Database seeded in: ${((Date.now() - timeStartInsert) / 1000).toFixed(2)}s`);

  // Verify dataset counts
  const [invCount, poCount, expCount, ledgCount, stCount] = await Promise.all([
    prisma.invoice.count({ where: { businessId: business.id } }),
    prisma.purchaseOrder.count({ where: { businessId: business.id } }),
    prisma.expense.count({ where: { businessId: business.id } }),
    prisma.ledgerEntry.count({ where: { businessId: business.id } }),
    prisma.stockTransaction.count({ where: { businessId: business.id } })
  ]);
  console.log(`Verified counts in database:\n - Invoices: ${invCount}\n - Purchases: ${poCount}\n - Expenses: ${expCount}\n - Ledger Entries: ${ledgCount}\n - Stock Transactions: ${stCount}`);

  // Spin up Express server
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const port = (server.address() as AddressInfo).port;
  const url = `http://127.0.0.1:${port}/api/reports`;
  const tok = generateToken({ userId: owner.id, businessId: business.id, role: owner.role });

  const queryReport = async (name: string, path: string) => {
    const start = Date.now();
    const res = await fetch(`${url}${path}`, {
      headers: { authorization: `Bearer ${tok}` }
    });
    const duration = Date.now() - start;
    assert(res.status === 200, `${name} report query failed`);
    const json = await res.json() as any;
    console.log(` - Query: ${name} took ${duration}ms, rows: ${json.rows?.length || 0}, pagination pages: ${json.pagination?.pages || 0}`);
    return duration;
  };

  console.log("7. Querying report and overview endpoints under scale...");
  const range = `from=${new Date().getFullYear()}-01-01&to=${new Date().toISOString().slice(0,10)}`;
  
  await queryReport("Sales Report (10,000 invoices)", `/sales?${range}`);
  await queryReport("Purchase Report (10,000 purchases)", `/purchases?${range}`);
  await queryReport("Expense Report (10,000 expenses)", `/expenses?${range}`);
  await queryReport("Stock Valuation (1 material)", "/stock-valuation");
  await queryReport("GST Summary (Sales + Purchases + Expenses)", `/gst-summary?${range}`);
  await queryReport("Profit & Loss Summary", `/profit-loss?${range}`);
  await queryReport("Business Overview", `/overview?${range}`);

  const memory = process.memoryUsage();
  console.log(`Memory Usage:\n - RSS: ${(memory.rss / 1024 / 1024).toFixed(2)} MB\n - Heap Total: ${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB\n - Heap Used: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);

  console.log("=== Performance scale test finished successfully ===");
  
  // Close server
  await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
  await prisma.$disconnect();

  // Clean files
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  if (fs.existsSync(journal)) fs.unlinkSync(journal);
}

main().catch(error => {
  console.error("=== Performance Scale Profiling Failed ===");
  console.error(error);
  process.exit(1);
});
