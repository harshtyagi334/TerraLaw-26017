import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { calculateProjectPrediction } from '../utils/mlEngine';
import { predictWithTrainedModel } from '../utils/modelApi';
import { LandProject, ProjectPrediction } from '../types';
import {
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Clock,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Zap,
  Loader2,
} from 'lucide-react';

function useSmoothNumber(target: number, durationMs: number = 200): number {
  const [current, setCurrent] = useState(target);

  useEffect(() => {
    const start = current;
    let startTime: number | null = null;
    let animationFrame: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setCurrent(Math.round(start + (target - start) * eased));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      }
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [target]);

  return current;
}

export const WhatIfSimulator: React.FC = () => {
  const {
    projects,
    selectedProject,
    setSelectedProject,
    updateProject,
    addAuditLog,
    userRole,
  } = useApp();

  const [activeProject, setActiveProject] = useState<LandProject>(
    selectedProject || projects[0]
  );

  // Simulating state variables
  const initialCompPct = activeProject.compensation
    ? (activeProject.compensation.total_compensation_disbursed_cr /
        Math.max(1, activeProject.compensation.total_compensation_assessed_cr)) *
      100
    : 40;

  const initialApprovals = (activeProject.approvals || []).filter(
    (a) => a.status === 'Pending' || a.status === 'In-Progress'
  ).length;

  const initialLegal = (activeProject.legal_disputes || []).filter(
    (l) => l.status === 'Pending'
  ).length;

  const initialPossession = activeProject.possession?.possession_percentage ?? 30;
  const initialRR = activeProject.rehabilitation
    ? (activeProject.rehabilitation.families_rehabilitated /
        Math.max(1, activeProject.rehabilitation.total_affected_families)) *
      100
    : 20;

  const [simCompPct, setSimCompPct] = useState<number>(initialCompPct);
  const [simApprovals, setSimApprovals] = useState<number>(initialApprovals);
  const [simLegal, setSimLegal] = useState<number>(initialLegal);
  const [simPossession, setSimPossession] = useState<number>(initialPossession);
  const [simRR, setSimRR] = useState<number>(initialRR);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [simulatedPred, setSimulatedPred] = useState<ProjectPrediction>(() =>
    calculateProjectPrediction(activeProject, activeProject.prediction?.probability_of_delay)
  );

  // Sync when project selection changes
  useEffect(() => {
    if (selectedProject) {
      setActiveProject(selectedProject);
      const c = selectedProject.compensation
        ? (selectedProject.compensation.total_compensation_disbursed_cr /
            Math.max(1, selectedProject.compensation.total_compensation_assessed_cr)) *
          100
        : 40;
      setSimCompPct(c);
      setSimApprovals(
        (selectedProject.approvals || []).filter(
          (a) => a.status === 'Pending' || a.status === 'In-Progress'
        ).length
      );
      setSimLegal(
        (selectedProject.legal_disputes || []).filter((l) => l.status === 'Pending').length
      );
      setSimPossession(selectedProject.possession?.possession_percentage ?? 30);
      setSimRR(
        selectedProject.rehabilitation
          ? (selectedProject.rehabilitation.families_rehabilitated /
              Math.max(1, selectedProject.rehabilitation.total_affected_families)) *
            100
          : 20
      );
      setIsSaved(false);
    }
  }, [selectedProject]);

  // Create simulated project object
  const simulatedProject: LandProject = {
    ...activeProject,
    compensation: {
      ...activeProject.compensation,
      total_compensation_disbursed_cr: parseFloat(
        (
          ((activeProject.compensation?.total_compensation_assessed_cr || 10) * simCompPct) /
          100
        ).toFixed(2)
      ),
    },
    approvals: Array.from({ length: simApprovals }).map((_, i) => ({
      approval_id: `SIM-APP-${i}`,
      approval_type: 'Forest',
      status: 'Pending',
      applied_date: '2023-01-01',
      delay_days: 45,
    })),
    legal_disputes: Array.from({ length: simLegal }).map((_, i) => ({
      case_id: `SIM-CASE-${i}`,
      case_type: 'Ownership',
      status: 'Pending',
      filed_date: '2023-01-01',
      court_level: 'High Court',
    })),
    possession: {
      ...activeProject.possession,
      possession_percentage: simPossession,
    },
    rehabilitation: {
      ...activeProject.rehabilitation,
      families_rehabilitated: Math.round(
        ((activeProject.rehabilitation?.total_affected_families || 100) * simRR) / 100
      ),
    },
  };

  const currentPred = activeProject.prediction || calculateProjectPrediction(activeProject);

  useEffect(() => {
    let active = true;
    predictWithTrainedModel(simulatedProject)
      .then((prediction) => {
        if (active) setSimulatedPred(calculateProjectPrediction(simulatedProject, prediction.probability_of_delay, prediction));
      })
      .catch((error) => console.error('The Python ML service is unavailable:', error));
    return () => {
      active = false;
    };
  }, [activeProject.project_id, simCompPct, simApprovals, simLegal, simPossession, simRR]);

  const riskDelta = currentPred.risk_score - simulatedPred.risk_score;
  const daysSaved = Math.max(0, currentPred.predicted_delay_days - simulatedPred.predicted_delay_days);

  // Smooth number interpolation
  const animatedRiskScore = useSmoothNumber(simulatedPred.risk_score, 220);
  const animatedDaysSaved = useSmoothNumber(daysSaved, 220);

  const handleApplyMitigation = () => {
    setIsSaving(true);
    setTimeout(() => {
      updateProject(activeProject.project_id, {
        compensation: simulatedProject.compensation,
        approvals: simulatedProject.approvals,
        legal_disputes: simulatedProject.legal_disputes,
        possession: simulatedProject.possession,
        rehabilitation: simulatedProject.rehabilitation,
      });

      addAuditLog({
        user_id: `USR-${userRole.replace(/\s+/g, '-').toUpperCase()}`,
        user_role: userRole,
        action: 'UPDATE',
        entity_type: 'Project',
        entity_id: activeProject.project_id,
        details: `What-If Mitigation targets committed: Risk reduced from ${currentPred.risk_score} to ${simulatedPred.risk_score}. Forecasted delay mitigated by ${daysSaved} days.`,
      });

      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3500);
    }, 250);
  };

  return (
    <div id="what-if-simulator-view" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-500" />
            <span>Interactive What-If Simulation Sandbox</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Test policy and operational interventions to observe real-time risk mitigation and days saved before issuing field orders.
          </p>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Select Project:
          </label>
          <select
            value={activeProject.project_id}
            onChange={(e) => {
              const found = projects.find((p) => p.project_id === e.target.value);
              if (found) {
                setActiveProject(found);
                setSelectedProject(found);
              }
            }}
            className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium"
          >
            {projects.slice(0, 40).map((p) => (
              <option key={p.project_id} value={p.project_id}>
                {p.project_id} &mdash; {p.project_name.substring(0, 32)}... ({p.prediction?.risk_score}/100)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Delta Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Baseline Risk */}
        <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 shadow-xs card-hover-lift flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Baseline Risk Score
            </span>
            <div className="text-3xl font-black text-slate-700 mt-1">
              {currentPred.risk_score}
              <span className="text-xs font-normal text-slate-500">/100</span>
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Category: <span className="font-bold">{currentPred.risk_category}</span>
            </div>
          </div>
          <div className="w-full bg-slate-200/90 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ease-out rounded-full ${
                currentPred.risk_score >= 65 ? 'bg-red-500' : currentPred.risk_score >= 35 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, currentPred.risk_score))}%` }}
            />
          </div>
        </div>

        {/* Simulated Risk */}
        <div
          className={`p-4 rounded-lg border shadow-xs card-hover-lift transition-all flex flex-col justify-between ${
            simulatedPred.risk_score < currentPred.risk_score
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Simulated Risk Score</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            </span>
            <div className="text-3xl font-black mt-1 flex items-baseline gap-2">
              <span className="font-mono-data transition-all duration-150">{animatedRiskScore}</span>
              <span className="text-xs font-normal text-slate-500">/100</span>
              {riskDelta !== 0 && (
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded transition-all duration-200 ${
                    riskDelta > 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'
                  }`}
                >
                  {riskDelta > 0 ? `-${riskDelta} pts` : `+${Math.abs(riskDelta)} pts`}
                </span>
              )}
            </div>
            <div className="text-xs font-bold mt-0.5">
              New Category: {simulatedPred.risk_category}
            </div>
          </div>
          <div className="w-full bg-slate-200/90 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ease-out rounded-full ${
                animatedRiskScore >= 65 ? 'bg-red-500' : animatedRiskScore >= 35 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, animatedRiskScore))}%` }}
            />
          </div>
        </div>

        {/* Days Saved */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs card-hover-lift flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Projected Days Saved</span>
              <TrendingDown className="w-4 h-4 text-emerald-600" />
            </span>
            <div className="text-3xl font-black text-emerald-600 mt-1 font-mono-data transition-all duration-150">
              {animatedDaysSaved}
              <span className="text-xs font-normal text-slate-500 ml-1">Days</span>
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Forecasted: {simulatedPred.predicted_delay_days} days (was {currentPred.predicted_delay_days}d)
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${Math.min(100, (animatedDaysSaved / Math.max(1, currentPred.predicted_delay_days)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Action Button Card */}
        <div className="bg-slate-900 p-4 rounded-lg text-white flex flex-col justify-between shadow-xs card-hover-lift">
          <div>
            <div className="text-xs font-bold text-amber-400">Commit Simulation</div>
            <p className="text-[11px] text-slate-300 mt-1">
              Apply these targets as official administrative mitigation milestones.
            </p>
          </div>
          <button
            onClick={handleApplyMitigation}
            disabled={isSaving}
            className="w-full mt-3 py-2.5 min-h-[44px] bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-bold text-xs rounded transition-all duration-200 ease-in-out cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 shadow-xs"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 text-slate-950 animate-spin" />
                <span>Saving Targets...</span>
              </>
            ) : isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Mitigation Target Saved!</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-slate-950" />
                <span>Adopt Mitigation Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Interactive Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Sliders */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Intervention Levers &amp; Policy Variables
              </h3>
              <p className="text-xs text-slate-500">
                Adjust sliders to simulate ground mitigation actions
              </p>
            </div>
            <button
              onClick={() => {
                setSimCompPct(initialCompPct);
                setSimApprovals(initialApprovals);
                setSimLegal(initialLegal);
                setSimPossession(initialPossession);
                setSimRR(initialRR);
              }}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] bg-slate-100 hover:bg-slate-200 rounded cursor-pointer transition font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Slider 1: Compensation Disbursed % */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800">
                1. Compensation Disbursed (Direct Benefit Transfer):
              </span>
              <span className="font-mono font-bold text-amber-600">{simCompPct.toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={simCompPct}
              onChange={(e) => setSimCompPct(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% (Stalled)</span>
              <span>Baseline: {initialCompPct.toFixed(0)}%</span>
              <span>100% (Fully Disbursed)</span>
            </div>
          </div>

          {/* Slider 2: Pending Statutory Approvals */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800">
                2. Pending Statutory Approvals (Forest/Environment/Revenue):
              </span>
              <span className="font-mono font-bold text-blue-600">{simApprovals} Pending</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={simApprovals}
              onChange={(e) => setSimApprovals(parseInt(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0 (All Cleared)</span>
              <span>Baseline: {initialApprovals}</span>
              <span>10 Clearances</span>
            </div>
          </div>

          {/* Slider 3: Legal Disputes Resolved */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800">
                3. Active Litigation &amp; High Court Writs:
              </span>
              <span className="font-mono font-bold text-red-600">{simLegal} Cases</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={simLegal}
              onChange={(e) => setSimLegal(parseInt(e.target.value))}
              className="w-full accent-red-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0 (Lok Adalat Settlement)</span>
              <span>Baseline: {initialLegal}</span>
              <span>20 Cases</span>
            </div>
          </div>

          {/* Slider 4: Physical Possession % */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800">
                4. Physical Possession Handover:
              </span>
              <span className="font-mono font-bold text-slate-800">{simPossession.toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={simPossession}
              onChange={(e) => setSimPossession(parseFloat(e.target.value))}
              className="w-full accent-slate-800 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0%</span>
              <span>Baseline: {initialPossession.toFixed(0)}%</span>
              <span>100% (Full Takeover)</span>
            </div>
          </div>

          {/* Slider 5: R&R Resettlement % */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800">
                5. Rehabilitation &amp; Resettlement (Families Resettled):
              </span>
              <span className="font-mono font-bold text-emerald-600">{simRR.toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={simRR}
              onChange={(e) => setSimRR(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0%</span>
              <span>Baseline: {initialRR.toFixed(0)}%</span>
              <span>100% (Colony Handed Over)</span>
            </div>
          </div>
        </div>

        {/* Right Col: Live SHAP Dynamic Recalculation */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Estimated Impact (Model-Informed Sensitivity Analysis)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Feature attribution estimated from real trained model weights (Legal Disputes: 35.5% dominant factor)
            </p>
          </div>

          <div className="space-y-3">
            {simulatedPred.top_shap_factors.map((factor, idx) => {
              const isPositive = factor.contribution > 0;
              const barWidth = Math.min(100, Math.max(10, Math.abs(factor.contribution) * 4));
              return (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 card-hover-lift hover:bg-white space-y-1.5 transition-all duration-200"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{factor.factor}</span>
                    <span
                      className={`font-mono font-bold text-xs px-2 py-0.5 rounded transition-all duration-200 ${
                        isPositive ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isPositive ? `+${factor.contribution}` : factor.contribution} pts
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{factor.description}</p>
                  <div className="w-full bg-slate-200/80 rounded-full h-1 overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ease-out ${
                        isPositive ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Targeted Action Plan */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Simulated Action Plan Summary:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              By increasing compensation DBT to {simCompPct.toFixed(0)}% and resolving {initialLegal - simLegal} legal disputes, this project transitions from {currentPred.risk_category} risk to {simulatedPred.risk_category} risk, recovering approximately {daysSaved} critical calendar days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
