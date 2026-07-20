import { z } from "zod";

export const createWorkerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long"),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits"),
  email: z.string().trim().email("Please enter a valid email address"),
  role: z.enum(["MANAGER", "STAFF", "DRIVER"], {
    errorMap: () => ({ message: "Role must be MANAGER, STAFF, or DRIVER" }),
  }),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  isActive: z.boolean().optional(),
});

export const updateWorkerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits").optional(),
  email: z.string().trim().email("Please enter a valid email address").optional(),
  role: z.enum(["MANAGER", "STAFF", "DRIVER"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});
