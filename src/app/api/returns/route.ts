import { NextResponse } from "next/server";
import { createReturnRequest } from "@/lib/services/returns";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createReturnRequest(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to create return request" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      returnId: result.returnId,
      message: "Return request submitted successfully",
    });
  } catch (err: any) {
    console.error("Return request error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit return request" }, { status: 500 });
  }
}
