import { getOperationalReport, getShoppingFunnelMetrics } from "@/lib/services/analytics";
import { ReportsClient } from "./reports-client";

export const metadata = {
  title: "Sales & Operational Reports | FLASHWEAR Admin",
};

export default async function AdminReportsPage() {
  const [report, funnelMetrics] = await Promise.all([
    getOperationalReport({ range: "30d" }),
    getShoppingFunnelMetrics({ range: "30d" }),
  ]);
  return <ReportsClient initialReport={{ ...report, funnelMetrics }} />;
}
