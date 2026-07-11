import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { ApiError } from "../utils/apiError";
import { ROLE_PERMISSIONS, UserRole } from "../config/permissions";

export const protect = (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new ApiError(401, "You are not logged in. Please provide a valid authentication token."));
    }

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (err) {
      return next(new ApiError(401, "Authentication token is invalid or has expired."));
    }
  } catch (err) {
    next(err);
  }
};

export const authenticate = protect;

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required."));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action."));
    }

    next();
  };
};

export const authorizeRoles = (...roles: string[]) => {
  return restrictTo(...roles);
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required."));
    }

    const role = req.user.role as UserRole;
    const permissions = ROLE_PERMISSIONS[role] || [];

    if (!permissions.includes(permission)) {
      return next(new ApiError(403, `You do not have permission to perform this action.`));
    }

    next();
  };
};

export const requireBusinessAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.businessId) {
    return next(new ApiError(403, "Access to business data is restricted or not authorized."));
  }
  next();
};
