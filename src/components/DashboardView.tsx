import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useRoleFilteredData } from '../hooks/useRoleFilteredData';
import { FilterBar } from './FilterBar';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Landmark,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  ArrowRight,
  FileSpreadsheet,
  FileText,
  Download,
  MapPin,
  Building2,
  Scale,
  Briefcase,
  Shield,
  BadgeCheck,
  ChevronRight,
  Activity,
  Compass,
  Loader2,
  Zap,
  Radio,
  Pause,
  Play,
} from 'lucide-react';
import { LandProject } from '../types';
import {
  exportDashboardToExcel,
  exportDashboardToPDF,
  ReportFilterMetadata,
} from '../utils/reportExportUtils';
import { ReportExportModal } from './ReportExportModal';
import { QuickBeginnerGuide } from './QuickBeginnerGuide';
const DelayTrendChart = React.lazy(() => import('./DelayTrendChart').then((module) => ({ default: module.DelayTrendChart })));
const RiskDistributionChart = React.lazy(() => import('./RiskDistributionChart').then((module) => ({ default: module.RiskDistributionChart })));

export const DashboardView: React.FC = () => {
  const {
    setSelectedProject,
    setActiveTab,
    selectedState,
    selectedDistrict,
    selectedType,
    selectedStage,
    selectedRisk,
    setSelectedRisk,
    searchQuery,
    setShowAuthModal,
    telemetryStream,
    isSurveillanceActive,
    toggleSurveillance,
    lastSurveillanceSweep,
    simulateFieldTelemetryEvent,
    projects,
  } = useApp();

  const [telemetryFilter, setTelemetryFilter] = useState<'ALL' | 'CRITICAL' | 'LEGAL' | 'COMPENSATION' | 'FIELD'>('ALL');
  const [simulatedFeedback, setSimulatedFeedback] = useState<string | null>(null);

  const handleSimulateIncident = () => {
    const evt = simulateFieldTelemetryEvent();
    setSimulatedFeedback(`Live Field Incident Detected: [${evt.event_type.replace('_', ' ')}] ${evt.message}`);
    setTimeout(() => setSimulatedFeedback(null), 5000);
  };

  // Role-Specific Hook & Context Selector
  const roleData = useRoleFilteredData();
  const {
    role,
    user,
    jurisdictionTitle,
    jurisdictionSubtitle,
    scopeBadgeText,
    scopedState,
    scopedDistrict,
    filteredProjects,
    ongoingProjects,
    completedProjects,
    highRiskProjects,
    mediumRiskProjects,
    lowRiskProjects,
    totalCount,
    ongoingCount,
    highRiskCount,
    medRiskCount,
    lowRiskCount,
    highRiskPct,
    medRiskPct,
    avgPredictedDelayDays,
    totalLandAreaHa,
    totalAffectedFamilies,
    totalCompensationAssessedCr,
    totalCompensationDisbursedCr,
    compensationDisbursedPct,
    roleKpis,
    stageBottlenecks,
    geographicBreakdown,
    topPriorityProjects,
    statutoryDirectives,
  } = roleData;

  const [showExportModal, setShowExportModal] = useState(false);
  const [quickExportSuccess, setQuickExportSuccess] = useState<string | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [executingDirId, setExecutingDirId] = useState<string | null>(null);
  const [geoViewMode, setGeoViewMode] = useState<'ranking' | 'comparator'>('ranking');
  const [compareA, setCompareA] = useState<string>('');
  const [compareB, setCompareB] = useState<string>('');
  const [showDetailedDashboard, setShowDetailedDashboard] = useState(false);
  const [analyticsTab, setAnalyticsTab] = useState<'trends' | 'districts' | 'timeline'>('trends');

  // Default entity comparison options based on available zones
  React.useEffect(() => {
    if (geographicBreakdown.length >= 2) {
      if (!compareA || !geographicBreakdown.some((g) => g.name === compareA)) {
        setCompareA(geographicBreakdown[0].name);
      }
      if (!compareB || !geographicBreakdown.some((g) => g.name === compareB)) {
        setCompareB(geographicBreakdown[1].name);
      }
    } else if (geographicBreakdown.length === 1) {
      setCompareA(geographicBreakdown[0].name);
    }
  }, [geographicBreakdown, compareA, compareB]);

  const getEntityStats = (name: string) => {
    const projs = ongoingProjects.filter(
      (p) => p.state === name || p.district === name
    );
    const count = projs.length;
    const highRisk = projs.filter((p) => (p.prediction?.risk_score ?? 0) >= 65).length;
    const avgDelay = count > 0 ? Math.round(projs.reduce((acc, p) => acc + (p.prediction?.predicted_delay_days ?? 60), 0) / count) : 0;
    const totalLand = Math.round(projs.reduce((acc, p) => acc + p.land_area_hectares, 0));
    const assessed = projs.reduce((acc, p) => acc + (p.compensation?.total_compensation_assessed_cr || 0), 0);
    const disbursed = projs.reduce((acc, p) => acc + (p.compensation?.total_compensation_disbursed_cr || 0), 0);
    const dbtPct = assessed > 0 ? Math.round((disbursed / assessed) * 100) : 0;
    return { name, count, highRisk, highRiskPct: count > 0 ? Math.round((highRisk / count) * 100) : 0, avgDelay, totalLand, dbtPct };
  };

  const statsA = getEntityStats(compareA);
  const statsB = getEntityStats(compareB);

  const maxGeoDelay = Math.max(...geographicBreakdown.map((d) => d.avgDelay), 100);
  const maxStageDelay = Math.max(...stageBottlenecks.map((s) => s.avgDelay), 100);

  const handleInspectProject = (p: LandProject) => {
    setSelectedProject(p);
    setActiveTab('project_detail');
  };

  const handleQuickExportExcel = () => {
    setIsExportingExcel(true);
    setTimeout(() => {
      try {
        const metadata: ReportFilterMetadata = {
          state: selectedState,
          district: selectedDistrict,
          projectType: selectedType,
          stage: selectedStage,
          risk: selectedRisk,
          searchQuery,
          userRole: role,
        };
        exportDashboardToExcel(filteredProjects, metadata);
        setQuickExportSuccess(`Executive Excel workbook (.xlsx) for ${role} scope downloaded successfully.`);
        setTimeout(() => setQuickExportSuccess(null), 3500);
      } catch (err) {
        console.error('Export error:', err);
      } finally {
        setIsExportingExcel(false);
      }
    }, 300);
  };

  const handleQuickExportPDF = () => {
    setIsExportingPDF(true);
    setTimeout(() => {
      try {
        const metadata: ReportFilterMetadata = {
          state: selectedState,
          district: selectedDistrict,
          projectType: selectedType,
          stage: selectedStage,
          risk: selectedRisk,
          searchQuery,
          userRole: role,
        };
        exportDashboardToPDF(filteredProjects, metadata);
        setQuickExportSuccess(`Executive Status PDF report for ${role} scope downloaded successfully.`);
        setTimeout(() => setQuickExportSuccess(null), 3500);
      } catch (err) {
        console.error('Export error:', err);
      } finally {
        setIsExportingPDF(false);
      }
    }, 300);
  };

  if (!showDetailedDashboard) {
    const riskScore = filteredProjects.length
      ? Math.round(filteredProjects.reduce((total, project) => total + (project.prediction?.risk_score ?? 0), 0) / filteredProjects.length)
      : 0;
    const riskColor = riskScore >= 65 ? '#BA2D1D' : riskScore >= 35 ? '#C0781A' : '#27774E';
    const riskLabel = riskScore >= 65 ? 'High risk' : riskScore >= 35 ? 'Moderate risk' : 'Low risk';
    const topRiskProject = [...filteredProjects].sort((a, b) => (b.prediction?.risk_score ?? 0) - (a.prediction?.risk_score ?? 0))[0];

    return (
      <div id="dashboard-view" className="w-full max-w-6xl mx-auto px-5 sm:px-8 py-9 space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{jurisdictionTitle} · {jurisdictionSubtitle}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Land acquisition overview</h1>
            <p className="mt-2 text-base text-slate-600">A clear view of current delay risk and the next step.</p>
          </div>
          <button onClick={() => setShowDetailedDashboard(true)} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Full dashboard</button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Main sections">
          {[
            { label: 'Prediction', detail: 'Predict risk for a project', tab: 'prediction' as const, icon: ShieldAlert },
            { label: 'GIS map', detail: 'Explore locations', tab: 'gis_map' as const, icon: MapPin },
            { label: 'Dashboard', detail: 'Portfolio summary', tab: 'dashboard' as const, icon: Layers },
            { label: 'Alerts', detail: 'Review active alerts', tab: 'alerts' as const, icon: AlertTriangle },
          ].map(({ label, detail, tab, icon: Icon }) => (
            <button key={label} onClick={() => tab !== 'dashboard' && setActiveTab(tab)} className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
              <Icon className="h-6 w-6 text-slate-600" />
              <span className="mt-4 block text-lg font-semibold text-slate-900">{label}</span>
              <span className="mt-1 block text-sm text-slate-500">{detail}</span>
            </button>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Portfolio delay risk</p>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-6xl font-bold tracking-tight" style={{ color: riskColor }}>{riskScore}</span>
              <span className="text-lg font-semibold" style={{ color: riskColor }}>{riskLabel}</span>
            </div>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              {topRiskProject ? `${topRiskProject.prediction?.top_shap_factors?.[0]?.description || `${topRiskProject.project_name} has the highest predicted delay risk in this portfolio.`}` : 'No projects match the current filters.'}
            </p>
            <button onClick={() => topRiskProject && handleInspectProject(topRiskProject)} disabled={!topRiskProject} className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">View highest-risk project</button>
            <div className="mt-7 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
              <div><p className="text-sm text-slate-500">Projects in scope</p><p className="mt-1 text-2xl font-bold text-slate-900">{totalCount}</p></div>
              <div><p className="text-sm text-slate-500">Average delay</p><p className="mt-1 text-2xl font-bold text-slate-900">{avgPredictedDelayDays}<span className="ml-1 text-sm font-medium">days</span></p></div>
            </div>
          </article>

          <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-xl font-bold text-slate-900">Portfolio insights</h2><p className="mt-1 text-sm text-slate-500">Choose one view to explore.</p></div>
              <div role="tablist" aria-label="Analytics views" className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
                {([['trends', 'Delay trends'], ['districts', 'District comparison'], ['timeline', 'Timeline analysis']] as const).map(([tab, label]) => (
                  <button key={tab} role="tab" aria-selected={analyticsTab === tab} onClick={() => setAnalyticsTab(tab)} className={`rounded-md px-3 py-2 text-sm font-medium ${analyticsTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>
                ))}
              </div>
            </div>
            <div className="mt-5">
              {analyticsTab === 'trends' && <React.Suspense fallback={<div className="py-10 text-center text-sm text-slate-500">Loading trend analysis…</div>}><DelayTrendChart /></React.Suspense>}
              {analyticsTab === 'districts' && <div className="space-y-3">{geographicBreakdown.slice(0, 8).map((item) => <div key={item.name} className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-4 py-3"><span className="font-medium text-slate-800">{item.name}</span><span className="text-sm text-slate-600">{item.count} projects</span><span className="font-semibold text-slate-900">{item.avgDelay} day avg.</span></div>)}{geographicBreakdown.length === 0 && <p className="py-8 text-center text-slate-500">No district results for the current filters.</p>}</div>}
              {analyticsTab === 'timeline' && <div className="space-y-4">{stageBottlenecks.slice(0, 8).map((stage) => <div key={stage.stage} className="grid grid-cols-[minmax(100px,1fr)_2fr_auto] items-center gap-3"><span className="text-sm font-medium text-slate-700">{stage.stage}</span><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, Math.max(4, (stage.avgDelay / maxStageDelay) * 100))}%` }} /></div><span className="text-sm font-semibold text-slate-800">{stage.avgDelay} days</span></div>)}{stageBottlenecks.length === 0 && <p className="py-8 text-center text-slate-500">No timeline results for the current filters.</p>}</div>}
            </div>
          </article>
        </section>
      </div>
    );
  }

  return (
    <div
      id="dashboard-view"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
    >
      {/* Quick Export Toast Notification */}
      {quickExportSuccess && (
        <div className="mb-6 p-3 bg-[#EAF4EE] border border-[#B8DCBE] text-[#196842] rounded-[4px] text-xs font-semibold flex items-center justify-between font-mono-data animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#196842] shrink-0" />
            <span>{quickExportSuccess}</span>
          </div>
          <button
            onClick={() => setQuickExportSuccess(null)}
            className="text-[#196842] hover:text-[#0C2B20] cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Beginner Quick Guide Banner */}
      <QuickBeginnerGuide />

      {/* 1. ASYMMETRIC JURISDICTION MASTHEAD & OFFICER CADRE BANNER */}
      <div className="mb-8 p-4 sm:p-5 bg-[#FFFFFF] rounded-[4px] border border-[#DFE3DC] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-[2px] flex items-center justify-center text-white shrink-0 font-mono-data border ${
              role === 'Central Admin'
                ? 'bg-[#0C2B20] border-[#1C4332]'
                : role === 'State Admin'
                ? 'bg-[#196842] border-[#276449]'
                : role === 'District Admin'
                ? 'bg-[#C0781A] border-[#8C530C]'
                : 'bg-[#2C5282] border-[#1A365D]'
            }`}
          >
            {role === 'Central Admin' ? (
              <Building2 className="w-5 h-5" />
            ) : role === 'State Admin' ? (
              <Layers className="w-5 h-5" />
            ) : role === 'District Admin' ? (
              <Scale className="w-5 h-5" />
            ) : (
              <Briefcase className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono-data text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-[#ECEEEA] text-[#141E1A] border border-[#DFE3DC]">
                {scopeBadgeText}
              </span>
              <span className="text-xs text-[#4E5C55]">
                Authenticated: <strong className="text-[#141E1A] font-semibold">{user?.name || 'Authorized Officer'}</strong> ({user?.designation || role})
              </span>
            </div>
            <h2 className="font-serif-heading text-lg sm:text-xl font-bold text-[#141E1A] tracking-tight mt-1">
              {jurisdictionTitle}
            </h2>
            <p className="text-xs text-[#4E5C55] mt-0.5 max-w-[65ch] leading-relaxed">
              {jurisdictionSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          <div className="px-3 py-1.5 bg-[#ECEEEA]/60 rounded-[4px] border border-[#DFE3DC] text-left">
            <span className="text-[9px] text-[#4E5C55] font-bold uppercase font-mono-data block">Scope Registry</span>
            <span className="font-mono-data text-xs font-bold text-[#141E1A]">
              {totalCount} Parcels Active
            </span>
          </div>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-3.5 py-2.5 min-h-[44px] bg-[#FFFFFF] hover:bg-[#ECEEEA] border border-[#DFE3DC] text-[#141E1A] text-xs font-semibold rounded-[4px] transition cursor-pointer flex items-center gap-1.5 font-mono-data"
            title="Switch Administrative Cadre"
          >
            <Shield className="w-3.5 h-3.5 text-[#196842]" />
            <span className="hidden sm:inline">Switch Cadre</span>
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE HEADER SECTION WITH DELIBERATE ASYMMETRIC CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-5 border-b border-[#DFE3DC]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#141E1A] tracking-tight">
              {role === 'Central Admin'
                ? 'National Delay Surveillance Directorate'
                : role === 'State Admin'
                ? 'State Land Governance & Statutory Monitoring'
                : role === 'District Admin'
                ? 'District CALA Land Operations & SLA Portal'
                : 'Implementing Agency Field Handover Portal'}
            </h1>
            <span className="status-tag-live">
              <span className="w-1.5 h-1.5 bg-[#196842] rounded-[1px] animate-pulse"></span>
              LIVE FEED
            </span>
          </div>
          <p className="text-xs text-[#4E5C55] mt-1 max-w-[65ch]">
            Machine learning delay probability models active across Section 25, Section 19, and Section 38 statutory milestones.
          </p>
        </div>

        {/* Action Controls: Structured Architectural Action Buttons (min 44px touch height) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-dashboard-formal-report"
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] text-xs font-semibold bg-[#0C2B20] hover:bg-[#164734] active:scale-[0.98] text-white rounded-[4px] transition-all duration-200 ease-in-out cursor-pointer font-mono-data shadow-xs"
            title="Configure and Generate Formal Status Report with Attestation"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Formal Report</span>
          </button>

          <button
            onClick={() => setActiveTab('gis_map')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] text-xs font-semibold bg-[#0C2B20] hover:bg-[#164734] active:scale-[0.98] text-white rounded-[4px] transition-all duration-200 ease-in-out cursor-pointer font-mono-data shadow-xs"
          >
            <span>GIS Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            id="btn-dashboard-export-excel"
            onClick={handleQuickExportExcel}
            disabled={isExportingExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] text-xs font-semibold bg-[#FFFFFF] hover:bg-[#ECEEEA] active:scale-[0.98] text-[#141E1A] border border-[#DFE3DC] rounded-[4px] transition-all duration-200 ease-in-out cursor-pointer font-mono-data disabled:opacity-60 shadow-2xs"
            title="Download Executive Excel Workbook (.xlsx)"
          >
            {isExportingExcel ? (
              <Loader2 className="w-3.5 h-3.5 text-[#196842] animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#196842]" />
            )}
            <span>{isExportingExcel ? 'Exporting...' : 'Excel'}</span>
          </button>

          <button
            id="btn-dashboard-export-pdf"
            onClick={handleQuickExportPDF}
            disabled={isExportingPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] text-xs font-semibold bg-[#FFFFFF] hover:bg-[#ECEEEA] active:scale-[0.98] text-[#141E1A] border border-[#DFE3DC] rounded-[4px] transition-all duration-200 ease-in-out cursor-pointer font-mono-data disabled:opacity-60 shadow-2xs"
            title="Download Executive Status PDF Report"
          >
            {isExportingPDF ? (
              <Loader2 className="w-3.5 h-3.5 text-[#BA2D1D] animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-[#BA2D1D]" />
            )}
            <span>{isExportingPDF ? 'Generating...' : 'PDF'}</span>
          </button>
        </div>
      </div>

      {/* Streamlined Horizontal Filter Bar */}
      <FilterBar />

      {/* 3. ASYMMETRIC PRIMARY METRIC LAYOUT (HEAVIER HIGH RISK, CONSOLIDATED SECONDARIES) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8 items-stretch">
        {/* DOMINANT VISUAL UNIT: High Risk Priority Command (5 Columns on Desktop) */}
        <div
          id="metric-high-risk"
          onClick={() => setSelectedRisk(selectedRisk === 'High' ? 'All' : 'High')}
          className={`lg:col-span-4 p-5 rounded-[4px] border card-hover-lift cursor-pointer flex flex-col justify-between ${
            selectedRisk === 'High'
              ? 'bg-[#FAECEB] border-[#BA2D1D] ring-1 ring-[#BA2D1D]'
              : 'bg-[#FFFFFF] border-[#DFE3DC] hover:border-[#BA2D1D]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="status-tag-urgent">
                <ShieldAlert className="w-3 h-3 text-[#BA2D1D]" />
                <span>CRITICAL DELAY VECTORS</span>
              </span>
              <span className="font-mono-data text-[10px] font-bold text-[#BA2D1D]">
                Score &ge; 65
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono-data text-4xl sm:text-5xl font-black text-[#BA2D1D] tracking-tight">
                {highRiskCount}
              </span>
              <span className="font-mono-data text-sm font-bold text-[#BA2D1D]/80">
                Parcels ({highRiskPct}%)
              </span>
            </div>

            <p className="text-xs text-[#4E5C55] mt-2 leading-relaxed">
              Section 25 lapse probability &gt;75%. Immediate administrative escalation required.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#DFE3DC] flex items-center justify-between text-xs font-mono-data">
            <span className="text-[#BA2D1D] font-bold">Filter High Risk Only &rarr;</span>
            <span className="text-[#4E5C55]">{selectedRisk === 'High' ? '[ ACTIVE FILTER ]' : '[ CLICK TO APPLY ]'}</span>
          </div>
        </div>

        {/* SECONDARY STATS: Total Portfolio & Medium Risk Watchlist (3 Columns on Desktop) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Total Projects in Scope */}
          <div
            id="metric-total-projects"
            className="p-4 bg-[#FFFFFF] rounded-[4px] border border-[#DFE3DC] card-hover-lift flex-1 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-[#4E5C55] mb-1">
              <span className="font-mono-data text-[10px] font-bold uppercase tracking-wider">
                Total In Scope
              </span>
              <Layers className="w-3.5 h-3.5 text-[#2C5282]" />
            </div>
            <div className="font-mono-data text-3xl font-black text-[#141E1A] tracking-tight">
              {totalCount}
            </div>
            <div className="font-mono-data text-[11px] text-[#4E5C55] pt-2 border-t border-[#DFE3DC] flex items-center justify-between">
              <span>{ongoingCount} Ongoing</span>
              <span>{completedProjects.length} Closed</span>
            </div>
          </div>

          {/* Medium Risk Watchlist */}
          <div
            id="metric-medium-risk"
            onClick={() => setSelectedRisk(selectedRisk === 'Medium' ? 'All' : 'Medium')}
            className={`p-4 rounded-[4px] border card-hover-lift flex-1 flex flex-col justify-between cursor-pointer ${
              selectedRisk === 'Medium'
                ? 'bg-[#FDF3E7] border-[#C0781A] ring-1 ring-[#C0781A]'
                : 'bg-[#FFFFFF] border-[#DFE3DC] hover:border-[#C0781A]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="status-tag-warning">
                <AlertTriangle className="w-3 h-3 text-[#C0781A]" />
                <span>WATCHLIST</span>
              </span>
              <span className="font-mono-data text-[10px] font-bold text-[#C0781A]">35–64</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono-data text-2xl font-black text-[#C0781A] tracking-tight">
                {medRiskCount}
              </span>
              <span className="font-mono-data text-xs font-semibold text-[#C0781A]/80">
                ({medRiskPct}%)
              </span>
            </div>
            <div className="font-mono-data text-[10px] text-[#4E5C55] pt-1.5 border-t border-[#DFE3DC]">
              Moderate title/clearance bottlenecks
            </div>
          </div>
        </div>

        {/* CONSOLIDATED ANALYTICAL RECTANGLE: Delay, DBT Compensation & Land Area (5 Columns on Desktop) */}
        <div className="lg:col-span-5 bg-[#FFFFFF] rounded-[4px] border border-[#DFE3DC] p-5 card-hover-lift flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#DFE3DC]">
              <span className="font-serif-heading text-sm font-bold text-[#141E1A]">
                Portfolio Execution Vector
              </span>
              <span className="official-stamp">
                DoLR CERTIFIED
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4">
              {/* Avg Delay */}
              <div className="space-y-1">
                <span className="font-mono-data text-[9px] font-bold text-[#4E5C55] uppercase block">
                  Mean Delay
                </span>
                <div className="font-mono-data text-xl sm:text-2xl font-black text-[#141E1A]">
                  +{avgPredictedDelayDays}
                  <span className="text-xs font-normal text-[#4E5C55] ml-0.5">d</span>
                </div>
                <p className="text-[10px] text-[#4E5C55] leading-tight">Over baseline SLA</p>
              </div>

              {/* DBT Disbursed */}
              <div className="space-y-1 border-l border-[#DFE3DC] pl-3">
                <span className="font-mono-data text-[9px] font-bold text-[#4E5C55] uppercase block">
                  DBT Disbursed
                </span>
                <div className="font-mono-data text-xl sm:text-2xl font-black text-[#196842]">
                  {compensationDisbursedPct}%
                </div>
                <p className="font-mono-data text-[10px] text-[#4E5C55] truncate">
                  ₹{totalCompensationDisbursedCr.toFixed(0)} / ₹{totalCompensationAssessedCr.toFixed(0)} Cr
                </p>
              </div>

              {/* Land Area & Families */}
              <div className="space-y-1 border-l border-[#DFE3DC] pl-3">
                <span className="font-mono-data text-[9px] font-bold text-[#4E5C55] uppercase block">
                  Land &amp; PAFs
                </span>
                <div className="font-mono-data text-xl sm:text-2xl font-black text-[#141E1A]">
                  {totalLandAreaHa.toLocaleString()}
                  <span className="text-xs font-normal text-[#4E5C55] ml-0.5">Ha</span>
                </div>
                <p className="font-mono-data text-[10px] text-[#4E5C55] truncate">
                  {totalAffectedFamilies.toLocaleString()} Families
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#DFE3DC] text-[11px] text-[#4E5C55] flex items-center justify-between">
            <span>Possession eligibility requires 80% DBT disbursed (Sec. 38)</span>
            <span className="font-mono-data font-bold text-[#196842]">Sec. 38 Guard Active</span>
          </div>
        </div>
      </div>

      {/* 4. ROLE-SPECIFIC TAILORED 4-CARD STATUTORY INDICATORS */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono-data text-xs text-[#0C2B20] font-bold">▍</span>
            <h3 className="font-serif-heading text-base font-bold text-[#141E1A]">
              {role} Statutory Surveillance Indicators
            </h3>
          </div>
          <span className="font-mono-data text-[10px] text-[#4E5C55]">
            [ JURISDICTION: {scopedState !== 'All' ? scopedState : 'NATIONAL'} ]
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {roleKpis.map((kpi) => (
            <div
              key={kpi.id}
              className={`p-4 rounded-[4px] border card-hover-lift bg-[#FFFFFF] flex flex-col justify-between ${
                kpi.type === 'risk'
                  ? 'border-[#BA2D1D]/40'
                  : kpi.type === 'warning'
                  ? 'border-[#C0781A]/40'
                  : kpi.type === 'success'
                  ? 'border-[#27774E]/40'
                  : 'border-[#DFE3DC]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono-data text-[10px] font-bold uppercase tracking-wider text-[#4E5C55]">
                    {kpi.label}
                  </span>
                  {kpi.badge && (
                    <span
                      className={`font-mono-data text-[9px] font-bold px-1.5 py-0.2 rounded-[2px] border ${
                        kpi.type === 'risk'
                          ? 'bg-[#FAECEB] text-[#BA2D1D] border-[#F0B8B3]'
                          : kpi.type === 'warning'
                          ? 'bg-[#FDF3E7] text-[#C0781A] border-[#F8DCB8]'
                          : kpi.type === 'success'
                          ? 'bg-[#EAF4EE] text-[#27774E] border-[#B8DCBE]'
                          : 'bg-[#ECEEEA] text-[#4E5C55] border-[#DFE3DC]'
                      }`}
                    >
                      {kpi.badge}
                    </span>
                  )}
                </div>

                <div
                  className={`font-mono-data text-2xl font-black tracking-tight ${
                    kpi.type === 'risk'
                      ? 'text-[#BA2D1D]'
                      : kpi.type === 'warning'
                      ? 'text-[#C0781A]'
                      : kpi.type === 'success'
                      ? 'text-[#27774E]'
                      : 'text-[#141E1A]'
                  }`}
                >
                  {kpi.value}
                </div>
              </div>

              <div className="text-[11px] text-[#4E5C55] mt-2.5 pt-2 border-t border-[#DFE3DC] leading-snug">
                {kpi.subtext}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4B. REAL-TIME SURVEILLANCE & FIELD TELEMETRY FEED (NEW) */}
      <div className="mb-8 p-4 sm:p-5 bg-[#FFFFFF] rounded-[4px] border border-[#DFE3DC] shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#DFE3DC]">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono-data text-xs text-[#0C2B20] font-bold">▍</span>
              <h3 className="font-serif-heading text-base font-bold text-[#141E1A] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#196842]" />
                <span>Real-Time Field Telemetry &amp; Statutory Surveillance Feed</span>
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono-data font-bold px-2 py-0.5 rounded-[2px] bg-[#EAF4EE] text-[#196842] border border-[#B8DCBE]">
                <span className={`w-1.5 h-1.5 rounded-[1px] ${isSurveillanceActive ? 'bg-[#196842] animate-pulse' : 'bg-[#BA2D1D]'}`} />
                {isSurveillanceActive ? 'ACTIVE NODE' : 'PAUSED'} &bull; Sweep: {lastSurveillanceSweep}
              </span>
            </div>
            <p className="text-xs text-[#4E5C55] mt-1">
              Automated background surveillance of statutory stage milestones, High Court writ filings, and Aadhaar-DBT fund velocity.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-simulate-field-telemetry"
              type="button"
              onClick={handleSimulateIncident}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#0C2B20] hover:bg-[#164734] text-white rounded-[4px] border border-[#1C4332] transition cursor-pointer font-mono-data shadow-2xs"
              title="Simulate a real-time field event (court stay order / compensation DBT / drone upload)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Simulate Field Event</span>
            </button>
            <button
              type="button"
              onClick={toggleSurveillance}
              className={`p-1.5 rounded-[4px] border text-xs font-semibold transition cursor-pointer ${
                isSurveillanceActive
                  ? 'bg-white hover:bg-[#ECEEEA] text-[#BA2D1D] border-[#DFE3DC]'
                  : 'bg-[#EAF4EE] text-[#196842] border-[#B8DCBE]'
              }`}
              title={isSurveillanceActive ? 'Pause Surveillance Engine' : 'Resume Surveillance Engine'}
            >
              {isSurveillanceActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Live Simulation Toast Banner */}
        {simulatedFeedback && (
          <div className="mt-3 p-3 bg-[#EAF4EE] border border-[#B8DCBE] rounded-[4px] text-[#196842] text-xs font-semibold flex items-center justify-between font-mono-data animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#196842]" />
              <span>{simulatedFeedback}</span>
            </div>
            <button onClick={() => setSimulatedFeedback(null)} className="text-[#196842] hover:text-[#0C2B20] text-xs cursor-pointer">✕</button>
          </div>
        )}

        {/* Category Filters */}
        <div className="mt-3.5 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-[#4E5C55] font-mono-data font-bold uppercase mr-1">Filter Stream:</span>
          {(
            [
              { key: 'ALL', label: 'All Telemetry', count: telemetryStream.length },
              { key: 'CRITICAL', label: 'Critical Tripwires', count: telemetryStream.filter((t) => t.severity === 'Critical').length },
              { key: 'LEGAL', label: 'Court Injunctions', count: telemetryStream.filter((t) => t.event_type === 'Court_Order').length },
              { key: 'COMPENSATION', label: 'Compensation DBT', count: telemetryStream.filter((t) => t.event_type === 'Compensation_Disbursed').length },
              { key: 'FIELD', label: 'Drone & DGPS', count: telemetryStream.filter((t) => t.event_type === 'Drone_Survey' || t.event_type === 'Pillar_GeoTagged').length },
            ] as const
          ).map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setTelemetryFilter(filter.key)}
              className={`px-2.5 py-1 text-[11px] font-mono-data rounded-[2px] border transition cursor-pointer ${
                telemetryFilter === filter.key
                  ? 'bg-[#0C2B20] text-white border-[#0C2B20] font-bold'
                  : 'bg-[#ECEEEA]/50 hover:bg-[#ECEEEA] text-[#4E5C55] border-[#DFE3DC]'
              }`}
            >
              <span>{filter.label}</span>
              <span className={`ml-1 px-1 py-0.2 rounded-[2px] text-[9px] ${telemetryFilter === filter.key ? 'bg-white/20 text-white' : 'bg-white text-[#141E1A] border border-[#DFE3DC]'}`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        {/* Real-Time Telemetry Stream List */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {telemetryStream
            .filter((t) => {
              if (telemetryFilter === 'ALL') return true;
              if (telemetryFilter === 'CRITICAL') return t.severity === 'Critical';
              if (telemetryFilter === 'LEGAL') return t.event_type === 'Court_Order';
              if (telemetryFilter === 'COMPENSATION') return t.event_type === 'Compensation_Disbursed';
              if (telemetryFilter === 'FIELD') return t.event_type === 'Drone_Survey' || t.event_type === 'Pillar_GeoTagged';
              return true;
            })
            .slice(0, 6)
            .map((evt) => {
              const matchedProject = projects.find((p) => p.project_id === evt.project_id);
              return (
                <div
                  key={evt.id}
                  className={`p-3 rounded-[4px] border text-xs flex flex-col justify-between transition ${
                    evt.severity === 'Critical'
                      ? 'bg-[#FAECEB]/40 border-[#F0B8B3]'
                      : evt.severity === 'Warning'
                      ? 'bg-[#FDF3E7]/40 border-[#F8DCB8]'
                      : 'bg-[#ECEEEA]/30 border-[#DFE3DC]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-[9px] font-mono-data font-bold px-1.5 py-0.2 rounded-[2px] border uppercase ${
                          evt.severity === 'Critical'
                            ? 'bg-[#FAECEB] text-[#BA2D1D] border-[#F0B8B3]'
                            : evt.severity === 'Warning'
                            ? 'bg-[#FDF3E7] text-[#C0781A] border-[#F8DCB8]'
                            : 'bg-[#EAF4EE] text-[#196842] border-[#B8DCBE]'
                        }`}
                      >
                        {evt.event_type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-[#4E5C55] font-mono-data">{evt.timeAgo}</span>
                    </div>

                    <h4 className="font-semibold text-[#141E1A] text-xs line-clamp-1 mt-1">
                      {evt.project_name}
                    </h4>

                    <p className="text-[11px] text-[#4E5C55] mt-1 line-clamp-2 leading-snug">
                      {evt.message}
                    </p>

                    <div className="mt-2 text-[10px] text-[#196842] font-mono-data flex items-center justify-between">
                      <span>{evt.district}, {evt.state}</span>
                      {evt.statutory_clause && (
                        <span className="text-[#0C2B20] font-bold">{evt.statutory_clause}</span>
                      )}
                    </div>
                  </div>

                  {matchedProject && (
                    <div className="mt-2.5 pt-2 border-t border-[#DFE3DC] flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleInspectProject(matchedProject)}
                        className="text-[10px] text-[#196842] hover:text-[#0C2B20] font-bold font-mono-data flex items-center gap-1 cursor-pointer"
                      >
                        <span>Inspect Parcel</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* 5. ROLE-SPECIFIC STATUTORY DIRECTIVES & ACTION STRIP */}
      {statutoryDirectives.length > 0 && (
        <div className="mb-8 p-4 sm:p-5 bg-[#FFFFFF] rounded-[4px] border border-[#DFE3DC] card-hover-lift">
          <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[#DFE3DC]">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#0C2B20]" />
              <h3 className="font-serif-heading text-sm font-bold text-[#141E1A]">
                Priority Statutory Directives for {role}
              </h3>
            </div>
            <span className="font-mono-data text-[10px] font-semibold text-[#196842] bg-[#EAF4EE] px-2 py-0.5 rounded-[2px] border border-[#B8DCBE]">
              RFCTLARR 2013 Statutory Compliance
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {statutoryDirectives.map((dir) => (
              <div
                key={dir.id}
                className="p-3.5 rounded-[4px] bg-[#ECEEEA]/40 border border-[#DFE3DC] flex items-start justify-between gap-3 text-xs card-hover-lift hover:bg-white"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono-data text-[9px] font-bold px-1.5 py-0.2 rounded-[2px] ${
                        dir.priority === 'High'
                          ? 'bg-[#FAECEB] text-[#BA2D1D] border border-[#F0B8B3]'
                          : 'bg-[#FDF3E7] text-[#C0781A] border border-[#F8DCB8]'
                      }`}
                    >
                      {dir.priority} Priority
                    </span>
                    <span className="font-semibold text-[#141E1A]">{dir.title}</span>
                  </div>
                  <p className="text-[11px] text-[#4E5C55] mt-1 leading-snug">
                    {dir.description}
                  </p>
                  <div className="mt-1.5 text-[10px] font-mono-data text-[#196842]">
                    {dir.actSection} &bull; {dir.authority}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setExecutingDirId(dir.id);
                    setTimeout(() => {
                      setActiveTab(dir.actionableLinkTab);
                      setExecutingDirId(null);
                    }, 220);
                  }}
                  disabled={executingDirId === dir.id}
                  className="px-2.5 py-1.5 bg-[#0C2B20] hover:bg-[#164734] active:scale-[0.98] text-white font-semibold rounded-[4px] text-[11px] transition-all duration-200 ease-in-out shrink-0 flex items-center gap-1 cursor-pointer font-mono-data disabled:opacity-75 shadow-2xs"
                >
                  {executingDirId === dir.id ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-white" />
                      <span>Routing...</span>
                    </>
                  ) : (
                    <>
                      <span>Execute</span>
                      <ChevronRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. PRIMARY ANALYTICAL GRID: Delay Trends & Risk Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8 items-stretch">
        <React.Suspense fallback={<div className="py-10 text-center text-sm text-slate-500">Loading analytics…</div>}><DelayTrendChart /></React.Suspense>
        <React.Suspense fallback={<div className="py-10 text-center text-sm text-slate-500">Loading analytics…</div>}><RiskDistributionChart
          highRiskCount={highRiskCount}
          medRiskCount={medRiskCount}
          lowRiskCount={lowRiskCount}
          totalOngoing={ongoingCount}
          selectedRisk={selectedRisk}
          setSelectedRisk={setSelectedRisk}
          projects={ongoingProjects}
        /></React.Suspense>
      </div>

      {/* 7. SECONDARY OPERATIONAL ANALYTICS GRID: Geographic & Stage Bottlenecks */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8 items-stretch">
        {/* Geographic / District Delay Comparative Analytics */}
        <div className="bg-[#FFFFFF] p-5 sm:p-6 rounded-[4px] border border-[#DFE3DC] flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-2 border-b border-[#DFE3DC]">
              <div>
                <h3 className="font-serif-heading text-base font-bold text-[#141E1A]">
                  {role === 'Central Admin'
                    ? 'State Comparative Analytics'
                    : 'District / Corridor Comparative Analytics'}
                </h3>
                <p className="text-xs text-[#4E5C55] mt-0.5">
                  Mean delay days &amp; statutory metrics across {role === 'Central Admin' ? 'all 7 monitored states' : `${scopedState} jurisdiction`}
                </p>
              </div>

              {/* View Switcher: Ranking vs Side-by-Side Comparator */}
              <div className="flex items-center gap-1 bg-[#ECEEEA] p-0.5 rounded-[4px] border border-[#DFE3DC] text-[11px] font-mono-data">
                <button
                  onClick={() => setGeoViewMode('ranking')}
                  className={`px-2 py-0.5 rounded-[2px] font-semibold transition cursor-pointer ${
                    geoViewMode === 'ranking'
                      ? 'bg-[#0C2B20] text-white'
                      : 'text-[#4E5C55] hover:text-[#141E1A]'
                  }`}
                >
                  Rankings ({geographicBreakdown.length})
                </button>
                <button
                  onClick={() => setGeoViewMode('comparator')}
                  className={`px-2 py-0.5 rounded-[2px] font-semibold transition cursor-pointer ${
                    geoViewMode === 'comparator'
                      ? 'bg-[#0C2B20] text-white'
                      : 'text-[#4E5C55] hover:text-[#141E1A]'
                  }`}
                >
                  Side-by-Side Comparator
                </button>
              </div>
            </div>

            {geoViewMode === 'ranking' ? (
              <div className="space-y-3">
                {geographicBreakdown.map((item) => {
                  const pct = Math.min(100, Math.round((item.avgDelay / maxGeoDelay) * 100));
                  const isHigh = item.avgDelay > 120;
                  const isMed = item.avgDelay > 70 && item.avgDelay <= 120;
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#141E1A]">{item.name}</span>
                        <div className="flex items-center gap-2 font-mono-data text-[11px]">
                          <span className="text-[#4E5C55]">{item.count} parcels</span>
                          <span
                            className={`font-bold px-1.5 py-0.2 rounded-[2px] ${
                              isHigh
                                ? 'bg-[#FAECEB] text-[#BA2D1D] border border-[#F0B8B3]'
                                : isMed
                                ? 'bg-[#FDF3E7] text-[#C0781A] border border-[#F8DCB8]'
                                : 'bg-[#EAF4EE] text-[#27774E] border border-[#B8DCBE]'
                            }`}
                          >
                            +{item.avgDelay}d
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-[#ECEEEA] rounded-[2px] h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isHigh ? 'bg-[#BA2D1D]' : isMed ? 'bg-[#C0781A]' : 'bg-[#27774E]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Interactive Side-by-Side Comparative Selector & Metrics Grid */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 pb-2 border-b border-[#DFE3DC]">
                  {/* Entity A Selector */}
                  <div>
                    <label className="block text-[10px] font-mono-data uppercase font-bold text-[#4E5C55] mb-1">
                      Entity A
                    </label>
                    <select
                      value={compareA}
                      onChange={(e) => setCompareA(e.target.value)}
                      className="w-full bg-[#ECEEEA] border border-[#DFE3DC] rounded-[4px] px-2.5 py-1.5 text-xs font-semibold text-[#141E1A] focus:outline-hidden"
                    >
                      {geographicBreakdown.map((g) => (
                        <option key={g.name} value={g.name}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Entity B Selector */}
                  <div>
                    <label className="block text-[10px] font-mono-data uppercase font-bold text-[#4E5C55] mb-1">
                      Entity B
                    </label>
                    <select
                      value={compareB}
                      onChange={(e) => setCompareB(e.target.value)}
                      className="w-full bg-[#ECEEEA] border border-[#DFE3DC] rounded-[4px] px-2.5 py-1.5 text-xs font-semibold text-[#141E1A] focus:outline-hidden"
                    >
                      {geographicBreakdown.map((g) => (
                        <option key={g.name} value={g.name}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Comparative Metric Matrix */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Column A */}
                  <div className="p-3 rounded-[4px] bg-[#ECEEEA]/40 border border-[#DFE3DC] space-y-2.5">
                    <div className="font-serif-heading font-bold text-sm text-[#0C2B20] pb-1 border-b border-[#DFE3DC]">
                      {statsA.name || 'Entity A'}
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#4E5C55]">Active Packages:</span>
                      <span className="font-mono-data font-bold text-[#141E1A]">{statsA.count}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#4E5C55]">Mean Delay:</span>
                      <span className={`font-mono-data font-bold px-1.5 py-0.2 rounded-[2px] ${statsA.avgDelay > 100 ? 'bg-[#FAECEB] text-[#BA2D1D]' : 'bg-[#EAF4EE] text-[#27774E]'}`}>
                        +{statsA.avgDelay}d
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#4E5C55]">High Risk Ratio:</span>
                      <span className="font-mono-data font-bold text-[#BA2D1D]">{statsA.highRiskPct}%</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#4E5C55]">Total Land Area:</span>
                      <span className="font-mono-data font-bold text-[#141E1A]">{statsA.totalLand.toLocaleString()} Ha</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#4E5C55]">DBT Disbursed:</span>
                      <span className="font-mono-data font-bold text-[#196842]">{statsA.dbtPct}%</span>
                    </div>
                  </div>

                  {/* Column B */}
                  <div className="p-3 rounded-[4px] bg-[#ECEEEA]/40 border border-[#DFE3DC] space-y-2.5">
                    <div className="font-serif-heading font-bold text-sm text-[#0C2B20] pb-1 border-b border-[#DFE3DC]">
                      {statsB.name || 'Entity B'}
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#4E5C55]">Active Packages:</span>
                      <span className="font-mono-data font-bold text-[#141E1A]">{statsB.count}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#4E5C55]">Mean Delay:</span>
                      <span className={`font-mono-data font-bold px-1.5 py-0.2 rounded-[2px] ${statsB.avgDelay > 100 ? 'bg-[#FAECEB] text-[#BA2D1D]' : 'bg-[#EAF4EE] text-[#27774E]'}`}>
                        +{statsB.avgDelay}d
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#4E5C55]">High Risk Ratio:</span>
                      <span className="font-mono-data font-bold text-[#BA2D1D]">{statsB.highRiskPct}%</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#4E5C55]">Total Land Area:</span>
                      <span className="font-mono-data font-bold text-[#141E1A]">{statsB.totalLand.toLocaleString()} Ha</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#4E5C55]">DBT Disbursed:</span>
                      <span className="font-mono-data font-bold text-[#196842]">{statsB.dbtPct}%</span>
                    </div>
                  </div>
                </div>

                {/* Comparative Analysis Takeaway */}
                <div className="p-2.5 bg-[#ECEEEA]/70 rounded-[4px] border border-[#DFE3DC] text-[11px] text-[#4E5C55]">
                  <span className="font-bold text-[#141E1A]">Comparative SLA Delta: </span>
                  {statsA.avgDelay > statsB.avgDelay ? (
                    <span>
                      <strong className="text-[#BA2D1D]">{statsA.name}</strong> experiences an average of{' '}
                      <strong>{statsA.avgDelay - statsB.avgDelay} more delay days</strong> than {statsB.name}.
                    </span>
                  ) : statsB.avgDelay > statsA.avgDelay ? (
                    <span>
                      <strong className="text-[#BA2D1D]">{statsB.name}</strong> experiences an average of{' '}
                      <strong>{statsB.avgDelay - statsA.avgDelay} more delay days</strong> than {statsA.name}.
                    </span>
                  ) : (
                    <span>Both entities demonstrate identical average delay profiles.</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-[#ECEEEA]/50 rounded-[4px] border border-[#DFE3DC] text-xs text-[#4E5C55] flex items-center justify-between">
            <span>Critical SLA threshold applies to areas with &gt;120 days average delay</span>
            <span className="font-mono-data font-bold text-[#BA2D1D]">
              {geographicBreakdown.filter((g) => g.avgDelay > 120).length} Flagged Zones
            </span>
          </div>
        </div>

        {/* Stage Bottleneck Analysis */}
        <div className="bg-[#FFFFFF] p-5 sm:p-6 rounded-[4px] border border-[#DFE3DC] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#DFE3DC]">
              <div>
                <h3 className="font-serif-heading text-base font-bold text-[#141E1A]">
                  Stage Delay Bottleneck Breakdown
                </h3>
                <p className="text-xs text-[#4E5C55] mt-0.5">
                  Statutory acquisition milestones in {scopedState !== 'All' ? scopedState : 'portfolio'}
                </p>
              </div>
              <span className="font-mono-data text-[10px] text-[#4E5C55]">RFCTLARR Stages</span>
            </div>

            <div className="space-y-3">
              {stageBottlenecks.map((item) => {
                const pct = Math.min(100, Math.round((item.avgDelay / maxStageDelay) * 100));
                const isHigh = item.avgDelay > 100;
                const isMed = item.avgDelay > 50 && item.avgDelay <= 100;
                return (
                  <div key={item.stage} className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#141E1A]">{item.stage} Stage</span>
                      <span
                        className={`font-mono-data font-bold px-1.5 py-0.2 rounded-[2px] text-[11px] ${
                          isHigh
                            ? 'bg-[#FAECEB] text-[#BA2D1D] border border-[#F0B8B3]'
                            : isMed
                            ? 'bg-[#FDF3E7] text-[#C0781A] border border-[#F8DCB8]'
                            : 'bg-[#EAF4EE] text-[#27774E] border border-[#B8DCBE]'
                        }`}
                      >
                        ~{item.avgDelay}d mean
                      </span>
                    </div>
                    <div className="w-full bg-[#ECEEEA] rounded-[2px] h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isHigh ? 'bg-[#BA2D1D]' : isMed ? 'bg-[#C0781A]' : 'bg-[#27774E]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 p-3 bg-[#ECEEEA]/50 rounded-[4px] border border-[#DFE3DC] text-xs text-[#4E5C55] leading-relaxed">
            <span className="font-bold text-[#141E1A]">Primary Bottleneck:</span> Compensation disbursement &amp; Title disputes account for 44% of total project delays.
          </div>
        </div>
      </div>

      {/* 8. CRITICAL HIGH-RISK PRIORITY WATCHLIST TABLE */}
      <div className="bg-[#FFFFFF] rounded-[4px] border border-[#DFE3DC] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#DFE3DC] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif-heading text-base font-bold text-[#141E1A] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#BA2D1D]" />
              <span>Priority High-Risk Early Detection Watchlist ({role} Scope)</span>
            </h3>
            <p className="text-xs text-[#4E5C55] mt-0.5">
              Parcels requiring immediate administrative escalation under Section 25 lapsing rules
            </p>
          </div>
          <button
            onClick={() => setActiveTab('projects')}
            className="text-xs text-[#0C2B20] hover:text-[#164734] font-semibold inline-flex items-center gap-1 cursor-pointer bg-[#ECEEEA] hover:bg-[#DFE3DC] border border-[#DFE3DC] px-3 py-1.5 rounded-[4px] transition font-mono-data"
          >
            <span>View All {filteredProjects.length} In Scope</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#ECEEEA]/60 text-[#4E5C55] font-bold font-mono-data border-b border-[#DFE3DC]">
              <tr>
                <th className="py-2.5 px-4 sm:px-5">PARCEL ID</th>
                <th className="py-2.5 px-4 sm:px-5">PROJECT NAME</th>
                <th className="py-2.5 px-4 sm:px-5">STATE &amp; DISTRICT</th>
                <th className="py-2.5 px-4 sm:px-5">STAGE</th>
                <th className="py-2.5 px-4 sm:px-5">RISK SCORE</th>
                <th className="py-2.5 px-4 sm:px-5">DELAY PROB.</th>
                <th className="py-2.5 px-4 sm:px-5">PRIMARY SHAP DRIVER</th>
                <th className="py-2.5 px-4 sm:px-5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE3DC]">
              {highRiskProjects.slice(0, 5).map((p) => {
                const topDriver = p.prediction?.top_shap_factors[0];
                return (
                  <tr key={p.project_id} className="hover:bg-[#ECEEEA]/50 transition-all duration-150 ease-in-out cursor-pointer">
                    <td className="py-3 px-4 sm:px-5 font-mono-data font-bold text-[#141E1A]">
                      {p.project_id}
                    </td>
                    <td className="py-3 px-4 sm:px-5 font-semibold text-[#141E1A]">
                      {p.project_name}
                      <span className="block text-[10px] text-[#4E5C55] font-normal mt-0.5 font-mono-data">
                        {p.project_type} &bull; {p.land_area_hectares} Ha
                      </span>
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-[#4E5C55]">
                      {p.district}, {p.state}
                    </td>
                    <td className="py-3 px-4 sm:px-5">
                      <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono-data font-semibold bg-[#ECEEEA] text-[#141E1A] border border-[#DFE3DC]">
                        {p.current_stage}
                      </span>
                    </td>
                    <td className="py-3 px-4 sm:px-5">
                      <span className="font-mono-data inline-flex items-center gap-1 font-bold text-[#BA2D1D] bg-[#FAECEB] border border-[#F0B8B3] px-2 py-0.5 rounded-[2px] text-[11px]">
                        {p.prediction?.risk_score}/100
                      </span>
                    </td>
                    <td className="py-3 px-4 sm:px-5 font-mono-data font-bold text-[#141E1A]">
                      {((p.prediction?.probability_of_delay || 0) * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-[#4E5C55] max-w-xs">
                      {topDriver ? (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="font-mono-data font-bold text-[#BA2D1D]">+{topDriver.contribution}</span>
                          <span className="truncate text-[#4E5C55]">{topDriver.factor}</span>
                        </div>
                      ) : (
                        'Pending statutory approvals'
                      )}
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-right">
                      <button
                        onClick={() => handleInspectProject(p)}
                        className="inline-flex items-center gap-1 text-xs bg-[#0C2B20] hover:bg-[#164734] text-white font-medium px-3 py-1.5 rounded-[4px] transition cursor-pointer font-mono-data"
                      >
                        <span>Inspect Risk</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formal Report Export Modal */}
      <ReportExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        reportType="dashboard"
        projects={filteredProjects}
        filterState={{
          state: selectedState,
          district: selectedDistrict,
          projectType: selectedType,
          stage: selectedStage,
          risk: selectedRisk,
          searchQuery,
        }}
        userRole={role}
      />
    </div>
  );
};
