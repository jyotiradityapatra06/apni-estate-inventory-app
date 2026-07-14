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
    const prismaError = err as any;

    console.error("💥 Prisma database error:", {
      code: prismaError.code,
      message: prismaError.message,
      meta: prismaError.meta,
      method: req.method,
      path: req.originalUrl,
    });

    switch (prismaError.code) {
      case "P2002":
        statusCode = 409;
        message = "This information already exists.";
        break;

      case "P2003":
        statusCode = 400;
        message =
          "The related business, account, or record could not be found.";
        break;

      case "P2021":
        statusCode = 500;
        message =
          "The database is not updated. Please run the latest database migrations.";
        break;

      case "P2022":
        statusCode = 500;
        message =
          "The database structure is outdated. Please update the database schema.";
        break;

      case "P2025":
        statusCode = 404;
        message = "The requested record was not found.";
        break;

      default:
        statusCode = 500;
        message = "A database error occurred. Please try again.";
        break;
    }
  } else if (err.name === "PrismaClientValidationError") {
    console.error("💥 Prisma validation error:", {
      message: err.message,
      method: req.method,
      path: req.originalUrl,
    });

    statusCode = 400;
    message = "Invalid database request.";
  } else {
    console.error("💥 Unexpected system error:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
      method: req.method,
      path: req.originalUrl,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

export default errorHandler;