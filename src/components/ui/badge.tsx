import React from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "lime" | "outline" | "dark" | "destructive" | "neutral";
}

export function Badge({ className, variant = "lime", children, ...props }: BadgeProps) {
  const variants = {
    lime: "bg-[#ccff00] text-black font-semibold",
    outline: "border border-zinc-700 text-zinc-300",
    dark: "bg-zinc-800 text-zinc-200 border border-zinc-700",
    destructive: "bg-red-500/20 text-red-400 border border-red-500/30",
    neutral: "bg-zinc-900 text-zinc-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
