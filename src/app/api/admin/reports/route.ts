import { NextResponse } from "next/server";
import { getOperationalReport, generateOrdersCSV, getShoppingFunnelMetrics } from "@/lib/services/analytics";
import { getAdminOrders } from "@/lib/services/orders";
import { requireAdmin } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Forbidden" }, { status: auth.status });
    }

    const url = new URL(request.url);
    const range = (url.searchParams.get("range") || "30d") as "7d" | "30d" | "90d" | "all";
    const format = url.searchParams.get("format");

    if (format === "csv") {
      const orders = await getAdminOrders();
      const csv = generateOrdersCSV(orders);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="flashwear-orders-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    const [report, funnelMetrics] = await Promise.all([
      getOperationalReport({ range }),
      getShoppingFunnelMetrics({ range }),
    ]);
    return NextResponse.json({ ...report, funnelMetrics });
  } catch (err: any) {
    console.error("Reports API error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate report" }, { status: 500 });
  }
}
