-- Extend tenant business profiles with optional branding, payment, and invoice settings.
ALTER TABLE "Business" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "Business" ADD COLUMN "email" TEXT;
ALTER TABLE "Business" ADD COLUMN "website" TEXT;
ALTER TABLE "Business" ADD COLUMN "registrationType" TEXT;
ALTER TABLE "Business" ADD COLUMN "bankName" TEXT;
ALTER TABLE "Business" ADD COLUMN "accountNumber" TEXT;
ALTER TABLE "Business" ADD COLUMN "ifscCode" TEXT;
ALTER TABLE "Business" ADD COLUMN "branch" TEXT;
ALTER TABLE "Business" ADD COLUMN "upiId" TEXT;
ALTER TABLE "Business" ADD COLUMN "invoiceTerms" TEXT;
ALTER TABLE "Business" ADD COLUMN "invoiceFooter" TEXT;

-- Snapshot profile values onto invoices so issued documents remain immutable.
ALTER TABLE "Invoice" ADD COLUMN "businessEmail" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "businessWebsite" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "businessRegistrationType" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "bankName" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "bankAccountNumber" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "bankIfscCode" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "bankBranch" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "businessUpiId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "invoiceFooter" TEXT;
