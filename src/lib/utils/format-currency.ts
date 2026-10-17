export function formatBDT(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "৳0";
  }
  const numeric = typeof amount === "string" ? parseFloat(amount) : amount;
  return `৳${numeric.toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function calculateDeliveryFee(
  division: string,
  dhakaFee: number = 80,
  outsideFee: number = 150
): number {
  if (!division) return dhakaFee;
  const normalized = division.trim().toLowerCase();
  if (normalized === "dhaka") {
    return dhakaFee;
  }
  return outsideFee;
}
