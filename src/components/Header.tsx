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
      className={`bg-[#1A5C3C] text-white border-b sticky top-0 z-40 transition-all duration-200 ease-in-out ${
        isScrolled ? 'shadow-lg border-[#2E7A55] bg-[#1A5C3C]/98 backdrop-blur-sm' : 'border-[#2E7A55]'
      }`}
    >
      {/* Main Header Bar */}
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Portal Logo & Title */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer select-none shrink-0"
          >
            {/* Emblem */}
            <div className="w-9 h-9 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center text-white shrink-0 hover:bg-white/20 transition">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" stroke="none">
                <path d="M12 2L4 5V11.5C4 16.5 7.4 21.1 12 22.5C16.6 21.1 20 16.5 20 11.5V5L12 2ZM12 4.2L18 6.5V11.5C18 15.3 15.5 18.9 12 20.2C8.5 18.9 6 15.3 6 11.5V6.5L12 4.2ZM12 7A4.5 4.5 0 1 0 12 16A4.5 4.5 0 0 0 12 7ZM12 8.8A2.7 2.7 0 1 1 12 14.2A2.7 2.7 0 0 1 12 8.8Z" />
              </svg>
            </div>

            <div>
              <span className="font-serif-heading text-base sm:text-lg font-bold tracking-tight text-white leading-tight block">
                Land Acquisition Portal
              </span>
              <p className="text-[11px] text-white/60 font-normal mt-0.5 hidden sm:block">
                Ministry of Rural Development · Dept. of Land Resources
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xs md:max-w-md lg:max-w-lg">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-white/50 pointer-events-none" />
              <input
                id="global-project-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, district, state..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition"
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
                className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white/90"
                title="Google Gemini 2.5 Flash Active & Connected"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
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
                className="inline-flex items-center gap-1.5 text-sm bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white px-3 py-1.5 rounded-lg border border-white/20 font-medium transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">Setup AI</span>
              </button>
            )}

            {/* Quick Export CSV Button */}
            <button
              id="export-csv-btn"
              onClick={handleExportCSV}
              disabled={isExporting}
              title="Download Dataset (.csv)"
              className="hidden xl:inline-flex items-center gap-1.5 text-sm bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white px-3 py-1.5 rounded-lg border border-white/20 font-medium transition-all duration-200 ease-in-out cursor-pointer disabled:opacity-60"
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
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer"
                  title="Your profile & settings"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-400/30 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {currentUser.avatarInitials}
                  </div>
                  <div className="text-left hidden lg:block max-w-[140px]">
                    <span className="text-xs font-semibold text-white block truncate leading-tight">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-white/60 block truncate leading-tight">
                      {currentUser.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-white/60 shrink-0" />
                </button>

                {/* Profile Popover */}
                {showRoleDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E4E8E2] rounded-xl shadow-xl py-2 z-50 text-[#1A2520] animate-in fade-in zoom-in-95">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-[#EEF1EC]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1A5C3C] text-white font-bold text-sm flex items-center justify-center shrink-0">
                          {currentUser.avatarInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1A2520] truncate">{currentUser.name}</p>
                          <p className="text-xs text-[#52605A] truncate">{currentUser.role}</p>
                          <div className="flex items-center gap-1 text-xs text-[#7A8780] mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {currentUser.state === 'All' ? 'National (All States)' : `${currentUser.state}, ${currentUser.district}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Surveillance control — moved here from top strip */}
                    <div ref={surveillanceRef} className="px-4 py-3 border-b border-[#EEF1EC]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-[#1A5C3C]" />
                          <span className="text-xs font-semibold text-[#1A2520]">Monitoring</span>
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
                        <span className="text-[10px] text-[#7A8780]">Sweep interval:</span>
                        <div className="flex gap-1">
                          {[5, 15, 30].map((sec) => (
                            <button key={sec} type="button" onClick={() => setSurveillanceIntervalSeconds(sec)}
                              className={`px-2 py-0.5 text-[10px] rounded border transition cursor-pointer ${
                                surveillanceIntervalSeconds === sec ? 'bg-[#1A5C3C] text-white border-[#1A5C3C]' : 'bg-white text-[#52605A] border-[#E4E8E2] hover:border-[#1A5C3C]'
                              }`}>{sec}s</button>
                          ))}
                        </div>
                      </div>
                      <button type="button" onClick={() => { simulateFieldTelemetryEvent(); setShowRoleDropdown(false); }}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium bg-[#F5F6F3] hover:bg-[#EEF1EC] text-[#52605A] border border-[#E4E8E2] rounded-lg transition cursor-pointer">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Simulate Telemetry Event
                      </button>
                    </div>

                    {/* Permissions */}
                    <div className="px-4 py-3 border-b border-[#EEF1EC]">
                      <p className="text-[10px] font-semibold text-[#7A8780] uppercase tracking-wide mb-2">Permissions</p>
                      <ul className="space-y-1.5">
                        {currentUser.rulesSummary.slice(0, 3).map((rule, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#1A5C3C] shrink-0 mt-0.5" />
                            <span className="text-xs text-[#52605A] leading-tight">{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => { setShowRoleDropdown(false); setShowAuthModal(true); }}
                        className="w-full text-left px-3 py-2 text-sm text-[#52605A] hover:text-[#1A2520] hover:bg-[#F5F6F3] rounded-lg transition flex items-center gap-2 cursor-pointer"
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
                className="flex items-center gap-1.5 bg-white text-[#1A5C3C] text-sm px-4 py-1.5 rounded-lg font-semibold transition hover:bg-white/90 cursor-pointer"
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
                className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white relative transition cursor-pointer"
                title="Alerts & Warnings"
              >
                <Bell className="w-4 h-4" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadAlertsCount}
                  </span>
                )}
              </button>

              {/* Alert Dropdown */}
              {showAlertModal && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E4E8E2] rounded-xl shadow-xl py-2 z-50 text-[#1A2520] animate-in fade-in zoom-in-95">
                  <div className="px-4 py-3 border-b border-[#EEF1EC] flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-sm text-[#1A2520]">
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                      <span>Alerts & Warnings</span>
                    </div>
                    {unreadAlertsCount > 0 && (
                      <button
                        onClick={markAllAlertsRead}
                        className="text-xs text-[#1A5C3C] hover:text-[#0f4029] cursor-pointer font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-[#EEF1EC]">
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
                        className={`p-3.5 text-xs hover:bg-[#F5F6F3] transition cursor-pointer ${
                          !alert.is_read ? 'bg-[#F8FBF9]' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            alert.severity === 'Critical'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>{alert.severity}</span>
                          <span className="text-[10px] text-[#7A8780]">{alert.created_at}</span>
                        </div>
                        <p className="font-semibold text-[#1A2520] mt-1.5 line-clamp-1">{alert.project_name}</p>
                        <p className="text-[11px] text-[#52605A] mt-0.5 line-clamp-2">{alert.message}</p>
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
          className="fixed top-0 right-0 h-screen w-80 sm:w-96 z-50 bg-white border-l border-[#E4E8E2] shadow-2xl flex flex-col backdrop-blur-md animate-in slide-in-from-right duration-200 text-[#1A2520] font-sans"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF1EC]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1A2520]">AI Settings</h3>
                <p className="text-xs text-[#7A8780]">Google Gemini 2.5 Flash</p>
              </div>
            </div>
            <button
              id="btn-close-gemini-drawer"
              onClick={() => setShowApiKeyModal(false)}
              className="text-[#7A8780] hover:text-[#1A2520] p-1.5 rounded-lg hover:bg-[#F5F6F3] transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Status */}
            <div className="p-3.5 bg-[#F5F6F3] rounded-xl border border-[#E4E8E2]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#1A2520]">Status</span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  hasGeminiApiKey()
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {hasGeminiApiKey() ? 'Connected' : 'Not configured'}
                </span>
              </div>
              <p className="text-xs text-[#52605A] mt-2 leading-relaxed">
                {hasGeminiApiKey()
                  ? 'Gemini AI is connected and serving real-time analysis.'
                  : 'Add your API key to enable AI-powered insights and briefings.'}
              </p>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-xs font-semibold text-[#1A2520] mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#52605A]" />
                <span>Google Gemini API Key</span>
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 text-sm bg-white border border-[#E4E8E2] rounded-lg text-[#1A2520] focus:border-[#1A5C3C] focus:outline-none transition"
              />
              <p className="text-xs text-[#7A8780] mt-1">Saved locally in your browser.</p>
            </div>

            {keySaveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>API key saved!</span>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-[#EEF1EC] flex items-center justify-between gap-2">
            <button type="button"
              onClick={() => { setApiKeyInput(''); setGeminiApiKey(''); setKeySaveSuccess(true); setTimeout(() => setKeySaveSuccess(false), 1500); }}
              className="text-xs text-[#7A8780] hover:text-[#1A2520] underline cursor-pointer">
              Clear Key
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowApiKeyModal(false)}
                className="px-4 py-2 text-sm text-[#52605A] hover:text-[#1A2520] border border-[#E4E8E2] rounded-lg cursor-pointer hover:bg-[#F5F6F3] transition">
                Cancel
              </button>
              <button type="button" onClick={handleSaveApiKey}
                className="px-4 py-2 text-sm font-semibold bg-[#1A5C3C] hover:bg-[#165035] text-white rounded-lg cursor-pointer transition">
                Save Key
              </button>
            </div>
          </div>
        </aside>
      )}
    </header>
  );
};
