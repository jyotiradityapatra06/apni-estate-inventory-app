import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes";
import businessRoutes from "./routes/business.routes";
import inventoryRoutes from "./routes/inventory.routes";
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

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/inventory", inventoryRoutes);

// Fallbacks
app.use(notFound);
app.use(errorHandler);

export default app;
