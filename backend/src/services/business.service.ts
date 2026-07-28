import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import { BusinessUpdateInput } from "../validations/business.validation";

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
  input: BusinessUpdateInput
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
      logoUrl: input.logoUrl,
      gstNumber: input.gstNumber === null ? null : input.gstNumber?.toUpperCase(),
      phone: input.phone,
      email: input.email,
      website: input.website,
      address: input.address,
      state: input.state,
      stateCode: input.stateCode,
      registrationType: input.registrationType,
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      ifscCode: input.ifscCode === null ? null : input.ifscCode?.toUpperCase(),
      branch: input.branch,
      upiId: input.upiId,
      invoiceTerms: input.invoiceTerms,
      invoiceFooter: input.invoiceFooter,
      workerSeatLimit: input.workerSeatLimit !== undefined ? Number(input.workerSeatLimit) : undefined,
    },
  });

  return updatedBusiness;
};
