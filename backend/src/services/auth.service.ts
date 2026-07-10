import { prisma } from "../config/db";
import { registerSchema, loginSchema } from "../validations/auth.validation";
import { ApiError } from "../utils/apiError";
import * as bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt";

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
        role: "ADMIN",
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
      role: result.user.role,
      createdAt: result.user.createdAt,
    },
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

  const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValidPassword) {
    throw new ApiError(401, "Invalid email or password combination.");
  }

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
      role: user.role,
      createdAt: user.createdAt,
    },
    business: user.business,
  };
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      business: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User session not found.");
  }

  return user;
};
