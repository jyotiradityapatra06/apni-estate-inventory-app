import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes";
import businessRoutes from "./routes/business.routes";
import inventoryRoutes from "./routes/inventory.routes";
import teamRoutes from "./routes/team.routes";
import notificationRoutes from "./routes/notification.routes";
import deliveryRoutes from "./routes/delivery.routes";
import customerRoutes from "./routes/customer.routes";
import supplierRoutes from "./routes/supplier.routes";
import godownRoutes from "./routes/godown.routes";
import stockTransferRoutes from "./routes/stockTransfer.routes";
import salesOrderRoutes from "./routes/salesOrder.routes";
import invoiceRoutes from "./routes/invoice.routes";
import paymentRoutes from "./routes/payment.routes";
import linkedDeliveryRoutes from "./routes/linkedDelivery.routes";
import purchaseRoutes from "./routes/purchase.routes";
import financialRoutes from "./routes/financial.routes";
import expenseRoutes from "./routes/expense.routes";
import expenseCategoryRoutes from "./routes/expenseCategory.routes";
import reportRoutes from "./routes/report.routes";
import salesReturnRoutes from "./routes/salesReturn.routes";
import purchaseReturnRoutes from "./routes/purchaseReturn.routes";
import { notFound } from "./middleware/notFound.middleware";
import { errorHandler } from "./middleware/error.middleware";
import { env } from "./config/env";

const app = express();

// Security Middlewares
app.use(helmet());

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

// Logging Middleware
app.use(morgan("dev"));

// Body Parser Middleware
app.use(express.json());

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/godowns", godownRoutes);
app.use("/api/stock-transfers", stockTransferRoutes);
// Preferred construction-supplier terminology while preserving /api/inventory.
app.use("/api/materials", inventoryRoutes);
app.use("/api/sales-orders", salesOrderRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/customer-payments", paymentRoutes);
app.use("/api/linked-deliveries", linkedDeliveryRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/financials", financialRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/expense-categories", expenseCategoryRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/sales-returns", salesReturnRoutes);
app.use("/api/purchase-returns", purchaseReturnRoutes);

// Fallbacks
app.use(notFound);
app.use(errorHandler);

export default app;
