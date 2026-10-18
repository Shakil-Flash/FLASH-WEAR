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
        className="inline-flex items-center gap-1.5 text-xs text-[#74716D] hover:text-[#181818] transition-colors underline underline-offset-4 decoration-[#E7E3DC] hover:decoration-[#181818]"
      >
        <Ruler className="w-3.5 h-3.5 text-[#FF5938]" />
        <span>Size Guide</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#181818]/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white rounded-lg border border-[#E7E3DC] p-6 shadow-xl z-10 text-[#181818]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E7E3DC]">
              <div>
                <h3 className="font-display text-base font-bold tracking-tight text-[#181818]">
                  FLASHWEAR Sizing Guide
                </h3>
                <p className="text-xs text-[#74716D] mt-0.5">
                  Relaxed, boxy streetwear fit. True to size for the intended silhouette.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#74716D] hover:text-[#181818] rounded-md transition-colors"
                aria-label="Close size guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Unit switch */}
            <div className="flex items-center justify-end gap-2 my-4">
              <span className="text-xs text-[#74716D]">Unit:</span>
              <button
                onClick={() => setUnit("inches")}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  unit === "inches"
                    ? "bg-[#181818] text-white font-medium"
                    : "bg-[#F7F5F0] text-[#74716D] hover:text-[#181818]"
                }`}
              >
                Inches
              </button>
              <button
                onClick={() => setUnit("cm")}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  unit === "cm"
                    ? "bg-[#181818] text-white font-medium"
                    : "bg-[#F7F5F0] text-[#74716D] hover:text-[#181818]"
                }`}
              >
                CM
              </button>
            </div>

            {/* Sizing Table */}
            <div className="overflow-x-auto border border-[#E7E3DC] rounded-md">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F5F0] text-[#74716D] uppercase text-[11px] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Chest Width</th>
                    <th className="py-2.5 px-3">Length</th>
                    <th className="py-2.5 px-3">Shoulder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E3DC]">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#181818]">S</td>
                    <td className="py-2.5 px-3 text-[#74716D]">{unit === "inches" ? '42"' : "106 cm"}</td>
                    <td className="py-2.5 px-3 text-[#74716D]">{unit === "inches" ? '27.5"' : "70 cm"}</td>
                    <td className="py-2.5 px-3 text-[#74716D]">{unit === "inches" ? '21"' : "53 cm"}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#181818]">M</td>
                    <td className="py-2.5 px-3 text-[#74716D]">{unit === "inches" ? '44"' : "112 cm"}</td>
                    <td className="py-2.5 px-3 text-[#74716D]">{unit === "inches" ? '28.5"' : "72 cm"}</td>
                    <td className="py-2.5 px-3 text-[#74716D]">{unit === "inches" ? '22"' : "56 cm"}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#181818]">L</td>
                    <td className="py-2.5 px-3 text-[#74716D]">{unit === "inches" ? '46"' : "117 cm"}</td>
                    <td className="py-2.5 px-3 text-[#74716D]">{unit === "inches" ? '29.5"' : "75 cm"}</td>
                    <td className="py-2.5 px-3 text-[#74716D]">{unit === "inches" ? '23"' : "58 cm"}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#181818]">XL</td>
                    <td className="py-2.5 px-3 text-[#74716D]">{unit === "inches" ? '48"' : "122 cm"}</td>
                    <td className="py-2.5 px-3 text-[#74716D]">{unit === "inches" ? '30.5"' : "77 cm"}</td>
                    <td className="py-2.5 px-3 text-[#74716D]">{unit === "inches" ? '24"' : "61 cm"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-[#F7F5F0] rounded border border-[#E7E3DC] text-xs text-[#74716D] leading-relaxed">
              <strong className="text-[#181818]">Fit Tip:</strong> Our cuts are deliberately boxy with a relaxed drop shoulder. If you prefer a closer fit, consider sizing down one size.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
