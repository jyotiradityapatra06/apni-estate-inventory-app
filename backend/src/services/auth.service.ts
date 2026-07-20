import { prisma } from "../config/db";
import { registerSchema, loginSchema } from "../validations/auth.validation";
import { ApiError } from "../utils/apiError";
import * as bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt";
import { ROLE_PERMISSIONS, UserRole } from "../config/permissions";

export const register = async (input: any) => {
  const data = registerSchema.parse(input);

  // Check unique email
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new ApiError(409, "A user with this email address already exists.");
  }

  // Create Business & User atomically
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.password, salt);

  const result = await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        name: data.businessName,
      },
    });

    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: "OWNER",
        businessId: business.id,
      },
    });

    return { user, business };
  });

  const token = generateToken({
    userId: result.user.id,
    businessId: result.business.id,
    role: result.user.role,
  });

  return {
    token,
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      phone: result.user.phone,
      role: result.user.role,
      businessId: result.user.businessId,
      isActive: result.user.isActive,
    },
    permissions: ROLE_PERMISSIONS[result.user.role as UserRole] || [],
    business: result.business,
  };
};

export const login = async (input: any) => {
  const data = loginSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { business: true },
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password combination.");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated. Please contact your administrator.");
  }

  if (user.role === "DRIVER") {
    throw new ApiError(403, "Driver login is not available.");
  }

  const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValidPassword) {
    throw new ApiError(401, "Invalid email or password combination.");
  }

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const token = generateToken({
    userId: user.id,
    businessId: user.businessId,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      businessId: user.businessId,
      isActive: user.isActive,
    },
    permissions: ROLE_PERMISSIONS[user.role as UserRole] || [],
    business: user.business,
  };
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      business: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User session not found.");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated.");
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      businessId: user.businessId,
      isActive: user.isActive,
    },
    permissions: ROLE_PERMISSIONS[user.role as UserRole] || [],
    business: user.business,
  };
};
