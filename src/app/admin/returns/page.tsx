import { getReturnRequests } from "@/lib/services/returns";
import { ReturnsClient } from "./returns-client";

export const metadata = {
  title: "Return & Exchange Requests | FLASHWEAR Admin",
};

export default async function AdminReturnsPage() {
  const returnRequests = await getReturnRequests();
  return <ReturnsClient initialReturns={returnRequests} />;
}
