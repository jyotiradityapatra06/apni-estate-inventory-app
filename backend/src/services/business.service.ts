import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";

export const getById = async (businessId: string) => {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });

  if (!business) {
    throw new ApiError(404, "Business account not found.");
  }

  return business;
};

export const update = async (
  businessId: string,
  userRole: string,
  input: { name?: string; gstNumber?: string; phone?: string; address?: string }
) => {
  if (userRole !== "OWNER") {
    throw new ApiError(403, "Only business owners can update company settings.");
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });

  if (!business) {
    throw new ApiError(404, "Business account not found.");
  }

  const updatedBusiness = await prisma.business.update({
    where: { id: businessId },
    data: {
      name: input.name ?? undefined,
      gstNumber: input.gstNumber !== undefined ? input.gstNumber : undefined,
      phone: input.phone !== undefined ? input.phone : undefined,
      address: input.address !== undefined ? input.address : undefined,
    },
  });

  return updatedBusiness;
};
