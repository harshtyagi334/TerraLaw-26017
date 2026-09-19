import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Lightbulb,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const QuickBeginnerGuide: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (isDismissed) return null;

  return (
    <div
      id="beginner-quick-guide"
      className="mb-6 bg-white border border-[#E4E7E1] rounded-xl p-3.5 sm:p-4 shadow-sm transition-all"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#2D6CDF]/10 text-[#2D6CDF] flex items-center justify-center font-bold text-xs shrink-0 border border-[#2D6CDF]/20">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="flex-1 truncate">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#111814]">
                Land Acquisition Delay Prediction Guide
              </span>
              <span className="text-[11px] text-[#5B6660] hidden sm:inline">
                &bull; Machine learning forecasts parcel delays 60–90 days ahead
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-[#111814] hover:text-[#0F3D2E] bg-[#F7F8F5] hover:bg-slate-200/70 border border-[#E4E7E1] rounded-lg px-2.5 py-1.5 transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
          >
            <span>{isExpanded ? 'Hide Steps' : '4-Step Workflow'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-[#5B6660] hover:text-[#111814] rounded transition cursor-pointer"
            title="Dismiss guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3.5 pt-3.5 border-t border-[#E4E7E1] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs animate-in fade-in slide-in-from-top-1">
          {/* Step 1 */}
          <div className="bg-[#F7F8F5] p-3.5 rounded-lg border border-[#E4E7E1]">
            <span className="font-bold text-[#111814] flex items-center gap-1.5 text-xs">
              <span className="w-4 h-4 rounded-full bg-[#2D6CDF]/15 text-[#2D6CDF] flex items-center justify-center text-[10px] font-bold">1</span>
              Review Portfolio
            </span>
            <p className="text-[11px] text-[#5B6660] mt-1">
              Examine land hectares, compensation disbursed, and High Risk delay probability across 700 acquisitions.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-[#F7F8F5] p-3.5 rounded-lg border border-[#E4E7E1]">
            <span className="font-bold text-[#111814] flex items-center gap-1.5 text-xs">
              <span className="w-4 h-4 rounded-full bg-[#2D6CDF]/15 text-[#2D6CDF] flex items-center justify-center text-[10px] font-bold">2</span>
              Inspect Spatial Map
            </span>
            <p className="text-[11px] text-[#5B6660] mt-1">
              Locate acquisitions across India with color-coded risk markers (Red / Amber / Green).
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-[#F7F8F5] p-3.5 rounded-lg border border-[#E4E7E1]">
            <span className="font-bold text-[#111814] flex items-center gap-1.5 text-xs">
              <span className="w-4 h-4 rounded-full bg-[#2D6CDF]/15 text-[#2D6CDF] flex items-center justify-center text-[10px] font-bold">3</span>
              TreeSHAP Explain
            </span>
            <p className="text-[11px] text-[#5B6660] mt-1">
              Inspect AI attribution drivers showing root causes (e.g. stalled compensation, dispute backlog).
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-[#F7F8F5] p-3.5 rounded-lg border border-[#E4E7E1]">
            <span className="font-bold text-[#111814] flex items-center gap-1.5 text-xs">
              <span className="w-4 h-4 rounded-full bg-[#1F7A4D]/15 text-[#1F7A4D] flex items-center justify-center text-[10px] font-bold">4</span>
              Export Formal Report
            </span>
            <p className="text-[11px] text-[#5B6660] mt-1">
              Generate structured, signed administrative status dossiers and statutory escalation packages.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
