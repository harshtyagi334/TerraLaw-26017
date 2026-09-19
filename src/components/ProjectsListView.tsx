import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FilterBar } from './FilterBar';
import { LandProject, ProjectStage, ProjectType } from '../types';
import {
  Search,
  Eye,
  Sliders,
  Edit3,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Download,
  Loader2,
} from 'lucide-react';
import {
  exportProjectListToExcel,
  exportProjectListToPDF,
  ReportFilterMetadata,
} from '../utils/reportExportUtils';
import { ReportExportModal } from './ReportExportModal';

export const ProjectsListView: React.FC = () => {
  const {
    filteredProjects,
    setSelectedProject,
    setActiveTab,
    updateProject,
    addProject,
    userRole,
    selectedState,
    selectedDistrict,
    selectedType,
    selectedStage,
    selectedRisk,
    searchQuery,
    themeConfig,
  } = useApp();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [quickExportSuccess, setQuickExportSuccess] = useState<string | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<'risk_score' | 'land_area' | 'name' | 'id'>('risk_score');
  const [sortAsc, setSortAsc] = useState(false);

  // Edit / Stage Update Modal
  const [editingProject, setEditingProject] = useState<LandProject | null>(null);
  const [newStage, setNewStage] = useState<ProjectStage>('Notification');
  const [editCompDisbursedCr, setEditCompDisbursedCr] = useState<number>(0);
  const [editPossessionPct, setEditPossessionPct] = useState<number>(0);
  const [editPendingApprovals, setEditPendingApprovals] = useState<number>(0);
  const [editLegalDisputes, setEditLegalDisputes] = useState<number>(0);

  // New Project Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState<ProjectType>('Highway');
  const [newState, setNewState] = useState('Maharashtra');
  const [newDistrict, setNewDistrict] = useState('Pune');
  const [newLandArea, setNewLandArea] = useState(120);
  const [newFamilies, setNewFamilies] = useState(250);

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let valA = 0;
    let valB = 0;
    if (sortField === 'risk_score') {
      valA = a.prediction?.risk_score ?? 0;
      valB = b.prediction?.risk_score ?? 0;
    } else if (sortField === 'land_area') {
      valA = a.land_area_hectares;
      valB = b.land_area_hectares;
    } else if (sortField === 'name') {
      return sortAsc ? a.project_name.localeCompare(b.project_name) : b.project_name.localeCompare(a.project_name);
    } else {
      return sortAsc ? a.project_id.localeCompare(b.project_id) : b.project_id.localeCompare(a.project_id);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  const totalPages = Math.ceil(sortedProjects.length / pageSize);
  const paginatedProjects = sortedProjects.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenEdit = (p: LandProject) => {
    setEditingProject(p);
    setNewStage(p.current_stage);
    setEditCompDisbursedCr(p.compensation?.total_compensation_disbursed_cr ?? 0);
    setEditPossessionPct(p.possession?.possession_percentage ?? 0);
    setEditPendingApprovals(
      (p.approvals || []).filter((a) => a.status === 'Pending' || a.status === 'In-Progress').length
    );
    setEditLegalDisputes((p.legal_disputes || []).length);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    // Recalculate approvals array
    const updatedApprovals = Array.from({ length: editPendingApprovals }).map((_, idx) => ({
      approval_id: `APP-${editingProject.project_id}-${idx + 1}`,
      approval_type: 'Forest' as const,
      status: 'Pending' as const,
      applied_date: editingProject.start_date,
      delay_days: 45,
    }));

    // Recalculate legal disputes
    const updatedLegal = Array.from({ length: editLegalDisputes }).map((_, idx) => ({
      case_id: `WP-${1000 + idx}/${editingProject.project_id}`,
      case_type: 'Ownership' as const,
      status: 'Pending' as const,
      filed_date: editingProject.start_date,
      court_level: 'High Court' as const,
    }));

    updateProject(editingProject.project_id, {
      current_stage: newStage,
      project_status: newStage === 'Completed' ? 'Completed' : 'Ongoing',
      compensation: {
        ...editingProject.compensation,
        total_compensation_disbursed_cr: editCompDisbursedCr,
      },
      possession: {
        ...editingProject.possession,
        possession_percentage: editPossessionPct,
      },
      approvals: updatedApprovals,
      legal_disputes: updatedLegal,
    });

    setEditingProject(null);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const created = addProject({
      project_name: newProjectName,
      project_type: newProjectType,
      state: newState,
      district: newDistrict,
      block: 'Block-01',
      geo_location: {
        lat: 18.52,
        lng: 73.85,
        district: newDistrict,
        state: newState,
      },
      land_area_hectares: newLandArea,
      affected_families_count: newFamilies,
      start_date: new Date().toISOString().split('T')[0],
      planned_end_date: new Date(Date.now() + 500 * 86400000).toISOString().split('T')[0],
      current_stage: 'Notification',
      project_status: 'Ongoing',
      last_updated_date: new Date().toISOString().split('T')[0],
      approvals: [
        {
          approval_id: `APP-NEW-1`,
          approval_type: 'Administrative',
          status: 'Approved',
          applied_date: new Date().toISOString().split('T')[0],
          approved_date: new Date().toISOString().split('T')[0],
          delay_days: 0,
        },
        {
          approval_id: `APP-NEW-2`,
          approval_type: 'Forest',
          status: 'Pending',
          applied_date: new Date().toISOString().split('T')[0],
          delay_days: 30,
        },
      ],
      compensation: {
        compensation_id: `CMP-NEW`,
        total_compensation_assessed_cr: parseFloat((newLandArea * 1.1).toFixed(2)),
        total_compensation_disbursed_cr: 0,
        families_paid_count: 0,
        families_pending_count: newFamilies,
        disputed_cases_count: 0,
        last_updated_date: new Date().toISOString().split('T')[0],
      },
      legal_disputes: [],
      possession: {
        possession_id: `POS-NEW`,
        possession_percentage: 0,
        encumbrance_free_area_ha: 0,
      },
      rehabilitation: {
        rr_id: `RR-NEW`,
        total_affected_families: newFamilies,
        families_rehabilitated: 0,
        families_pending: newFamilies,
        rr_status: 'Not Started',
        r_and_r_center_ready: false,
      },
      stakeholder_responsiveness: {
        avg_response_time_days: 10,
        missed_meetings_count: 0,
        escalation_count: 0,
      },
    });

    setShowAddModal(false);
    setSelectedProject(created);
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
          userRole,
        };
        exportProjectListToExcel(sortedProjects, metadata);
        setQuickExportSuccess(`Project Status Register (${sortedProjects.length} records) exported to Excel (.xlsx) successfully.`);
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
          userRole,
        };
        exportProjectListToPDF(sortedProjects, metadata);
        setQuickExportSuccess(`Official Status Report (${sortedProjects.length} records) exported to PDF successfully.`);
        setTimeout(() => setQuickExportSuccess(null), 3500);
      } catch (err) {
        console.error('Export error:', err);
      } finally {
        setIsExportingPDF(false);
      }
    }, 300);
  };

  return (
    <div id="projects-list-view" className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Quick Export Toast Notification */}
      {quickExportSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{quickExportSuccess}</span>
          </div>
          <button
            onClick={() => setQuickExportSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Title & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5 pb-3.5 border-b border-[#E4E7E1]">
        <div>
          <h2 className="text-xl font-bold text-[#111814] tracking-tight">
            Land Acquisition Projects Directory &amp; Stage Gates
          </h2>
          <p className="text-xs text-[#5B6660] mt-0.5">
            Stage-wise monitoring, RFCTLARR Act logical consistency checks, and AI-driven early delay warnings.
          </p>
        </div>

        {/* Action Controls & Formal Status Report Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Excel Export */}
          <button
            id="btn-projects-export-excel"
            onClick={handleQuickExportExcel}
            disabled={isExportingExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white hover:bg-[#F7F8F5] active:scale-[0.98] text-[#111814] border border-[#E4E7E1] rounded-lg transition-all duration-200 ease-in-out cursor-pointer shadow-2xs hover:shadow-xs disabled:opacity-60"
            title="Download Project Status Register (.xlsx)"
          >
            {isExportingExcel ? (
              <Loader2 className="w-3.5 h-3.5 text-[#1F7A4D] animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#1F7A4D]" />
            )}
            <span>{isExportingExcel ? 'Exporting...' : 'Export Excel'}</span>
          </button>

          {/* Quick PDF Export */}
          <button
            id="btn-projects-export-pdf"
            onClick={handleQuickExportPDF}
            disabled={isExportingPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white hover:bg-[#F7F8F5] active:scale-[0.98] text-[#111814] border border-[#E4E7E1] rounded-lg transition-all duration-200 ease-in-out cursor-pointer shadow-2xs hover:shadow-xs disabled:opacity-60"
            title="Download Official PDF Status Report"
          >
            {isExportingPDF ? (
              <Loader2 className="w-3.5 h-3.5 text-[#C6402C] animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-[#C6402C]" />
            )}
            <span>{isExportingPDF ? 'Generating...' : 'Export PDF'}</span>
          </button>

          {/* Formal Status Report Modal */}
          <button
            id="btn-projects-formal-report"
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#0F3D2E] hover:bg-[#165641] active:scale-[0.98] text-white rounded-lg transition-all duration-200 ease-in-out cursor-pointer shadow-sm hover:shadow"
            title="Configure and Generate Formal Status Report with Attestation"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Formal Report...</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-[#0F3D2E] hover:bg-[#165641] active:scale-[0.98] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm hover:shadow transition-all duration-200 ease-in-out cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-200" />
            <span>Register Project</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar />

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-[#E4E7E1] shadow-sm hover:shadow-md transition overflow-hidden">
        {/* Table Controls */}
        <div className="px-5 py-3.5 bg-[#F7F8F5] border-b border-[#E4E7E1] flex flex-wrap items-center justify-between gap-3 text-xs text-[#5B6660]">
          <div>
            Showing{' '}
            <span className="font-bold text-[#111814]">
              {sortedProjects.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-[#111814]">
              {Math.min(currentPage * pageSize, sortedProjects.length)}
            </span>{' '}
            of <span className="font-bold text-[#111814]">{sortedProjects.length}</span> projects
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#5B6660]">Sort by:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="bg-white border border-[#E4E7E1] rounded-lg px-2.5 py-1 text-xs text-[#111814] font-medium shadow-2xs cursor-pointer focus:outline-none focus:ring-1.5 focus:ring-[#1F7A4D]/50"
            >
              <option value="risk_score">Risk Score (Highest First)</option>
              <option value="land_area">Land Area (Hectares)</option>
              <option value="name">Project Name</option>
              <option value="id">Project ID</option>
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="p-1.5 border border-[#E4E7E1] rounded-lg bg-white hover:bg-[#F7F8F5] text-[#5B6660] cursor-pointer shadow-2xs"
              title="Toggle Asc/Desc"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center gap-1 bg-white hover:bg-[#F7F8F5] text-[#111814] border border-[#E4E7E1] rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer shadow-2xs"
              title="Generate Formal Status Report"
            >
              <Download className="w-3.5 h-3.5 text-[#5B6660]" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Desktop & Tablet Table View (hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F8F5] text-[#5B6660] font-semibold border-b border-[#E4E7E1]">
              <tr>
                <th className="py-3 px-4">Project ID</th>
                <th className="py-3 px-4">Project Name &amp; Sector</th>
                <th className="py-3 px-4">District &amp; State</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Delay Prob.</th>
                <th className="py-3 px-4">Primary Delay Driver (SHAP)</th>
                <th className="py-3 px-4">Stage-Gate Check</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7E1]">
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#5B6660]">
                    No projects match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((p) => {
                  const risk = p.prediction?.risk_score ?? 0;
                  const prob = p.prediction?.probability_of_delay ?? 0;
                  const topDriver = p.prediction?.top_shap_factors[0];
                  const issues = p.prediction?.stage_gate_issues || [];
                  const hasError = issues.some((i) => i.type === 'Error');
                  const hasWarning = issues.some((i) => i.type === 'Warning');

                  return (
                    <tr key={p.project_id} className="hover:bg-[#F7F8F5]/90 transition-all duration-150 ease-in-out">
                      <td className="py-3 px-4 font-mono font-bold text-[#111814] whitespace-nowrap">
                        {p.project_id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#111814] max-w-xs truncate" title={p.project_name}>
                          {p.project_name}
                        </div>
                        <div className="text-[11px] text-[#5B6660]">
                          {p.project_type} &bull; {p.land_area_hectares} Ha &bull; {p.affected_families_count} Families
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#5B6660] whitespace-nowrap">
                        <span className="font-medium text-[#111814]">{p.district}</span>
                        <span className="block text-[11px] text-[#5B6660]">{p.state}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                            p.current_stage === 'Completed'
                              ? 'bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/30'
                              : 'bg-[#F7F8F5] text-[#111814] border-[#E4E7E1]'
                          }`}
                        >
                          {p.current_stage}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                              risk >= 65
                                ? 'bg-[#C6402C]/10 text-[#C6402C] border border-[#C6402C]/30'
                                : risk >= 35
                                ? 'bg-[#D98B2B]/10 text-[#D98B2B] border border-[#D98B2B]/30'
                                : 'bg-[#2E8B57]/10 text-[#2E8B57] border border-[#2E8B57]/30'
                            }`}
                          >
                            {risk}/100
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#111814] whitespace-nowrap">
                        {(prob * 100).toFixed(0)}%
                      </td>
                      <td className="py-3 px-4 text-[#5B6660] max-w-[220px]">
                        {topDriver ? (
                          <div className="truncate text-[11px]" title={topDriver.description}>
                            <span className="font-semibold text-[#C6402C]">+{topDriver.contribution}</span>{' '}
                            {topDriver.factor}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#5B6660]">Within statutory SLA</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {hasError ? (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#C6402C]/10 text-[#C6402C] border border-[#C6402C]/30 px-2 py-0.5 rounded-md"
                            title={issues[0]?.message}
                          >
                            <AlertCircle className="w-3 h-3 text-[#C6402C]" />
                            Rule Violation
                          </span>
                        ) : hasWarning ? (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#D98B2B]/10 text-[#D98B2B] border border-[#D98B2B]/30 px-2 py-0.5 rounded-md"
                            title={issues[0]?.message}
                          >
                            <AlertTriangle className="w-3 h-3 text-[#D98B2B]" />
                            Warning
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2E8B57]">
                            <CheckCircle2 className="w-3 h-3 text-[#2E8B57]" />
                            Compliant
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedProject(p);
                              setActiveTab('project_detail');
                            }}
                            className="p-2 min-h-[36px] min-w-[36px] rounded-lg text-[#1F7A4D] hover:text-[#0F3D2E] hover:bg-[#F7F8F5] cursor-pointer transition border border-transparent hover:border-[#E4E7E1] inline-flex items-center justify-center"
                            title="Inspect AI Risk & SHAP"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProject(p);
                              setActiveTab('what_if');
                            }}
                            className="p-2 min-h-[36px] min-w-[36px] rounded-lg text-[#D98B2B] hover:text-[#b8711e] hover:bg-[#F7F8F5] cursor-pointer transition border border-transparent hover:border-[#E4E7E1] inline-flex items-center justify-center"
                            title="What-If Simulation"
                          >
                            <Sliders className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-2 min-h-[36px] min-w-[36px] rounded-lg text-[#5B6660] hover:text-[#111814] hover:bg-[#F7F8F5] cursor-pointer transition border border-transparent hover:border-[#E4E7E1] inline-flex items-center justify-center"
                            title="Update Stage / Field Data"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Card Layout (< md screens: no cramped horizontal scroll) */}
        <div className="block md:hidden divide-y divide-[#E4E7E1]">
          {paginatedProjects.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#5B6660]">
              No projects match the selected filter criteria.
            </div>
          ) : (
            paginatedProjects.map((p) => {
              const risk = p.prediction?.risk_score ?? 0;
              const prob = p.prediction?.probability_of_delay ?? 0;
              const topDriver = p.prediction?.top_shap_factors[0];
              const issues = p.prediction?.stage_gate_issues || [];
              const hasError = issues.some((i) => i.type === 'Error');
              const hasWarning = issues.some((i) => i.type === 'Warning');

              return (
                <div key={p.project_id} className="p-4 bg-white hover:bg-[#F7F8F5]/90 transition-all duration-150 ease-in-out card-hover-lift space-y-3">
                  {/* Card Header: ID, Name, Risk Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0F3D2E] bg-[#EAF4EE] px-2 py-0.5 rounded border border-[#B8DCBE]">
                          {p.project_id}
                        </span>
                        <span className="text-[11px] font-semibold text-[#5B6660]">
                          {p.project_type}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#111814] mt-1 leading-snug">
                        {p.project_name}
                      </h4>
                    </div>

                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-bold font-mono ${
                        risk >= 65
                          ? 'bg-[#C6402C]/10 text-[#C6402C] border border-[#C6402C]/30'
                          : risk >= 35
                          ? 'bg-[#D98B2B]/10 text-[#D98B2B] border border-[#D98B2B]/30'
                          : 'bg-[#2E8B57]/10 text-[#2E8B57] border border-[#2E8B57]/30'
                      }`}
                    >
                      {risk}/100 Risk
                    </span>
                  </div>

                  {/* Card Core Fields: District/State, Stage, Delay Prob */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#F7F8F5] p-2.5 rounded-lg border border-[#E4E7E1]">
                    <div>
                      <span className="text-[10px] text-[#5B6660] block uppercase font-mono font-bold">Location</span>
                      <span className="font-medium text-[#111814]">{p.district}, {p.state}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#5B6660] block uppercase font-mono font-bold">Current Stage</span>
                      <span className="font-medium text-[#111814]">{p.current_stage}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#5B6660] block uppercase font-mono font-bold">Delay Probability</span>
                      <span className="font-medium text-[#111814]">{(prob * 100).toFixed(0)}% ({p.prediction?.predicted_delay_days ?? 0}d)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#5B6660] block uppercase font-mono font-bold">Stage Gate Status</span>
                      {hasError ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#C6402C]">
                          <AlertCircle className="w-3 h-3 shrink-0" /> Violation
                        </span>
                      ) : hasWarning ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D98B2B]">
                          <AlertTriangle className="w-3 h-3 shrink-0" /> Warning
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2E8B57]">
                          <CheckCircle2 className="w-3 h-3 shrink-0" /> Compliant
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Primary SHAP Driver if any */}
                  {topDriver && (
                    <div className="text-[11px] text-[#5B6660] bg-white p-2 rounded border border-[#E4E7E1]">
                      <span className="font-mono font-bold text-[#C6402C]">Top Risk Factor:</span> {topDriver.factor}
                    </div>
                  )}

                  {/* Mobile Touch Action Buttons (at least 44px touch targets) */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedProject(p);
                        setActiveTab('project_detail');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 min-h-[44px] bg-[#0F3D2E] hover:bg-[#165641] text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Inspect AI</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProject(p);
                        setActiveTab('what_if');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 min-h-[44px] bg-[#FDF3E7] hover:bg-[#FDE8CF] text-[#C0781A] border border-[#FAD7A0] text-xs font-semibold rounded-lg transition cursor-pointer"
                    >
                      <Sliders className="w-4 h-4" />
                      <span>What-If</span>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-2.5 min-h-[44px] min-w-[44px] bg-white hover:bg-[#F7F8F5] text-[#5B6660] border border-[#E4E7E1] rounded-lg transition cursor-pointer flex items-center justify-center"
                      title="Edit Project Stage"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 bg-[#F7F8F5] border-t border-[#E4E7E1] flex items-center justify-between text-xs text-[#5B6660]">
            <div>
              Page <span className="font-bold text-[#111814]">{currentPage}</span> of{' '}
              <span className="font-bold text-[#111814]">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#E4E7E1] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F7F8F5] text-[#111814] font-medium flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#E4E7E1] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F7F8F5] text-[#111814] font-medium flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Update Stage & Field Data */}
      {editingProject && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-5 border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="font-mono text-[11px] text-amber-600 font-bold">
                  {editingProject.project_id}
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Update Stage &amp; Acquisition Parameters
                </h3>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-base font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Current Stage (RFCTLARR Statutory Workflow)
                </label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value as ProjectStage)}
                  className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-800"
                >
                  <option value="Notification">Notification (Section 11)</option>
                  <option value="Survey">Joint Survey &amp; Demarcation</option>
                  <option value="Compensation">Compensation Award &amp; Disbursement (Section 23)</option>
                  <option value="Possession">Physical Possession Takeover (Section 38)</option>
                  <option value="R&R">Rehabilitation &amp; Resettlement</option>
                  <option value="Completed">Project Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Compensation Disbursed (₹ Crores) &mdash; Total Assessed: ₹
                  {editingProject.compensation?.total_compensation_assessed_cr} Cr
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={editingProject.compensation?.total_compensation_assessed_cr}
                  value={editCompDisbursedCr}
                  onChange={(e) => setEditCompDisbursedCr(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Physical Possession Handover (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editPossessionPct}
                  onChange={(e) => setEditPossessionPct(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Pending Statutory Approvals
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={editPendingApprovals}
                    onChange={(e) => setEditPendingApprovals(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Active Court Writs / Disputes
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={editLegalDisputes}
                    onChange={(e) => setEditLegalDisputes(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-100 rounded text-[11px] text-blue-800">
                <span className="font-semibold">Automated Retraining Notice:</span> Saving changes will trigger instantaneous recalculation of the Random Forest risk score and regenerate SHAP attribution factors.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer shadow-xs"
                >
                  Save &amp; Recalculate Risk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register New Project */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-5 border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="font-semibold text-amber-600 text-[11px] uppercase">
                  DoLR &bull; Infrastructure Onboarding
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Register New Land Acquisition Package
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-base font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Pune Outer Ring Road Expressway Section-3"
                  className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Project Sector</label>
                  <select
                    value={newProjectType}
                    onChange={(e) => setNewProjectType(e.target.value as ProjectType)}
                    className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="Highway">Highway</option>
                    <option value="Railway">Railway</option>
                    <option value="Power">Power</option>
                    <option value="Irrigation">Irrigation</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Urban">Urban</option>
                    <option value="Rural">Rural</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target State</label>
                  <select
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Odisha">Odisha</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Land Area (Ha)</label>
                  <input
                    type="number"
                    min="1"
                    value={newLandArea}
                    onChange={(e) => setNewLandArea(parseFloat(e.target.value) || 1)}
                    className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Affected Families Count (SIA Baseline)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newFamilies}
                  onChange={(e) => setNewFamilies(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer shadow-xs"
                >
                  Register &amp; Initialize AI Model
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formal Report Export Modal */}
      <ReportExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        reportType="project_list"
        projects={sortedProjects}
        currentPageProjects={paginatedProjects}
        filterState={{
          state: selectedState,
          district: selectedDistrict,
          projectType: selectedType,
          stage: selectedStage,
          risk: selectedRisk,
          searchQuery,
        }}
        userRole={userRole}
      />
    </div>
  );
};
