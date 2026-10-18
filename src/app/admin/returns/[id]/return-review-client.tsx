"use client";

import { useState } from "react";
import Link from "next/link";
import { ReturnRequest, ReturnStatus } from "@/lib/types";
import { formatBDT } from "@/lib/utils/format-currency";
import { ArrowLeft, CheckCircle2, AlertCircle, RotateCcw, Boxes, ShieldAlert } from "lucide-react";

interface Props {
  initialRequest: ReturnRequest;
}

export function ReturnReviewClient({ initialRequest }: Props) {
  const [request, setRequest] = useState<ReturnRequest>(initialRequest);
  const [status, setStatus] = useState<ReturnStatus>(initialRequest.status);
  const [adminNotes, setAdminNotes] = useState(initialRequest.admin_notes || "");
  const [inspectionOutcome, setInspectionOutcome] = useState(initialRequest.inspection_outcome || "Passed Inspection - Tags Intact");
  const [refundAmount, setRefundAmount] = useState(initialRequest.refund_amount.toString());
  const [refundStatus, setRefundStatus] = useState(initialRequest.refund_status);
  const [saving, setSaving] = useState(false);
  const [restocking, setRestocking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/admin/returns/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNotes,
          inspectionOutcome,
          refundAmount: Number(refundAmount) || 0,
          refundStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setMessage("Request updated successfully!");
      setRequest({
        ...request,
        status,
        admin_notes: adminNotes,
        inspection_outcome: inspectionOutcome,
        refund_amount: Number(refundAmount) || 0,
        refund_status: refundStatus,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update return");
    } finally {
      setSaving(false);
    }
  };

  const handleRestock = async () => {
    if (!confirm("Are you sure you want to restock these items into active inventory? This will increment stock quantities.")) return;
    setRestocking(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/admin/returns/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "restock",
          adminNotes: "Physical goods inspected and restored to inventory.",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Restock failed");

      setMessage("Items successfully restocked into product variants!");
      setRequest({ ...request, is_restocked: true });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to restock");
    } finally {
      setRestocking(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/returns"
          className="text-xs uppercase font-bold text-zinc-400 hover:text-white flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Returns List</span>
        </Link>
        <span className="font-mono text-xs text-zinc-500">ID: {request.id}</span>
      </div>

      {message && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details & Items */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[#121214] border border-zinc-800 p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#ccff00] font-mono">
                  {`// ${request.request_type.toUpperCase()} REQUEST`}
                </span>
                <h1 className="text-xl font-bold uppercase text-white mt-1">
                  Order {request.order_number}
                </h1>
              </div>
              <span
                className={`text-xs px-3 py-1 uppercase font-bold ${
                  request.status === "completed"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : request.status === "rejected"
                    ? "bg-red-500/10 text-red-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}
              >
                {request.status.replace(/_/g, " ")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs mb-6">
              <div>
                <span className="text-zinc-500 block uppercase">Customer Name</span>
                <strong className="text-white">{request.customer_name}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block uppercase">Phone Number</span>
                <strong className="text-white">{request.customer_phone}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block uppercase">Email</span>
                <strong className="text-white">{request.customer_email}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block uppercase">Reason</span>
                <strong className="text-white">{request.reason}</strong>
              </div>
            </div>

            {request.customer_notes && (
              <div className="p-3 bg-[#18181b] border border-zinc-800 text-xs text-zinc-300 mb-6">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold mb-1">Customer Note:</span>
                "{request.customer_notes}"
              </div>
            )}

            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              Items for {request.request_type} ({request.items.length})
            </h3>
            <div className="space-y-3">
              {request.items.map((item, idx) => (
                <div key={idx} className="p-3 bg-[#18181b] border border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-white text-sm">{item.product_name}</strong>
                    <p className="text-zinc-400 mt-0.5">
                      Original Size: {item.size} &bull; Qty: {item.quantity} &bull; SKU: {item.sku}
                    </p>
                    {item.exchange_size && (
                      <p className="text-[#ccff00] font-bold mt-1">
                        &rarr; Requested Exchange Size: {item.exchange_size}
                      </p>
                    )}
                  </div>
                  <div className="font-mono text-white font-bold">
                    {formatBDT(item.unit_price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Restock Action Card */}
          <div className="bg-[#121214] border border-zinc-800 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Boxes className="w-5 h-5 text-[#ccff00]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Physical Inventory Restocking
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Restock safety rule: Inventory cannot be restored until physical goods have arrived at the warehouse and passed QA inspection.
            </p>

            {request.is_restocked ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Items have been successfully restocked into warehouse inventory.</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRestock}
                disabled={restocking || !["received", "inspected", "completed"].includes(request.status)}
                className="px-4 py-2.5 bg-[#ccff00] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#b8e600] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Boxes className="w-4 h-4" />
                <span>{restocking ? "Restocking..." : "Approve Restock into Inventory"}</span>
              </button>
            )}
            {!["received", "inspected", "completed"].includes(request.status) && (
              <p className="text-[11px] text-amber-400 mt-2">
                * Note: Update status to "Received" or "Inspected" before restocking.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Workflow Controls */}
        <div className="space-y-6">
          <form onSubmit={handleStatusUpdate} className="bg-[#121214] border border-zinc-800 p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white pb-3 border-b border-zinc-800">
              Workflow Management
            </h2>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Request Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReturnStatus)}
                className="w-full bg-[#18181b] border border-zinc-700 p-2 text-xs text-white"
              >
                <option value="requested">Requested</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="return_in_transit">Return In Transit</option>
                <option value="received">Received at Warehouse</option>
                <option value="inspected">QA Inspected</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                QA Inspection Outcome
              </label>
              <select
                value={inspectionOutcome}
                onChange={(e) => setInspectionOutcome(e.target.value)}
                className="w-full bg-[#18181b] border border-zinc-700 p-2 text-xs text-white"
              >
                <option value="Passed Inspection - Tags Intact">Passed Inspection - Tags Intact</option>
                <option value="Minor Stitch Defect - Replaced">Minor Stitch Defect - Replaced</option>
                <option value="Stained / Worn - Ineligible">Stained / Worn - Ineligible</option>
                <option value="Missing Original Tags">Missing Original Tags</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Refund Status
              </label>
              <select
                value={refundStatus}
                onChange={(e) => setRefundStatus(e.target.value as any)}
                className="w-full bg-[#18181b] border border-zinc-700 p-2 text-xs text-white"
              >
                <option value="unrefunded">Unrefunded</option>
                <option value="pending">Refund Pending Approval</option>
                <option value="processed">Processed (Paid)</option>
                <option value="declined">Declined</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Refund Amount (৳ BDT)
              </label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full bg-[#18181b] border border-zinc-700 p-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Admin Notes (Audit Log)
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal inspection notes or rejection reason..."
                className="w-full bg-[#18181b] border border-zinc-700 p-2 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Update Request"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
