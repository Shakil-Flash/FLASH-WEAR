import React from "react";

interface AnnouncementBarProps {
  message?: string;
}

export function AnnouncementBar({
  message = "FLASHWEAR DROP 01 // CASH ON DELIVERY AVAILABLE BANGLADESH WIDE // FREE SHIPPING OVER ৳3,000",
}: AnnouncementBarProps) {
  return (
    <div className="bg-[#ccff00] text-black py-1.5 px-4 text-center font-mono text-[11px] font-bold tracking-widest uppercase overflow-hidden border-b border-black/10">
      <div className="inline-flex items-center gap-6 animate-marquee whitespace-nowrap">
        <span>{message}</span>
        <span className="opacity-40">•</span>
        <span>{message}</span>
        <span className="opacity-40">•</span>
        <span>{message}</span>
        <span className="opacity-40">•</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
