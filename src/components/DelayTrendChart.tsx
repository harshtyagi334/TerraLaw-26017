import React, { useState } from 'react';
import {
  TrendingDown,
  Target,
  Info,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export interface TrendYearData {
  year: string;
  plannedAvg: number; // Statutory SLA planned days
  actualAvg: number;  // Actual total project elapsed days
  delayAvg: number;   // Average delay slippage (+days)
  pctOfSLA: number;   // % of planned SLA consumed
  status: 'Critical' | 'Warning' | 'Improving' | 'Target';
  tierColor: 'rose' | 'amber' | 'emerald' | 'indigo';
  keyDriver: string;
  reforms: string;
}

const TREND_DATA: TrendYearData[] = [
  {
    year: '2020',
    plannedAvg: 320,
    actualAvg: 410,
    delayAvg: 90,
    pctOfSLA: 128,
    status: 'Warning',
    tierColor: 'amber',
    keyDriver: 'Early COVID-19 lockdown disruptions & field survey suspensions',
    reforms: 'Initial emergency extensions granted under Section 25',
  },
  {
    year: '2021',
    plannedAvg: 340,
    actualAvg: 465,
    delayAvg: 125,
    pctOfSLA: 137,
    status: 'Critical',
    tierColor: 'rose',
    keyDriver: 'Court litigation backlogs & physical revenue record disputes',
    reforms: 'District Collector virtual dispute redressal circulars',
  },
  {
    year: '2022',
    plannedAvg: 360,
    actualAvg: 512,
    delayAvg: 152,
    pctOfSLA: 142,
    status: 'Critical',
    tierColor: 'rose',
    keyDriver: 'Peak slippage: overlapping highway corridor land acquisition hearings',
    reforms: 'Introduction of Bhoomi Rashi digital portal onboarding',
  },
  {
    year: '2023',
    plannedAvg: 380,
    actualAvg: 518,
    delayAvg: 138,
    pctOfSLA: 136,
    status: 'Warning',
    tierColor: 'amber',
    keyDriver: 'Gradual recovery as GIS boundary surveys replaced manual tape measurements',
    reforms: 'Standardized Section 19 declaration fast-track templates',
  },
  {
    year: '2024',
    plannedAvg: 390,
    actualAvg: 485,
    delayAvg: 95,
    pctOfSLA: 124,
    status: 'Improving',
    tierColor: 'amber',
    keyDriver: 'Direct DBT bank transfers for compensation accelerated possession handovers',
    reforms: '37% delay reduction from 2022 peak recorded statewide',
  },
  {
    year: '2025 (Proj)',
    plannedAvg: 410,
    actualAvg: 472,
    delayAvg: 62,
    pctOfSLA: 115,
    status: 'Target',
    tierColor: 'emerald',
    keyDriver: 'Integrated PM GatiShakti spatial clearance & automated Section 23 awards',
    reforms: 'Targeting sub-60 day statutory grace tolerance ceiling',
  },
];

export const DelayTrendChart: React.FC = () => {
  const [chartMode, setChartMode] = useState<'slippage' | 'horizon'>('slippage');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // SVG Chart Dimensions & Generous Breathing Space
  const width = 680;
  const height = 260;
  const padLeft = 56;
  const padRight = 36;
  const padTop = 32;
  const padBottom = 46;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Chart Mode 1: Slippage (+Days) Scale: 0 to 180 days
  const slippageMax = 180;
  const slippageTicks = [0, 45, 90, 135, 180];

  // Chart Mode 2: Full Horizon (Days) Scale: 0 to 600 days
  const horizonMax = 600;
  const horizonTicks = [0, 150, 300, 450, 600];

  // X Coordinate for each point (evenly distributed)
  const getX = (idx: number) => padLeft + (idx / (TREND_DATA.length - 1)) * chartW;

  // Y Coordinate for Slippage
  const getYSlippage = (val: number) => {
    const clamped = Math.max(0, Math.min(val, slippageMax));
    return padTop + chartH - (clamped / slippageMax) * chartH;
  };

  // Y Coordinate for Horizon
  const getYHorizon = (val: number) => {
    const clamped = Math.max(0, Math.min(val, horizonMax));
    return padTop + chartH - (clamped / horizonMax) * chartH;
  };

  // Build SVG Path for Delay Slippage
  const slippagePoints = TREND_DATA.map((d, i) => ({ x: getX(i), y: getYSlippage(d.delayAvg) }));
  const slippagePathD = slippagePoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');
  const slippageAreaD = `${slippagePathD} L ${slippagePoints[slippagePoints.length - 1].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${slippagePoints[0].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} Z`;

  // Build SVG Paths for Horizon Mode (Planned vs Actual)
  const plannedPoints = TREND_DATA.map((d, i) => ({ x: getX(i), y: getYHorizon(d.plannedAvg) }));
  const actualPoints = TREND_DATA.map((d, i) => ({ x: getX(i), y: getYHorizon(d.actualAvg) }));

  const plannedPathD = plannedPoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  const actualPathD = actualPoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  // Area between planned and actual (delay slippage band)
  const horizonBandD = `${plannedPathD} ${actualPoints
    .slice()
    .reverse()
    .map((pt) => `L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ')} Z`;

  const activeItem = hoveredIdx !== null ? TREND_DATA[hoveredIdx] : null;

  return (
    <div className="bg-white p-6 sm:p-7 rounded-xl border border-[#E4E7E1] shadow-sm hover:shadow-md transition flex flex-col justify-between">
      {/* Top Header & View Mode Switcher */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#111814] tracking-tight">
                Delay Trends &amp; Statutory SLA Horizon (2020 &ndash; 2025)
              </h3>
              <span className="text-[10px] font-bold bg-[#2D6CDF]/10 text-[#2D6CDF] px-2.5 py-0.5 rounded-full border border-[#2D6CDF]/30">
                RFCTLARR Sec 25
              </span>
            </div>
            <p className="text-xs text-[#5B6660] mt-1">
              Historical slippage vs planned statutory timelines with refined risk thresholds
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="inline-flex p-1 bg-[#F7F8F5] border border-[#E4E7E1] rounded-lg text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setChartMode('slippage')}
              className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                chartMode === 'slippage'
                  ? 'bg-[#0F3D2E] text-white shadow-2xs font-bold'
                  : 'text-[#5B6660] hover:text-[#111814]'
              }`}
            >
              Slippage Curve (+Days)
            </button>
            <button
              type="button"
              onClick={() => setChartMode('horizon')}
              className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                chartMode === 'horizon'
                  ? 'bg-[#0F3D2E] text-white shadow-2xs font-bold'
                  : 'text-[#5B6660] hover:text-[#111814]'
              }`}
            >
              Full Cycle vs SLA
            </button>
          </div>
        </div>

        {/* Executive KPI Ribbon with Distinct Semantic Colors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {/* Peak Risk Card (Risk-high #C6402C) */}
          <div className="bg-[#C6402C]/5 p-3.5 rounded-xl border border-[#C6402C]/20">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#C6402C] uppercase tracking-wider">Critical Peak</span>
              <ShieldAlert className="w-3.5 h-3.5 text-[#C6402C]" />
            </div>
            <div className="text-xl font-black text-[#C6402C] mt-1 tracking-tight">
              +152 Days
            </div>
            <div className="text-[11px] text-[#C6402C]/90 font-medium flex items-center justify-between mt-0.5">
              <span>Year 2022</span>
              <span className="font-bold">142% of SLA</span>
            </div>
          </div>

          {/* Current Slippage Card (Risk-medium #D98B2B) */}
          <div className="bg-[#D98B2B]/5 p-3.5 rounded-xl border border-[#D98B2B]/20">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#D98B2B] uppercase tracking-wider">2024 Slippage</span>
              <AlertTriangle className="w-3.5 h-3.5 text-[#D98B2B]" />
            </div>
            <div className="text-xl font-black text-[#D98B2B] mt-1 tracking-tight">
              +95 Days
            </div>
            <div className="text-[11px] text-[#D98B2B]/90 font-medium flex items-center justify-between mt-0.5">
              <span>Down -37%</span>
              <span className="font-bold">124% of SLA</span>
            </div>
          </div>

          {/* Target Milestone Card (Risk-low #2E8B57) */}
          <div className="bg-[#2E8B57]/5 p-3.5 rounded-xl border border-[#2E8B57]/20">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#2E8B57] uppercase tracking-wider">2025 Target</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2E8B57]" />
            </div>
            <div className="text-xl font-black text-[#2E8B57] mt-1 tracking-tight">
              +62 Days
            </div>
            <div className="text-[11px] text-[#2E8B57]/90 font-medium flex items-center justify-between mt-0.5">
              <span>Sub-60d Goal</span>
              <span className="font-bold">115% of SLA</span>
            </div>
          </div>

          {/* Statutory Ceiling (Neutral data accent #2D6CDF) */}
          <div className="bg-[#F7F8F5] p-3.5 rounded-xl border border-[#E4E7E1]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#5B6660] uppercase tracking-wider">Statutory Cap</span>
              <Target className="w-3.5 h-3.5 text-[#2D6CDF]" />
            </div>
            <div className="text-xl font-black text-[#111814] mt-1 tracking-tight">
              365 Days
            </div>
            <div className="text-[11px] text-[#5B6660] font-medium flex items-center justify-between mt-0.5">
              <span>Sec 25 RFCTLARR</span>
              <span className="font-bold">100% Limit</span>
            </div>
          </div>
        </div>

        {/* Legend & Semantics Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-3 pb-2.5 border-b border-[#E4E7E1]">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-[#C6402C] font-semibold">
              <span className="w-3 h-3 rounded-full bg-[#C6402C] border-2 border-white shadow-2xs"></span>
              Critical Delay Tier (&gt;120d)
            </span>
            <span className="flex items-center gap-1.5 text-[#D98B2B] font-semibold">
              <span className="w-3 h-3 rounded-full bg-[#D98B2B] border-2 border-white shadow-2xs"></span>
              Warning Tolerance (60–120d)
            </span>
            <span className="flex items-center gap-1.5 text-[#2E8B57] font-semibold">
              <span className="w-3 h-3 rounded-full bg-[#2E8B57] border-2 border-white shadow-2xs"></span>
              Target Corridor (&lt;60d)
            </span>
          </div>
          <span className="text-[11px] text-[#5B6660]">
            Click or hover data points for breakdown
          </span>
        </div>

        {/* Interactive SVG Trend Chart with Clear Zones & Embedded Percentages */}
        <div className="relative w-full overflow-x-auto">
          <div className="min-w-[580px]">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-64 select-none overflow-visible"
            >
              <defs>
                {/* Background Shaded Zones */}
                <linearGradient id="roseCriticalZone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C6402C" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#C6402C" stopOpacity="0.02" />
                </linearGradient>

                <linearGradient id="amberWarningZone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D98B2B" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#D98B2B" stopOpacity="0.02" />
                </linearGradient>

                <linearGradient id="emeraldTargetZone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2E8B57" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#2E8B57" stopOpacity="0.01" />
                </linearGradient>

                {/* Slippage Mode Primary Gradient */}
                <linearGradient id="slippageFillGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2D6CDF" stopOpacity="0.22" />
                  <stop offset="60%" stopColor="#2D6CDF" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#2D6CDF" stopOpacity="0.0" />
                </linearGradient>

                {/* Horizon Mode Band Gradient */}
                <linearGradient id="horizonGapBandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C6402C" stopOpacity="0.20" />
                  <stop offset="100%" stopColor="#D98B2B" stopOpacity="0.08" />
                </linearGradient>
              </defs>

              {/* Shaded Risk Threshold Background Zones for Slippage Mode */}
              {chartMode === 'slippage' && (
                <>
                  {/* Critical Zone: 120d to 180d */}
                  <rect
                    x={padLeft}
                    y={getYSlippage(180)}
                    width={chartW}
                    height={getYSlippage(120) - getYSlippage(180)}
                    fill="url(#roseCriticalZone)"
                  />
                  {/* Warning Zone: 60d to 120d */}
                  <rect
                    x={padLeft}
                    y={getYSlippage(120)}
                    width={chartW}
                    height={getYSlippage(60) - getYSlippage(120)}
                    fill="url(#amberWarningZone)"
                  />
                  {/* Target Zone: 0d to 60d */}
                  <rect
                    x={padLeft}
                    y={getYSlippage(60)}
                    width={chartW}
                    height={getYSlippage(0) - getYSlippage(60)}
                    fill="url(#emeraldTargetZone)"
                  />
                </>
              )}

              {/* Grid Lines & Accurate Y-Axis Labels */}
              {chartMode === 'slippage'
                ? slippageTicks.map((val) => {
                    const y = getYSlippage(val);
                    return (
                      <g key={`slip-grid-${val}`}>
                        <line
                          x1={padLeft}
                          y1={y}
                          x2={width - padRight}
                          y2={y}
                          stroke={val === 0 ? '#5B6660' : '#E4E7E1'}
                          strokeWidth={val === 0 ? 1.5 : 1}
                          strokeDasharray={val === 0 ? 'none' : '2 2'}
                        />
                        <text
                          x={padLeft - 10}
                          y={y + 3.5}
                          textAnchor="end"
                          fontSize="10"
                          fontWeight={val === 0 ? '700' : '600'}
                          fill={
                            val >= 135
                              ? '#C6402C'
                              : val >= 90
                              ? '#D98B2B'
                              : val >= 45
                              ? '#2E8B57'
                              : '#5B6660'
                          }
                        >
                          +{val}d
                        </text>
                      </g>
                    );
                  })
                : horizonTicks.map((val) => {
                    const y = getYHorizon(val);
                    return (
                      <g key={`horiz-grid-${val}`}>
                        <line
                          x1={padLeft}
                          y1={y}
                          x2={width - padRight}
                          y2={y}
                          stroke={val === 0 ? '#5B6660' : '#E4E7E1'}
                          strokeWidth={val === 0 ? 1.5 : 1}
                        />
                        <text
                          x={padLeft - 10}
                          y={y + 3.5}
                          textAnchor="end"
                          fontSize="10"
                          fontWeight="600"
                          fill="#5B6660"
                        >
                          {val}d
                        </text>
                      </g>
                    );
                  })}

              {/* Distinct Reference Threshold Lines */}
              {chartMode === 'slippage' ? (
                <>
                  {/* 120-day Critical Line */}
                  <line
                    x1={padLeft}
                    y1={getYSlippage(120)}
                    x2={width - padRight}
                    y2={getYSlippage(120)}
                    stroke="#C6402C"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                  />
                  <rect
                    x={width - padRight - 88}
                    y={getYSlippage(120) - 9}
                    width="88"
                    height="16"
                    rx="4"
                    fill="#C6402C"
                    fillOpacity="0.1"
                    stroke="#C6402C"
                    strokeOpacity="0.3"
                    strokeWidth="1"
                  />
                  <text
                    x={width - padRight - 44}
                    y={getYSlippage(120) + 2.5}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill="#C6402C"
                  >
                    Critical SLA (&gt;120d)
                  </text>

                  {/* 60-day Tolerance Line */}
                  <line
                    x1={padLeft}
                    y1={getYSlippage(60)}
                    x2={width - padRight}
                    y2={getYSlippage(60)}
                    stroke="#2E8B57"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                  />
                  <rect
                    x={width - padRight - 88}
                    y={getYSlippage(60) - 9}
                    width="88"
                    height="16"
                    rx="4"
                    fill="#2E8B57"
                    fillOpacity="0.1"
                    stroke="#2E8B57"
                    strokeOpacity="0.3"
                    strokeWidth="1"
                  />
                  <text
                    x={width - padRight - 44}
                    y={getYSlippage(60) + 2.5}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill="#2E8B57"
                  >
                    Target Bound (60d)
                  </text>
                </>
              ) : (
                /* Horizon Mode: 365-day statutory ceiling */
                <g>
                  <line
                    x1={padLeft}
                    y1={getYHorizon(365)}
                    x2={width - padRight}
                    y2={getYHorizon(365)}
                    stroke="#D98B2B"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                  <rect
                    x={width - padRight - 124}
                    y={getYHorizon(365) - 9}
                    width="124"
                    height="16"
                    rx="4"
                    fill="#D98B2B"
                    fillOpacity="0.1"
                    stroke="#D98B2B"
                    strokeOpacity="0.3"
                    strokeWidth="1"
                  />
                  <text
                    x={width - padRight - 62}
                    y={getYHorizon(365) + 2.5}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill="#D98B2B"
                  >
                    Sec 25 SLA Ceiling (365d)
                  </text>
                </g>
              )}

              {/* Slippage Area & Stroke */}
              {chartMode === 'slippage' && (
                <>
                  <path d={slippageAreaD} fill="url(#slippageFillGrad)" />
                  <path
                    d={slippagePathD}
                    fill="none"
                    stroke="#2D6CDF"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Individual Data Points with Clear Inside Risk Percentages & Badges */}
                  {TREND_DATA.map((item, idx) => {
                    const x = getX(idx);
                    const y = getYSlippage(item.delayAvg);
                    const isHovered = hoveredIdx === idx;
                    const isPeak = item.delayAvg === 152;
                    const isTarget = idx === TREND_DATA.length - 1;

                    // Color mapping
                    const dotFill =
                      item.tierColor === 'rose'
                        ? '#C6402C'
                        : item.tierColor === 'amber'
                        ? '#D98B2B'
                        : '#2E8B57';

                    const badgeFill =
                      item.tierColor === 'rose'
                        ? '#C6402C'
                        : item.tierColor === 'amber'
                        ? '#D98B2B'
                        : '#2E8B57';

                    const badgeBorder =
                      item.tierColor === 'rose'
                        ? '#C6402C'
                        : item.tierColor === 'amber'
                        ? '#D98B2B'
                        : '#2E8B57';

                    const badgeText =
                      item.tierColor === 'rose'
                        ? '#C6402C'
                        : item.tierColor === 'amber'
                        ? '#D98B2B'
                        : '#2E8B57';

                    return (
                      <g
                        key={item.year}
                        className="cursor-pointer transition-transform"
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                      >
                        {/* Hover vertical column hit target */}
                        <rect
                          x={x - 30}
                          y={padTop}
                          width="60"
                          height={chartH}
                          fill={isHovered ? 'rgba(79, 70, 229, 0.05)' : 'transparent'}
                          rx="6"
                        />

                        {/* Hover guideline */}
                        {isHovered && (
                          <line
                            x1={x}
                            y1={padTop}
                            x2={x}
                            y2={padTop + chartH}
                            stroke="#6366f1"
                            strokeWidth="1.2"
                            strokeDasharray="2 2"
                          />
                        )}

                        {/* Outer glow ring */}
                        {(isHovered || isPeak) && (
                          <circle
                            cx={x}
                            cy={y}
                            r={isHovered ? '11' : '8'}
                            fill={dotFill}
                            fillOpacity="0.22"
                          />
                        )}

                        {/* Main Data Circle */}
                        <circle
                          cx={x}
                          cy={y}
                          r={isHovered ? '6' : '5'}
                          fill={dotFill}
                          stroke="#ffffff"
                          strokeWidth="2.5"
                        />

                        {/* Value Pill Badge Inside Chart (e.g., +152d) */}
                        <rect
                          x={x - 22}
                          y={y - 23}
                          width="44"
                          height="16"
                          rx="4"
                          fill={badgeFill}
                          stroke={badgeBorder}
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y={y - 12}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="800"
                          fill={badgeText}
                        >
                          +{item.delayAvg}d
                        </text>

                        {/* Inside SLA Percentage Callout: e.g. 142% SLA */}
                        <text
                          x={x}
                          y={y + 16}
                          textAnchor="middle"
                          fontSize="8.5"
                          fontWeight="700"
                          fill={dotFill}
                        >
                          {item.pctOfSLA}% SLA
                        </text>

                        {/* Year Label */}
                        <text
                          x={x}
                          y={padTop + chartH + 20}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight={isHovered ? '800' : '600'}
                          fill={isHovered ? '#0f172a' : '#64748b'}
                        >
                          {item.year}
                        </text>
                      </g>
                    );
                  })}
                </>
              )}

              {/* Horizon Mode (Planned vs Actual Slippage Gap) */}
              {chartMode === 'horizon' && (
                <>
                  <path d={horizonBandD} fill="url(#horizonGapBandGrad)" />

                  {/* Planned Statutory Horizon Line */}
                  <path
                    d={plannedPathD}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="5 4"
                    strokeLinecap="round"
                  />

                  {/* Actual Duration Line */}
                  <path
                    d={actualPathD}
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {TREND_DATA.map((item, idx) => {
                    const x = getX(idx);
                    const yPlanned = getYHorizon(item.plannedAvg);
                    const yActual = getYHorizon(item.actualAvg);
                    const isHovered = hoveredIdx === idx;

                    return (
                      <g
                        key={item.year}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                      >
                        {/* Gap Connector */}
                        <line
                          x1={x}
                          y1={yPlanned}
                          x2={x}
                          y2={yActual}
                          stroke="#f43f5e"
                          strokeWidth={isHovered ? '3' : '2'}
                          strokeOpacity="0.7"
                        />

                        {/* Planned baseline circle */}
                        <circle cx={x} cy={yPlanned} r="4" fill="#94a3b8" stroke="#ffffff" strokeWidth="1.5" />

                        {/* Actual elapsed circle */}
                        <circle cx={x} cy={yActual} r={isHovered ? '6' : '5'} fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />

                        {/* Actual Duration Value */}
                        <text
                          x={x}
                          y={yActual - 10}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="800"
                          fill="#312e81"
                        >
                          {item.actualAvg}d
                        </text>

                        {/* Gap Slippage Label */}
                        <text
                          x={x}
                          y={(yPlanned + yActual) / 2 + 3}
                          textAnchor="middle"
                          fontSize="8.5"
                          fontWeight="700"
                          fill="#be123c"
                        >
                          +{item.delayAvg}d
                        </text>

                        {/* Year Label */}
                        <text
                          x={x}
                          y={padTop + chartH + 20}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight={isHovered ? '800' : '600'}
                          fill={isHovered ? '#0f172a' : '#64748b'}
                        >
                          {item.year}
                        </text>
                      </g>
                    );
                  })}
                </>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Interactive Detail Inspector Card */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 min-h-[58px]">
        {activeItem ? (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-900">{activeItem.year}</span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  activeItem.tierColor === 'rose'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : activeItem.tierColor === 'amber'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {activeItem.status} Risk ({activeItem.pctOfSLA}% SLA)
              </span>
              <span className="text-xs text-slate-600 font-semibold">
                +{activeItem.delayAvg}d slippage ({activeItem.actualAvg}d total)
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate max-w-sm">
              {activeItem.keyDriver}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>
                <strong>Statutory Trajectory:</strong> Delay peaked in 2022 at <strong>+152d (142% SLA)</strong> and declined by 37% through digital compensation DBT.
              </span>
            </span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md hidden md:inline">
              Target: 115% SLA (2025)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
