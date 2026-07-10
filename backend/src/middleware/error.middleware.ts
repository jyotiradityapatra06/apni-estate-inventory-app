import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import ApiError from "../utils/apiError";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors: any[] = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation Error";
    errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
  } else if (err.name === "PrismaClientKnownRequestError") {
    // Handling database constraint or other Prisma specific errors
    statusCode = 400;
    const anyErr = err as any;
    message = anyErr.meta?.cause || err.message;
    if (anyErr.code === "P2002") {
      statusCode = 409;
      message = `Unique constraint failed on field(s): ${(anyErr.meta?.target as string[] || []).join(", ")}`;
    }
  } else {
    // Unexpected system error
    console.error("💥 Unexpected system error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

export default errorHandler;
