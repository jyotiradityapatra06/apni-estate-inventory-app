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
    const anyErr = err as any;
    if (anyErr.code === "P2002") {
      statusCode = 409;
      message = "Unique constraint conflict: A record with this value already exists.";
    } else {
      statusCode = 400;
      message = "Database operation failed due to a constraint or invalid reference.";
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
