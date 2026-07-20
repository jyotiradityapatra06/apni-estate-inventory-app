import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const dbPath = path.join(__dirname, "../prisma/test-regression.db");
const journal = `${dbPath}-journal`;
process.env.DATABASE_URL = `file:${dbPath}`;

try {
  // Cleanup any old db files
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  if (fs.existsSync(journal)) fs.unlinkSync(journal);

  console.log("=== Setting up isolated regression test database ===");
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
  execSync("npx ts-node prisma/seed.ts", { stdio: "inherit", env: process.env });

  console.log("=== Running Regression Tests ===");
  execSync("npx ts-node --files tests/phase2b.smoke.ts", { stdio: "inherit", env: process.env });
  execSync("npx ts-node --files tests/phase391.supplier-payment-reversal.ts", { stdio: "inherit", env: process.env });
  execSync("npx ts-node --files tests/phase310.expense-management.ts", { stdio: "inherit", env: process.env });
  execSync("npx ts-node --files tests/phase311.reports-analytics.ts", { stdio: "inherit", env: process.env });
  execSync("npx ts-node --files tests/phase313.returns-management.ts", { stdio: "inherit", env: process.env });

  console.log("=== All Regression Tests Passed! ===");
} finally {
  if (fs.existsSync(dbPath)) {
    try { fs.unlinkSync(dbPath); } catch {}
  }
  if (fs.existsSync(journal)) {
    try { fs.unlinkSync(journal); } catch {}
  }
}
