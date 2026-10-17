import crypto from "crypto";

export function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `FW-${dateStr}-${randomSuffix}`;
}

export function generateReceiptToken(): string {
  return crypto.randomBytes(24).toString("hex");
}
