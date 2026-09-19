import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Printer,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Copy,
  Check,
  BookOpen,
  FileCheck,
  Bot,
  Send,
  RefreshCw,
  SlidersHorizontal,
  Loader2,
} from 'lucide-react';
import { LandProject, UserRole } from '../types';
import {
  exportProjectListToExcel,
  exportProjectListToPDF,
  exportDashboardToExcel,
  exportDashboardToPDF,
  generateDocRef,
  ReportFilterMetadata,
} from '../utils/reportExportUtils';
import {
  generateExecutiveBriefing,
  GenAIReportResult,
  getGeminiApiKey,
  hasGeminiApiKey,
} from '../utils/geminiService';
import jsPDF from 'jspdf';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'project_list' | 'dashboard';
  projects: LandProject[];
  currentPageProjects?: LandProject[];
  filterState: {
    state?: string;
    district?: string;
    projectType?: string;
    stage?: string;
    risk?: string;
    searchQuery?: string;
  };
  userRole: UserRole;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  reportType,
  projects,
  currentPageProjects = [],
  filterState,
  userRole,
}) => {
  const [modalTab, setModalTab] = useState<'official' | 'genai'>('official');
  const [scope, setScope] = useState<'all' | 'high_risk' | 'current_page'>('all');
  const [officerName, setOfficerName] = useState(
    userRole === 'District Admin'
      ? 'District Collector & CALA'
      : userRole === 'State Admin'
      ? 'State Nodal Secretary (Revenue)'
      : 'Chief Monitoring Officer, DoLR'
  );
  const [officerDesignation, setOfficerDesignation] = useState(
    userRole === 'District Admin'
      ? 'Competent Authority for Land Acquisition (CALA)'
      : userRole === 'State Admin'
      ? 'Department of Revenue & Land Records'
      : 'Ministry of Rural Development, Govt. of India'
  );
  const [includeExecutiveSummary, setIncludeExecutiveSummary] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // GenAI Specific State
  const [genAiFocus, setGenAiFocus] = useState<
    'general_executive' | 'statutory_compliance' | 'financial_dbt' | 'high_risk_mitigation'
  >('general_executive');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiResult, setAiResult] = useState<GenAIReportResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  // Filter projects according to chosen scope
  let exportData: LandProject[] = projects;
  if (scope === 'high_risk') {
    exportData = projects.filter((p) => (p.prediction?.risk_score ?? 0) >= 65);
  } else if (scope === 'current_page' && currentPageProjects.length > 0) {
    exportData = currentPageProjects;
  }

  const highRiskCount = exportData.filter((p) => (p.prediction?.risk_score ?? 0) >= 65).length;
  const ongoingCount = exportData.filter((p) => p.project_status === 'Ongoing').length;
  const totalAssessed = exportData.reduce(
    (acc, p) => acc + (p.compensation?.total_compensation_assessed_cr || 0),
    0
  );
  const totalDisbursed = exportData.reduce(
    (acc, p) => acc + (p.compensation?.total_compensation_disbursed_cr || 0),
    0
  );

  const metadata: ReportFilterMetadata = {
    state: filterState.state,
    district: filterState.district,
    projectType: filterState.projectType,
    stage: filterState.stage,
    risk: filterState.risk,
    searchQuery: filterState.searchQuery,
    userRole,
    officerName,
    officerDesignation,
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    setExportSuccessMsg(null);
    try {
      if (reportType === 'dashboard') {
        exportDashboardToExcel(exportData, metadata);
      } else {
        exportProjectListToExcel(exportData, metadata);
      }
      setExportSuccessMsg('Formal Excel workbook (.xlsx) successfully generated and downloaded.');
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    setExportSuccessMsg(null);
    try {
      if (reportType === 'dashboard') {
        exportDashboardToPDF(exportData, metadata);
      } else {
        exportProjectListToPDF(exportData, metadata);
      }
      setExportSuccessMsg('Official PDF status report generated and downloaded.');
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateAiBrief = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await generateExecutiveBriefing(exportData, userRole, {
        focus: genAiFocus,
        customInstructions,
      });
      setAiResult(res);
      setExportSuccessMsg(`GenAI Executive Briefing generated using ${res.modelUsed}.`);
      setTimeout(() => setExportSuccessMsg(null), 3500);
    } catch (err) {
      console.error('GenAI generation error:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!aiResult) return;
    navigator.clipboard.writeText(aiResult.markdown);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadAiPdf = () => {
    if (!aiResult) return;
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const maxTextWidth = pageWidth - margin * 2;

      // Header bar
      doc.setFillColor(15, 61, 46);
      doc.rect(0, 0, pageWidth, 24, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('GOVERNMENT OF INDIA • MINISTRY OF RURAL DEVELOPMENT', margin, 9);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 230, 215);
      doc.text('DEPARTMENT OF LAND RESOURCES (DoLR) • RFCTLARR STATUTORY SURVEILLANCE', margin, 15);

      const docRef = generateDocRef('DoLR-GENAI-SYNTHESIS');
      doc.setFontSize(7);
      doc.text(`Doc Ref: ${docRef} | Model: ${aiResult.modelUsed}`, margin, 20);

      // Title
      let y = 33;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 61, 46);
      doc.text('EXECUTIVE LAND ACQUISITION INTELLIGENCE BRIEF', margin, y);
      y += 6;

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 110, 105);
      doc.text(
        `Target Cadre: ${userRole} | Packages: ${aiResult.projectCount} | Focus: ${genAiFocus.toUpperCase()} | Generated: ${aiResult.generatedAt}`,
        margin,
        y
      );
      y += 8;

      // Body lines
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 35, 32);

      const cleanText = aiResult.markdown.replace(/#{1,6}\s?/g, '').replace(/\*\*/g, '');
      const lines = doc.splitTextToSize(cleanText, maxTextWidth);

      for (let i = 0; i < lines.length; i++) {
        if (y > 272) {
          doc.addPage();
          y = 18;
        }
        doc.text(lines[i], margin, y);
        y += 4.3;
      }

      // Sign-off attestation
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      y += 8;
      doc.setDrawColor(200, 210, 205);
      doc.line(margin, y, pageWidth - margin, y);
      y += 7;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 61, 46);
      doc.text(`Reporting Authority: ${officerName}`, margin, y);
      y += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(90, 100, 95);
      doc.text(`${officerDesignation}`, margin, y);

      doc.save(`DoLR_GenAI_Executive_Brief_${new Date().toISOString().split('T')[0]}.pdf`);
      setExportSuccessMsg('GenAI Executive Briefing PDF downloaded successfully.');
      setTimeout(() => setExportSuccessMsg(null), 3500);
    } catch (e) {
      console.error('PDF export error:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        id="report-export-modal"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans"
      >
        {/* Header */}
        <div className="bg-[#0F3D2E] text-white px-6 py-4 flex items-center justify-between border-b border-[#0F3D2E]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg border border-white/20 text-emerald-200">
              {modalTab === 'official' ? (
                <FileText className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5 text-amber-300" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>
                  {modalTab === 'official'
                    ? reportType === 'dashboard'
                      ? 'Generate Executive Land Acquisition Status Report'
                      : 'Export Formal Land Acquisition Project Status Report'
                    : 'GenAI Land Acquisition Intelligence Briefing'}
                </span>
              </h3>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                {modalTab === 'official'
                  ? 'Statutory audit report compliant with RFCTLARR Act, 2013 & DoLR standards'
                  : 'Powered by Google Gemini 2.5 Flash via @google/genai SDK'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E4E7E1] bg-[#F7F8F5] px-6">
          <button
            type="button"
            onClick={() => setModalTab('official')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              modalTab === 'official'
                ? 'border-[#0F3D2E] text-[#0F3D2E] bg-white shadow-2xs'
                : 'border-transparent text-[#5B6660] hover:text-[#111814]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-[#1F7A4D]" />
            <span>Formal Statutory Register (Excel &amp; PDF)</span>
          </button>

          <button
            type="button"
            id="tab-genai-synthesis"
            onClick={() => setModalTab('genai')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              modalTab === 'genai'
                ? 'border-[#1F7A4D] text-[#1F7A4D] bg-white shadow-2xs'
                : 'border-transparent text-[#5B6660] hover:text-[#111814]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>GenAI Executive Synthesis (Google Gemini)</span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 font-mono">
              gemini-2.5-flash
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto text-xs text-[#5B6660]">
          {/* Success Banner */}
          {exportSuccessMsg && (
            <div className="p-3 bg-[#2E8B57]/10 border border-[#2E8B57]/30 rounded-lg text-[#2E8B57] flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#2E8B57] shrink-0" />
              <span>{exportSuccessMsg}</span>
            </div>
          )}

          {/* Scope Selector (Shared across both modes) */}
          <div>
            <label className="block text-xs font-bold text-[#111814] uppercase tracking-wider mb-2">
              Select Analysis &amp; Report Scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  scope === 'all'
                    ? 'bg-[#0F3D2E] text-white border-[#0F3D2E] shadow-sm'
                    : 'bg-white hover:bg-[#F7F8F5] border-[#E4E7E1] text-[#111814]'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>All Filtered</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      scope === 'all'
                        ? 'bg-white/20 text-white'
                        : 'bg-[#F7F8F5] text-[#111814] border border-[#E4E7E1]'
                    }`}
                  >
                    {projects.length}
                  </span>
                </div>
                <div className={`text-[11px] mt-1 ${scope === 'all' ? 'text-emerald-100' : 'text-[#5B6660]'}`}>
                  Full register under active filters
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('high_risk')}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  scope === 'high_risk'
                    ? 'bg-[#C6402C] text-white border-[#C6402C] shadow-sm'
                    : 'bg-white hover:bg-[#C6402C]/5 border-[#E4E7E1] text-[#111814]'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
                    <span>High Risk Only</span>
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      scope === 'high_risk'
                        ? 'bg-white/20 text-white'
                        : 'bg-[#C6402C]/10 text-[#C6402C] border border-[#C6402C]/20'
                    }`}
                  >
                    {projects.filter((p) => (p.prediction?.risk_score ?? 0) >= 65).length}
                  </span>
                </div>
                <div className={`text-[11px] mt-1 ${scope === 'high_risk' ? 'text-rose-100' : 'text-[#5B6660]'}`}>
                  Score &ge; 65 critical packages
                </div>
              </button>

              {currentPageProjects.length > 0 && (
                <button
                  type="button"
                  onClick={() => setScope('current_page')}
                  className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                    scope === 'current_page'
                      ? 'bg-[#0F3D2E] text-white border-[#0F3D2E] shadow-sm'
                      : 'bg-white hover:bg-[#F7F8F5] border-[#E4E7E1] text-[#111814]'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>Current Page</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                        scope === 'current_page'
                          ? 'bg-white/20 text-white'
                          : 'bg-[#F7F8F5] text-[#111814] border border-[#E4E7E1]'
                      }`}
                    >
                      {currentPageProjects.length}
                    </span>
                  </div>
                  <div className={`text-[11px] mt-1 ${scope === 'current_page' ? 'text-emerald-100' : 'text-[#5B6660]'}`}>
                    Active table page items only
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Scope Statistics Preview */}
          <div className="bg-[#F7F8F5] p-3.5 rounded-xl border border-[#E4E7E1] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-[10px] text-[#5B6660] uppercase font-semibold">Packages</div>
              <div className="text-lg font-bold text-[#111814] mt-0.5">{exportData.length}</div>
              <div className="text-[10px] text-[#5B6660]">{ongoingCount} ongoing</div>
            </div>
            <div>
              <div className="text-[10px] text-[#C6402C] uppercase font-bold">High Risk</div>
              <div className="text-lg font-bold text-[#C6402C] mt-0.5">{highRiskCount}</div>
              <div className="text-[10px] text-[#C6402C]">
                {exportData.length > 0 ? ((highRiskCount / exportData.length) * 100).toFixed(0) : 0}% of scope
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#5B6660] uppercase font-semibold">Compensation Assessed</div>
              <div className="text-lg font-bold text-[#111814] mt-0.5">₹{totalAssessed.toFixed(1)} Cr</div>
              <div className="text-[10px] text-[#5B6660]">Sec 23 awards</div>
            </div>
            <div>
              <div className="text-[10px] text-[#2E8B57] uppercase font-bold">Compensation DBT</div>
              <div className="text-lg font-bold text-[#2E8B57] mt-0.5">
                {totalAssessed > 0 ? ((totalDisbursed / totalAssessed) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-[10px] text-[#2E8B57]">₹{totalDisbursed.toFixed(1)} Cr paid</div>
            </div>
          </div>

          {/* TAB 1: FORMAL STATUTORY REGISTER BODY */}
          {modalTab === 'official' && (
            <div className="space-y-4">
              {/* Officer & Authentication Metadata */}
              <div>
                <label className="block text-xs font-bold text-[#111814] uppercase tracking-wider mb-2">
                  Officer Attestation &amp; Sign-off Details
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5B6660] mb-1">
                      Reporting Officer / Authority Name:
                    </label>
                    <input
                      type="text"
                      value={officerName}
                      onChange={(e) => setOfficerName(e.target.value)}
                      placeholder="e.g. Demo Officer — Central Role"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E4E7E1] rounded-lg text-[#111814] focus:ring-1.5 focus:ring-[#1F7A4D]/50 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#5B6660] mb-1">
                      Official Designation / Department:
                    </label>
                    <input
                      type="text"
                      value={officerDesignation}
                      onChange={(e) => setOfficerDesignation(e.target.value)}
                      placeholder="e.g. Competent Authority (CALA)"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E4E7E1] rounded-lg text-[#111814] focus:ring-1.5 focus:ring-[#1F7A4D]/50 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Options */}
              <div className="pt-2 border-t border-[#E4E7E1]">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeExecutiveSummary}
                    onChange={(e) => setIncludeExecutiveSummary(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0F3D2E] focus:ring-[#1F7A4D] border-[#E4E7E1]"
                  />
                  <span className="text-xs font-semibold text-[#111814]">
                    Include Executive Summary KPI Sheet &amp; Stage-Gate Compliance Audit
                  </span>
                </label>
              </div>

              {/* Report Features Explanation */}
              <div className="p-3.5 bg-[#2D6CDF]/10 border border-[#2D6CDF]/30 rounded-xl text-[11px] text-[#111814] space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-[#2D6CDF]">
                  <ShieldCheck className="w-4 h-4 text-[#2D6CDF]" />
                  <span>Official Government Format Standards:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[#5B6660]">
                  <li>
                    <strong>Excel (.xlsx) Workbook:</strong> Master project records, executive summary KPIs, and high-risk action matrix.
                  </li>
                  <li>
                    <strong>PDF Document:</strong> Official Ministry header, document tracking ID, RFCTLARR statutory checks, and signature blocks.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: GENAI EXECUTIVE SYNTHESIS BODY */}
          {modalTab === 'genai' && (
            <div className="space-y-4">
              {/* Strategic Focus Selector */}
              <div>
                <label className="block text-xs font-bold text-[#111814] uppercase tracking-wider mb-2">
                  Select AI Strategic Synthesis Focus
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      id: 'general_executive',
                      title: 'General Executive Briefing',
                      desc: 'Macro portfolio health, capital exposure, and high-delay sector hotspots.',
                    },
                    {
                      id: 'statutory_compliance',
                      title: 'RFCTLARR Statutory Velocity',
                      desc: 'Section 11 lapse risk (12-mo cap), Section 19 declaration, and Section 38 possession barriers.',
                    },
                    {
                      id: 'financial_dbt',
                      title: 'Financial Risk & DBT Velocity',
                      desc: 'Award determination, PFMS direct bank disbursement velocity, and PAF escrow accounts.',
                    },
                    {
                      id: 'high_risk_mitigation',
                      title: 'Critical Path Package De-risking',
                      desc: 'Targeted action plans for packages with Risk Score >= 65 and acute judicial stay orders.',
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGenAiFocus(item.id as any)}
                      className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                        genAiFocus === item.id
                          ? 'bg-[#EAF4EE] border-[#196842] text-[#0C2B20]'
                          : 'bg-white hover:bg-[#F7F8F5] border-[#DFE3DC] text-[#4E5C55]'
                      }`}
                    >
                      <div className="font-bold text-xs text-[#111814] flex items-center justify-between">
                        <span>{item.title}</span>
                        {genAiFocus === item.id && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#196842]" />
                        )}
                      </div>
                      <p className="text-[11px] mt-0.5 text-[#5B6660] leading-snug">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Officer Directives */}
              <div>
                <label className="block text-[11px] font-semibold text-[#111814] mb-1">
                  Optional Executive Directives / Specific Emphasis:
                </label>
                <input
                  type="text"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Focus on highway packages in Maharashtra with Section 38 disbursement lagging..."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E4E7E1] rounded-lg text-[#111814] focus:ring-1.5 focus:ring-[#1F7A4D]/50 focus:outline-hidden"
                />
              </div>

              {/* AI Generation Trigger Banner */}
              <div className="p-3.5 bg-[#F7F8F5] rounded-xl border border-[#DFE3DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-xs text-[#111814] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Generate AI Brief with Google Gemini 2.5 Flash</span>
                  </div>
                  <p className="text-[11px] text-[#5B6660] mt-0.5">
                    Synthesizes {exportData.length} records against RFCTLARR Act statutory provisions.
                  </p>
                </div>

                <button
                  id="btn-generate-ai-brief"
                  type="button"
                  disabled={isGeneratingAi || exportData.length === 0}
                  onClick={handleGenerateAiBrief}
                  className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#165641] text-white font-bold text-xs rounded-lg shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  {isGeneratingAi ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                      <span>Synthesizing Brief...</span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-3.5 h-3.5 text-amber-300" />
                      <span>Generate Intelligence Brief</span>
                    </>
                  )}
                </button>
              </div>

              {/* AI Generated Result Preview */}
              {aiResult && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between p-2.5 bg-[#0C2B20] text-white rounded-lg">
                    <div className="flex items-center gap-2 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span className="font-bold">Intelligence Brief Generated</span>
                      <span className="text-[10px] text-emerald-200 font-mono">({aiResult.modelUsed})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyMarkdown}
                        className="px-2.5 py-1 text-[11px] bg-white/10 hover:bg-white/20 rounded text-white flex items-center gap-1 cursor-pointer transition font-mono"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadAiPdf}
                        className="px-2.5 py-1 text-[11px] bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded flex items-center gap-1 cursor-pointer transition"
                      >
                        <Download className="w-3 h-3 text-slate-900" />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-[#DFE3DC] rounded-lg max-h-72 overflow-y-auto font-mono text-[11px] text-[#141E1A] leading-relaxed whitespace-pre-wrap select-text">
                    {aiResult.markdown}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#F7F8F5] px-6 py-4 border-t border-[#E4E7E1] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 border border-[#E4E7E1] text-[#5B6660] hover:bg-white rounded-lg font-semibold text-xs transition cursor-pointer shadow-2xs"
          >
            Close
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {modalTab === 'official' ? (
              <>
                <button
                  id="btn-export-modal-excel"
                  type="button"
                  disabled={isExporting || exportData.length === 0}
                  onClick={handleExportExcel}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white hover:bg-[#F7F8F5] border border-[#E4E7E1] text-[#111814] font-semibold text-xs px-4 py-2 rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#1F7A4D]" />
                  <span>Export Excel (.xlsx)</span>
                </button>

                <button
                  id="btn-export-modal-pdf"
                  type="button"
                  disabled={isExporting || exportData.length === 0}
                  onClick={handleExportPDF}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#0F3D2E] hover:bg-[#165641] text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-200" />
                  <span>Export PDF Report (.pdf)</span>
                </button>
              </>
            ) : (
              <>
                {aiResult && (
                  <button
                    type="button"
                    onClick={handleDownloadAiPdf}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white hover:bg-[#F7F8F5] border border-[#E4E7E1] text-[#111814] font-semibold text-xs px-4 py-2 rounded-lg shadow-2xs transition cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#1F7A4D]" />
                    <span>Download Briefing (.pdf)</span>
                  </button>
                )}

                <button
                  id="btn-footer-generate-brief"
                  type="button"
                  disabled={isGeneratingAi || exportData.length === 0}
                  onClick={handleGenerateAiBrief}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#0F3D2E] hover:bg-[#165641] text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{aiResult ? 'Regenerate Brief' : 'Generate with Gemini AI'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
