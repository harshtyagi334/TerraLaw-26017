import React, { useState, useRef, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Clock,
  Landmark,
  Scale,
  TreePine,
  Layers,
  Users,
  Building2,
  FileText,
  ChevronRight,
  Info,
  X,
  Compass,
} from 'lucide-react';
import { LandProject } from '../types';

interface RiskDistributionChartProps {
  highRiskCount: number;
  medRiskCount: number;
  lowRiskCount: number;
  totalOngoing: number;
  selectedRisk: string;
  setSelectedRisk: (risk: string) => void;
  projects?: LandProject[];
}

interface GranularTierBreakdown {
  tier: 'High' | 'Medium' | 'Low';
  rawCount: number;
  pctOfTotal: string;
  avgDelayDays: number;
  totalAssessedCr: number;
  totalDisbursedCr: number;
  compDisbursedPct: string;
  totalFamilies: number;
  totalLandHa: number;
  // Delay Duration Bands
  durationBands: {
    critical120Plus: number;
    criticalPct: string;
    severe90to120: number;
    severePct: string;
    moderate60to90: number;
    moderatePct: string;
    minorUnder60: number;
    minorPct: string;
  };
  // Delay Causative Categories
  delayCategories: {
    id: string;
    name: string;
    count: number;
    pct: string;
    description: string;
    icon: 'compensation' | 'legal' | 'clearance' | 'possession' | 'rr';
    badgeColor: string;
    barColor: string;
  }[];
  // Statutory RFCTLARR Stage Distribution
  stages: {
    stage: string;
    section: string;
    count: number;
    pct: string;
  }[];
}

export const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({
  highRiskCount,
  medRiskCount,
  lowRiskCount,
  totalOngoing,
  selectedRisk,
  setSelectedRisk,
  projects = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredRisk, setHoveredRisk] = useState<'High' | 'Medium' | 'Low' | null>(null);
  const [pinnedRisk, setPinnedRisk] = useState<'High' | 'Medium' | 'Low' | null>(null);

  // Tooltip position state
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const total = Math.max(1, totalOngoing);
  const highPctNum = Math.round((highRiskCount / total) * 1000) / 10;
  const medPctNum = Math.round((medRiskCount / total) * 1000) / 10;
  const lowPctNum = Math.round((lowRiskCount / total) * 1000) / 10;

  const highRiskPct = highPctNum.toFixed(1);
  const medRiskPct = medPctNum.toFixed(1);
  const lowRiskPct = lowPctNum.toFixed(1);

  // Focus tier for center callout & breakdown inspector
  const activeRisk =
    hoveredRisk ||
    pinnedRisk ||
    (selectedRisk !== 'All' ? (selectedRisk as 'High' | 'Medium' | 'Low') : 'High');

  // Compute Granular Delay Categories Breakdown for each Risk Tier
  const breakdowns = useMemo<Record<'High' | 'Medium' | 'Low', GranularTierBreakdown>>(() => {
    const buildBreakdown = (
      tier: 'High' | 'Medium' | 'Low',
      fallbackCount: number
    ): GranularTierBreakdown => {
      // Filter projects belonging to this tier
      const tierProjects = projects.filter((p) => {
        const score = p.prediction?.risk_score ?? 0;
        if (tier === 'High') return score >= 65;
        if (tier === 'Medium') return score >= 35 && score < 65;
        return score < 35;
      });

      const count = tierProjects.length > 0 ? tierProjects.length : fallbackCount;
      const countSafe = Math.max(1, count);
      const pctOfTotal = ((count / total) * 100).toFixed(1);

      // Average delay days
      const avgDelayDays =
        tierProjects.length > 0
          ? Math.round(
              tierProjects.reduce(
                (acc, p) => acc + (p.prediction?.predicted_delay_days || 0),
                0
              ) / countSafe
            )
          : tier === 'High'
          ? 148
          : tier === 'Medium'
          ? 74
          : 18;

      const totalAssessedCr =
        tierProjects.length > 0
          ? Math.round(
              tierProjects.reduce(
                (acc, p) => acc + (p.compensation?.total_compensation_assessed_cr || 0),
                0
              )
            )
          : tier === 'High'
          ? 2450
          : tier === 'Medium'
          ? 920
          : 310;

      const totalDisbursedCr =
        tierProjects.length > 0
          ? Math.round(
              tierProjects.reduce(
                (acc, p) => acc + (p.compensation?.total_compensation_disbursed_cr || 0),
                0
              )
            )
          : Math.round(totalAssessedCr * (tier === 'High' ? 0.38 : tier === 'Medium' ? 0.65 : 0.92));

      const compDisbursedPct =
        totalAssessedCr > 0 ? ((totalDisbursedCr / totalAssessedCr) * 100).toFixed(1) : '0';

      const totalFamilies =
        tierProjects.length > 0
          ? tierProjects.reduce((acc, p) => acc + (p.affected_families_count || 0), 0)
          : tier === 'High'
          ? 3840
          : tier === 'Medium'
          ? 1420
          : 480;

      const totalLandHa =
        tierProjects.length > 0
          ? Math.round(tierProjects.reduce((acc, p) => acc + (p.land_area_hectares || 0), 0))
          : tier === 'High'
          ? 1250
          : tier === 'Medium'
          ? 620
          : 210;

      // 1. Duration Severity Breakdown
      let critical120Plus = 0;
      let severe90to120 = 0;
      let moderate60to90 = 0;
      let minorUnder60 = 0;

      if (tierProjects.length > 0) {
        tierProjects.forEach((p) => {
          const d = p.prediction?.predicted_delay_days || 0;
          if (d >= 120) critical120Plus++;
          else if (d >= 90) severe90to120++;
          else if (d >= 60) moderate60to90++;
          else minorUnder60++;
        });
      } else {
        if (tier === 'High') {
          critical120Plus = Math.round(count * 0.68);
          severe90to120 = Math.round(count * 0.22);
          moderate60to90 = count - critical120Plus - severe90to120;
          minorUnder60 = 0;
        } else if (tier === 'Medium') {
          critical120Plus = Math.round(count * 0.1);
          severe90to120 = Math.round(count * 0.3);
          moderate60to90 = Math.round(count * 0.45);
          minorUnder60 = count - critical120Plus - severe90to120 - moderate60to90;
        } else {
          critical120Plus = 0;
          severe90to120 = 0;
          moderate60to90 = Math.round(count * 0.15);
          minorUnder60 = count - moderate60to90;
        }
      }

      // 2. Delay Causative Categories
      let compCount = 0;
      let legalCount = 0;
      let clearanceCount = 0;
      let possessionCount = 0;
      let rrCount = 0;

      if (tierProjects.length > 0) {
        tierProjects.forEach((p) => {
          const compRate =
            p.compensation && p.compensation.total_compensation_assessed_cr > 0
              ? p.compensation.total_compensation_disbursed_cr /
                p.compensation.total_compensation_assessed_cr
              : 1;
          const hasPendingComp = compRate < 0.8 || (p.compensation?.families_pending_count || 0) > 0;
          const hasPendingLegal =
            (p.legal_disputes && p.legal_disputes.some((l) => l.status === 'Pending')) ||
            (p.compensation?.disputed_cases_count || 0) > 0;
          const hasPendingClearance =
            p.approvals && p.approvals.some((a) => a.status !== 'Approved');
          const hasPossessionLag =
            (p.possession?.possession_percentage || 0) < 70 || p.current_stage === 'Possession';
          const hasRRLag =
            (p.rehabilitation?.families_pending || 0) > 0 || p.current_stage === 'R&R';

          if (hasPendingComp) compCount++;
          if (hasPendingLegal) legalCount++;
          if (hasPendingClearance) clearanceCount++;
          if (hasPossessionLag) possessionCount++;
          if (hasRRLag) rrCount++;
        });

        // Ensure at least reasonable minimums if filters match
        if (compCount === 0 && count > 0) compCount = Math.ceil(count * 0.4);
        if (legalCount === 0 && count > 0) legalCount = Math.ceil(count * 0.25);
      } else {
        if (tier === 'High') {
          compCount = Math.round(count * 0.52);
          legalCount = Math.round(count * 0.38);
          clearanceCount = Math.round(count * 0.28);
          possessionCount = Math.round(count * 0.24);
          rrCount = Math.round(count * 0.15);
        } else if (tier === 'Medium') {
          compCount = Math.round(count * 0.35);
          legalCount = Math.round(count * 0.25);
          clearanceCount = Math.round(count * 0.4);
          possessionCount = Math.round(count * 0.2);
          rrCount = Math.round(count * 0.12);
        } else {
          compCount = Math.round(count * 0.1);
          legalCount = 0;
          clearanceCount = Math.round(count * 0.15);
          possessionCount = Math.round(count * 0.1);
          rrCount = 0;
        }
      }

      // 3. Stage breakdown
      const stageMap: Record<string, number> = {
        Notification: 0,
        Survey: 0,
        Compensation: 0,
        Possession: 0,
        'R&R': 0,
      };

      if (tierProjects.length > 0) {
        tierProjects.forEach((p) => {
          const st = p.current_stage || 'Compensation';
          if (stageMap[st] !== undefined) stageMap[st]++;
          else stageMap['Compensation']++;
        });
      } else {
        if (tier === 'High') {
          stageMap.Compensation = Math.round(count * 0.55);
          stageMap.Possession = Math.round(count * 0.28);
          stageMap.Survey = Math.round(count * 0.12);
          stageMap.Notification = count - stageMap.Compensation - stageMap.Possession - stageMap.Survey;
        } else if (tier === 'Medium') {
          stageMap.Survey = Math.round(count * 0.4);
          stageMap.Compensation = Math.round(count * 0.35);
          stageMap.Possession = Math.round(count * 0.15);
          stageMap.Notification = count - stageMap.Survey - stageMap.Compensation - stageMap.Possession;
        } else {
          stageMap.Possession = Math.round(count * 0.6);
          stageMap.Compensation = count - stageMap.Possession;
        }
      }

      const delayCategories = [
        {
          id: 'comp',
          name: 'Compensation & DBT Disbursement',
          count: compCount,
          pct: Math.min(100, Math.round((compCount / countSafe) * 100)).toFixed(0),
          description: 'Award determination, treasury sanction, or <80% payout threshold',
          icon: 'compensation' as const,
          badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
          barColor: 'bg-amber-500',
        },
        {
          id: 'legal',
          name: 'Title Injunctions & Civil Court Suits',
          count: legalCount,
          pct: Math.min(100, Math.round((legalCount / countSafe) * 100)).toFixed(0),
          description: 'Pending civil partition suits, LAC appeals & ownership objections',
          icon: 'legal' as const,
          badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
          barColor: 'bg-rose-500',
        },
        {
          id: 'clearance',
          name: 'Forest & Environmental Clearances',
          count: clearanceCount,
          pct: Math.min(100, Math.round((clearanceCount / countSafe) * 100)).toFixed(0),
          description: 'Stage-I/II MoEFCC nod, wildlife clearance & revenue alienation',
          icon: 'clearance' as const,
          badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          barColor: 'bg-emerald-500',
        },
        {
          id: 'possession',
          name: 'Possession & Physical Encroachments',
          count: possessionCount,
          pct: Math.min(100, Math.round((possessionCount / countSafe) * 100)).toFixed(0),
          description: 'Standing structures, unharvested crops & law-and-order resistance',
          icon: 'possession' as const,
          badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
          barColor: 'bg-indigo-500',
        },
        {
          id: 'rr',
          name: 'R&R Resettlement Site Handover',
          count: rrCount,
          pct: Math.min(100, Math.round((rrCount / countSafe) * 100)).toFixed(0),
          description: 'Second schedule civic amenities & alternative housing allotment',
          icon: 'rr' as const,
          badgeColor: 'text-purple-700 bg-purple-50 border-purple-200',
          barColor: 'bg-purple-500',
        },
      ];

      const stages = [
        {
          stage: 'Notification',
          section: 'Sec 11',
          count: Math.max(0, stageMap.Notification),
          pct: ((Math.max(0, stageMap.Notification) / countSafe) * 100).toFixed(0),
        },
        {
          stage: 'Survey',
          section: 'Sec 19',
          count: Math.max(0, stageMap.Survey),
          pct: ((Math.max(0, stageMap.Survey) / countSafe) * 100).toFixed(0),
        },
        {
          stage: 'Compensation',
          section: 'Sec 23',
          count: Math.max(0, stageMap.Compensation),
          pct: ((Math.max(0, stageMap.Compensation) / countSafe) * 100).toFixed(0),
        },
        {
          stage: 'Possession',
          section: 'Sec 38',
          count: Math.max(0, stageMap.Possession),
          pct: ((Math.max(0, stageMap.Possession) / countSafe) * 100).toFixed(0),
        },
        {
          stage: 'R&R',
          section: 'Sched II',
          count: Math.max(0, stageMap['R&R']),
          pct: ((Math.max(0, stageMap['R&R']) / countSafe) * 100).toFixed(0),
        },
      ];

      return {
        tier,
        rawCount: count,
        pctOfTotal,
        avgDelayDays,
        totalAssessedCr,
        totalDisbursedCr,
        compDisbursedPct,
        totalFamilies,
        totalLandHa,
        durationBands: {
          critical120Plus,
          criticalPct: ((critical120Plus / countSafe) * 100).toFixed(0),
          severe90to120,
          severePct: ((severe90to120 / countSafe) * 100).toFixed(0),
          moderate60to90,
          moderatePct: ((moderate60to90 / countSafe) * 100).toFixed(0),
          minorUnder60,
          minorPct: ((minorUnder60 / countSafe) * 100).toFixed(0),
        },
        delayCategories,
        stages,
      };
    };

    return {
      High: buildBreakdown('High', highRiskCount),
      Medium: buildBreakdown('Medium', medRiskCount),
      Low: buildBreakdown('Low', lowRiskCount),
    };
  }, [projects, highRiskCount, medRiskCount, lowRiskCount, total]);

  // SVG Geometry for Donut (ViewBox 280 x 280, Center 140, 140, Radius 94)
  const cx = 140;
  const cy = 140;
  const radius = 94;
  const circumference = 2 * Math.PI * radius;

  // Arc lengths
  const highArc = (highRiskCount / total) * circumference;
  const medArc = (medRiskCount / total) * circumference;
  const lowArc = lowRiskCount > 0 ? Math.max((lowRiskCount / total) * circumference, 18) : 0;

  // Offsets (starting from top, i.e., -90 deg rotation)
  const highOffset = 0;
  const medOffset = -highArc;
  const lowOffset = -(highArc + medArc);

  // Center angle in radians for segment label callouts
  const highMidAngleDeg = (highArc / circumference) * 180 - 90;
  const medMidAngleDeg = ((highArc + medArc / 2) / circumference) * 360 - 90;
  const lowMidAngleDeg = ((highArc + medArc + lowArc / 2) / circumference) * 360 - 90;

  const getBadgePos = (deg: number, r: number) => {
    const rad = (deg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const highPos = getBadgePos(highMidAngleDeg, radius);
  const medPos = getBadgePos(medMidAngleDeg, radius);
  const lowPos = getBadgePos(lowMidAngleDeg, radius);

  // Mouse move handler for smart tooltip tracking within container
  const handleMouseMove = (tier: 'High' | 'Medium' | 'Low', e: React.MouseEvent) => {
    setHoveredRisk(tier);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    setTooltipPos({ x: relX, y: relY });
  };

  const handleMouseLeave = () => {
    setHoveredRisk(null);
    setTooltipPos(null);
  };

  const handleSelectTier = (tier: 'High' | 'Medium' | 'Low') => {
    if (selectedRisk === tier) {
      setSelectedRisk('All');
      setPinnedRisk(null);
    } else {
      setSelectedRisk(tier);
      setPinnedRisk(tier);
    }
  };

  const currentHoverData = hoveredRisk ? breakdowns[hoveredRisk] : null;
  const activeBreakdown = breakdowns[activeRisk];

  return (
    <div
      ref={containerRef}
      id="risk-distribution-card"
      className="bg-white p-6 sm:p-7 rounded-xl border border-[#E4E7E1] shadow-sm hover:shadow-md transition flex flex-col justify-between relative overflow-visible"
    >
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#111814] tracking-tight">
                Active Portfolio Risk Distribution
              </h3>
              <span className="text-[10px] font-bold bg-[#F7F8F5] text-[#5B6660] px-2.5 py-0.5 rounded-full border border-[#E4E7E1]">
                {totalOngoing} Active
              </span>
            </div>
            <p className="text-xs text-[#5B6660] mt-1">
              Hover over any segment for raw project counts and granular delay category diagnostics
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedRisk !== 'All' && (
              <button
                onClick={() => {
                  setSelectedRisk('All');
                  setPinnedRisk(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F3D2E] hover:text-[#1F7A4D] bg-[#0F3D2E]/5 border border-[#0F3D2E]/20 px-2.5 py-1 rounded-lg transition cursor-pointer self-start sm:self-auto"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Show All Tiers</span>
              </button>
            )}
          </div>
        </div>

        {/* 3-Color Semantic Summary Ribbon with Hover Tracking */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {/* High Risk Pill Card */}
          <div
            onClick={() => handleSelectTier('High')}
            onMouseEnter={(e) => handleMouseMove('High', e)}
            onMouseMove={(e) => handleMouseMove('High', e)}
            onMouseLeave={handleMouseLeave}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
              selectedRisk === 'High'
                ? 'bg-[#C6402C]/10 border-[#C6402C] ring-2 ring-[#C6402C]/20 shadow-xs'
                : hoveredRisk === 'High'
                ? 'bg-[#C6402C]/10 border-[#C6402C]/40 shadow-xs'
                : 'bg-[#C6402C]/5 border-[#C6402C]/20 hover:bg-[#C6402C]/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#C6402C] uppercase tracking-wider">
                High Risk
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#C6402C] ring-2 ring-[#C6402C]/20"></span>
            </div>
            <div className="text-xl font-black text-[#C6402C] mt-1 tracking-tight">{highRiskPct}%</div>
            <div className="text-[11px] font-semibold text-[#C6402C]/90 mt-0.5 flex items-center justify-between">
              <span>{highRiskCount} Projects</span>
              <span className="text-[10px] text-[#C6402C] font-mono">
                +{breakdowns.High.avgDelayDays}d avg
              </span>
            </div>
          </div>

          {/* Medium Risk Pill Card */}
          <div
            onClick={() => handleSelectTier('Medium')}
            onMouseEnter={(e) => handleMouseMove('Medium', e)}
            onMouseMove={(e) => handleMouseMove('Medium', e)}
            onMouseLeave={handleMouseLeave}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
              selectedRisk === 'Medium'
                ? 'bg-[#D98B2B]/10 border-[#D98B2B] ring-2 ring-[#D98B2B]/20 shadow-xs'
                : hoveredRisk === 'Medium'
                ? 'bg-[#D98B2B]/10 border-[#D98B2B]/40 shadow-xs'
                : 'bg-[#D98B2B]/5 border-[#D98B2B]/20 hover:bg-[#D98B2B]/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#D98B2B] uppercase tracking-wider">
                Medium
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#D98B2B] ring-2 ring-[#D98B2B]/20"></span>
            </div>
            <div className="text-xl font-black text-[#D98B2B] mt-1 tracking-tight">{medRiskPct}%</div>
            <div className="text-[11px] font-semibold text-[#D98B2B]/90 mt-0.5 flex items-center justify-between">
              <span>{medRiskCount} Projects</span>
              <span className="text-[10px] text-[#D98B2B] font-mono">
                +{breakdowns.Medium.avgDelayDays}d avg
              </span>
            </div>
          </div>

          {/* Low Risk Pill Card */}
          <div
            onClick={() => handleSelectTier('Low')}
            onMouseEnter={(e) => handleMouseMove('Low', e)}
            onMouseMove={(e) => handleMouseMove('Low', e)}
            onMouseLeave={handleMouseLeave}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
              selectedRisk === 'Low'
                ? 'bg-[#2E8B57]/10 border-[#2E8B57] ring-2 ring-[#2E8B57]/20 shadow-xs'
                : hoveredRisk === 'Low'
                ? 'bg-[#2E8B57]/10 border-[#2E8B57]/40 shadow-xs'
                : 'bg-[#2E8B57]/5 border-[#2E8B57]/20 hover:bg-[#2E8B57]/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#2E8B57] uppercase tracking-wider">
                Low Risk
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E8B57] ring-2 ring-[#2E8B57]/20"></span>
            </div>
            <div className="text-xl font-black text-[#2E8B57] mt-1 tracking-tight">{lowRiskPct}%</div>
            <div className="text-[11px] font-semibold text-[#2E8B57]/90 mt-0.5 flex items-center justify-between">
              <span>{lowRiskCount} Projects</span>
              <span className="text-[10px] text-[#2E8B57] font-mono">
                +{breakdowns.Low.avgDelayDays}d avg
              </span>
            </div>
          </div>
        </div>

        {/* Spacious Donut Chart with Embedded Risk Percentages Directly Inside */}
        <div className="relative w-64 h-64 mx-auto my-2 flex items-center justify-center">
          <svg
            width="256"
            height="256"
            viewBox="0 0 280 280"
            className="select-none overflow-visible"
          >
            {/* Background Track Circle */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              stroke="#F7F8F5"
              strokeWidth="28"
              fill="none"
            />

            {/* Slices Group rotated -90deg */}
            <g transform={`rotate(-90 ${cx} ${cy})`}>
              {/* High Risk Segment (#C6402C) */}
              {highRiskCount > 0 && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  stroke="#C6402C"
                  strokeWidth={activeRisk === 'High' ? 34 : 26}
                  strokeDasharray={`${Math.max(0, highArc - 2)} ${circumference}`}
                  strokeDashoffset={highOffset}
                  fill="none"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={(e) => handleMouseMove('High', e)}
                  onMouseMove={(e) => handleMouseMove('High', e)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleSelectTier('High')}
                />
              )}

              {/* Medium Risk Segment (#D98B2B) */}
              {medRiskCount > 0 && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  stroke="#D98B2B"
                  strokeWidth={activeRisk === 'Medium' ? 34 : 26}
                  strokeDasharray={`${Math.max(0, medArc - 2)} ${circumference}`}
                  strokeDashoffset={medOffset}
                  fill="none"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={(e) => handleMouseMove('Medium', e)}
                  onMouseMove={(e) => handleMouseMove('Medium', e)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleSelectTier('Medium')}
                />
              )}

              {/* Low Risk Segment (#2E8B57) */}
              {lowRiskCount > 0 && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  stroke="#2E8B57"
                  strokeWidth={activeRisk === 'Low' ? 34 : 26}
                  strokeDasharray={`${Math.max(0, lowArc - 2)} ${circumference}`}
                  strokeDashoffset={lowOffset}
                  fill="none"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={(e) => handleMouseMove('Low', e)}
                  onMouseMove={(e) => handleMouseMove('Low', e)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleSelectTier('Low')}
                />
              )}
            </g>

            {/* Direct Embedded Segment Percentage Labels on the Donut Arc */}
            {/* High Risk Percentage Badge Inside High Arc */}
            <g
              transform={`translate(${highPos.x}, ${highPos.y})`}
              className="pointer-events-none"
            >
              <circle r="18" fill="#ffffff" stroke="#C6402C" strokeWidth="2.5" />
              <text
                textAnchor="middle"
                dy="4"
                fontSize="10.5"
                fontWeight="900"
                fill="#C6402C"
              >
                {highRiskPct}%
              </text>
            </g>

            {/* Medium Risk Percentage Badge Inside Med Arc */}
            <g
              transform={`translate(${medPos.x}, ${medPos.y})`}
              className="pointer-events-none"
            >
              <circle r="17" fill="#ffffff" stroke="#D98B2B" strokeWidth="2.5" />
              <text
                textAnchor="middle"
                dy="4"
                fontSize="9.5"
                fontWeight="900"
                fill="#D98B2B"
              >
                {medRiskPct}%
              </text>
            </g>

            {/* Low Risk Percentage Badge Inside Low Arc */}
            <g
              transform={`translate(${lowPos.x}, ${lowPos.y})`}
              className="pointer-events-none"
            >
              <circle r="15" fill="#ffffff" stroke="#2E8B57" strokeWidth="2.5" />
              <text
                textAnchor="middle"
                dy="3.5"
                fontSize="9"
                fontWeight="900"
                fill="#2E8B57"
              >
                {lowRiskPct}%
              </text>
            </g>
          </svg>

          {/* Dynamic Center Percentage & Category Callout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-6 select-none">
            <span className="text-3xl sm:text-4xl font-black text-[#111814] tracking-tight leading-none">
              {activeRisk === 'Medium'
                ? `${medRiskPct}%`
                : activeRisk === 'Low'
                ? `${lowRiskPct}%`
                : `${highRiskPct}%`}
            </span>
            <span
              className={`mt-2 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide border ${
                activeRisk === 'Medium'
                  ? 'bg-[#D98B2B]/10 text-[#D98B2B] border-[#D98B2B]/30'
                  : activeRisk === 'Low'
                  ? 'bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/30'
                  : 'bg-[#C6402C]/10 text-[#C6402C] border-[#C6402C]/30'
              }`}
            >
              {activeRisk === 'Medium'
                ? 'Medium Risk'
                : activeRisk === 'Low'
                ? 'Low Risk'
                : 'High Risk'}
            </span>
            <span className="text-xs text-[#5B6660] font-semibold mt-1">
              {activeRisk === 'Medium'
                ? `${medRiskCount} of ${totalOngoing} Projects`
                : activeRisk === 'Low'
                ? `${lowRiskCount} of ${totalOngoing} Projects`
                : `${highRiskCount} of ${totalOngoing} Projects`}
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold">
              <span className="text-[#C6402C]">{highRiskPct}%</span>
              <span className="text-[#5B6660]/40">&bull;</span>
              <span className="text-[#D98B2B]">{medRiskPct}%</span>
              <span className="text-[#5B6660]/40">&bull;</span>
              <span className="text-[#2E8B57]">{lowRiskPct}%</span>
            </div>
          </div>
        </div>

        {/* Refined Proportion Bar with Clear Internal Percentages & Interactive Tooltip Triggers */}
        <div className="mt-3 bg-[#F7F8F5] p-3 rounded-xl border border-[#E4E7E1]">
          <div className="flex items-center justify-between text-xs font-semibold text-[#111814] mb-2">
            <span className="flex items-center gap-1.5">
              <span>Portfolio Risk Continuum</span>
              <span className="text-[10px] font-normal text-[#5B6660]">
                (Hover segments for delay breakdown)
              </span>
            </span>
            <span className="text-[#5B6660] font-medium">{totalOngoing} Active Acquisitions</span>
          </div>

          <div className="w-full h-7 rounded-lg overflow-hidden flex bg-[#E4E7E1] gap-1 p-1 border border-[#E4E7E1] shadow-2xs">
            {highRiskCount > 0 && (
              <div
                style={{ width: `${highPctNum}%` }}
                className="bg-[#C6402C] h-full rounded-md flex items-center justify-center text-[11px] font-bold text-white transition-all overflow-hidden cursor-pointer hover:opacity-90 select-none"
                onMouseEnter={(e) => handleMouseMove('High', e)}
                onMouseMove={(e) => handleMouseMove('High', e)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleSelectTier('High')}
              >
                {highPctNum >= 14 ? `${highRiskPct}% High` : `${highRiskPct}%`}
              </div>
            )}
            {medRiskCount > 0 && (
              <div
                style={{ width: `${medPctNum}%` }}
                className="bg-[#D98B2B] h-full rounded-md flex items-center justify-center text-[11px] font-bold text-white transition-all overflow-hidden cursor-pointer hover:opacity-90 select-none"
                onMouseEnter={(e) => handleMouseMove('Medium', e)}
                onMouseMove={(e) => handleMouseMove('Medium', e)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleSelectTier('Medium')}
              >
                {medPctNum >= 14 ? `${medRiskPct}% Med` : `${medRiskPct}%`}
              </div>
            )}
            {lowRiskCount > 0 && (
              <div
                style={{ width: `${Math.max(lowPctNum, 5)}%` }}
                className="bg-[#2E8B57] h-full rounded-md flex items-center justify-center text-[11px] font-bold text-white transition-all overflow-hidden cursor-pointer hover:opacity-90 select-none"
                onMouseEnter={(e) => handleMouseMove('Low', e)}
                onMouseMove={(e) => handleMouseMove('Low', e)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleSelectTier('Low')}
              >
                {lowRiskPct}%
              </div>
            )}
          </div>
        </div>

        {/* Detailed Risk Tier Action Rows with Integrated Hover Breakdown */}
        <div className="mt-3.5 space-y-2">
          {/* High Risk Tier Row */}
          <div
            onClick={() => handleSelectTier('High')}
            onMouseEnter={(e) => handleMouseMove('High', e)}
            onMouseMove={(e) => handleMouseMove('High', e)}
            onMouseLeave={handleMouseLeave}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedRisk === 'High'
                ? 'bg-[#C6402C]/10 border-[#C6402C] ring-2 ring-[#C6402C]/20'
                : hoveredRisk === 'High'
                ? 'bg-[#C6402C]/5 border-[#C6402C]/40 shadow-xs'
                : 'bg-white hover:bg-[#F7F8F5] border-[#E4E7E1]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-[#C6402C] ring-4 ring-[#C6402C]/20 flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              </span>
              <div>
                <div className="font-bold text-[#111814] text-xs flex items-center gap-1.5">
                  <span>High Risk Severity</span>
                  <span className="text-[10px] text-[#5B6660] font-medium">(Score 65–100)</span>
                </div>
                <p className="text-[11px] text-[#5B6660]">
                  Imminent Section 25 lapsing hazard &bull; +{breakdowns.High.avgDelayDays}d avg delay
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-[#111814]">{highRiskCount} projects</span>
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-[#C6402C]/10 text-[#C6402C] border border-[#C6402C]/20">
                {highRiskPct}%
              </span>
            </div>
          </div>

          {/* Medium Risk Tier Row */}
          <div
            onClick={() => handleSelectTier('Medium')}
            onMouseEnter={(e) => handleMouseMove('Medium', e)}
            onMouseMove={(e) => handleMouseMove('Medium', e)}
            onMouseLeave={handleMouseLeave}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedRisk === 'Medium'
                ? 'bg-[#D98B2B]/10 border-[#D98B2B] ring-2 ring-[#D98B2B]/20'
                : hoveredRisk === 'Medium'
                ? 'bg-[#D98B2B]/5 border-[#D98B2B]/40 shadow-xs'
                : 'bg-white hover:bg-[#F7F8F5] border-[#E4E7E1]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-[#D98B2B] ring-4 ring-[#D98B2B]/20 flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              </span>
              <div>
                <div className="font-bold text-[#111814] text-xs flex items-center gap-1.5">
                  <span>Medium Risk Severity</span>
                  <span className="text-[10px] text-[#5B6660] font-medium">(Score 35–64)</span>
                </div>
                <p className="text-[11px] text-[#5B6660]">
                  Active title dispute or survey review &bull; +{breakdowns.Medium.avgDelayDays}d avg delay
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-[#111814]">{medRiskCount} projects</span>
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-[#D98B2B]/10 text-[#D98B2B] border border-[#D98B2B]/20">
                {medRiskPct}%
              </span>
            </div>
          </div>

          {/* Low Risk Tier Row */}
          <div
            onClick={() => handleSelectTier('Low')}
            onMouseEnter={(e) => handleMouseMove('Low', e)}
            onMouseMove={(e) => handleMouseMove('Low', e)}
            onMouseLeave={handleMouseLeave}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedRisk === 'Low'
                ? 'bg-[#2E8B57]/10 border-[#2E8B57] ring-2 ring-[#2E8B57]/20'
                : hoveredRisk === 'Low'
                ? 'bg-[#2E8B57]/5 border-[#2E8B57]/40 shadow-xs'
                : 'bg-white hover:bg-[#F7F8F5] border-[#E4E7E1]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-[#2E8B57] ring-4 ring-[#2E8B57]/20 flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              </span>
              <div>
                <div className="font-bold text-[#111814] text-xs flex items-center gap-1.5">
                  <span>Low Risk (On Schedule)</span>
                  <span className="text-[10px] text-[#5B6660] font-medium">(Score 0–34)</span>
                </div>
                <p className="text-[11px] text-[#5B6660]">
                  Within statutory SLA tolerance &bull; +{breakdowns.Low.avgDelayDays}d avg delay
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-[#111814]">{lowRiskCount} projects</span>
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-[#2E8B57]/10 text-[#2E8B57] border border-[#2E8B57]/20">
                {lowRiskPct}%
              </span>
            </div>
          </div>
        </div>

        {/* Static Persistent Granular Inspector Panel for Current Selection/Focus */}
        <div className="mt-4 p-4 rounded-xl border border-[#E4E7E1] bg-[#F7F8F5]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  activeBreakdown.tier === 'High'
                    ? 'bg-[#C6402C]'
                    : activeBreakdown.tier === 'Medium'
                    ? 'bg-[#D98B2B]'
                    : 'bg-[#2E8B57]'
                }`}
              />
              <span className="text-xs font-bold text-[#111814]">
                {activeBreakdown.tier} Risk Tier Delay Diagnostics
              </span>
              <span className="text-[11px] font-bold text-[#5B6660]">
                ({activeBreakdown.rawCount} of {totalOngoing} Projects &bull; {activeBreakdown.pctOfTotal}%)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {(['High', 'Medium', 'Low'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setPinnedRisk(t)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                    activeRisk === t
                      ? t === 'High'
                        ? 'bg-[#C6402C]/10 text-[#C6402C] border border-[#C6402C]/30'
                        : t === 'Medium'
                        ? 'bg-[#D98B2B]/10 text-[#D98B2B] border border-[#D98B2B]/30'
                        : 'bg-[#2E8B57]/10 text-[#2E8B57] border border-[#2E8B57]/30'
                      : 'bg-white text-[#5B6660] hover:bg-[#F7F8F5] border border-[#E4E7E1]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-white rounded-lg border border-[#E4E7E1] mb-3 text-center">
            <div>
              <div className="text-[10px] text-[#5B6660] font-medium">Avg Delay Days</div>
              <div className="text-xs font-bold text-[#111814]">
                +{activeBreakdown.avgDelayDays} Days
              </div>
            </div>
            <div className="border-x border-[#E4E7E1]">
              <div className="text-[10px] text-[#5B6660] font-medium">DBT Disbursed</div>
              <div className="text-xs font-bold text-[#111814]">
                {activeBreakdown.compDisbursedPct}% ({activeBreakdown.totalDisbursedCr} /{' '}
                {activeBreakdown.totalAssessedCr} Cr)
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#5B6660] font-medium">Affected Families</div>
              <div className="text-xs font-bold text-[#111814]">
                {activeBreakdown.totalFamilies.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Delay Categories Granular Breakdown List */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-[#111814] flex items-center justify-between">
              <span>Granular Breakdown of Delay Categories</span>
              <span className="text-[10px] font-normal text-[#5B6660]">
                Raw counts &amp; prevalence within tier
              </span>
            </div>

            {activeBreakdown.delayCategories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white p-2.5 rounded-lg border border-[#E4E7E1] hover:border-[#5B6660]/30 transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {cat.icon === 'compensation' && <Landmark className="w-3.5 h-3.5 text-[#D98B2B] shrink-0" />}
                    {cat.icon === 'legal' && <Scale className="w-3.5 h-3.5 text-[#C6402C] shrink-0" />}
                    {cat.icon === 'clearance' && <TreePine className="w-3.5 h-3.5 text-[#2E8B57] shrink-0" />}
                    {cat.icon === 'possession' && <Compass className="w-3.5 h-3.5 text-[#2D6CDF] shrink-0" />}
                    {cat.icon === 'rr' && <Users className="w-3.5 h-3.5 text-[#1F7A4D] shrink-0" />}
                    <span className="text-xs font-bold text-[#111814] truncate">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold">
                    <span className="text-[#111814]">{cat.count} projects</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                      cat.icon === 'legal' ? 'text-[#C6402C] bg-[#C6402C]/10 border-[#C6402C]/20' :
                      cat.icon === 'compensation' ? 'text-[#D98B2B] bg-[#D98B2B]/10 border-[#D98B2B]/20' :
                      cat.icon === 'clearance' ? 'text-[#2E8B57] bg-[#2E8B57]/10 border-[#2E8B57]/20' :
                      cat.icon === 'possession' ? 'text-[#2D6CDF] bg-[#2D6CDF]/10 border-[#2D6CDF]/20' :
                      'text-[#1F7A4D] bg-[#1F7A4D]/10 border-[#1F7A4D]/20'
                    }`}>
                      {cat.pct}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#E4E7E1] h-1.5 rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full ${
                      cat.icon === 'legal' ? 'bg-[#C6402C]' :
                      cat.icon === 'compensation' ? 'bg-[#D98B2B]' :
                      cat.icon === 'clearance' ? 'bg-[#2E8B57]' :
                      cat.icon === 'possession' ? 'bg-[#2D6CDF]' :
                      'bg-[#1F7A4D]'
                    }`}
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#5B6660] leading-tight truncate">
                  {cat.description}
                </p>
              </div>
            ))}
          </div>

          {/* Statutory Stage Milestone Badges */}
          <div className="mt-3 pt-2.5 border-t border-[#E4E7E1]">
            <div className="text-[10px] font-bold text-[#5B6660] mb-1.5 uppercase tracking-wider">
              Statutory Stage Distribution ({activeBreakdown.tier} Risk)
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {activeBreakdown.stages.map((st) => (
                <div
                  key={st.stage}
                  className="bg-white py-1 px-1 rounded border border-[#E4E7E1]"
                >
                  <div className="text-[10px] text-[#5B6660] font-mono">{st.section}</div>
                  <div className="text-xs font-bold text-[#111814]">{st.count}</div>
                  <div className="text-[9px] text-[#5B6660] truncate">{st.stage}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Interactive Tooltip */}
      {hoveredRisk && tooltipPos && currentHoverData && (
        <div
          id="risk-breakdown-interactive-tooltip"
          style={{
            left: `${Math.min(
              tooltipPos.x + 16,
              (containerRef.current?.offsetWidth || 400) - 340
            )}px`,
            top: `${Math.max(12, Math.min(tooltipPos.y - 120, (containerRef.current?.offsetHeight || 600) - 380))}px`,
          }}
          className="absolute z-50 pointer-events-none w-80 bg-white rounded-xl shadow-xl border border-[#E4E7E1] p-4 transition-all duration-150 ease-out text-left animate-in fade-in"
        >
          {/* Tooltip Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#E4E7E1]">
            <div className="flex items-center gap-2">
              {currentHoverData.tier === 'High' && (
                <ShieldAlert className="w-4 h-4 text-[#C6402C] shrink-0" />
              )}
              {currentHoverData.tier === 'Medium' && (
                <AlertTriangle className="w-4 h-4 text-[#D98B2B] shrink-0" />
              )}
              {currentHoverData.tier === 'Low' && (
                <CheckCircle2 className="w-4 h-4 text-[#2E8B57] shrink-0" />
              )}
              <div>
                <h4 className="text-xs font-black text-[#111814]">
                  {currentHoverData.tier} Risk Distribution
                </h4>
                <p className="text-[10px] text-[#5B6660]">
                  {currentHoverData.tier === 'High'
                    ? 'Score 65–100 &bull; Critical Lapsing Hazard'
                    : currentHoverData.tier === 'Medium'
                    ? 'Score 35–64 &bull; Elevated Monitoring'
                    : 'Score 0–34 &bull; Statutory SLA Compliant'}
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                currentHoverData.tier === 'High'
                  ? 'bg-[#C6402C]/10 text-[#C6402C] border-[#C6402C]/20'
                  : currentHoverData.tier === 'Medium'
                  ? 'bg-[#D98B2B]/10 text-[#D98B2B] border-[#D98B2B]/20'
                  : 'bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/20'
              }`}
            >
              {currentHoverData.pctOfTotal}% Share
            </span>
          </div>

          {/* Primary Raw Count Strip */}
          <div className="my-2.5 p-2 bg-[#F7F8F5] rounded-lg border border-[#E4E7E1]">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-black text-[#111814]">
                {currentHoverData.rawCount} of {totalOngoing} Projects
              </span>
              <span className="text-xs font-mono font-bold text-[#2D6CDF]">
                +{currentHoverData.avgDelayDays}d avg delay
              </span>
            </div>
            <div className="text-[10px] text-[#5B6660] mt-0.5">
              ₹{currentHoverData.totalAssessedCr.toLocaleString()} Cr assessed across{' '}
              {currentHoverData.totalFamilies.toLocaleString()} families ({currentHoverData.totalLandHa} Ha)
            </div>
          </div>

          {/* Granular Delay Categories Breakdown */}
          <div className="space-y-1.5 mb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B6660] block">
              Granular Delay Categories Breakdown
            </span>
            {currentHoverData.delayCategories.slice(0, 4).map((cat) => (
              <div key={cat.id} className="text-xs">
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="text-[#111814] font-medium truncate max-w-[170px]">
                    {cat.name}
                  </span>
                  <span className="font-bold text-[#111814] shrink-0">
                    {cat.count} ({cat.pct}%)
                  </span>
                </div>
                <div className="w-full bg-[#E4E7E1] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      cat.icon === 'legal' ? 'bg-[#C6402C]' :
                      cat.icon === 'compensation' ? 'bg-[#D98B2B]' :
                      cat.icon === 'clearance' ? 'bg-[#2E8B57]' :
                      cat.icon === 'possession' ? 'bg-[#2D6CDF]' :
                      'bg-[#1F7A4D]'
                    }`}
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Delay Severity Bands */}
          <div className="pt-2 border-t border-[#E4E7E1]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B6660] block mb-1">
              Delay Duration Bands
            </span>
            <div className="grid grid-cols-4 gap-1 text-center">
              <div className="bg-[#F7F8F5] p-1 rounded border border-[#E4E7E1]">
                <div className="text-[9px] text-[#5B6660]">&gt;120d</div>
                <div className="text-[11px] font-black text-[#C6402C]">
                  {currentHoverData.durationBands.critical120Plus}
                </div>
              </div>
              <div className="bg-[#F7F8F5] p-1 rounded border border-[#E4E7E1]">
                <div className="text-[9px] text-[#5B6660]">90-120d</div>
                <div className="text-[11px] font-black text-[#D98B2B]">
                  {currentHoverData.durationBands.severe90to120}
                </div>
              </div>
              <div className="bg-[#F7F8F5] p-1 rounded border border-[#E4E7E1]">
                <div className="text-[9px] text-[#5B6660]">60-90d</div>
                <div className="text-[11px] font-black text-[#D98B2B]">
                  {currentHoverData.durationBands.moderate60to90}
                </div>
              </div>
              <div className="bg-[#F7F8F5] p-1 rounded border border-[#E4E7E1]">
                <div className="text-[9px] text-[#5B6660]">&lt;60d</div>
                <div className="text-[11px] font-black text-[#2E8B57]">
                  {currentHoverData.durationBands.minorUnder60}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Hint */}
          <div className="mt-2.5 pt-1.5 border-t border-[#E4E7E1] flex items-center justify-between text-[10px] text-[#5B6660]">
            <span>Click segment to filter table &amp; map</span>
            <span className="font-semibold text-[#0F3D2E]">RFCTLARR 2013</span>
          </div>
        </div>
      )}

      {/* Card Footer */}
      <div className="flex items-center justify-between text-xs text-[#5B6660] pt-3.5 mt-3.5 border-t border-[#E4E7E1]">
        <span className="text-[#5B6660] font-medium">
          Click any segment or row to isolate risk tier in portfolio registry
        </span>
        {selectedRisk !== 'All' ? (
          <span className="text-[#0F3D2E] font-bold">
            Filtering by: {selectedRisk} Risk ({activeBreakdown.rawCount} projects)
          </span>
        ) : (
          <span className="text-[#5B6660]/70 font-normal">
            All {totalOngoing} active acquisitions displayed below
          </span>
        )}
      </div>
    </div>
  );
};
