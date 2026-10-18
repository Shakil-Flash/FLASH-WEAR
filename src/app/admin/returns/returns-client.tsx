"use client";

import { useState } from "react";
import Link from "next/link";
import { ReturnRequest } from "@/lib/types";
import { RotateCcw, Search, Eye, AlertCircle } from "lucide-react";

interface Props {
  initialReturns: ReturnRequest[];
}

export function ReturnsClient({ initialReturns }: Props) {
  const [returns, setReturns] = useState<ReturnRequest[]>(initialReturns);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = returns.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesSearch =
      r.order_number.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_phone.includes(search);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-[#ccff00]" />
            <span>Customer Returns &amp; Exchanges</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Review requests, conduct QA inspection, record refunds, and restock</p>
        </div>
      </div>

      <div className="bg-[#121214] border border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search order number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#18181b] border border-zinc-700 pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#ccff00]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#18181b] border border-zinc-700 px-3 py-1.5 text-xs text-white"
          >
            <option value="all">All Statuses</option>
            <option value="requested">Requested</option>
            <option value="approved">Approved</option>
            <option value="return_in_transit">Return In Transit</option>
            <option value="received">Received</option>
            <option value="inspected">Inspected</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-[#121214] border border-zinc-800 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#18181b] border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-mono">
            <tr>
              <th className="p-4">Request Details</th>
              <th className="p-4">Type</th>
              <th className="p-4">Reason</th>
              <th className="p-4">Restocked?</th>
              <th className="p-4">Refund Status</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-zinc-500">
                  No return or exchange requests found.
                </td>
              </tr>
            ) : (
              filtered.map((req) => (
                <tr key={req.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="p-4">
                    <div className="font-mono font-bold text-white text-sm">{req.order_number}</div>
                    <div className="text-zinc-400 mt-0.5">{req.customer_name} &bull; {req.customer_phone}</div>
                    <div className="text-[11px] text-zinc-500">{new Date(req.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`uppercase font-bold text-[10px] px-2 py-0.5 ${
                        req.request_type === "exchange"
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {req.request_type}
                    </span>
                  </td>
                  <td className="p-4 max-w-xs truncate text-zinc-300">
                    {req.reason}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 ${
                        req.is_restocked
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "text-zinc-500 bg-zinc-800"
                      }`}
                    >
                      {req.is_restocked ? "Yes (Restocked)" : "No"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="capitalize text-zinc-400 font-mono text-[11px]">
                      {req.refund_status} {req.refund_amount > 0 && `(৳${req.refund_amount})`}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 ${
                        req.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : req.status === "rejected"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {req.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/admin/returns/${req.id}`}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase text-[11px] inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
