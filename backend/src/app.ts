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

// Fallbacks
app.use(notFound);
app.use(errorHandler);

export default app;
