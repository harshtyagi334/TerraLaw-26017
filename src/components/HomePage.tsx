import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, AppUser } from '../types';
import {
  Landmark,
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
      setLoginError('Please enter your official Government User ID or Email address.');
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
      setLoginError('Unable to authenticate official credentials. Please check your credentials.');
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
      setRegError('All required officer identity fields must be filled.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Password and Confirmation Password do not match.');
      return;
    }

    if (!regAgreeTerms) {
      setRegError('You must acknowledge the Official Secrets & RFCTLARR compliance undertaking.');
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
    <div className="min-h-screen bg-[#F4F5F0] text-[#141E1A] flex flex-col font-sans">
      {/* 1. TOP OFFICIAL GOVERNMENT OF INDIA IDENTITY STRIP */}
      <header className="bg-[#0A2218] text-white border-b border-[#1C4332]">
        <div className="border-b border-[#143325] bg-[#071911] px-4 sm:px-6 lg:px-8 py-1.5">
          <div className="max-w-[1536px] mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#86A697] font-mono-data gap-1 sm:gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-[#C4D9CD] font-bold tracking-wider uppercase">
                भारत सरकार &bull; Government of India
              </span>
              <span className="text-[#476B5A]">|</span>
              <span className="text-[#A5C8B6]">
                Ministry of Rural Development &bull; Department of Land Resources (DoLR)
              </span>
            </div>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-[2px] bg-amber-400/20 text-amber-300 border border-amber-400/40 tracking-wider">
                SIH 2026 PROTOTYPE — DEMO DATA
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#A5C8B6]">
                <span className="w-1.5 h-1.5 bg-[#48BB78] rounded-[1px] animate-pulse"></span>
                PROTOTYPE SANDBOX NODE ONLINE
              </span>
              <span className="hidden md:inline text-[#6D917F]">
                Prototype Ref: SIH-2026-DEMO/v2.0.0 (Real Trained Ensemble)
              </span>
            </div>
          </div>
        </div>

        {/* Main Banner Masthead */}
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Emblem & Portal Title */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-[4px] bg-[#0F3526] border border-[#276449] flex items-center justify-center text-[#D8ECE0] shrink-0 shadow-sm">
                <Landmark className="w-6 h-6 text-[#A5C8B6]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-data text-[10px] font-bold text-amber-300 uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded-[2px] border border-amber-500/40">
                    SIH 2026 PROTOTYPE — DEMO DATA
                  </span>
                  <span className="hidden sm:inline-block font-mono-data text-[10px] text-[#86A697]">
                    RFCTLARR Act, 2013 Simulation
                  </span>
                </div>
                <h1 className="font-serif-heading text-xl sm:text-2xl font-bold tracking-tight text-[#FAFBF9] mt-0.5">
                  Land Acquisition Delay Predictive System &amp; Early Warning Portal
                </h1>
                <p className="text-xs text-[#86A697] hidden sm:block mt-0.5">
                  Universal Single Sign-On for Central Ministry, State Revenue, District CALA, and Project Implementing Officers
                </p>
              </div>
            </div>

            {/* Helpline & Security Badge */}
            <div className="flex items-center gap-2.5 self-start md:self-center">
              <div className="px-3 py-1.5 bg-[#0F3526]/80 rounded-[4px] border border-[#276449] text-right font-mono-data hidden lg:block">
                <span className="text-[9px] text-[#86A697] font-bold uppercase block">Prototype Helpdesk</span>
                <span className="text-xs font-bold text-[#FAFBF9]">1800-000-DEMO (Toll Free)</span>
              </div>
              <div className="px-3 py-1.5 bg-[#071911] rounded-[4px] border border-[#1C4332] text-left font-mono-data">
                <span className="text-[9px] text-[#48BB78] font-bold uppercase block flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#48BB78]" />
                  Demo Security Sandbox
                </span>
                <span className="text-[10px] text-[#86A697]">Simulated Cloud Environment</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN HERO & UNIFIED LOGIN SURFACE */}
      <main className="flex-1 max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 7 COLUMNS: Executive Context, Statutory Mandate & 1-Click Fast Directory */}
          <div className="lg:col-span-7 space-y-6">
            {/* Mission Statement Box */}
            <div className="bg-[#FFFFFF] p-6 sm:p-7 rounded-[4px] border border-[#DFE3DC]">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono-data text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-[#EAF4EE] text-[#196842] border border-[#B8DCBE]">
                  OFFICIAL STATUTORY PORTAL
                </span>
                <span className="text-xs text-[#4E5C55] font-mono-data">
                  Single Gateway &bull; Automatic Cadre Resolution
                </span>
              </div>

              <h2 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#141E1A] tracking-tight leading-tight">
                Single Unified Gateway for Government Officials &amp; Competent Authorities
              </h2>

              <p className="text-sm text-[#4E5C55] mt-3 leading-relaxed">
                Welcome to the Department of Land Resources automated delay surveillance portal.
                Enter your official user credentials into the universal login interface. The system
                will <strong className="text-[#141E1A]">automatically identify your administrative cadre and designation</strong> (Central, State, District CALA, or Project Officer)
                and direct you directly to your customized, role-based statutory dashboard with jurisdiction-level security filters pre-loaded.
              </p>

              {/* 4 Core Pillars Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 pt-5 border-t border-[#DFE3DC] text-xs">
                <div className="p-2.5 rounded-[2px] bg-[#ECEEEA]/60 border border-[#DFE3DC]">
                  <div className="flex items-center gap-1.5 font-bold text-[#141E1A] text-[11px]">
                    <Building2 className="w-3.5 h-3.5 text-[#0C2B20] shrink-0" />
                    <span>Central Admin</span>
                  </div>
                  <p className="text-[10px] text-[#4E5C55] mt-0.5">National ML Oversight</p>
                </div>

                <div className="p-2.5 rounded-[2px] bg-[#ECEEEA]/60 border border-[#DFE3DC]">
                  <div className="flex items-center gap-1.5 font-bold text-[#141E1A] text-[11px]">
                    <Layers className="w-3.5 h-3.5 text-[#196842] shrink-0" />
                    <span>State Admin</span>
                  </div>
                  <p className="text-[10px] text-[#4E5C55] mt-0.5">Sec 11 &amp; Clearances</p>
                </div>

                <div className="p-2.5 rounded-[2px] bg-[#ECEEEA]/60 border border-[#DFE3DC]">
                  <div className="flex items-center gap-1.5 font-bold text-[#141E1A] text-[11px]">
                    <Scale className="w-3.5 h-3.5 text-[#C0781A] shrink-0" />
                    <span>District Admin</span>
                  </div>
                  <p className="text-[10px] text-[#4E5C55] mt-0.5">CALA Awards &amp; DBT</p>
                </div>

                <div className="p-2.5 rounded-[2px] bg-[#ECEEEA]/60 border border-[#DFE3DC]">
                  <div className="flex items-center gap-1.5 font-bold text-[#141E1A] text-[11px]">
                    <Briefcase className="w-3.5 h-3.5 text-[#2C5282] shrink-0" />
                    <span>Project Officer</span>
                  </div>
                  <p className="text-[10px] text-[#4E5C55] mt-0.5">NHAI Field Handover</p>
                </div>
              </div>
            </div>

            {/* DEMO / QUICK ACCESS OFFICER DIRECTORY (1-CLICK CADRE ACCESS) */}
            <div className="bg-[#FFFFFF] p-6 sm:p-7 rounded-[4px] border border-[#DFE3DC]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#DFE3DC]">
                <div>
                  <h3 className="font-serif-heading text-base sm:text-lg font-bold text-[#141E1A] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C0781A]" />
                    <span>Official Cadre Directory &bull; 1-Click Fast Login</span>
                  </h3>
                  <p className="text-xs text-[#4E5C55] mt-0.5">
                    Click any registered officer below to test their designation-specific dashboard immediately:
                  </p>
                </div>
                <span className="font-mono-data text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-[#ECEEEA] text-[#141E1A] border border-[#DFE3DC]">
                  4 Designated Profiles
                </span>
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
                      className="p-4 rounded-[4px] border border-[#DFE3DC] hover:border-[#141E1A] bg-[#FFFFFF] hover:bg-[#ECEEEA]/30 transition flex flex-col justify-between group"
                    >
                      <div>
                        {/* Top Badge & Initials */}
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-[2px] font-mono-data font-bold text-xs flex items-center justify-center text-white shrink-0 ${
                                isCentral
                                  ? 'bg-[#0C2B20]'
                                  : isState
                                  ? 'bg-[#196842]'
                                  : isDistrict
                                  ? 'bg-[#C0781A]'
                                  : 'bg-[#2C5282]'
                              }`}
                            >
                              {user.avatarInitials}
                            </div>
                            <div>
                              <span
                                className={`font-mono-data text-[9px] font-bold px-1.5 py-0.2 rounded-[2px] uppercase border inline-block ${
                                  isCentral
                                    ? 'bg-[#EAF4EE] text-[#0C2B20] border-[#B8DCBE]'
                                    : isState
                                    ? 'bg-[#EAF4EE] text-[#196842] border-[#B8DCBE]'
                                    : isDistrict
                                    ? 'bg-[#FDF3E7] text-[#C0781A] border-[#F8DCB8]'
                                    : 'bg-[#EBF3FB] text-[#2C5282] border-[#C2D9EE]'
                                }`}
                              >
                                {user.role}
                              </span>
                              <h4 className="font-bold text-xs text-[#141E1A] mt-0.5 truncate">
                                {user.name}
                              </h4>
                            </div>
                          </div>
                        </div>

                        {/* Designation & Department */}
                        <p className="text-[11px] text-[#4E5C55] font-medium leading-snug line-clamp-2">
                          {user.designation}
                        </p>
                        <p className="text-[10px] text-[#78857E] mt-1 font-mono-data truncate">
                          {user.email}
                        </p>

                        {/* Jurisdiction tag */}
                        <div className="mt-2.5 pt-2 border-t border-[#DFE3DC] flex items-center justify-between text-[10px] font-mono-data text-[#4E5C55]">
                          <span>Scope:</span>
                          <span className="font-bold text-[#141E1A]">
                            {user.state === 'All' ? 'National (7 States)' : `${user.state} &bull; ${user.district}`}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleQuickPresetLogin(user.role)}
                        className="mt-3.5 w-full py-2 px-3 bg-[#0C2B20] hover:bg-[#164734] text-white text-xs font-semibold rounded-[4px] transition cursor-pointer flex items-center justify-center gap-1.5 font-mono-data"
                      >
                        <span>Sign In as {user.role.split(' ')[0]}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LIVE PORTAL SYSTEM BENCHMARKS */}
            <div className="bg-[#FFFFFF] p-5 rounded-[4px] border border-[#DFE3DC] font-mono-data">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#DFE3DC]">
                <span className="text-xs font-bold text-[#141E1A] uppercase tracking-wider">
                  Live National Surveillance Benchmarks
                </span>
                <span className="text-[10px] text-[#196842] font-bold bg-[#EAF4EE] px-2 py-0.5 rounded-[2px] border border-[#B8DCBE]">
                  RFCTLARR Q1 2025
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 bg-[#ECEEEA]/40 rounded-[2px]">
                  <div className="text-lg font-black text-[#141E1A]">700</div>
                  <div className="text-[9px] text-[#4E5C55] uppercase mt-0.5">Parcels Monitored</div>
                </div>
                <div className="p-2.5 bg-[#ECEEEA]/40 rounded-[2px]">
                  <div className="text-lg font-black text-[#196842]">
                    {(mlModel.roc_auc * (mlModel.roc_auc <= 1 ? 100 : 1)).toFixed(1)}%
                  </div>
                  <div className="text-[9px] text-[#4E5C55] uppercase mt-0.5">ML ROC-AUC</div>
                </div>
                <div className="p-2.5 bg-[#ECEEEA]/40 rounded-[2px]">
                  <div className="text-lg font-black text-[#C0781A]">7 States</div>
                  <div className="text-[9px] text-[#4E5C55] uppercase mt-0.5">Active Jurisdictions</div>
                </div>
                <div className="p-2.5 bg-[#ECEEEA]/40 rounded-[2px]">
                  <div className="text-lg font-black text-[#BA2D1D]">Sec. 25</div>
                  <div className="text-[9px] text-[#4E5C55] uppercase mt-0.5">Lapsing Guard</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLUMNS: UNIVERSAL SINGLE LOGIN CARD */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#FFFFFF] rounded-[4px] border border-[#DFE3DC] shadow-sm overflow-hidden sticky top-6">
              {/* Header with Mode Toggle */}
              <div className="p-5 sm:p-6 bg-[#ECEEEA]/50 border-b border-[#DFE3DC]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono-data text-[10px] font-bold uppercase tracking-wider text-[#196842] bg-[#EAF4EE] px-2 py-0.5 rounded-[2px] border border-[#B8DCBE]">
                    UNIVERSAL OFFICIAL LOGIN
                  </span>
                  <span className="text-[10px] text-[#4E5C55] font-mono-data">
                    Secure 2FA Ready
                  </span>
                </div>
                <h3 className="font-serif-heading text-xl font-bold text-[#141E1A]">
                  Government Official Single Sign-In
                </h3>
                <p className="text-xs text-[#4E5C55] mt-1 leading-relaxed">
                  Single portal for all officers. System will resolve your cadre and direct you to your personalized dashboard.
                </p>

                {/* View Switcher: Login vs Register */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-[#DFE3DC] rounded-[4px] mt-4 text-xs font-semibold font-mono-data">
                  <button
                    onClick={() => setActiveView('login')}
                    className={`py-1.5 px-2 rounded-[2px] transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeView === 'login'
                        ? 'bg-[#0C2B20] text-white font-bold'
                        : 'text-[#4E5C55] hover:text-[#141E1A] hover:bg-white/60'
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    <span>Official Sign In</span>
                  </button>

                  <button
                    onClick={() => setActiveView('register')}
                    className={`py-1.5 px-2 rounded-[2px] transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeView === 'register'
                        ? 'bg-[#0C2B20] text-white font-bold'
                        : 'text-[#4E5C55] hover:text-[#141E1A] hover:bg-white/60'
                    }`}
                  >
                    <User className="w-3 h-3" />
                    <span>Register New Officer</span>
                  </button>
                </div>
              </div>

              {/* VIEW 1: UNIVERSAL SINGLE LOGIN FORM */}
              {activeView === 'login' && (
                <form onSubmit={handleUniversalLogin} className="p-5 sm:p-6 space-y-4">
                  {loginError && (
                    <div className="p-3 bg-[#FAECEB] border border-[#F0B8B3] rounded-[4px] text-xs text-[#BA2D1D] flex items-start gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>{loginError}</div>
                    </div>
                  )}

                  {/* 1. Official User ID / Email Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#141E1A] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#4E5C55]" />
                        <span>Authorized User ID / Demo Email</span>
                      </span>
                      <span className="text-[10px] text-[#4E5C55] font-mono-data">DEMO PROFILES</span>
                    </label>

                    <input
                      id="universal-login-email"
                      type="text"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. demo.central@example.org or demo.district@example.org"
                      className="w-full px-3 py-2 text-xs bg-[#FFFFFF] border border-[#DFE3DC] rounded-[4px] text-[#141E1A] placeholder-[#78857E] focus:outline-none focus:border-[#0C2B20] transition font-mono-data"
                      required
                    />

                    {/* LIVE REAL-TIME CADRE AUTO-DETECTION PREVIEW CARD */}
                    {loginEmail.trim().length > 0 && (
                      <div className="p-2.5 bg-[#ECEEEA]/70 border border-[#DFE3DC] rounded-[4px] text-xs space-y-1 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase font-mono-data text-[#4E5C55]">
                            Auto-Resolved Cadre:
                          </span>
                          <span
                            className={`font-mono-data text-[10px] font-bold px-2 py-0.5 rounded-[2px] border ${
                              detectedInfo.role === 'Central Admin'
                                ? 'bg-[#EAF4EE] text-[#0C2B20] border-[#B8DCBE]'
                                : detectedInfo.role === 'State Admin'
                                ? 'bg-[#EAF4EE] text-[#196842] border-[#B8DCBE]'
                                : detectedInfo.role === 'District Admin'
                                ? 'bg-[#FDF3E7] text-[#C0781A] border-[#F8DCB8]'
                                : 'bg-[#EBF3FB] text-[#2C5282] border-[#C2D9EE]'
                            }`}
                          >
                            {detectedInfo.role}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-[#141E1A] truncate">
                          {detectedInfo.designation}
                        </div>
                        <div className="text-[10px] text-[#4E5C55] font-mono-data truncate">
                          Scope: {detectedInfo.jurisdiction}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Official Password Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#141E1A] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-[#4E5C55]" />
                        <span>Official Password</span>
                      </span>
                      <span className="text-[10px] text-[#78857E] font-mono-data">Demo PIN: admin123</span>
                    </label>

                    <div className="relative">
                      <input
                        id="universal-login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter password..."
                        className="w-full px-3 py-2 pr-9 text-xs bg-[#FFFFFF] border border-[#DFE3DC] rounded-[4px] text-[#141E1A] placeholder-[#78857E] focus:outline-none focus:border-[#0C2B20] transition font-mono-data"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2 text-[#78857E] hover:text-[#141E1A] cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 3. Security PIN / Captcha Verification */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#141E1A] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-[#4E5C55]" />
                        <span>Security PIN Verification</span>
                      </span>
                      <span className="text-[10px] text-[#4E5C55] font-mono-data">Case-sensitive</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <div className="bg-[#0C2B20] text-white px-3 py-2 rounded-[4px] font-mono-data font-black text-sm tracking-widest select-none border border-[#164734] shrink-0">
                        {captchaCode}
                      </div>
                      <button
                        type="button"
                        onClick={refreshCaptcha}
                        className="p-2 border border-[#DFE3DC] rounded-[4px] hover:bg-[#ECEEEA] text-[#4E5C55] transition cursor-pointer"
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
                        className="flex-1 px-3 py-2 text-xs bg-[#FFFFFF] border border-[#DFE3DC] rounded-[4px] text-[#141E1A] placeholder-[#78857E] focus:outline-none focus:border-[#0C2B20] transition font-mono-data"
                        required
                      />
                    </div>
                  </div>

                  {/* Optional Manual Cadre Override Accordion */}
                  <div className="pt-2 border-t border-[#DFE3DC]">
                    <button
                      type="button"
                      onClick={() => setShowRoleOverride(!showRoleOverride)}
                      className="text-[11px] text-[#4E5C55] hover:text-[#141E1A] flex items-center justify-between w-full font-mono-data cursor-pointer"
                    >
                      <span>Need to manually select cadre designation?</span>
                      <span className="font-bold">{showRoleOverride ? '[-]' : '[+]'}</span>
                    </button>

                    {showRoleOverride && (
                      <div className="mt-2 p-2.5 bg-[#ECEEEA]/40 border border-[#DFE3DC] rounded-[4px] space-y-1.5 animate-in fade-in text-xs">
                        <label className="text-[10px] font-bold text-[#4E5C55] font-mono-data uppercase block">
                          Select Specific Administrative Cadre:
                        </label>
                        <select
                          value={manualRoleOverride}
                          onChange={(e) => setManualRoleOverride(e.target.value as UserRole)}
                          className="w-full bg-[#FFFFFF] border border-[#DFE3DC] rounded-[4px] px-2 py-1.5 text-xs text-[#141E1A] focus:outline-none"
                        >
                          <option value="Central Admin">Central Admin (National DoLR Directorate)</option>
                          <option value="State Admin">State Admin (State Revenue &amp; Forest)</option>
                          <option value="District Admin">District Admin / CALA (Collectorate &amp; Awards)</option>
                          <option value="Project Officer">Project Officer (NHAI &amp; Implementing Agency)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* 4. Primary Submit Action */}
                  <button
                    id="universal-login-submit-btn"
                    type="submit"
                    className="w-full py-2.5 px-4 bg-[#0C2B20] hover:bg-[#164734] text-white font-semibold text-xs rounded-[4px] transition cursor-pointer flex items-center justify-center gap-2 font-mono-data shadow-sm"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#48BB78]" />
                    <span>Authenticate &amp; Open Role Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="text-[10px] text-[#78857E] text-center font-mono-data pt-1">
                    Directs to Central, State, District CALA, or Project dashboard upon authentication
                  </div>
                </form>
              )}

              {/* VIEW 2: NEW OFFICER REGISTRATION FORM */}
              {activeView === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="p-5 sm:p-6 space-y-3.5 text-xs">
                  {regError && (
                    <div className="p-3 bg-[#FAECEB] border border-[#F0B8B3] rounded-[4px] text-xs text-[#BA2D1D] flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>{regError}</div>
                    </div>
                  )}

                  {/* Cadre Role */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#141E1A]">Administrative Cadre Level *</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full bg-[#FFFFFF] border border-[#DFE3DC] rounded-[4px] px-2.5 py-1.5 text-xs text-[#141E1A] focus:outline-none"
                    >
                      <option value="District Admin">District Admin / CALA (Collectorate &amp; Awards)</option>
                      <option value="State Admin">State Admin (State Revenue Department)</option>
                      <option value="Central Admin">Central Admin (National Ministry of Rural Dev)</option>
                      <option value="Project Officer">Project Officer (NHAI &amp; Executing Agency)</option>
                    </select>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#141E1A]">Officer Full Name (with Cadre) *</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Demo Officer — District Role"
                      className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#DFE3DC] rounded-[4px] text-[#141E1A] text-xs focus:outline-none"
                      required
                    />
                  </div>

                  {/* Email & Employee ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-[#141E1A]">Official Email *</label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="demo.officer@example.org"
                        className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#DFE3DC] rounded-[4px] text-[#141E1A] text-xs font-mono-data focus:outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[#141E1A]">Demo Employee ID</label>
                      <input
                        type="text"
                        value={regEmpId}
                        onChange={(e) => setRegEmpId(e.target.value)}
                        placeholder="DEMO/MH/2026/01"
                        className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#DFE3DC] rounded-[4px] text-[#141E1A] text-xs font-mono-data focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* State & District */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-[#141E1A]">State Jurisdiction</label>
                      <select
                        value={regState}
                        onChange={(e) => setRegState(e.target.value)}
                        className="w-full bg-[#FFFFFF] border border-[#DFE3DC] rounded-[4px] px-2.5 py-1.5 text-xs text-[#141E1A] focus:outline-none"
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
                      <label className="font-bold text-[#141E1A]">District Jurisdiction</label>
                      <input
                        type="text"
                        value={regDistrict}
                        onChange={(e) => setRegDistrict(e.target.value)}
                        placeholder="e.g. Pune, Nagpur, Thane"
                        className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#DFE3DC] rounded-[4px] text-[#141E1A] text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Password & Confirm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-[#141E1A]">Create Password *</label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#DFE3DC] rounded-[4px] text-[#141E1A] text-xs font-mono-data focus:outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[#141E1A]">Confirm Password *</label>
                      <input
                        type="password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#DFE3DC] rounded-[4px] text-[#141E1A] text-xs font-mono-data focus:outline-none"
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
                      className="mt-0.5 rounded-[2px] border-[#DFE3DC] text-[#0C2B20] focus:ring-0"
                    />
                    <span className="text-[10px] text-[#4E5C55] leading-snug">
                      I solemnly affirm official statutory authority and undertake confidentiality under the RFCTLARR Act, 2013 and IT Act 2000.
                    </span>
                  </label>

                  {/* Register Submit */}
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-[#0C2B20] hover:bg-[#164734] text-white font-semibold text-xs rounded-[4px] transition cursor-pointer flex items-center justify-center gap-2 font-mono-data shadow-sm"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Register Officer &amp; Open Dashboard</span>
                  </button>
                </form>
              )}
            </div>

            {/* Statutory Security Seal Card */}
            <div className="p-4 bg-[#FFFFFF] rounded-[4px] border border-[#DFE3DC] text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#0C2B20] font-bold">
                <Shield className="w-4 h-4 text-[#196842]" />
                <span className="font-mono-data text-[11px] uppercase">Statutory Confidentiality Notice</span>
              </div>
              <p className="text-[11px] text-[#4E5C55] leading-relaxed">
                This portal is for authorized administrative officers of the Union and State Governments under the
                RFCTLARR Act, 2013. Unauthorized access is punishable under Sections 43 &amp; 66 of the Information Technology Act, 2000.
              </p>
            </div>
          </div>
        </div>

        {/* 3. DETAILED STATUTORY CAPABILITIES & SURVEILLANCE DIRECTIVE */}
        <section className="mt-12 pt-8 border-t border-[#DFE3DC]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="font-mono-data text-[10px] font-bold uppercase tracking-wider text-[#196842] bg-[#EAF4EE] px-2 py-0.5 rounded-[2px] border border-[#B8DCBE]">
                SYSTEM ARCHITECTURE &bull; RFCTLARR 2013
              </span>
              <h3 className="font-serif-heading text-xl sm:text-2xl font-bold text-[#141E1A] mt-1">
                Core Statutory Surveillance &amp; Delay Prevention Engines
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-[#FFFFFF] rounded-[4px] border border-[#DFE3DC] space-y-2">
              <div className="w-8 h-8 rounded-[2px] bg-[#FAECEB] border border-[#F0B8B3] flex items-center justify-center text-[#BA2D1D]">
                <Clock className="w-4 h-4" />
              </div>
              <h4 className="font-serif-heading font-bold text-sm text-[#141E1A]">
                Section 25 Lapsing Prevention Engine
              </h4>
              <p className="text-xs text-[#4E5C55] leading-relaxed">
                Mandatory 12-month statutory deadline between Section 19 declaration and Section 23 award.
                Automated ML predictive alarms alert officers 60–90 days in advance to prevent acquisition lapses.
              </p>
            </div>

            <div className="p-5 bg-[#FFFFFF] rounded-[4px] border border-[#DFE3DC] space-y-2">
              <div className="w-8 h-8 rounded-[2px] bg-[#EAF4EE] border border-[#B8DCBE] flex items-center justify-center text-[#196842]">
                <Cpu className="w-4 h-4" />
              </div>
              <h4 className="font-serif-heading font-bold text-sm text-[#141E1A]">
                TreeSHAP Delay Driver Attribution
              </h4>
              <p className="text-xs text-[#4E5C55] leading-relaxed">
                Machine learning ensemble isolates exact bottlenecks per parcel — whether pending High Court writ petitions,
                Forest Stage-I clearances, or stalled genealogical title verification.
              </p>
            </div>

            <div className="p-5 bg-[#FFFFFF] rounded-[4px] border border-[#DFE3DC] space-y-2">
              <div className="w-8 h-8 rounded-[2px] bg-[#FDF3E7] border border-[#F8DCB8] flex items-center justify-center text-[#C0781A]">
                <Scale className="w-4 h-4" />
              </div>
              <h4 className="font-serif-heading font-bold text-sm text-[#141E1A]">
                Section 38 Direct Benefit Transfer (DBT) Gate
              </h4>
              <p className="text-xs text-[#4E5C55] leading-relaxed">
                Physical land possession cannot be statutorily ordered until at least 80% compensation is disbursed
                to Project Affected Families (PAFs). Integrated escrow and DBT audit trail verification.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 4. OFFICIAL FOOTER */}
      <footer className="mt-12 border-t border-[#DFE3DC] bg-[#FFFFFF] text-xs text-[#4E5C55] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1536px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 font-mono-data text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#141E1A]">Department of Land Resources (DoLR)</span>
            <span>&bull;</span>
            <span>Ministry of Rural Development, Govt. of India</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[#4E5C55]">
            <span>Designed for Cloud Native Infrastructure</span>
            <span>&bull;</span>
            <span>RFCTLARR Act, 2013 Simulation MIS</span>
            <span>&bull;</span>
            <span className="text-[#196842] font-bold">Prototype Demo Environment</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
