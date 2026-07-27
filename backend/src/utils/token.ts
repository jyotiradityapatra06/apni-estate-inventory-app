import crypto from "crypto";

/**
 * Generates a cryptographically random, URL-safe public token for invoice sharing.
 */
export function generatePublicToken(): string {
  return crypto.randomBytes(12).toString("hex");
}
