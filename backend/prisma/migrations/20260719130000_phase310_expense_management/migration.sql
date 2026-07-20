-- Phase 3.10: business expense categories and auditable expenses.
CREATE TABLE "ExpenseCategory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "businessId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ExpenseCategory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ExpenseCategory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Expense" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "expenseNumber" TEXT NOT NULL,
  "expenseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "categoryId" TEXT NOT NULL,
  "payee" TEXT,
  "amount" DECIMAL NOT NULL,
  "gstApplicable" BOOLEAN NOT NULL DEFAULT false,
  "gstRate" DECIMAL NOT NULL DEFAULT 0,
  "gstAmount" DECIMAL NOT NULL DEFAULT 0,
  "totalAmount" DECIMAL NOT NULL,
  "paymentMode" TEXT,
  "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "attachmentUrl" TEXT,
  "paidAt" DATETIME,
  "cancelledAt" DATETIME,
  "cancelledById" TEXT,
  "cancellationReason" TEXT,
  "createdById" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "idempotencyKey" TEXT,
  CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Expense_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Expense_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ExpenseCategory_businessId_normalizedName_key" ON "ExpenseCategory"("businessId", "normalizedName");
CREATE INDEX "ExpenseCategory_businessId_isActive_idx" ON "ExpenseCategory"("businessId", "isActive");
CREATE INDEX "ExpenseCategory_businessId_name_idx" ON "ExpenseCategory"("businessId", "name");
CREATE UNIQUE INDEX "Expense_businessId_expenseNumber_key" ON "Expense"("businessId", "expenseNumber");
CREATE UNIQUE INDEX "Expense_businessId_idempotencyKey_key" ON "Expense"("businessId", "idempotencyKey");
CREATE INDEX "Expense_businessId_expenseDate_idx" ON "Expense"("businessId", "expenseDate");
CREATE INDEX "Expense_businessId_categoryId_idx" ON "Expense"("businessId", "categoryId");
CREATE INDEX "Expense_businessId_paymentStatus_idx" ON "Expense"("businessId", "paymentStatus");
CREATE INDEX "Expense_businessId_createdAt_idx" ON "Expense"("businessId", "createdAt");
