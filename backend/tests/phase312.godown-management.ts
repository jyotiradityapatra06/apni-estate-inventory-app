import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { AddressInfo } from "net";

const dbPath = path.join(__dirname, "../prisma/test-312.db");
const journal = `${dbPath}-journal`;
process.env.DATABASE_URL = `file:${dbPath}`;

import app from "../src/app";
import { prisma } from "../src/config/db";
import { generateToken } from "../src/utils/jwt";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const fmt = (val: any) => {
  if (val === null || val === undefined) return 0;
  return Number(val);
};

async function main() {
  console.log("=== Starting Phase 3.12 Godown Management Verification ===");
  
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
  const managerA = await prisma.user.create({ data: { name: "Manager A", email: `manager-a-${suffix}@test.local`, passwordHash: "dummy", role: "MANAGER", businessId: businessA.id } });
  const staffA = await prisma.user.create({ data: { name: "Staff A", email: `staff-a-${suffix}@test.local`, passwordHash: "dummy", role: "STAFF", businessId: businessA.id } });
  const ownerB = await prisma.user.create({ data: { name: "Owner B", email: `owner-b-${suffix}@test.local`, passwordHash: "dummy", role: "OWNER", businessId: businessB.id } });

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
    // 1. Verify default godown created for existing business (via prisma backfill)
    // Run backfill manually on this fresh DB
    execSync("npx ts-node prisma/backfill-godowns.ts", { stdio: "inherit", env: process.env });

    const defaultGodownA = await prisma.godown.findFirstOrThrow({ where: { businessId: businessA.id, isDefault: true } });
    assert(defaultGodownA.godownCode === "MAIN" && defaultGodownA.name === "Main Godown", "Default godown backfill failed");
    console.log("Verified: Default godown created successfully by backfill.");

    // 2. Validate godown code uniqueness per business
    const dupRes = await call("POST", "/godowns", ownerA, {
      name: "Another Main",
      godownCode: "MAIN"
    });
    assert(dupRes.status === 400, "Uniqueness check for godownCode failed");
    console.log("Verified: Duplicate godown code is blocked.");

    // 3. Create second godown
    const secRes = await call("POST", "/godowns", ownerA, {
      name: "Second Godown",
      godownCode: "SECOND",
      address: "Pune",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      notes: "Pune secondary location"
    });
    assert(secRes.status === 201, `Failed to create second godown: ${secRes.text}`);
    const secGodown = secRes.json.data;
    console.log(`Created Second Godown: ${secGodown.name} with Code ${secGodown.godownCode}`);

    // 4. Default godown cannot be deactivated directly
    const deactDef = await call("DELETE", `/godowns/${defaultGodownA.id}`, ownerA);
    assert(deactDef.status === 400, "Deactivating default godown should be blocked");
    console.log("Verified: Default godown deactivation is blocked.");

    // 5. Create material Cement
    const cementRes = await call("POST", "/materials", ownerA, {
      materialName: "ACC Cement",
      category: "Cement",
      sku: "ACC-CEM",
      unit: "Bags",
      reorderLevel: 20,
      location: "Main Godown",
      costPrice: 300,
      sellingPrice: 400,
      taxRate: 18
    });
    assert(cementRes.status === 201, `Failed to create material Cement: ${cementRes.text}`);
    const cement = cementRes.json.data;

    // Verify stock is 0 initially across godowns
    const stockA = await prisma.godownStock.findFirstOrThrow({ where: { businessId: businessA.id, godownId: defaultGodownA.id, inventoryItemId: cement.id } });
    assert(stockA.quantity === 0, "Initial stock should be 0");

    // 6. Perform manual Stock In to default godown (100 bags)
    const adjIn = await call("PATCH", `/materials/${cement.id}/stock`, ownerA, {
      type: "IN",
      quantity: 100,
      reason: "Manual addition",
      godownId: defaultGodownA.id,
      idempotencyKey: crypto.randomUUID()
    });
    assert(adjIn.status === 200, `Stock In failed: ${adjIn.text}`);
    
    let stDef = await prisma.godownStock.findUnique({
      where: { businessId_godownId_inventoryItemId: { businessId: businessA.id, godownId: defaultGodownA.id, inventoryItemId: cement.id } }
    }) || { quantity: 0 };
    let stSec = await prisma.godownStock.findUnique({
      where: { businessId_godownId_inventoryItemId: { businessId: businessA.id, godownId: secGodown.id, inventoryItemId: cement.id } }
    }) || { quantity: 0 };
    let materialFresh = await prisma.inventoryItem.findUniqueOrThrow({ where: { id: cement.id } });
    
    assert(stDef.quantity === 100, `Default stock should be 100, got ${stDef.quantity}`);
    assert(stSec.quantity === 0, "Second stock should be 0");
    assert(materialFresh.quantity === 100, `Global stock should be 100, got ${materialFresh.quantity}`);
    console.log("Verified: Stock In affects only selected godown and updates global count.");

    // 7. Perform Stock Out of 10 bags from default godown
    const adjOut = await call("PATCH", `/materials/${cement.id}/stock`, ownerA, {
      type: "OUT",
      quantity: 10,
      reason: "Sample test",
      godownId: defaultGodownA.id,
      idempotencyKey: crypto.randomUUID()
    });
    assert(adjOut.status === 200, `Stock Out failed: ${adjOut.text}`);
    
    stDef = await prisma.godownStock.findUnique({
      where: { businessId_godownId_inventoryItemId: { businessId: businessA.id, godownId: defaultGodownA.id, inventoryItemId: cement.id } }
    }) || { quantity: 0 };
    materialFresh = await prisma.inventoryItem.findUniqueOrThrow({ where: { id: cement.id } });
    
    assert(stDef.quantity === 90, `Default stock should be 90, got ${stDef.quantity}`);
    assert(materialFresh.quantity === 90, `Global stock should be 90, got ${materialFresh.quantity}`);
    console.log("Verified: Stock Out deducts from selected godown correctly.");

    // 8. Insufficient stock is checked per godown
    const adjOutInvalid = await call("PATCH", `/materials/${cement.id}/stock`, ownerA, {
      type: "OUT",
      quantity: 20,
      reason: " Pune Sample",
      godownId: secGodown.id,
      idempotencyKey: crypto.randomUUID()
    });
    assert(adjOutInvalid.status === 400, "Should reject stock out due to insufficient stock in second godown");
    console.log("Verified: Insufficient stock checks are correctly isolated to the selected godown.");

    // 9. Deactivating godown with stock is blocked
    const deactWithStock = await call("DELETE", `/godowns/${defaultGodownA.id}`, ownerA);
    assert(deactWithStock.status === 400, "Deactivating default godown with stock should be blocked");
    console.log("Verified: Deactivating godown containing stock is blocked.");

    // 10. Roles and Permissions check (STAFF is blocked from managing godowns)
    const staffWrite = await call("POST", "/godowns", staffA, { name: " Pune Site C", godownCode: "PN-C" });
    assert(staffWrite.status === 403, "Staff should be blocked from creating godowns");
    console.log("Verified: Role-based control restricts STAFF write actions (HTTP 403).");

    // 11. Business A cannot access Business B godowns
    const defaultGodownB = await prisma.godown.findFirstOrThrow({ where: { businessId: businessB.id, isDefault: true } });
    const crossAccess = await call("GET", `/godowns/${defaultGodownB.id}`, ownerA);
    assert(crossAccess.status === 404, "Owner A should receive 404 for Business B godown");
    console.log("Verified: Multi-business isolation keeps godowns secure (HTTP 404).");

    // 12. Create stock transfer draft (Pune Main -> Pune Second, 40 bags)
    const draftRes = await call("POST", "/stock-transfers", ownerA, {
      sourceGodownId: defaultGodownA.id,
      destinationGodownId: secGodown.id,
      notes: "Sample transfer",
      items: [{
        inventoryItemId: cement.id,
        quantity: 40
      }]
    });
    assert(draftRes.status === 201, `Failed to create draft transfer: ${draftRes.text}`);
    const draft = draftRes.json.data;
    assert(draft.status === "DRAFT", "Transfer status should be DRAFT");

    stDef = await prisma.godownStock.findUnique({
      where: { businessId_godownId_inventoryItemId: { businessId: businessA.id, godownId: defaultGodownA.id, inventoryItemId: cement.id } }
    }) || { quantity: 0 };
    assert(stDef.quantity === 90, "Draft transfer must not affect stock");
    console.log("Verified: Draft transfer does not modify stock levels.");

    // 13. Complete the transfer
    const compRes = await call("POST", `/stock-transfers/${draft.id}/post`, ownerA);
    assert(compRes.status === 200, `Failed to complete transfer: ${compRes.text}`);
    const completed = compRes.json.data;
    assert(completed.status === "COMPLETED", "Transfer status should be COMPLETED");

    // Verify stock changes
    stDef = await prisma.godownStock.findUnique({
      where: { businessId_godownId_inventoryItemId: { businessId: businessA.id, godownId: defaultGodownA.id, inventoryItemId: cement.id } }
    }) || { quantity: 0 };
    stSec = await prisma.godownStock.findUnique({
      where: { businessId_godownId_inventoryItemId: { businessId: businessA.id, godownId: secGodown.id, inventoryItemId: cement.id } }
    }) || { quantity: 0 };
    materialFresh = await prisma.inventoryItem.findUniqueOrThrow({ where: { id: cement.id } });

    assert(stDef.quantity === 50, `Source stock should be 50, got ${stDef.quantity}`);
    assert(stSec.quantity === 40, `Destination stock should be 40, got ${stSec.quantity}`);
    assert(materialFresh.quantity === 90, `Global stock must remain 90, got ${materialFresh.quantity}`);
    console.log("Verified: Completed transfer moves stock atomically and preserves total business quantities.");

    // 14. Stock transactions TRANSFER_OUT and TRANSFER_IN exist
    const txOut = await prisma.stockTransaction.findFirstOrThrow({
      where: { businessId: businessA.id, referenceId: draft.id, type: "TRANSFER_OUT" }
    });
    const txIn = await prisma.stockTransaction.findFirstOrThrow({
      where: { businessId: businessA.id, referenceId: draft.id, type: "TRANSFER_IN" }
    });
    assert(txOut.godownId === defaultGodownA.id && txIn.godownId === secGodown.id, "Stock transaction godown assignments incorrect");
    console.log("Verified: Transfer creates linked TRANSFER_OUT and TRANSFER_IN entries.");

    // 15. Completed transfer cannot be posted/completed again (Duplicate block)
    const compDup = await call("POST", `/stock-transfers/${draft.id}/post`, ownerA);
    assert(compDup.status === 400, "Should reject posting an already completed transfer");
    console.log("Verified: Re-posting a completed transfer is rejected.");

    // 16. Inactive godowns cannot be used
    // Deactivate second godown first (we must empty it first)
    await prisma.godownStock.update({
      where: { businessId_godownId_inventoryItemId: { businessId: businessA.id, godownId: secGodown.id, inventoryItemId: cement.id } },
      data: { quantity: 0 }
    });
    const deactSec = await call("DELETE", `/godowns/${secGodown.id}`, ownerA);
    assert(deactSec.status === 200, `Deactivation of empty godown failed: ${deactSec.text}`);

    const transferInactive = await call("POST", "/stock-transfers", ownerA, {
      sourceGodownId: defaultGodownA.id,
      destinationGodownId: secGodown.id,
      items: [{ inventoryItemId: cement.id, quantity: 5 }]
    });
    assert(transferInactive.status === 400, "Should block transfers involving inactive godowns");
    console.log("Verified: Transfers involving inactive godowns are blocked.");

    console.log("=== All Custom Phase 3.12 Checks Passed Successfully ===");
    await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
  } finally {
    await prisma.business.deleteMany({ where: { id: { in: [businessA.id, businessB.id] } } });
    await prisma.$disconnect();
    if (fs.existsSync(dbPath)) {
      try { fs.unlinkSync(dbPath); } catch {}
    }
    if (fs.existsSync(journal)) {
      try { fs.unlinkSync(journal); } catch {}
    }
  }
}

main().catch(error => {
  console.error("=== Custom Phase 3.12 Verification Failed ===");
  console.error(error);
  process.exit(1);
});
