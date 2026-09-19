import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders,
  Landmark,
  Building,
  Gavel,
  Users,
  Compass,
  ArrowRight,
  ExternalLink,
  Info,
  Calendar,
  Layers,
  Sparkles,
  Award,
  Bot,
  Loader2,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { generateProjectCopilotAnalysis, ProjectCopilotResult } from '../utils/geminiService';
import { ProjectHealthBadge } from './ProjectHealthBadge';

export const ProjectDetailView: React.FC = () => {
  const {
    selectedProject,
    setSelectedProject,
    setActiveTab,
    projects,
    alerts,
    acknowledgeAlert,
    userRole,
  } = useApp();

  const [isAnalyzingAi, setIsAnalyzingAi] = React.useState(false);
  const [copilotResult, setCopilotResult] = React.useState<ProjectCopilotResult | null>(null);

  const handleRunCopilot = async () => {
    if (!selectedProject) return;
    setIsAnalyzingAi(true);
    try {
      const res = await generateProjectCopilotAnalysis(selectedProject, userRole);
      setCopilotResult(res);
    } catch (err) {
      console.error('Copilot analysis error:', err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  if (!selectedProject) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500">
        <p className="text-sm">No project selected.</p>
        <button
          onClick={() => setActiveTab('projects')}
          className="mt-3 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded"
        >
          Select from Projects Directory
        </button>
      </div>
    );
  }

  const p = selectedProject;
  const pred = p.prediction;
  const riskScore = pred?.risk_score ?? 50;
  const probDelay = pred?.probability_of_delay ?? 0.5;
  const delayDays = pred?.predicted_delay_days ?? 90;
  const delayRange = pred?.predicted_delay_range_days ?? [80, 140];
  const shapFactors = pred?.top_shap_factors ?? [];
  const recommendations = pred?.recommendations ?? [];
  const stageProbs = pred?.stage_delay_probabilities ?? {
    Notification: 20,
    Survey: 40,
    Compensation: 70,
    Possession: 60,
    RR: 50,
  };
  const issues = pred?.stage_gate_issues ?? [];
  const completeness = pred?.data_completeness_pct ?? 90;

  // Compensation metrics
  const assessedCr = p.compensation?.total_compensation_assessed_cr || 1;
  const disbursedCr = p.compensation?.total_compensation_disbursed_cr || 0;
  const compPct = ((disbursedCr / assessedCr) * 100).toFixed(1);

  // Approvals metrics
  const pendingApprovals = (p.approvals || []).filter((a) => a.status !== 'Approved');
  const legalDisputes = p.legal_disputes || [];
  const pendingLegal = legalDisputes.filter((l) => l.status === 'Pending');

  // Related alerts for this project
  const projectAlerts = alerts.filter((a) => a.project_id === p.project_id);

  // Comparative Analytics (District and State benchmarks)
  const sameDistrictProjects = projects.filter((item) => item.district === p.district);
  const districtAvgDelay = Math.round(
    sameDistrictProjects.reduce(
      (acc, item) => acc + (item.actual_delay_days || item.prediction?.predicted_delay_days || 60),
      0
    ) / Math.max(1, sameDistrictProjects.length)
  );

  const sameTypeProjects = projects.filter((item) => item.project_type === p.project_type);
  const typeAvgDelay = Math.round(
    sameTypeProjects.reduce(
      (acc, item) => acc + (item.actual_delay_days || item.prediction?.predicted_delay_days || 60),
      0
    ) / Math.max(1, sameTypeProjects.length)
  );

  return (
    <div id="project-detail-view" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-bold text-xs bg-slate-900 text-amber-400 px-2 py-0.5 rounded">
              {p.project_id}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {p.state} &bull; {p.district} &bull; {p.block}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                p.project_status === 'Completed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {p.project_status}
            </span>
            <ProjectHealthBadge riskScore={riskScore} />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 leading-snug">{p.project_name}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('what_if')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-xs transition cursor-pointer shadow-xs"
          >
            <Sliders className="w-4 h-4" />
            <span>Launch What-If</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className="flex-1 sm:flex-none flex items-center justify-center px-3.5 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs transition cursor-pointer"
          >
            &larr; Back to Directory
          </button>
        </div>
      </div>

      {/* Section 8.3 Part 1 & 2: Basic Info & Risk Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Risk Score Card */}
        <div
          className={`p-4 rounded-lg border shadow-xs ${
            riskScore >= 65
              ? 'bg-red-50/70 border-red-200 text-red-950'
              : riskScore >= 35
              ? 'bg-amber-50/70 border-amber-200 text-amber-950'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Overall Risk Score</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black flex items-baseline gap-1">
            <span>{riskScore}</span>
            <span className="text-xs font-semibold text-slate-500">/100</span>
          </div>
          <div className="text-xs font-bold mt-1">
            {pred?.risk_category} Risk Category
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Calculated via trained Random Forest Classifier with TreeSHAP explainability
          </p>
        </div>

        {/* Delay Probability */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Delay Probability</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {(probDelay * 100).toFixed(0)}%
          </div>
          <div className="text-xs font-semibold text-slate-700 mt-1">
            High Likelihood of Milestone Slip
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Threshold: Slippage beyond 90 days SLA
          </p>
        </div>

        {/* Projected Delay Days */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Forecasted Delay</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 flex items-baseline gap-1">
            <span>{delayDays}</span>
            <span className="text-xs font-normal text-slate-500">Days</span>
          </div>
          <div className="text-xs font-semibold text-slate-700 mt-1">
            Range: {delayRange[0]} &ndash; {delayRange[1]} Days
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Planned Completion: {p.planned_end_date}
          </p>
        </div>

        {/* Current Stage & Progress */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Acquisition Stage</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900">{p.current_stage}</div>
          <div className="text-xs text-slate-600 mt-1">
            Possession: <span className="font-bold text-slate-900">{p.possession?.possession_percentage}%</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Area: {p.land_area_hectares} Ha &bull; {p.affected_families_count} Families
          </p>
        </div>
      </div>

      {/* GEMINI AI PROJECT COPILOT & STATUTORY MITIGATION ENGINE */}
      <div className="bg-[#071911] text-white rounded-xl border border-[#276449] p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#143325]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400/10 rounded-lg border border-amber-400/30 text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">Gemini AI Delay Diagnostic &amp; Legal Copilot</h3>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  gemini-2.5-flash
                </span>
                {copilotResult && (
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      copilotResult.riskVerdict === 'CRITICAL_INTERVENTION'
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : copilotResult.riskVerdict === 'HIGH_ATTENTION'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {copilotResult.riskVerdict.replace('_', ' ')}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#86A697] mt-0.5">
                Evaluates Explainable AI feature attributions, Section 11/19 statutory clocks, and High Court writ litigation.
              </p>
            </div>
          </div>

          <button
            id="btn-run-gemini-copilot"
            type="button"
            disabled={isAnalyzingAi}
            onClick={handleRunCopilot}
            className="px-4 py-2 bg-[#196842] hover:bg-[#228353] text-white text-xs font-bold rounded-lg border border-[#2F855A] shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isAnalyzingAi ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                <span>Diagnosing Parcel...</span>
              </>
            ) : (
              <>
                <Bot className="w-3.5 h-3.5 text-amber-300" />
                <span>{copilotResult ? 'Re-diagnose Parcel' : 'Generate AI Diagnosis'}</span>
              </>
            )}
          </button>
        </div>

        {copilotResult ? (
          <div className="space-y-4 animate-in fade-in">
            {/* Priority Action Directive Callout */}
            <div className="p-3.5 bg-[#0A2218] border border-[#2E855A] rounded-lg flex items-start gap-3 text-xs">
              <ShieldCheck className="w-4 h-4 text-[#48BB78] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#D8ECE0] uppercase text-[10px] tracking-wider block font-mono">
                  Priority CALA Directive:
                </span>
                <p className="text-white font-semibold mt-0.5">{copilotResult.priorityAction}</p>
              </div>
            </div>

            {/* Statutory Stage-Gate Mandates */}
            <div>
              <span className="text-[11px] font-bold text-[#A5C8B6] uppercase tracking-wider block mb-2 font-mono">
                RFCTLARR Act 2013 Statutory Compliance Checks:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {copilotResult.statutoryDirectives.map((directive, dIdx) => (
                  <div
                    key={dIdx}
                    className="p-2.5 bg-[#05130D] rounded border border-[#143325] text-[11px] text-[#C4D9CD] flex items-start gap-2"
                  >
                    <Check className="w-3.5 h-3.5 text-[#48BB78] shrink-0 mt-0.5" />
                    <span>{directive}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Granular AI Diagnostic Text Box */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#A5C8B6] uppercase tracking-wider font-mono">
                  Diagnostic Briefing &amp; Legal Strategy:
                </span>
                <span className="text-[10px] text-[#86A697] font-mono">Model: {copilotResult.modelUsed}</span>
              </div>
              <div className="p-4 bg-[#05130D] rounded-lg border border-[#143325] text-xs text-[#D8ECE0] font-mono leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto select-text">
                {copilotResult.markdown}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[#0A2218] rounded-lg border border-[#1C4332] text-xs text-[#86A697] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-amber-300 shrink-0" />
              <span>
                Click &ldquo;Generate AI Diagnosis&rdquo; to execute a real-time Gemini synthesis of this project&rsquo;s {shapFactors.length} SHAP factors, {pendingLegal.length} court cases, and RFCTLARR milestone risks.
              </span>
            </div>
            <button
              onClick={handleRunCopilot}
              className="text-amber-300 hover:text-amber-200 font-bold underline shrink-0 cursor-pointer text-xs"
            >
              Analyze Now &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Grid: SHAP Explainability & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Section 8.3 Part 3: Why This Risk? (Explainable AI - SHAP) */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Why This Risk? &mdash; Explainable AI (SHAP Waterfall)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Exact mathematical feature attribution driving the predictive risk score
              </p>
            </div>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300">
              TreeSHAP Explainer
            </span>
          </div>

          <div className="space-y-3">
            {shapFactors.length === 0 ? (
              <p className="text-xs text-slate-500">No adverse risk drivers detected.</p>
            ) : (
              shapFactors.map((factor, idx) => {
                const isPositive = factor.contribution > 0;
                const widthPct = Math.min(100, Math.abs(factor.contribution) * 3.5);

                return (
                  <div key={idx} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isPositive ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                        />
                        <span>{factor.factor}</span>
                      </div>
                      <span
                        className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                          isPositive ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isPositive ? `+${factor.contribution}` : factor.contribution} pts
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isPositive ? 'bg-red-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug">
                      {factor.description}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-md text-xs text-amber-900">
            <span className="font-bold">Interpretation:</span> Positive SHAP contributions actively push the delay probability above threshold. Mitigating these top factors directly de-risks the package.
          </div>
        </div>

        {/* Right Col: Section 8.3 Part 5: Prescriptive Recommendations */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                <span>Predictive Recommendations (Decision Support Engine)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Targeted corrective administrative interventions derived from top delay vectors
              </p>
            </div>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
              RFCTLARR SOPs
            </span>
          </div>

          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-xs space-y-2 hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        rec.priority === 'High'
                          ? 'bg-red-100 text-red-700'
                          : rec.priority === 'Medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {rec.priority} Priority
                    </span>
                    <span className="font-bold text-xs text-slate-900">{rec.action}</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    SLA: {rec.deadline_days} days
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{rec.rationale}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500">
                    Authority: <span className="font-semibold text-slate-800">{rec.responsible_authority}</span>
                  </span>
                  <button className="text-blue-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer">
                    <span>Issue Directive</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 8.3 Part 4: Stage-wise Delay Probability Timeline */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Stage-wise Delay Probability &amp; Milestones
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Risk transition likelihood across statutory land acquisition stages
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[
            {
              stage: 'Notification',
              prob: stageProbs.Notification,
              desc: 'Sec 11 Preliminary Notification & Social Impact Assessment',
              active: p.current_stage === 'Notification',
            },
            {
              stage: 'Survey',
              prob: stageProbs.Survey,
              desc: 'Joint Measurement Survey (JMS) & Boundary Demarcation',
              active: p.current_stage === 'Survey',
            },
            {
              stage: 'Compensation',
              prob: stageProbs.Compensation,
              desc: 'Sec 23 Award Declaration & DBT Disbursement to Titleholders',
              active: p.current_stage === 'Compensation',
            },
            {
              stage: 'Possession',
              prob: stageProbs.Possession,
              desc: 'Sec 38 Eviction & Physical Handover to Infrastructure Agency',
              active: p.current_stage === 'Possession',
            },
            {
              stage: 'R&R',
              prob: stageProbs.RR,
              desc: 'Sec 31 Rehabilitation Infrastructure & Resettlement Colony',
              active: p.current_stage === 'R&R',
            },
          ].map((item, idx) => {
            const isHigh = item.prob >= 60;
            return (
              <div
                key={item.stage}
                className={`p-3 rounded-lg border text-xs space-y-2 relative transition ${
                  item.active
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50/60 text-slate-800'
                }`}
              >
                {item.active && (
                  <span className="absolute -top-2 left-3 bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded uppercase tracking-wider">
                    Current Stage
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-bold">{item.stage}</span>
                  <span
                    className={`font-mono font-bold text-[11px] px-1.5 py-0.2 rounded ${
                      item.active
                        ? 'bg-slate-800 text-amber-400'
                        : isHigh
                        ? 'bg-red-100 text-red-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.prob}%
                  </span>
                </div>
                <p className={`text-[10px] leading-tight ${item.active ? 'text-slate-300' : 'text-slate-500'}`}>
                  {item.desc}
                </p>
                <div className="w-full bg-slate-200/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.active ? 'bg-amber-400' : isHigh ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${item.prob}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ground-Reality: Stage-Gate Validation & Comparative Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stage-Gate Validation & Data Quality */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Stage-Gate &amp; Legal Audit</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                issues.length > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {issues.length} Flag(s)
            </span>
          </h3>

          <div className="space-y-2">
            {issues.length === 0 ? (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>All RFCTLARR statutory rules &amp; stage gates satisfied.</span>
              </div>
            ) : (
              issues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded border text-xs ${
                    issue.type === 'Error'
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    <span>{issue.rule}</span>
                  </div>
                  <p className="text-[11px] mt-1 leading-snug">{issue.message}</p>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
              <span>Data Completeness Score</span>
              <span className="font-bold text-slate-900">{completeness}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  completeness >= 85 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
        </div>

        {/* Comparative Analytics */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">
            Comparative Benchmark Analytics
          </h3>
          <p className="text-xs text-slate-500">
            Performance comparison against similar infrastructure portfolios
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">This Project Delay</span>
                <span className="font-bold text-red-600">{delayDays} Days</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>District ({p.district}) Average</span>
                <span className="font-medium text-slate-700">{districtAvgDelay} Days</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Sector ({p.project_type}) Average</span>
                <span className="font-medium text-slate-700">{typeAvgDelay} Days</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-600">
              {delayDays > districtAvgDelay ? (
                <span className="text-red-700 font-semibold">
                  &bull; This project is lagging district historical benchmark by +
                  {delayDays - districtAvgDelay} days.
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold">
                  &bull; This project is performing better than the district average delay.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Automated Alerts for This Project */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Project Active Alerts</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              {projectAlerts.length} Active
            </span>
          </h3>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {projectAlerts.length === 0 ? (
              <p className="text-xs text-slate-400">No active alerts triggered for this project.</p>
            ) : (
              projectAlerts.map((alt) => (
                <div
                  key={alt.id}
                  className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="truncate">{alt.title}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{alt.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{alt.message}</p>
                  <div className="flex justify-end pt-1">
                    {!alt.acknowledged ? (
                      <button
                        onClick={() => acknowledgeAlert(alt.id)}
                        className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
                      >
                        Acknowledge Alert
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-semibold">Acknowledged</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
