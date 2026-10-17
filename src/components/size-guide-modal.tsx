"use client";

import React, { useState } from "react";
import { X, Ruler } from "lucide-react";

export function SizeGuideModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [unit, setUnit] = useState<"inches" | "cm">("inches");

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[#ccff00] transition-colors underline underline-offset-4"
      >
        <Ruler className="w-3.5 h-3.5" />
        <span>Size Guide</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-[#111113] border border-zinc-800 p-6 shadow-2xl z-10 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <h3 className="text-sm uppercase font-mono font-bold tracking-wider">
                  FLASHWEAR Streetwear Sizing
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Relaxed, boxy streetwear fit. True to size for oversized look.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Unit switch */}
            <div className="flex items-center justify-end gap-2 my-4">
              <span className="text-xs text-zinc-400">Unit:</span>
              <button
                onClick={() => setUnit("inches")}
                className={`px-2.5 py-1 text-[11px] font-mono uppercase ${
                  unit === "inches"
                    ? "bg-[#ccff00] text-black font-bold"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                Inches
              </button>
              <button
                onClick={() => setUnit("cm")}
                className={`px-2.5 py-1 text-[11px] font-mono uppercase ${
                  unit === "cm"
                    ? "bg-[#ccff00] text-black font-bold"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                CM
              </button>
            </div>

            {/* Sizing Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-900/80 text-zinc-400 font-mono text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Chest Width</th>
                    <th className="py-2.5 px-3">Length</th>
                    <th className="py-2.5 px-3">Shoulder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 font-mono">
                  <tr>
                    <td className="py-3 px-3 font-bold text-[#ccff00]">S</td>
                    <td className="py-3 px-3 text-zinc-300">{unit === "inches" ? '42"' : "106 cm"}</td>
                    <td className="py-3 px-3 text-zinc-300">{unit === "inches" ? '27.5"' : "70 cm"}</td>
                    <td className="py-3 px-3 text-zinc-300">{unit === "inches" ? '21"' : "53 cm"}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-[#ccff00]">M</td>
                    <td className="py-3 px-3 text-zinc-300">{unit === "inches" ? '44"' : "112 cm"}</td>
                    <td className="py-3 px-3 text-zinc-300">{unit === "inches" ? '28.5"' : "72 cm"}</td>
                    <td className="py-3 px-3 text-zinc-300">{unit === "inches" ? '22"' : "56 cm"}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-[#ccff00]">L</td>
                    <td className="py-3 px-3 text-zinc-300">{unit === "inches" ? '46"' : "117 cm"}</td>
                    <td className="py-3 px-3 text-zinc-300">{unit === "inches" ? '29.5"' : "75 cm"}</td>
                    <td className="py-3 px-3 text-zinc-300">{unit === "inches" ? '23"' : "58 cm"}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-[#ccff00]">XL</td>
                    <td className="py-3 px-3 text-zinc-300">{unit === "inches" ? '48"' : "122 cm"}</td>
                    <td className="py-3 px-3 text-zinc-300">{unit === "inches" ? '30.5"' : "77 cm"}</td>
                    <td className="py-3 px-3 text-zinc-300">{unit === "inches" ? '24"' : "61 cm"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-5 p-3 bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
              <strong className="text-zinc-200">Fitting Tip:</strong> If you prefer a regular fit, take one size down. If you want the intended signature boxy drop-shoulder aesthetic, choose your regular standard size.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
