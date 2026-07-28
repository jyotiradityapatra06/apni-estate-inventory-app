import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";

// In-memory rate limiter for public route: max 60 requests per minute per IP
const ipRateMap = new Map<string, { count: number; resetTime: number }>();

export const getPublicInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || "global";
    const now = Date.now();
    const windowMs = 60 * 1000;

    let rateData = ipRateMap.get(ip);
    if (!rateData || now > rateData.resetTime) {
      rateData = { count: 1, resetTime: now + windowMs };
      ipRateMap.set(ip, rateData);
    } else {
      rateData.count += 1;
      if (rateData.count > 60) {
        throw new ApiError(429, "Too many requests. Please try again later.");
      }
    }

    const { token } = req.params;
    if (!token || typeof token !== "string") {
      throw new ApiError(404, "Invoice not found.");
    }

    const invoice = await prisma.invoice.findUnique({
      where: { publicToken: token },
      include: {
        items: true,
        salesOrder: { select: { id: true, orderNumber: true } },
        payments: { where: { status: "POSTED" }, select: { paymentNumber: true, amount: true, paymentDate: true } },
      },
    });

    if (!invoice) {
      throw new ApiError(404, "Invoice not found.");
    }

    // Return display data only (no user secrets, internal permissions, or business management credentials)
    const publicData = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      invoiceType: invoice.invoiceType,
      status: invoice.status,
      businessName: invoice.businessName,
      businessGstin: invoice.businessGstin,
      businessAddress: invoice.businessAddress,
      businessPhone: invoice.businessPhone,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone,
      customerGstin: invoice.customerGstin,
      billingAddress: invoice.billingAddress,
      deliveryAddress: invoice.deliveryAddress,
      supplyType: invoice.supplyType,
      subtotal: invoice.subtotal,
      discountTotal: invoice.discountTotal,
      taxableTotal: invoice.taxableTotal,
      cgstTotal: invoice.cgstTotal,
      sgstTotal: invoice.sgstTotal,
      igstTotal: invoice.igstTotal,
      taxTotal: invoice.taxTotal,
      roundOff: invoice.roundOff,
      totalAmount: invoice.totalAmount,
      amountPaid: invoice.amountPaid,
      balanceDue: invoice.balanceDue,
      notes: invoice.notes,
      terms: invoice.terms,
      salesOrder: invoice.salesOrder,
      payments: invoice.payments,
      items: invoice.items.map((item) => ({
        id: item.id,
        materialName: item.materialName,
        sku: item.sku,
        hsnCode: item.hsnCode,
        unit: item.unit,
        quantity: item.quantity,
        rate: item.rate,
        taxableAmount: item.taxableAmount,
        gstRate: item.gstRate,
        lineTotal: item.lineTotal,
      })),
    };

    res.json({ success: true, data: publicData });
  } catch (error) {
    next(error);
  }
};
