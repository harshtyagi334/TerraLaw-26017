import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, AppUser } from '../types';
import {
  Hexagon,
  Shield,
  Lock,
  Mail,
  User,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building2,
  Layers,
  Scale,
  Briefcase,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  FileText,
  MapPin,
  Cpu,
  BadgeCheck,
  TrendingUp,
  Activity,
  Check,
  KeyRound,
  Compass,
  FileSpreadsheet,
  HelpCircle,
  Clock,
  Target,
  ChevronRight,
  Map,
  BarChart3,
  Brain,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const {
    loginWithCredentials,
    loginAsPreset,
    signup,
    presetUsers,
    mlModel,
  } = useApp();

  // Active view inside the portal: 'login' | 'register' | 'cadre_matrix'
  const [activeView, setActiveView] = useState<'login' | 'register' | 'cadre_matrix'>('login');

  // Single Universal Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState(() =>
    Math.floor(1000 + Math.random() * 9000).toString()
  );
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showRoleOverride, setShowRoleOverride] = useState(false);
  const [manualRoleOverride, setManualRoleOverride] = useState<UserRole>('Central Admin');

  // New Officer Registration States
  const [regRole, setRegRole] = useState<UserRole>('District Admin');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regEmpId, setRegEmpId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regDesignation, setRegDesignation] = useState(
    'District Collector & District Magistrate (CALA)'
  );
  const [regDepartment, setRegDepartment] = useState('District Collectorate, Pune');
  const [regState, setRegState] = useState('Maharashtra');
  const [regDistrict, setRegDistrict] = useState('Pune');
  const [regAgreeTerms, setRegAgreeTerms] = useState(true);
  const [regError, setRegError] = useState<string | null>(null);

  const refreshCaptcha = () => {
    setCaptchaCode(Math.floor(1000 + Math.random() * 9000).toString());
    setCaptchaInput('');
  };

  // Real-time Designation and Cadre detection based on typed User ID / Email
  const getDetectedCadreInfo = (input: string): {
    role: UserRole;
    designation: string;
    department: string;
    jurisdiction: string;
    isExactMatch: boolean;
    matchedUser?: AppUser;
  } => {
    const trimmed = input.trim().toLowerCase();

    // 1. Check exact preset match
    const exact = presetUsers.find((u) => u.email.toLowerCase() === trimmed);
    if (exact) {
      return {
        role: exact.role,
        designation: exact.designation,
        department: exact.department,
        jurisdiction:
          exact.state === 'All'
            ? 'National Oversight (7 States)'
            : `${exact.state} (${exact.district})`,
        isExactMatch: true,
        matchedUser: exact,
      };
    }

    // 2. Intelligent heuristics by keywords or domain
    if (
      trimmed.includes('state') ||
      trimmed.includes('revenue') ||
      trimmed.includes('maha') ||
      trimmed.includes('gujarat') ||
      trimmed.includes('up') ||
      trimmed.includes('mp') ||
      trimmed.includes('tn') ||
      trimmed.includes('odisha') ||
      trimmed.includes('karnataka')
    ) {
      return {
        role: 'State Admin',
        designation: 'State Nodal Officer & Principal Secretary (Revenue)',
        department: 'Revenue & Forest Department, State Government',
        jurisdiction: 'Statewide Jurisdiction',
        isExactMatch: false,
      };
    }

    if (
      trimmed.includes('district') ||
      trimmed.includes('collector') ||
      trimmed.includes('cala') ||
      trimmed.includes('sdm') ||
      trimmed.includes('slao') ||
      trimmed.includes('dm') ||
      trimmed.includes('magistrate')
    ) {
      return {
        role: 'District Admin',
        designation: 'District Collector & District Magistrate (CALA)',
        department: 'District Revenue Administration / Collectorate',
        jurisdiction: 'District CALA Jurisdiction',
        isExactMatch: false,
      };
    }

    if (
      trimmed.includes('nhai') ||
      trimmed.includes('officer') ||
      trimmed.includes('rail') ||
      trimmed.includes('po') ||
      trimmed.includes('piu') ||
      trimmed.includes('field') ||
      trimmed.includes('morth')
    ) {
      return {
        role: 'Project Officer',
        designation: 'Senior Land Acquisition Officer & Implementing Executive',
        department: 'National Highways Authority of India (NHAI) / PIU',
        jurisdiction: 'Field Corridor & Project Packages',
        isExactMatch: false,
      };
    }

    // Default detection
    return {
      role: manualRoleOverride,
      designation:
        manualRoleOverride === 'Central Admin'
          ? 'Joint Secretary & Central Nodal Director'
          : manualRoleOverride === 'State Admin'
          ? 'State Nodal Officer & Principal Secretary (Revenue)'
          : manualRoleOverride === 'District Admin'
          ? 'District Collector & District Magistrate (CALA)'
          : 'Senior Land Acquisition Officer & Implementing Executive',
      department:
        manualRoleOverride === 'Central Admin'
          ? 'Department of Land Resources (DoLR), Ministry of Rural Development'
          : manualRoleOverride === 'State Admin'
          ? 'State Revenue & Forest Department'
          : manualRoleOverride === 'District Admin'
          ? 'District Collectorate'
          : 'National Highways Authority of India (NHAI)',
      jurisdiction:
        manualRoleOverride === 'Central Admin'
          ? 'National Portfolio'
          : manualRoleOverride === 'State Admin'
          ? 'Statewide'
          : 'District Scope',
      isExactMatch: false,
    };
  };

  const detectedInfo = getDetectedCadreInfo(loginEmail);

  // Single Unified Form Login Handler
  const handleUniversalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim()) {
      setLoginError('Please enter your official User ID or Email address.');
      return;
    }

    if (captchaInput.trim() !== captchaCode) {
      setLoginError('Invalid Security PIN code entered. Please re-enter the 4-digit code.');
      refreshCaptcha();
      return;
    }

    const roleToUse = showRoleOverride ? manualRoleOverride : detectedInfo.role;
    const success = loginWithCredentials(
      loginEmail,
      loginPassword,
      roleToUse,
      detectedInfo.designation,
      detectedInfo.department
    );

    if (!success) {
      setLoginError('Unable to authenticate credentials. Please check your credentials.');
    }
  };

  // Preset Fast Login
  const handleQuickPresetLogin = (role: UserRole) => {
    loginAsPreset(role);
  };

  // Officer Registration Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegError('All required fields must be filled.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Password and Confirmation Password do not match.');
      return;
    }

    if (!regAgreeTerms) {
      setRegError('You must acknowledge the compliance undertaking.');
      return;
    }

    signup({
      name: regName.trim(),
      email: regEmail.trim(),
      role: regRole,
      designation: regDesignation,
      department: regDepartment.trim(),
      state: regState,
      district: regDistrict,
      rulesSummary: [
        `Statutory operational authorization under ${regRole} jurisdiction`,
        'Mandated to review Section 25 lapsing risk early warnings',
        'Direct integration with RFCTLARR compliance and decision-support pipeline',
      ],
    });
  };

  return (
    <div className="min-h-screen bg-[#F6F6FB] text-[#1A1A2E] flex flex-col font-sans">
      {/* HEADER */}
      <header className="bg-[#111111] text-white border-b border-[#222]">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#6C63E0]/20 border border-[#6C63E0]/40 flex items-center justify-center shrink-0">
                <Hexagon className="w-5 h-5 text-[#B9B7FA]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    LANDINTEL
                  </h1>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  Land Acquisition Intelligence Platform
                </p>
              </div>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2 self-start md:self-center">
              <div className="px-3 py-1.5 bg-white/8 rounded-xl border border-white/15 text-left">
                <span className="text-[11px] text-white/70 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-[#B9B7FA]" />
                  ML-Powered Prediction Platform
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <div className="hero-gradient border-b border-[#E4E4F0]">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#6C63E0]/10 border border-[#6C63E0]/20 text-sm text-[#6C63E0] font-medium mb-5">
            <Activity className="w-4 h-4" />
            <span>Land Acquisition Intelligence</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A2E] tracking-tight leading-tight max-w-2xl mx-auto">
            Predict acquisition delays before they become project risks
          </h2>
          <p className="text-base text-[#64648C] mt-4 max-w-xl mx-auto leading-relaxed">
            Enter project and land information to estimate the potential risk of acquisition delays using machine learning.
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Quick actions & login */}
          <div className="lg:col-span-7 space-y-6">

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Project Analysis Card */}
              <div className="bg-white p-5 rounded-[10px] border border-[#E4E4F0] shadow-sm hover:border-[#6C63E0] transition group cursor-pointer"
                onClick={() => {
                  // Scroll to quick sign in
                  document.getElementById('quick-login-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <div className="w-10 h-10 rounded-lg bg-[#6C63E0]/10 flex items-center justify-center text-[#6C63E0] mb-3 group-hover:bg-[#6C63E0]/20 transition">
                  <Target className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-sm text-[#1A1A2E] mb-1">Project Analysis</h4>
                <p className="text-xs text-[#64648C] leading-relaxed">Enter project data and predict acquisition delay risk</p>
                <div className="flex items-center gap-1 text-xs text-[#6C63E0] font-medium mt-3">
                  <span>Analyze Project</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* GIS Explorer Card */}
              <div className="bg-white p-5 rounded-[10px] border border-[#E4E4F0] shadow-sm hover:border-[#6C63E0] transition group cursor-pointer"
                onClick={() => {
                  document.getElementById('quick-login-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <div className="w-10 h-10 rounded-lg bg-[#6C63E0]/10 flex items-center justify-center text-[#6C63E0] mb-3 group-hover:bg-[#6C63E0]/20 transition">
                  <Compass className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-sm text-[#1A1A2E] mb-1">GIS Explorer</h4>
                <p className="text-xs text-[#64648C] leading-relaxed">Explore land parcels geographically with risk overlays</p>
                <div className="flex items-center gap-1 text-xs text-[#6C63E0] font-medium mt-3">
                  <span>Open GIS Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Reports Card */}
              <div className="bg-white p-5 rounded-[10px] border border-[#E4E4F0] shadow-sm hover:border-[#6C63E0] transition group cursor-pointer"
                onClick={() => {
                  document.getElementById('quick-login-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <div className="w-10 h-10 rounded-lg bg-[#6C63E0]/10 flex items-center justify-center text-[#6C63E0] mb-3 group-hover:bg-[#6C63E0]/20 transition">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-sm text-[#1A1A2E] mb-1">Reports</h4>
                <p className="text-xs text-[#64648C] leading-relaxed">View previous assessments and generated reports</p>
                <div className="flex items-center gap-1 text-xs text-[#6C63E0] font-medium mt-3">
                  <span>View Reports</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Quick Login Directory */}
            <div id="quick-login-section" className="bg-white p-6 sm:p-7 rounded-[10px] border border-[#E4E4F0] shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#E4E4F0]">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#1A1A2E]">
                    Quick Sign In — Choose a Role
                  </h3>
                  <p className="text-sm text-[#64648C] mt-0.5">
                    Click any profile to sign in and access the platform:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {presetUsers.map((user) => {
                  const isCentral = user.role === 'Central Admin';
                  const isState = user.role === 'State Admin';
                  const isDistrict = user.role === 'District Admin';
                  const isOfficer = user.role === 'Project Officer';

                  return (
                    <div
                      key={user.id}
                      className="p-4 rounded-[10px] border border-[#E4E4F0] hover:border-[#6C63E0] bg-white hover:bg-[#F6F6FB] transition flex flex-col justify-between group"
                    >
                      <div>
                        {/* Top Badge & Initials */}
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center text-white shrink-0 ${
                                isCentral
                                  ? 'bg-[#6C63E0]'
                                  : isState
                                  ? 'bg-[#6C63E0]/80'
                                  : isDistrict
                                  ? 'bg-[#F59E0B]'
                                  : 'bg-[#64648C]'
                              }`}
                            >
                              {user.avatarInitials}
                            </div>
                            <div>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border inline-block ${
                                  isCentral
                                    ? 'bg-[#EDECFB] text-[#6C63E0] border-[#B9B7FA]/40'
                                    : isState
                                    ? 'bg-[#EDECFB] text-[#6C63E0] border-[#B9B7FA]/40'
                                    : isDistrict
                                    ? 'bg-[#FEF9E7] text-[#B45309] border-[#FCD34D]/40'
                                    : 'bg-[#F0F0F8] text-[#64648C] border-[#E4E4F0]'
                                }`}
                              >
                                {user.role}
                              </span>
                              <h4 className="font-bold text-xs text-[#1A1A2E] mt-0.5 truncate">
                                {user.name}
                              </h4>
                            </div>
                          </div>
                        </div>

                        {/* Designation & Department */}
                        <p className="text-[11px] text-[#64648C] font-medium leading-snug line-clamp-2">
                          {user.designation}
                        </p>
                        <p className="text-[10px] text-[#9494B8] mt-1 font-mono-data truncate">
                          {user.email}
                        </p>

                        {/* Jurisdiction tag */}
                        <div className="mt-2.5 pt-2 border-t border-[#E4E4F0] flex items-center justify-between text-[10px] text-[#64648C]">
                          <span>Scope:</span>
                          <span className="font-bold text-[#1A1A2E]">
                            {user.state === 'All' ? 'National (7 States)' : `${user.state} • ${user.district}`}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleQuickPresetLogin(user.role)}
                        className="mt-3.5 w-full py-2 px-3 bg-[#6C63E0] hover:bg-[#5B53CF] text-white text-xs font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>Sign In as {user.role.split(' ')[0]}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platform overview stats */}
            <div className="bg-white p-5 rounded-[10px] border border-[#E4E4F0] shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E4E4F0]">
                <span className="text-sm font-semibold text-[#1A1A2E]">Platform Overview</span>
                <span className="text-xs text-[#6C63E0] font-medium bg-[#EDECFB] px-2.5 py-0.5 rounded-full border border-[#B9B7FA]/30">Live</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-[#F6F6FB] rounded-lg">
                  <div className="text-xl font-bold text-[#1A1A2E]">700</div>
                  <div className="text-xs text-[#64648C] mt-0.5">Projects</div>
                </div>
                <div className="p-3 bg-[#F6F6FB] rounded-lg">
                  <div className="text-xl font-bold text-[#6C63E0]">
                    {(mlModel.roc_auc * (mlModel.roc_auc <= 1 ? 100 : 1)).toFixed(1)}%
                  </div>
                  <div className="text-xs text-[#64648C] mt-0.5">Model Accuracy</div>
                </div>
                <div className="p-3 bg-[#F6F6FB] rounded-lg">
                  <div className="text-xl font-bold text-[#F59E0B]">7 States</div>
                  <div className="text-xs text-[#64648C] mt-0.5">Coverage</div>
                </div>
                <div className="p-3 bg-[#F6F6FB] rounded-lg">
                  <div className="text-xl font-bold text-[#E5484D]">Early</div>
                  <div className="text-xs text-[#64648C] mt-0.5">Warning Alerts</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: LOGIN FORM */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-[10px] border border-[#E4E4F0] shadow-sm overflow-hidden sticky top-6">
              {/* Header */}
              <div className="p-6 bg-[#F6F6FB] border-b border-[#E4E4F0]">
                <h3 className="text-xl font-bold text-[#1A1A2E]">Sign In</h3>
                <p className="text-sm text-[#64648C] mt-1">
                  Enter your credentials to access the intelligence platform.
                </p>

                {/* Login / Register toggle */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-[#E4E4F0] rounded-xl mt-4 text-sm font-medium">
                  <button
                    onClick={() => setActiveView('login')}
                    className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeView === 'login'
                        ? 'bg-[#6C63E0] text-white font-semibold'
                        : 'text-[#64648C] hover:text-[#1A1A2E] hover:bg-white/60'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>

                  <button
                    onClick={() => setActiveView('register')}
                    className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeView === 'register'
                        ? 'bg-[#6C63E0] text-white font-semibold'
                        : 'text-[#64648C] hover:text-[#1A1A2E] hover:bg-white/60'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Register</span>
                  </button>
                </div>
              </div>

              {/* VIEW 1: UNIVERSAL SINGLE LOGIN FORM */}
              {activeView === 'login' && (
                <form onSubmit={handleUniversalLogin} className="p-5 sm:p-6 space-y-4">
                  {loginError && (
                    <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg text-xs text-[#E5484D] flex items-start gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>{loginError}</div>
                    </div>
                  )}

                  {/* 1. Official User ID / Email Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1A1A2E] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#64648C]" />
                        <span>User ID / Demo Email</span>
                      </span>
                      <span className="text-[10px] text-[#9494B8] font-mono-data">DEMO PROFILES</span>
                    </label>

                    <input
                      id="universal-login-email"
                      type="text"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. demo.central@example.org or demo.district@example.org"
                      className="w-full px-3 py-2.5 text-sm bg-white border border-[#E4E4F0] rounded-lg text-[#1A1A2E] placeholder-[#9494B8] focus:outline-none focus:border-[#6C63E0] transition"
                      required
                    />

                    {/* LIVE REAL-TIME CADRE AUTO-DETECTION PREVIEW CARD */}
                    {loginEmail.trim().length > 0 && (
                      <div className="p-2.5 bg-[#F6F6FB] border border-[#E4E4F0] rounded-lg text-xs space-y-1 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-[#9494B8]">
                            Auto-Resolved Role:
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              detectedInfo.role === 'Central Admin'
                                ? 'bg-[#EDECFB] text-[#6C63E0] border-[#B9B7FA]/40'
                                : detectedInfo.role === 'State Admin'
                                ? 'bg-[#EDECFB] text-[#6C63E0] border-[#B9B7FA]/40'
                                : detectedInfo.role === 'District Admin'
                                ? 'bg-[#FEF9E7] text-[#B45309] border-[#FCD34D]/40'
                                : 'bg-[#F0F0F8] text-[#64648C] border-[#E4E4F0]'
                            }`}
                          >
                            {detectedInfo.role}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-[#1A1A2E] truncate">
                          {detectedInfo.designation}
                        </div>
                        <div className="text-[10px] text-[#64648C] font-mono-data truncate">
                          Scope: {detectedInfo.jurisdiction}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Official Password Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1A1A2E] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-[#64648C]" />
                        <span>Password</span>
                      </span>
                      <span className="text-[10px] text-[#9494B8] font-mono-data">Demo PIN: admin123</span>
                    </label>

                    <div className="relative">
                      <input
                        id="universal-login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter password..."
                        className="w-full px-3 py-2.5 pr-9 text-sm bg-white border border-[#E4E4F0] rounded-lg text-[#1A1A2E] placeholder-[#9494B8] focus:outline-none focus:border-[#6C63E0] transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-[#9494B8] hover:text-[#1A1A2E] cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 3. Security PIN / Captcha Verification */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1A1A2E] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-[#64648C]" />
                        <span>Security PIN</span>
                      </span>
                    </label>

                    <div className="flex items-center gap-2">
                      <div className="bg-[#111111] text-white px-3 py-2 rounded-lg font-mono-data font-black text-sm tracking-widest select-none shrink-0">
                        {captchaCode}
                      </div>
                      <button
                        type="button"
                        onClick={refreshCaptcha}
                        className="p-2 border border-[#E4E4F0] rounded-lg hover:bg-[#F6F6FB] text-[#64648C] transition cursor-pointer"
                        title="Refresh Security PIN"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <input
                        id="universal-login-captcha"
                        type="text"
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        placeholder="Enter PIN..."
                        maxLength={4}
                        className="flex-1 px-3 py-2.5 text-sm bg-white border border-[#E4E4F0] rounded-lg text-[#1A1A2E] placeholder-[#9494B8] focus:outline-none focus:border-[#6C63E0] transition font-mono-data"
                        required
                      />
                    </div>
                  </div>

                  {/* Optional Manual Cadre Override */}
                  <div className="pt-2 border-t border-[#E4E4F0]">
                    <button
                      type="button"
                      onClick={() => setShowRoleOverride(!showRoleOverride)}
                      className="text-[11px] text-[#64648C] hover:text-[#1A1A2E] flex items-center justify-between w-full cursor-pointer"
                    >
                      <span>Need to manually select role?</span>
                      <span className="font-bold">{showRoleOverride ? '[-]' : '[+]'}</span>
                    </button>

                    {showRoleOverride && (
                      <div className="mt-2 p-2.5 bg-[#F6F6FB] border border-[#E4E4F0] rounded-lg space-y-1.5 animate-in fade-in text-xs">
                        <label className="text-[10px] font-bold text-[#64648C] uppercase block">
                          Select Administrative Role:
                        </label>
                        <select
                          value={manualRoleOverride}
                          onChange={(e) => setManualRoleOverride(e.target.value as UserRole)}
                          className="w-full bg-white border border-[#E4E4F0] rounded-lg px-2 py-1.5 text-xs text-[#1A1A2E] focus:outline-none"
                        >
                          <option value="Central Admin">Central Admin (National Directorate)</option>
                          <option value="State Admin">State Admin (State Revenue)</option>
                          <option value="District Admin">District Admin / CALA (Collectorate)</option>
                          <option value="Project Officer">Project Officer (NHAI & Implementing Agency)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* 4. Primary Submit Action */}
                  <button
                    id="universal-login-submit-btn"
                    type="submit"
                    className="w-full py-3 px-4 bg-[#6C63E0] hover:bg-[#5B53CF] text-white font-semibold text-sm rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Sign In &amp; Open Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-xs text-[#9494B8] text-center pt-1">
                    Opens your role-specific intelligence dashboard
                  </div>
                </form>
              )}

              {/* VIEW 2: NEW OFFICER REGISTRATION FORM */}
              {activeView === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="p-5 sm:p-6 space-y-3.5 text-xs">
                  {regError && (
                    <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg text-xs text-[#E5484D] flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>{regError}</div>
                    </div>
                  )}

                  {/* Cadre Role */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#1A1A2E]">Administrative Level *</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full bg-white border border-[#E4E4F0] rounded-lg px-2.5 py-2 text-xs text-[#1A1A2E] focus:outline-none focus:border-[#6C63E0]"
                    >
                      <option value="District Admin">District Admin / CALA</option>
                      <option value="State Admin">State Admin</option>
                      <option value="Central Admin">Central Admin</option>
                      <option value="Project Officer">Project Officer</option>
                    </select>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#1A1A2E]">Full Name *</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Demo Officer"
                      className="w-full px-2.5 py-2 bg-white border border-[#E4E4F0] rounded-lg text-[#1A1A2E] text-xs focus:outline-none focus:border-[#6C63E0]"
                      required
                    />
                  </div>

                  {/* Email & Employee ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-[#1A1A2E]">Email *</label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="demo.officer@example.org"
                        className="w-full px-2.5 py-2 bg-white border border-[#E4E4F0] rounded-lg text-[#1A1A2E] text-xs font-mono-data focus:outline-none focus:border-[#6C63E0]"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[#1A1A2E]">Employee ID</label>
                      <input
                        type="text"
                        value={regEmpId}
                        onChange={(e) => setRegEmpId(e.target.value)}
                        placeholder="DEMO/MH/2026/01"
                        className="w-full px-2.5 py-2 bg-white border border-[#E4E4F0] rounded-lg text-[#1A1A2E] text-xs font-mono-data focus:outline-none focus:border-[#6C63E0]"
                      />
                    </div>
                  </div>

                  {/* State & District */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-[#1A1A2E]">State</label>
                      <select
                        value={regState}
                        onChange={(e) => setRegState(e.target.value)}
                        className="w-full bg-white border border-[#E4E4F0] rounded-lg px-2.5 py-2 text-xs text-[#1A1A2E] focus:outline-none focus:border-[#6C63E0]"
                      >
                        <option value="All">All States (Central)</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Odisha">Odisha</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-[#1A1A2E]">District</label>
                      <input
                        type="text"
                        value={regDistrict}
                        onChange={(e) => setRegDistrict(e.target.value)}
                        placeholder="e.g. Pune, Nagpur, Thane"
                        className="w-full px-2.5 py-2 bg-white border border-[#E4E4F0] rounded-lg text-[#1A1A2E] text-xs focus:outline-none focus:border-[#6C63E0]"
                      />
                    </div>
                  </div>

                  {/* Password & Confirm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-[#1A1A2E]">Create Password *</label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-2.5 py-2 bg-white border border-[#E4E4F0] rounded-lg text-[#1A1A2E] text-xs focus:outline-none focus:border-[#6C63E0]"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[#1A1A2E]">Confirm Password *</label>
                      <input
                        type="password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-2.5 py-2 bg-white border border-[#E4E4F0] rounded-lg text-[#1A1A2E] text-xs focus:outline-none focus:border-[#6C63E0]"
                        required
                      />
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <label className="flex items-start gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={regAgreeTerms}
                      onChange={(e) => setRegAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded border-[#E4E4F0] text-[#6C63E0] focus:ring-0"
                    />
                    <span className="text-[10px] text-[#64648C] leading-snug">
                      I acknowledge official authorization and undertake confidentiality under the RFCTLARR Act, 2013 and IT Act 2000.
                    </span>
                  </label>

                  {/* Register Submit */}
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-[#6C63E0] hover:bg-[#5B53CF] text-white font-semibold text-sm rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <User className="w-4 h-4" />
                    <span>Register &amp; Open Dashboard</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* PORTAL CAPABILITIES SECTION */}
        <section className="mt-12 pt-8 border-t border-[#E4E4F0]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A2E]">
                Platform Capabilities
              </h3>
              <p className="text-sm text-[#64648C] mt-1">Core features for land acquisition intelligence</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-[10px] border border-[#E4E4F0] shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#E5484D]/10 flex items-center justify-center text-[#E5484D]">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#1A1A2E]">
                Delay Risk Prediction
              </h4>
              <p className="text-sm text-[#64648C] leading-relaxed">
                ML-powered risk scoring predicts potential acquisition delays with explainable risk factors and confidence metrics.
              </p>
            </div>

            <div className="p-5 bg-white rounded-[10px] border border-[#E4E4F0] shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#6C63E0]/10 flex items-center justify-center text-[#6C63E0]">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#1A1A2E]">
                Explainable AI Analysis
              </h4>
              <p className="text-sm text-[#64648C] leading-relaxed">
                SHAP-based feature importance explains exactly why a project is at risk — not just a score, but actionable insight.
              </p>
            </div>

            <div className="p-5 bg-white rounded-[10px] border border-[#E4E4F0] shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B]">
                <Compass className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#1A1A2E]">
                GIS Parcel Explorer
              </h4>
              <p className="text-sm text-[#64648C] leading-relaxed">
                Geospatial visualization of land parcels with risk overlays, infrastructure layers, and acquisition boundaries.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-12 border-t border-[#E4E4F0] bg-white text-xs text-[#64648C] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1536px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1A1A2E]">LANDINTEL</span>
            <span>&bull;</span>
            <span>Land Acquisition Intelligence Platform</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[#9494B8]">
            <span>ML-Powered Prediction</span>
            <span>&bull;</span>
            <span>SHAP Explainability</span>
            <span>&bull;</span>
            <span>GIS Intelligence</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
