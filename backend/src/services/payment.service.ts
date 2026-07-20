import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import { createPaymentSchema, listPaymentQuerySchema } from "../validations/payment.validation";
import { money } from "./gstCalculation.service";
import { nextDocumentNumber } from "./numberSequence.service";
import { postLedgerEntry } from "./ledger.service";

const include = {
  customer: { select: { id: true, customerCode: true, name: true, phone: true } },
  invoice: { select: { id: true, invoiceNumber: true, status: true, totalAmount: true, balanceDue: true } },
  receivedBy: { select: { id: true, name: true } },
};

export const getAll = async (businessId: string, rawQuery: unknown) => {
  const query = listPaymentQuerySchema.parse(rawQuery);
  const where: Prisma.CustomerPaymentWhereInput = { businessId };
  if (query.customerId) where.customerId = query.customerId;
  if (query.invoiceId) where.invoiceId = query.invoiceId;
  if (query.status) where.status = query.status.toUpperCase();
  return prisma.customerPayment.findMany({ where, include, orderBy: { paymentDate: "desc" } });
};

export const getById = async (businessId: string, id: string) => {
  const payment = await prisma.customerPayment.findFirst({ where: { id, businessId }, include });
  if (!payment) throw new ApiError(404, "Customer payment not found.");
  return payment;
};

export const create = async (businessId: string, userId: string, input: unknown) => {
  const data = createPaymentSchema.parse(input);
  const amount = money(data.amount);
  if (amount.lte(0)) throw new ApiError(400, "Payment amount must be greater than zero.");
  return prisma.$transaction(async (tx) => {
    const duplicate = await tx.customerPayment.findFirst({ where: { businessId, idempotencyKey: data.idempotencyKey }, include });
    if (duplicate) return duplicate;
    const [customer, invoice] = await Promise.all([
      tx.customer.findFirst({ where: { id: data.customerId, businessId, isActive: true } }),
      tx.invoice.findFirst({ where: { id: data.invoiceId, businessId } }),
    ]);
    if (!customer) throw new ApiError(404, "Customer not found or inactive.");
    if (!invoice || invoice.customerId !== customer.id) throw new ApiError(404, "Invoice not found for this customer.");
    if (!["ISSUED", "PARTIALLY_PAID"].includes(invoice.status)) throw new ApiError(400, "Payments can only be recorded against an issued invoice.");
    if (amount.gt(invoice.balanceDue)) throw new ApiError(400, "Payment amount cannot exceed the invoice balance.");

    const paymentNumber = await nextDocumentNumber(tx, businessId, "CUSTOMER_PAYMENT", "PAY");
    const newAmountPaid = money(invoice.amountPaid.plus(amount));
    const newBalanceDue = money(invoice.balanceDue.minus(amount));
    const invoiceStatus = newBalanceDue.eq(0) ? "PAID" : "PARTIALLY_PAID";
    await tx.invoice.update({ where: { id: invoice.id }, data: { amountPaid: newAmountPaid, balanceDue: newBalanceDue, status: invoiceStatus } });
    await tx.customer.update({
      where: { id: customer.id },
      data: { outstandingBalance: Math.max(0, customer.outstandingBalance - Number(amount.toString())) },
    });
    const payment = await tx.customerPayment.create({
      data: {
        paymentNumber,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        customerId: customer.id,
        invoiceId: invoice.id,
        amount,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
        bankName: data.bankName,
        notes: data.notes,
        businessId,
        receivedById: userId,
        idempotencyKey: data.idempotencyKey,
      },
      include,
    });
    await postLedgerEntry(tx,{businessId,partyType:"CUSTOMER",partyId:customer.id,transactionType:"CUSTOMER_PAYMENT",referenceType:"CUSTOMER_PAYMENT",referenceId:payment.id,amount,debitAmount:0,creditAmount:amount,description:`Payment received against ${invoice.invoiceNumber}`,transactionDate:payment.paymentDate,createdById:userId,idempotencyKey:`CUSTOMER_PAYMENT:${payment.id}`});
    return payment;
  });
};

export const reverse = async (businessId: string, id: string) => prisma.$transaction(async (tx) => {
  const payment = await tx.customerPayment.findFirst({ where: { id, businessId }, include: { invoice: true, customer: true } });
  if (!payment) throw new ApiError(404, "Customer payment not found.");
  if (payment.status !== "POSTED") throw new ApiError(400, "Payment is already reversed.");
  if (!payment.invoice) throw new ApiError(400, "Payment is not linked to an invoice.");
  if (payment.invoice.status === "CANCELLED") throw new ApiError(400, "Cannot reverse a payment on a cancelled invoice.");

  const newAmountPaid = money(payment.invoice.amountPaid.minus(payment.amount));
  const newBalanceDue = money(payment.invoice.balanceDue.plus(payment.amount));
  await tx.invoice.update({
    where: { id: payment.invoice.id },
    data: { amountPaid: newAmountPaid, balanceDue: newBalanceDue, status: newAmountPaid.eq(0) ? "ISSUED" : "PARTIALLY_PAID" },
  });
  await tx.customer.update({
    where: { id: payment.customerId },
    data: { outstandingBalance: { increment: Number(payment.amount.toString()) } },
  });
  await tx.customerPayment.update({ where: { id }, data: { status: "REVERSED", reversedAt: new Date() } });
  await postLedgerEntry(tx,{businessId,partyType:"CUSTOMER",partyId:payment.customerId,transactionType:"CUSTOMER_PAYMENT_REVERSAL",referenceType:"CUSTOMER_PAYMENT",referenceId:payment.id,amount:payment.amount,debitAmount:payment.amount,creditAmount:0,description:`Payment ${payment.paymentNumber} reversed`,createdById:payment.receivedById,idempotencyKey:`CUSTOMER_PAYMENT_REVERSAL:${payment.id}`});
  return tx.customerPayment.findUniqueOrThrow({ where: { id }, include });
});
