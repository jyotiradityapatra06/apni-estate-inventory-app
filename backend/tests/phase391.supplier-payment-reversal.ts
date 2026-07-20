import { AddressInfo } from "net";
import app from "../src/app";
import { prisma } from "../src/config/db";
import { generateToken } from "../src/utils/jwt";

const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };

async function main() {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const businessA = await prisma.business.create({ data: { name: `Phase391 A ${suffix}` } });
  const businessB = await prisma.business.create({ data: { name: `Phase391 B ${suffix}` } });
  try {
    const [owner, manager, staff, otherOwner] = await Promise.all([
      prisma.user.create({ data: { name: "Audit Owner", email: `phase391-owner-${suffix}@test.local`, passwordHash: "unused", role: "OWNER", businessId: businessA.id } }),
      prisma.user.create({ data: { name: "Audit Manager", email: `phase391-manager-${suffix}@test.local`, passwordHash: "unused", role: "MANAGER", businessId: businessA.id } }),
      prisma.user.create({ data: { name: "Audit Staff", email: `phase391-staff-${suffix}@test.local`, passwordHash: "unused", role: "STAFF", businessId: businessA.id } }),
      prisma.user.create({ data: { name: "Other Owner", email: `phase391-other-${suffix}@test.local`, passwordHash: "unused", role: "OWNER", businessId: businessB.id } }),
    ]);
    const supplier = await prisma.supplier.create({ data: { supplierCode: `SUP-${suffix}`, name: "Audit Supplier", phone: "9999999999", businessId: businessA.id, totalPurchases: 50000, paidAmount: 20000, pendingPayments: 30000 } });
    const order = await prisma.purchaseOrder.create({ data: { purchaseOrderNumber: `PO-${suffix}`, status: "RECEIVED", paymentStatus: "PARTIAL", supplierId: supplier.id, supplierName: supplier.name, supplierPhone: supplier.phone, totalAmount: 50000, receivedAmount: 50000, amountPaid: 20000, balanceDue: 30000, businessId: businessA.id, createdById: owner.id } });
    const payment = await prisma.purchasePayment.create({ data: { paymentNumber: `PP-${suffix}`, amount: 20000, paymentMode: "BANK", purchaseOrderId: order.id, supplierId: supplier.id, businessId: businessA.id, recordedById: owner.id } });
    await prisma.ledgerEntry.create({ data: { businessId: businessA.id, partyType: "SUPPLIER", partyId: supplier.id, transactionType: "SUPPLIER_PAYMENT", referenceType: "PURCHASE_PAYMENT", referenceId: payment.id, amount: 20000, debitAmount: 20000, creditAmount: 0, description: "Test supplier payment", createdById: owner.id, idempotencyKey: `SUPPLIER_PAYMENT:${payment.id}` } });

    const server = app.listen(0);
    try {
      const port = (server.address() as AddressInfo).port;
      const call = (token: string, body: unknown) => fetch(`http://127.0.0.1:${port}/api/purchases/${order.id}/payments/${payment.id}/reverse`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const token = (user: { id: string; businessId: string; role: string }) => generateToken({ userId: user.id, businessId: user.businessId, role: user.role });

      assert((await call(token(staff), { reason: "Not permitted" })).status === 403, "STAFF must receive HTTP 403");
      assert((await call(token(otherOwner), { reason: "Cross-business attempt" })).status === 404, "Cross-business reversal must be rejected");
      assert((await call(token(manager), { reason: "   " })).status === 400, "Blank reversal reason must be rejected");
      const reversed = await call(token(manager), { reason: "Bank transfer entered against wrong purchase" });
      assert(reversed.status === 200, `Manager reversal failed with HTTP ${reversed.status}`);

      const [freshOrder, freshSupplier, freshPayment, ledger] = await Promise.all([
        prisma.purchaseOrder.findUniqueOrThrow({ where: { id: order.id } }),
        prisma.supplier.findUniqueOrThrow({ where: { id: supplier.id } }),
        prisma.purchasePayment.findUniqueOrThrow({ where: { id: payment.id } }),
        prisma.ledgerEntry.findMany({ where: { businessId: businessA.id, referenceId: payment.id } }),
      ]);
      assert(Number(freshOrder.amountPaid) === 0 && Number(freshOrder.balanceDue) === 50000 && freshOrder.paymentStatus === "UNPAID", "Purchase payable or payment status was not restored");
      assert(Number(freshSupplier.paidAmount) === 0 && Number(freshSupplier.pendingPayments) === 50000, "Supplier outstanding balance was not restored");
      assert(freshPayment.status === "REVERSED" && !!freshPayment.reversedAt && freshPayment.reversedById === manager.id && freshPayment.reversalReason === "Bank transfer entered against wrong purchase", "Reversal audit metadata is incomplete");
      assert(ledger.length === 2 && ledger.reduce((sum, row) => sum + Number(row.debitAmount) - Number(row.creditAmount), 0) === 0 && ledger.some(row => row.transactionType === "SUPPLIER_PAYMENT_REVERSAL" && Number(row.creditAmount) === 20000), "Opposite ledger entry did not restore the ledger balance");
      assert((await call(token(owner), { reason: "Second attempt" })).status === 409, "Double reversal must be rejected");

      const ownerPayment = await prisma.$transaction(async tx => {
        const next = await tx.purchasePayment.create({ data: { paymentNumber: `PP-OWNER-${suffix}`, amount: 100, paymentMode: "CASH", purchaseOrderId: order.id, supplierId: supplier.id, businessId: businessA.id, recordedById: manager.id } });
        await tx.purchaseOrder.update({ where: { id: order.id }, data: { amountPaid: 100, balanceDue: 49900, paymentStatus: "PARTIAL" } });
        await tx.supplier.update({ where: { id: supplier.id }, data: { paidAmount: 100, pendingPayments: 49900 } });
        await tx.ledgerEntry.create({ data: { businessId: businessA.id, partyType: "SUPPLIER", partyId: supplier.id, transactionType: "SUPPLIER_PAYMENT", referenceType: "PURCHASE_PAYMENT", referenceId: next.id, amount: 100, debitAmount: 100, creditAmount: 0, description: "Owner permission test", createdById: manager.id, idempotencyKey: `SUPPLIER_PAYMENT:${next.id}` } });
        return next;
      });
      const ownerResponse = await fetch(`http://127.0.0.1:${port}/api/purchases/${order.id}/payments/${ownerPayment.id}/reverse`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token(owner)}` }, body: JSON.stringify({ reason: "Owner permission verification" }) });
      assert(ownerResponse.status === 200, `OWNER reversal failed with HTTP ${ownerResponse.status}`);
      console.log(JSON.stringify({ success: true, amountReversed: 20000, checks: ["owner reversal", "manager reversal", "supplier outstanding restoration", "purchase payment status restoration", "ledger restoration", "audit metadata", "blank reason rejection", "double reversal rejection", "cross-business isolation", "staff HTTP 403"] }, null, 2));
    } finally {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  } finally {
    await prisma.business.deleteMany({ where: { id: { in: [businessA.id, businessB.id] } } });
    await prisma.$disconnect();
  }
}

main().catch(error => { console.error(error); process.exit(1); });
