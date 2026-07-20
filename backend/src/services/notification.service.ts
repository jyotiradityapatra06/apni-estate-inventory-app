import { prisma } from "../config/db";

export const getAll = async (businessId: string) => {
  return await prisma.notification.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
};

export const create = async (
  businessId: string,
  title: string,
  message: string
) => {
  return await prisma.notification.create({
    data: {
      title,
      message,
      businessId,
    },
  });
};

export const clearAll = async (businessId: string) => {
  return await prisma.notification.deleteMany({
    where: { businessId },
  });
};