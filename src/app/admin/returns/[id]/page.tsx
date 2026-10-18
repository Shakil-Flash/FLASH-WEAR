import { notFound } from "next/navigation";
import { getReturnRequestById } from "@/lib/services/returns";
import { ReturnReviewClient } from "./return-review-client";

interface Props {
  params: { id: string };
}

export const metadata = {
  title: "Review Return Request | FLASHWEAR Admin",
};

export default async function AdminReturnDetailPage({ params }: Props) {
  const request = await getReturnRequestById(params.id);
  if (!request) {
    notFound();
  }

  return <ReturnReviewClient initialRequest={request} />;
}
