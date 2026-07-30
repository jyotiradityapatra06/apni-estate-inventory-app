import crypto from "crypto";
import { prisma } from "../src/config/db";
import * as paymentService from "../src/services/payment.service";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

async function main() {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const business = await prisma.business.create({ data: { name: `Payment Test ${suffix}` } });
  try {
    const user = await prisma.user.create({
      data: { name: "Payment Tester", email: `payment-${suffix}@test.local`, passwordHash: "x", role: "OWNER", businessId: business.id },
    });
    const customer = await prisma.customer.create({
      data: { customerCode: "CUS-TEST", name: "Payment Customer", phone: "9876543210", outstandingBalance: 1000, businessId: business.id },
    });
    const otherCustomer = await prisma.customer.create({
      data: { customerCode: "CUS-OTHER", name: "Other Customer", phone: "9876543211", businessId: business.id },
    });
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: "INV-TEST",
        status: "ISSUED",
        customerId: customer.id,
        customerName: customer.name,
        businessName: business.name,
        totalAmount: 1000,
        balanceDue: 1000,
        businessId: business.id,
        createdById: user.id,
      },
    });

    const invoicePayment = await paymentService.create(business.id, user.id, {
      customerId: customer.id,
      invoiceId: invoice.id,
      amount: 400,
      paymentMethod: "UPI",
      referenceNumber: "UPI-TEST",
      idempotencyKey: crypto.randomUUID(),
    });
    assert(invoicePayment.invoiceId === invoice.id, "Invoice payment was not allocated.");
    const invoiceAfterPayment = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    assert(Number(invoiceAfterPayment.balanceDue) === 600, "Invoice outstanding was not reduced.");

    let wrongCustomerRejected = false;
    try {
      await paymentService.create(business.id, user.id, {
        customerId: otherCustomer.id,
        invoiceId: invoice.id,
        amount: 100,
        paymentMethod: "CASH",
        idempotencyKey: crypto.randomUUID(),
      });
    } catch {
      wrongCustomerRejected = true;
    }
    assert(wrongCustomerRejected, "An invoice belonging to another customer was accepted.");

    let overpaymentRejected = false;
    try {
      await paymentService.create(business.id, user.id, {
        customerId: customer.id,
        invoiceId: invoice.id,
        amount: 601,
        paymentMethod: "CASH",
        idempotencyKey: crypto.randomUUID(),
      });
    } catch {
      overpaymentRejected = true;
    }
    assert(overpaymentRejected, "Invoice overpayment was accepted.");

    const advanceKey = crypto.randomUUID();
    const advance = await paymentService.create(business.id, user.id, {
      customerId: customer.id,
      invoiceId: null,
      amount: 800,
      paymentMethod: "CASH",
      idempotencyKey: advanceKey,
    });
    assert(advance.invoiceId === null, "Advance payment was allocated to an invoice.");
    const customerAfterAdvance = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
    assert(customerAfterAdvance.outstandingBalance === -200, "Advance was not represented as customer credit.");
    const invoiceAfterAdvance = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    assert(Number(invoiceAfterAdvance.balanceDue) === 600, "Advance unexpectedly changed the invoice.");

    const duplicate = await paymentService.create(business.id, user.id, {
      customerId: customer.id,
      invoiceId: null,
      amount: 800,
      paymentMethod: "CASH",
      idempotencyKey: advanceKey,
    });
    assert(duplicate.id === advance.id, "Idempotent retry did not return the original payment.");
    assert(await prisma.customerPayment.count({ where: { businessId: business.id, idempotencyKey: advanceKey } }) === 1, "Duplicate payment was created.");

    await paymentService.reverse(business.id, advance.id);
    const customerAfterReversal = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
    assert(customerAfterReversal.outstandingBalance === 600, "Advance reversal did not restore the customer account.");

    console.log("Payment workflow regression passed.");
  } finally {
    await prisma.ledgerEntry.deleteMany({ where: { businessId: business.id } });
    await prisma.customerPayment.deleteMany({ where: { businessId: business.id } });
    await prisma.invoice.deleteMany({ where: { businessId: business.id } });
    await prisma.customer.deleteMany({ where: { businessId: business.id } });
    await prisma.user.deleteMany({ where: { businessId: business.id } });
    await prisma.business.delete({ where: { id: business.id } });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
