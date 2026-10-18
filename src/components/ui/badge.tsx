import React from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "lime" | "orange" | "sale" | "butter" | "outline" | "dark" | "destructive" | "neutral";
}

export function Badge({ className, variant = "orange", children, ...props }: BadgeProps) {
  const variants = {
    orange: "bg-[#FF5938] text-white font-semibold",
    lime: "bg-[#181818] text-white font-semibold",
    sale: "bg-[#FF5938] text-white font-semibold",
    butter: "bg-[#F4D66D] text-[#181818] font-semibold",
    outline: "border border-[#E7E3DC] text-[#74716D] bg-white/80",
    dark: "bg-[#181818] text-white font-semibold",
    destructive: "bg-red-50 text-red-600 border border-red-200 font-semibold",
    neutral: "bg-[#E7E3DC] text-[#181818] font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-sm",
        variants[variant] || variants.neutral,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
