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
  Hexagon,
  Settings,
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
      link.setAttribute('download', `landintel_export_${new Date().toISOString().split('T')[0]}.csv`);
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
      className={`bg-[#111111] text-white border-b sticky top-0 z-40 transition-all duration-200 ease-in-out ${
        isScrolled ? 'shadow-lg border-[#222] bg-[#111111]/98 backdrop-blur-sm' : 'border-[#222]'
      }`}
    >
      {/* Main Header Bar */}
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* LANDINTEL Logo & Title */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer select-none shrink-0"
          >
            {/* Hexagon Emblem */}
            <div className="w-9 h-9 rounded-lg bg-[#6C63E0]/20 border border-[#6C63E0]/40 flex items-center justify-center text-[#B9B7FA] shrink-0 hover:bg-[#6C63E0]/30 transition">
              <Hexagon className="w-5 h-5" />
            </div>

            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight block">
                LANDINTEL
              </span>
              <p className="text-[11px] text-white/50 font-normal mt-0.5 hidden sm:block">
                Land Acquisition Intelligence
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xs md:max-w-md lg:max-w-lg">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-white/40 pointer-events-none" />
              <input
                id="global-project-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, parcels, districts..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-white/8 hover:bg-white/12 border border-white/15 rounded-lg text-white placeholder-white/35 focus:outline-none focus:border-[#6C63E0]/60 focus:bg-white/12 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-white/50 hover:text-white transition"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Gemini AI Button */}
            {hasGeminiApiKey() ? (
              <div
                id="gemini-status-badge"
                className="inline-flex items-center gap-1.5 bg-white/8 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white/90"
                title="Google Gemini 2.5 Flash Active & Connected"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                <span className="font-medium hidden sm:inline">AI Active</span>
                <button
                  type="button"
                  id="btn-configure-gemini"
                  onClick={() => setShowApiKeyModal(!showApiKeyModal)}
                  className="ml-0.5 p-0.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
                  title="Configure Gemini Settings"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                id="btn-setup-ai"
                type="button"
                onClick={() => setShowApiKeyModal(true)}
                title="Configure Google Gemini AI"
                className="inline-flex items-center gap-1.5 text-sm bg-white/8 hover:bg-white/15 active:scale-[0.98] text-white px-3 py-1.5 rounded-lg border border-white/15 font-medium transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#B9B7FA]" />
                <span className="hidden sm:inline">Setup AI</span>
              </button>
            )}

            {/* Quick Export CSV Button */}
            <button
              id="export-csv-btn"
              onClick={handleExportCSV}
              disabled={isExporting}
              title="Download Dataset (.csv)"
              className="hidden xl:inline-flex items-center gap-1.5 text-sm bg-white/8 hover:bg-white/15 active:scale-[0.98] text-white px-3 py-1.5 rounded-lg border border-white/15 font-medium transition-all duration-200 ease-in-out cursor-pointer disabled:opacity-60"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </button>

            {/* User Profile Dropdown */}
            {isAuthenticated && currentUser ? (
              <div ref={roleRef} className="relative">
                <button
                  id="officer-profile-btn"
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="flex items-center gap-2 bg-white/8 hover:bg-white/15 border border-white/15 text-white text-sm px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer"
                  title="Your profile & settings"
                >
                  <div className="w-7 h-7 rounded-full bg-[#6C63E0]/30 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {currentUser.avatarInitials}
                  </div>
                  <div className="text-left hidden lg:block max-w-[140px]">
                    <span className="text-xs font-semibold text-white block truncate leading-tight">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-white/50 block truncate leading-tight">
                      {currentUser.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-white/50 shrink-0" />
                </button>

                {/* Profile Popover */}
                {showRoleDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E4E4F0] rounded-xl shadow-xl py-2 z-50 text-[#1A1A2E] animate-in fade-in zoom-in-95">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-[#E4E4F0]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#6C63E0] text-white font-bold text-sm flex items-center justify-center shrink-0">
                          {currentUser.avatarInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1A1A2E] truncate">{currentUser.name}</p>
                          <p className="text-xs text-[#64648C] truncate">{currentUser.role}</p>
                          <div className="flex items-center gap-1 text-xs text-[#9494B8] mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {currentUser.state === 'All' ? 'National (All States)' : `${currentUser.state}, ${currentUser.district}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Surveillance control */}
                    <div ref={surveillanceRef} className="px-4 py-3 border-b border-[#E4E4F0]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-[#6C63E0]" />
                          <span className="text-xs font-semibold text-[#1A1A2E]">Monitoring</span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            isSurveillanceActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isSurveillanceActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                            {isSurveillanceActive ? 'Active' : 'Paused'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={toggleSurveillance}
                          className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                            isSurveillanceActive
                              ? 'bg-[#FEF2F2] text-red-600 border-red-200 hover:bg-red-50'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {isSurveillanceActive ? 'Pause' : 'Resume'}
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-[#9494B8]">Sweep interval:</span>
                        <div className="flex gap-1">
                          {[5, 15, 30].map((sec) => (
                            <button key={sec} type="button" onClick={() => setSurveillanceIntervalSeconds(sec)}
                              className={`px-2 py-0.5 text-[10px] rounded border transition cursor-pointer ${
                                surveillanceIntervalSeconds === sec ? 'bg-[#6C63E0] text-white border-[#6C63E0]' : 'bg-white text-[#64648C] border-[#E4E4F0] hover:border-[#6C63E0]'
                              }`}>{sec}s</button>
                          ))}
                        </div>
                      </div>
                      <button type="button" onClick={() => { simulateFieldTelemetryEvent(); setShowRoleDropdown(false); }}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium bg-[#F6F6FB] hover:bg-[#EDECFB] text-[#64648C] border border-[#E4E4F0] rounded-lg transition cursor-pointer">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Simulate Telemetry Event
                      </button>
                    </div>

                    {/* Permissions */}
                    <div className="px-4 py-3 border-b border-[#E4E4F0]">
                      <p className="text-[10px] font-semibold text-[#9494B8] uppercase tracking-wide mb-2">Permissions</p>
                      <ul className="space-y-1.5">
                        {currentUser.rulesSummary.slice(0, 3).map((rule, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#6C63E0] shrink-0 mt-0.5" />
                            <span className="text-xs text-[#64648C] leading-tight">{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => { setShowRoleDropdown(false); setShowAuthModal(true); }}
                        className="w-full text-left px-3 py-2 text-sm text-[#64648C] hover:text-[#1A1A2E] hover:bg-[#F6F6FB] rounded-lg transition flex items-center gap-2 cursor-pointer"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span>Switch Role</span>
                      </button>
                      <button
                        onClick={() => { setShowRoleDropdown(false); logout(); }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 bg-[#6C63E0] text-white text-sm px-4 py-1.5 rounded-lg font-semibold transition hover:bg-[#5B53CF] cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}

            {/* Alerts Bell */}
            <div ref={alertRef} className="relative">
              <button
                id="alert-bell-btn"
                onClick={() => setShowAlertModal(!showAlertModal)}
                className="p-2 bg-white/8 hover:bg-white/15 border border-white/15 rounded-lg text-white relative transition cursor-pointer"
                title="Alerts & Warnings"
              >
                <Bell className="w-4 h-4" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#E5484D] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadAlertsCount}
                  </span>
                )}
              </button>

              {/* Alert Dropdown */}
              {showAlertModal && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E4E4F0] rounded-xl shadow-xl py-2 z-50 text-[#1A1A2E] animate-in fade-in zoom-in-95">
                  <div className="px-4 py-3 border-b border-[#E4E4F0] flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-sm text-[#1A1A2E]">
                      <ShieldAlert className="w-4 h-4 text-[#E5484D]" />
                      <span>Alerts & Warnings</span>
                    </div>
                    {unreadAlertsCount > 0 && (
                      <button
                        onClick={markAllAlertsRead}
                        className="text-xs text-[#6C63E0] hover:text-[#5B53CF] cursor-pointer font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-[#E4E4F0]">
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
                        className={`p-3.5 text-xs hover:bg-[#F6F6FB] transition cursor-pointer ${
                          !alert.is_read ? 'bg-[#F6F6FB]/60' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            alert.severity === 'Critical'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>{alert.severity}</span>
                          <span className="text-[10px] text-[#9494B8]">{alert.created_at}</span>
                        </div>
                        <p className="font-semibold text-[#1A1A2E] mt-1.5 line-clamp-1">{alert.project_name}</p>
                        <p className="text-[11px] text-[#64648C] mt-0.5 line-clamp-2">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Configuration Drawer (non-blocking slide-out) */}
      {showApiKeyModal && (
        <aside
          id="gemini-config-drawer"
          ref={geminiDrawerRef}
          aria-label="AI Configuration"
          className="fixed top-0 right-0 h-screen w-80 sm:w-96 z-50 bg-white border-l border-[#E4E4F0] shadow-2xl flex flex-col backdrop-blur-md animate-in slide-in-from-right duration-200 text-[#1A1A2E] font-sans"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E4F0]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#EDECFB] rounded-lg border border-[#B9B7FA]/40">
                <Sparkles className="w-4 h-4 text-[#6C63E0]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1A1A2E]">AI Settings</h3>
                <p className="text-xs text-[#9494B8]">Google Gemini 2.5 Flash</p>
              </div>
            </div>
            <button
              id="btn-close-gemini-drawer"
              onClick={() => setShowApiKeyModal(false)}
              className="text-[#9494B8] hover:text-[#1A1A2E] p-1.5 rounded-lg hover:bg-[#F6F6FB] transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Status */}
            <div className="p-3.5 bg-[#F6F6FB] rounded-xl border border-[#E4E4F0]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#1A1A2E]">Status</span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  hasGeminiApiKey()
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {hasGeminiApiKey() ? 'Connected' : 'Not configured'}
                </span>
              </div>
              <p className="text-xs text-[#64648C] mt-2 leading-relaxed">
                {hasGeminiApiKey()
                  ? 'Gemini AI is connected and serving real-time analysis.'
                  : 'Add your API key to enable AI-powered insights and briefings.'}
              </p>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#64648C]" />
                <span>Google Gemini API Key</span>
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 text-sm bg-white border border-[#E4E4F0] rounded-lg text-[#1A1A2E] focus:border-[#6C63E0] focus:outline-none transition"
              />
              <p className="text-xs text-[#9494B8] mt-1">Saved locally in your browser.</p>
            </div>

            {keySaveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>API key saved!</span>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-[#E4E4F0] flex items-center justify-between gap-2">
            <button type="button"
              onClick={() => { setApiKeyInput(''); setGeminiApiKey(''); setKeySaveSuccess(true); setTimeout(() => setKeySaveSuccess(false), 1500); }}
              className="text-xs text-[#9494B8] hover:text-[#1A1A2E] underline cursor-pointer">
              Clear Key
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowApiKeyModal(false)}
                className="px-4 py-2 text-sm text-[#64648C] hover:text-[#1A1A2E] border border-[#E4E4F0] rounded-lg cursor-pointer hover:bg-[#F6F6FB] transition">
                Cancel
              </button>
              <button type="button" onClick={handleSaveApiKey}
                className="px-4 py-2 text-sm font-semibold bg-[#6C63E0] hover:bg-[#5B53CF] text-white rounded-lg cursor-pointer transition">
                Save Key
              </button>
            </div>
          </div>
        </aside>
      )}
    </header>
  );
};
