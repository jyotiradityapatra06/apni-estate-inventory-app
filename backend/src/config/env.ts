import * as dotenv from "dotenv";
import * as path from "path";
import { z } from "zod";

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, "../../.env") });

const envSchema = z.object({
  DATABASE_URL: z.string().default("file:./dev.db"),
  JWT_SECRET: z.string().min(8, "JWT_SECRET should be at least 8 characters long"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("5000"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables configuration:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
