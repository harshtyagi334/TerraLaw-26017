import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, AppTheme } from '../types';
import {
  Bell,
  Search,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  X,
  ExternalLink,
  ChevronDown,
  User,
  LogOut,
  LogIn,
  MapPin,
  CheckCircle2,
  ShieldAlert,
  SlidersHorizontal,
  Palette,
  Sparkles,
  Loader2,
  Activity,
  Play,
  Pause,
  Zap,
  Key,
  ShieldCheck,
} from 'lucide-react';
import { exportProjectsToCSV } from '../utils/datasetGenerator';
import { THEME_CONFIGS } from '../utils/themeConfig';
import { getGeminiApiKey, setGeminiApiKey, hasGeminiApiKey } from '../utils/geminiService';

export const Header: React.FC = () => {
  const {
    userRole,
    setUserRole,
    currentUser,
    isAuthenticated,
    logout,
    setShowAuthModal,
    alerts,
    unreadAlertsCount,
    acknowledgeAlert,
    markAllAlertsRead,
    searchQuery,
    setSearchQuery,
    projects,
    setSelectedProject,
    setActiveTab,
    appTheme,
    setAppTheme,
    themeConfig,
    isSurveillanceActive,
    toggleSurveillance,
    surveillanceIntervalSeconds,
    setSurveillanceIntervalSeconds,
    lastSurveillanceSweep,
    simulateFieldTelemetryEvent,
  } = useApp();

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [showSurveillanceDropdown, setShowSurveillanceDropdown] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>(getGeminiApiKey);
  const [keySaveSuccess, setKeySaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const roleRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const surveillanceRef = useRef<HTMLDivElement>(null);
  const geminiDrawerRef = useRef<HTMLElement>(null);

  // Detect scroll for sticky header transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setShowRoleDropdown(false);
      }
      if (alertRef.current && !alertRef.current.contains(event.target as Node)) {
        setShowAlertModal(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setShowThemeDropdown(false);
      }
      if (surveillanceRef.current && !surveillanceRef.current.contains(event.target as Node)) {
        setShowSurveillanceDropdown(false);
      }
      if (
        geminiDrawerRef.current &&
        !geminiDrawerRef.current.contains(event.target as Node)
      ) {
        const trigger =
          document.getElementById('btn-configure-gemini') ||
          document.getElementById('btn-setup-ai') ||
          document.getElementById('gemini-status-badge');
        if (!trigger || !trigger.contains(event.target as Node)) {
          setShowApiKeyModal(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      const csv = exportProjectsToCSV(projects);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `land_acquisition_data_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
    }, 300);
  };

  const handleSaveApiKey = () => {
    setGeminiApiKey(apiKeyInput);
    setKeySaveSuccess(true);
    setTimeout(() => {
      setKeySaveSuccess(false);
      setShowApiKeyModal(false);
    }, 1500);
  };

  return (
    <header
      id="app-header"
      className={`bg-[#0A2218] text-white border-b sticky top-0 z-40 transition-all duration-200 ease-in-out ${
        isScrolled ? 'shadow-md border-[#276449] bg-[#0A2218]/98 backdrop-blur-xs' : 'border-[#1C4332]'
      }`}
    >
      {/* Top Editorial Authority Strip */}
      <div className="border-b border-[#143325] bg-[#071911] px-4 sm:px-6 lg:px-8 py-1">
        <div className="max-w-[1536px] mx-auto flex items-center justify-between text-[10px] text-[#86A697] font-mono tracking-tight">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-[2px] bg-amber-400/20 text-amber-300 border border-amber-400/40 tracking-wider">
              SIH 2026 PROTOTYPE — DEMO DATA
            </span>
            <span className="text-[#C4D9CD] font-bold tracking-wider uppercase hidden sm:inline">
              Government of India &bull; Ministry of Rural Development
            </span>
            <span className="hidden md:inline text-[#476B5A]">|</span>
            <span className="hidden md:inline text-[#86A697]">
              Dept. of Land Resources (DoLR) &bull; Ref: RFCTLARR-MIS/2025/Q1
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Live Surveillance Node Control */}
            <div ref={surveillanceRef} className="relative">
              <button
                type="button"
                id="surveillance-node-btn"
                onClick={() => setShowSurveillanceDropdown(!showSurveillanceDropdown)}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border text-[10px] font-mono-data transition cursor-pointer select-none ${
                  isSurveillanceActive
                    ? 'bg-[#0E3A28] border-[#2E855A] text-[#D8ECE0] hover:bg-[#165039]'
                    : 'bg-[#3A220E] border-[#A85A1E] text-[#ECD8C4] hover:bg-[#4E3015]'
                }`}
                title="Real-Time SLA & Delay Surveillance Engine"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-[1px] ${
                    isSurveillanceActive ? 'bg-[#48BB78] animate-pulse' : 'bg-[#E53E3E]'
                  }`}
                />
                <span className="font-bold">
                  {isSurveillanceActive ? 'SURVEILLANCE NODE: ACTIVE' : 'SURVEILLANCE: PAUSED'}
                </span>
                <span className="text-[#86A697] hidden sm:inline">&bull; Sweep: {lastSurveillanceSweep}</span>
                <ChevronDown className="w-2.5 h-2.5 ml-0.5 opacity-70" />
              </button>

              {showSurveillanceDropdown && (
                <div className="absolute right-0 mt-1.5 w-80 bg-[#071911] border border-[#1C4332] rounded-[4px] p-3.5 z-50 text-[#FAFBF9] shadow-2xl animate-in fade-in zoom-in-95 font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-[#143325]">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#48BB78]" />
                      <span className="font-bold text-xs">Real-Time Surveillance Engine</span>
                    </div>
                    <span
                      className={`text-[9px] font-mono-data font-bold px-1.5 py-0.5 rounded-[2px] border ${
                        isSurveillanceActive
                          ? 'bg-[#0E3A28] text-[#48BB78] border-[#2E855A]'
                          : 'bg-[#3A220E] text-[#F6AD55] border-[#A85A1E]'
                      }`}
                    >
                      {isSurveillanceActive ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#A5C8B6] mt-2 leading-relaxed font-sans">
                    Surveillance node screens ongoing parcels continuously against RFCTLARR Section 11/19/23 deadlines, court stays, and DBT velocity.
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-[#143325] flex items-center justify-between">
                    <span className="text-[10px] text-[#86A697]">Surveillance Interval:</span>
                    <div className="flex items-center gap-1">
                      {[5, 15, 30].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setSurveillanceIntervalSeconds(sec)}
                          className={`px-2 py-0.5 text-[10px] font-mono-data rounded-[2px] border transition cursor-pointer ${
                            surveillanceIntervalSeconds === sec
                              ? 'bg-[#196842] text-white border-[#48BB78]'
                              : 'bg-[#05130D] text-[#86A697] border-[#1C4332] hover:text-white'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-[#143325]">
                    <button
                      type="button"
                      onClick={toggleSurveillance}
                      className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-[2px] text-xs font-semibold border transition cursor-pointer ${
                        isSurveillanceActive
                          ? 'bg-[#2D1515] hover:bg-[#3D1D1D] text-[#FC8181] border-[#742A2A]'
                          : 'bg-[#0E3A28] hover:bg-[#165039] text-[#48BB78] border-[#2E855A]'
                      }`}
                    >
                      {isSurveillanceActive ? (
                        <>
                          <Pause className="w-3 h-3" />
                          <span>Pause Node</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          <span>Resume Node</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        simulateFieldTelemetryEvent();
                        setShowSurveillanceDropdown(false);
                      }}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-[2px] text-xs font-semibold bg-[#0F3526] hover:bg-[#164734] text-[#D8ECE0] border border-[#276449] transition cursor-pointer"
                      title="Trigger an immediate simulated telemetry incident"
                    >
                      <Zap className="w-3 h-3 text-amber-300" />
                      <span>Simulate Event</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <span className="text-[#6D917F] text-[10px] font-mono-data hidden sm:inline">
              {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Bespoke Directorate Seal & Masthead Branding */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3.5 cursor-pointer select-none shrink-0"
          >
            {/* Custom Architectural Emblem Seal */}
            <div className="w-9 h-9 rounded-[4px] bg-[#0F3526] border border-[#276449] flex items-center justify-center text-[#D8ECE0] shrink-0 shadow-xs group-hover:border-[#48BB78] transition">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-[#E0EFE6]" stroke="none">
                {/* Geometric Ashoka / Directorate Shield Vector */}
                <path d="M12 2L4 5V11.5C4 16.5 7.4 21.1 12 22.5C16.6 21.1 20 16.5 20 11.5V5L12 2ZM12 4.2L18 6.5V11.5C18 15.3 15.5 18.9 12 20.2C8.5 18.9 6 15.3 6 11.5V6.5L12 4.2ZM12 7A4.5 4.5 0 1 0 12 16A4.5 4.5 0 0 0 12 7ZM12 8.8A2.7 2.7 0 1 1 12 14.2A2.7 2.7 0 0 1 12 8.8Z" />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-serif-heading text-lg sm:text-xl font-bold tracking-tight text-[#FAFBF9] leading-none">
                  Land Acquisition Delay Predictive System
                </span>
                <span className="font-mono-data text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase tracking-wider shrink-0">
                  SIH 2026 PROTOTYPE — DEMO DATA
                </span>
              </div>
              <p className="text-[11px] text-[#86A697] font-normal tracking-normal mt-0.5 hidden sm:block">
                RFCTLARR 2013 Statutory Milestone &amp; Delay Vector Early Warning
              </p>
            </div>
          </div>

          {/* Asymmetric Search Input with Clear Labeling */}
          <div className="flex-1 max-w-xs md:max-w-md lg:max-w-lg">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#86A697] pointer-events-none" />
              <input
                id="global-project-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search parcels, gazette ID, district, agency..."
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#071911] hover:bg-[#05130D] border border-[#1C4332] rounded-[4px] text-[#FAFBF9] placeholder-[#5C7D6E] focus:outline-none focus:border-[#48BB78] transition font-mono-data"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-[#86A697] hover:text-white transition"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Actions & Authority Controls */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* If Gemini is already configured: show compact status badge; else show setup button */}
            {hasGeminiApiKey() ? (
              <div
                id="gemini-status-badge"
                className="inline-flex items-center gap-2 bg-[#0A261A] border border-[#2E855A] rounded-[4px] px-2.5 py-1 text-xs font-mono-data text-[#D8ECE0]"
                title="Google Gemini 2.5 Flash Active & Connected"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#48BB78] shrink-0" />
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[10px] font-bold text-[#48BB78]">Gemini Connected</span>
                  <span className="text-[9px] text-[#86A697] mt-0.5">Model: Gemini 2.5 Flash</span>
                </div>
                <button
                  type="button"
                  id="btn-configure-gemini"
                  onClick={() => setShowApiKeyModal(!showApiKeyModal)}
                  className="ml-1 p-1 rounded hover:bg-[#165039] text-[#86A697] hover:text-white transition cursor-pointer"
                  title="Configure Gemini Settings (Slide-out drawer)"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                id="btn-setup-ai"
                type="button"
                onClick={() => setShowApiKeyModal(true)}
                title="Configure Google Gemini 2.5 Flash GenAI Model & API Key"
                className="inline-flex items-center gap-1.5 text-xs bg-[#0F3526] hover:bg-[#164734] active:scale-[0.98] text-[#E0EFE6] px-2.5 py-1.5 rounded-[4px] border border-[#276449] font-medium transition cursor-pointer font-mono-data"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Configure Gemini</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ring-2 ring-amber-400/30" />
              </button>
            )}

            {/* Quick Export CSV Button */}
            <button
              id="export-csv-btn"
              onClick={handleExportCSV}
              disabled={isExporting}
              title="Download Raw Land Acquisition Dataset (.csv)"
              className="hidden xl:inline-flex items-center gap-1.5 text-xs bg-[#0F3526] hover:bg-[#164734] active:scale-[0.98] text-[#E0EFE6] px-3 py-1.5 rounded-[4px] border border-[#276449] font-medium transition-all duration-200 ease-in-out cursor-pointer font-mono-data disabled:opacity-60"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 text-[#48BB78] animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#48BB78]" />
              )}
              <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>

            {/* Officer Profile & Authority Dropdown */}
            {isAuthenticated && currentUser ? (
              <div ref={roleRef} className="relative">
                <button
                  id="officer-profile-btn"
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="flex items-center gap-2 bg-[#0F3526] hover:bg-[#164734] border border-[#276449] text-[#FAFBF9] text-xs px-2.5 py-1.5 rounded-[4px] font-medium transition cursor-pointer"
                  title="Officer Jurisdiction & Statutory Authority"
                >
                  <div className="w-6 h-6 rounded-[2px] bg-[#196842] text-white font-bold text-[11px] font-mono-data flex items-center justify-center shrink-0 border border-[#2F855A]">
                    {currentUser.avatarInitials}
                  </div>
                  <div className="text-left hidden lg:block max-w-[140px] xl:max-w-[170px]">
                    <span className="text-[11px] font-bold text-[#FAFBF9] block truncate leading-tight">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-[#A5C8B6] block truncate font-mono-data leading-tight">
                      {currentUser.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-[#86A697] shrink-0" />
                </button>

                {/* Profile Popover */}
                {showRoleDropdown && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#071911] border border-[#1C4332] rounded-[4px] py-2 z-50 text-[#FAFBF9] animate-in fade-in zoom-in-95">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-[#143325] bg-[#05130D]">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-[2px] bg-[#196842] text-white font-bold text-sm font-mono-data flex items-center justify-center shrink-0 border border-[#2F855A]">
                          {currentUser.avatarInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#A5C8B6] bg-[#0F3526] px-2 py-0.5 rounded-[2px] border border-[#276449] font-mono-data inline-block">
                            {currentUser.role}
                          </span>
                          <h4 className="text-xs font-bold text-white mt-1 truncate">
                            {currentUser.name}
                          </h4>
                          <p className="text-[11px] text-[#C4D9CD] leading-snug">
                            {currentUser.designation}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-[#86A697] mt-1 font-mono-data">
                            <MapPin className="w-3 h-3 text-[#86A697] shrink-0" />
                            <span className="truncate">
                              {currentUser.state === 'All'
                                ? 'National Jurisdiction (7 States)'
                                : `${currentUser.state} (${currentUser.district})`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Statutory Authority */}
                    <div className="px-4 py-3 border-b border-[#143325]">
                      <span className="text-[10px] font-bold text-[#86A697] uppercase tracking-wider block mb-1.5 font-mono-data">
                        Statutory Powers &amp; Mandate:
                      </span>
                      <ul className="text-[11px] text-[#C4D9CD] space-y-1.5">
                        {currentUser.rulesSummary.slice(0, 3).map((rule, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#48BB78] shrink-0 mt-0.5" />
                            <span className="leading-tight">{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Quick Switch / Sign out */}
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => {
                          setShowRoleDropdown(false);
                          setShowAuthModal(true);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-[#A5C8B6] hover:text-white hover:bg-[#0F3526] rounded-[2px] transition flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Switch Administrative Cadre</span>
                        </span>
                        <span className="text-[10px] text-[#86A697] font-mono-data">4 Cadres</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowRoleDropdown(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-[#FC8181] hover:bg-[#2D1515] rounded-[2px] transition flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out Officer Session</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 bg-[#196842] hover:bg-[#228353] text-white text-xs px-3 py-1.5 rounded-[4px] font-semibold transition cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Officer Login</span>
              </button>
            )}

            {/* Statutory Alert Center Bell */}
            <div ref={alertRef} className="relative">
              <button
                id="alert-bell-btn"
                onClick={() => setShowAlertModal(!showAlertModal)}
                className="p-1.5 bg-[#0F3526] hover:bg-[#164734] border border-[#276449] rounded-[4px] text-[#D8ECE0] relative transition cursor-pointer"
                title="Statutory Alerts & Delay Warnings"
              >
                <Bell className="w-4 h-4" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#BA2D1D] text-white text-[9px] font-bold font-mono-data w-4 h-4 rounded-[2px] flex items-center justify-center border border-[#0A2218]">
                    {unreadAlertsCount}
                  </span>
                )}
              </button>

              {/* Alert Drawer Popover */}
              {showAlertModal && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#071911] border border-[#1C4332] rounded-[4px] py-2 z-50 text-[#FAFBF9] animate-in fade-in zoom-in-95">
                  <div className="px-3.5 py-2 border-b border-[#143325] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <ShieldAlert className="w-4 h-4 text-[#E53E3E]" />
                      <span>Section 25 Lapsing Warnings</span>
                    </div>
                    {unreadAlertsCount > 0 && (
                      <button
                        onClick={markAllAlertsRead}
                        className="text-[10px] text-[#A5C8B6] hover:text-white cursor-pointer font-mono-data"
                      >
                        Acknowledge All
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-[#143325]">
                    {alerts.slice(0, 6).map((alert) => (
                      <div
                        key={alert.id}
                        onClick={() => {
                          const proj = projects.find((p) => p.project_id === alert.project_id);
                          if (proj) {
                            setSelectedProject(proj);
                            setActiveTab('project_detail');
                            setShowAlertModal(false);
                          }
                        }}
                        className={`p-3 text-xs hover:bg-[#0F3526] transition cursor-pointer ${
                          !alert.is_read ? 'bg-[#0A2218]' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`font-mono-data text-[10px] font-bold px-1.5 py-0.2 rounded-[2px] border ${
                              alert.severity === 'Critical'
                                ? 'bg-[#2D1515] text-[#FC8181] border-[#742A2A]'
                                : 'bg-[#2D2315] text-[#F6AD55] border-[#7B4E18]'
                            }`}
                          >
                            {alert.severity}
                          </span>
                          <span className="text-[10px] text-[#86A697] font-mono-data">{alert.created_at}</span>
                        </div>
                        <p className="font-semibold text-[#FAFBF9] mt-1 line-clamp-1">{alert.project_name}</p>
                        <p className="text-[11px] text-[#86A697] mt-0.5 line-clamp-2">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* OPTION A: Right-Side Slide-Out AI Configuration Drawer (Non-blocking: GIS map & dashboard remain fully visible) */}
      {showApiKeyModal && (
        <aside
          id="gemini-config-drawer"
          ref={geminiDrawerRef}
          aria-label="Google Gemini GenAI Configuration"
          className="fixed top-0 right-0 h-screen w-80 sm:w-96 z-50 bg-[#071911]/98 border-l border-[#276449] shadow-2xl flex flex-col backdrop-blur-md animate-in slide-in-from-right duration-200 text-white font-sans"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#143325] bg-[#05130D]">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-400/10 rounded border border-amber-400/30 text-amber-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
                  AI Settings &amp; Configuration
                </h3>
                <p className="text-[10px] text-[#86A697] font-mono-data">
                  Model: gemini-2.5-flash &bull; @google/genai SDK
                </p>
              </div>
            </div>
            <button
              id="btn-close-gemini-drawer"
              onClick={() => setShowApiKeyModal(false)}
              className="text-[#86A697] hover:text-white p-1.5 rounded hover:bg-white/10 transition cursor-pointer"
              title="Close Drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs text-[#C4D9CD]">
            {/* Active Status Box */}
            <div className="p-3 bg-[#0A2218] rounded border border-[#1C4332] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Engine Status:</span>
                <span
                  className={`text-[10px] font-mono-data font-bold px-2 py-0.5 rounded border ${
                    hasGeminiApiKey()
                      ? 'bg-[#0E3A28] text-[#48BB78] border-[#2E855A]'
                      : 'bg-[#2D2315] text-[#F6AD55] border-[#7B4E18]'
                  }`}
                >
                  {hasGeminiApiKey() ? 'CONNECTED' : 'DEMO ENGINE'}
                </span>
              </div>
              <p className="text-[11px] text-[#86A697] leading-relaxed">
                {hasGeminiApiKey()
                  ? 'Google Gemini 2.5 Flash is connected and serving real-time AI briefings.'
                  : 'Built-in AI heuristic synthesis model is active for presentations.'}
              </p>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-[11px] font-semibold text-[#86A697] mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-300" />
                <span>Google Gemini API Key:</span>
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 text-xs bg-[#05130D] border border-[#1C4332] rounded text-white font-mono-data focus:border-[#48BB78] focus:outline-none"
              />
              <p className="text-[10px] text-[#86A697] mt-1 font-mono-data">
                Saved locally in browser localStorage (persists across reloads).
              </p>
            </div>

            {keySaveSuccess && (
              <div className="p-2.5 bg-[#0E3A28] border border-[#2E855A] rounded text-[#48BB78] text-xs flex items-center gap-2 font-mono-data">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>API Key configuration saved!</span>
              </div>
            )}

            {/* Information on non-blocking workflow */}
            <div className="p-3 bg-[#0A2218]/50 border border-[#143325] rounded text-[11px] text-[#86A697] space-y-1">
              <span className="font-semibold text-[#A5C8B6] block">Non-Blocking Workflow:</span>
              <p>
                The GIS Digital Risk Map, telemetry stream, and project inspection panels behind this drawer remain fully accessible and interactive.
              </p>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-3.5 border-t border-[#143325] bg-[#05130D] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setApiKeyInput('');
                setGeminiApiKey('');
                setKeySaveSuccess(true);
                setTimeout(() => setKeySaveSuccess(false), 1500);
              }}
              className="text-[11px] text-[#86A697] hover:text-white underline cursor-pointer"
            >
              Clear Key
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowApiKeyModal(false)}
                className="px-3 py-1.5 text-xs text-[#86A697] hover:text-white border border-[#1C4332] rounded cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-3.5 py-1.5 text-xs font-semibold bg-[#196842] hover:bg-[#228353] text-white rounded border border-[#2F855A] cursor-pointer shadow-sm font-mono-data"
              >
                Save Key
              </button>
            </div>
          </div>
        </aside>
      )}
    </header>
  );
};
