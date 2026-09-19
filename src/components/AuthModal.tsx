import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, AppUser } from '../types';
import {
  Shield,
  Building2,
  Lock,
  Mail,
  User,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Eye,
  EyeOff,
  Briefcase,
  HelpCircle,
  X,
  Landmark,
  FileCheck,
  TrendingUp,
  Cpu,
  Award,
  Scale,
  FileText,
  Layers,
  Check,
  RefreshCw,
  AlertCircle,
  KeyRound,
  BadgeCheck,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isFullPage?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  isFullPage = false,
}) => {
  const {
    loginAsPreset,
    loginWithCredentials,
    signup,
    presetUsers,
    currentUser,
    isAuthenticated,
    mlModel,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'presets' | 'matrix'>('presets');
  
  // Sign In Form State
  const [selectedLoginRole, setSelectedLoginRole] = useState<UserRole>('Central Admin');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());

  // Sign Up Form State
  const [signupRole, setSignupRole] = useState<UserRole>('District Admin');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupEmployeeId, setSignupEmployeeId] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupDesignation, setSignupDesignation] = useState('District Collector & District Magistrate (CALA)');
  const [signupDepartment, setSignupDepartment] = useState('District Collectorate, Pune');
  const [signupState, setSignupState] = useState('Maharashtra');
  const [signupDistrict, setSignupDistrict] = useState('Pune');
  const [agreeStatutoryTerms, setAgreeStatutoryTerms] = useState(true);
  const [signupError, setSignupError] = useState<string | null>(null);

  if (!isOpen) return null;

  const refreshCaptcha = () => {
    setCaptchaCode(Math.floor(1000 + Math.random() * 9000).toString());
    setCaptchaInput('');
  };

  // Designation presets based on role
  const designationOptions: Record<UserRole, string[]> = {
    'Central Admin': [
      'Joint Secretary & Central Nodal Director',
      'Director (Land Governance & Digitization)',
      'Deputy Secretary (Department of Land Resources)',
      'Central Policy & Predictive Surveillance Director',
      'PM GatiShakti National Nodal Coordinator',
    ],
    'State Admin': [
      'State Nodal Officer & Principal Secretary (Revenue)',
      'Divisional Commissioner & Appellate Authority',
      'Director of Land Records & Surveys',
      'Joint Secretary (Revenue & Forest Department)',
      'State Competent Authority for Infrastructure',
    ],
    'District Admin': [
      'District Collector & District Magistrate (CALA)',
      'Sub-Divisional Magistrate (SDM / CALA)',
      'Special Land Acquisition Officer (SLAO)',
      'Competent Authority for Land Acquisition (CALA)',
      'Additional District Collector (Land Reforms)',
    ],
    'Project Officer': [
      'Senior Land Acquisition Officer & Implementing Executive',
      'Project Director (NHAI / Implementing Agency)',
      'Chief Engineer (Railways / Infrastructure)',
      'Field Revenue Officer & Survey Coordinator',
      'Executive Engineer (Irrigation & Urban Works)',
    ],
  };

  const roleMeta: Record<
    UserRole,
    {
      title: string;
      levelBadge: string;
      tagline: string;
      scope: string;
      badgeColor: string;
      borderColor: string;
      authoritySummary: string;
      keyPowers: string[];
    }
  > = {
    'Central Admin': {
      title: 'Central Admin (National Level)',
      levelBadge: 'Central Ministry / DoLR',
      tagline: 'Ministry of Rural Development &bull; Dept of Land Resources',
      scope: 'National Portfolio (All 7 Monitored States)',
      badgeColor: 'bg-[#0F3D2E] text-white border-[#0F3D2E]',
      borderColor: 'border-[#0F3D2E]',
      authoritySummary: 'National statutory oversight across all infrastructure corridors, AI/ML retraining, and inter-ministerial directives.',
      keyPowers: [
        'National portfolio surveillance across all 7 monitored states & priority infrastructure corridors',
        'Authority to trigger AI/ML retraining pipeline and calibrate risk threshold parameters',
        'Access to full tamper-evident audit logs and statutory compliance verification under RFCTLARR Act',
        'Issue inter-ministerial policy directives to State Revenue Departments and PM GatiShakti portals',
      ],
    },
    'State Admin': {
      title: 'State Admin (State Level)',
      levelBadge: 'State Revenue & Forest',
      tagline: 'Revenue & Forest Department, State Government',
      scope: 'Statewide Jurisdiction (Multi-District)',
      badgeColor: 'bg-[#1F7A4D] text-white border-[#1F7A4D]',
      borderColor: 'border-[#1F7A4D]',
      authoritySummary: 'Statewide project clearance coordination, Forest/Environment clearances, and Section 11 gazette tracking.',
      keyPowers: [
        'State-level oversight across all monitored districts in the State',
        'Inter-departmental clearance coordination (Forest, Wildlife, Environment, Revenue)',
        'Section 11 gazette publication and Joint Measurement Survey (JMS) expediting',
        'Statewide compensation fund allocation and DBT disbursement tracking',
      ],
    },
    'District Admin': {
      title: 'District Admin / CALA (District Level)',
      levelBadge: 'District Magistrate & CALA',
      tagline: 'District Collectorate & Revenue Administration',
      scope: 'District Jurisdiction (Competent Authority)',
      badgeColor: 'bg-[#D98B2B] text-white border-[#D98B2B]',
      borderColor: 'border-[#D98B2B]',
      authoritySummary: 'Statutory CALA authority for Section 19 declarations, Section 23 compensation awards, and Section 38 possession.',
      keyPowers: [
        'Statutory Competent Authority for Land Acquisition (CALA) under RFCTLARR Act',
        'Section 19 declaration issuance and Section 23 financial compensation award determination',
        'Direct Benefit Transfer (DBT) verification to Project Affected Families (PAFs)',
        'Section 38 Physical Possession order issuance (statutorily requires min 80% disbursement)',
      ],
    },
    'Project Officer': {
      title: 'Project Officer (Implementing Agency)',
      levelBadge: 'Executing Agency / NHAI',
      tagline: 'NHAI / Railways / MoRTH / Port / Power PIU',
      scope: 'Field Project Packages & Handover',
      badgeColor: 'bg-[#2D6CDF] text-white border-[#2D6CDF]',
      borderColor: 'border-[#2D6CDF]',
      authoritySummary: 'Field package execution, survey milestones, physical possession hurdles, and What-If simulation.',
      keyPowers: [
        'Ground-level package field execution and encumbrance-free handover tracking',
        'Active stage milestone updates, physical possession progress, and field constraints logging',
        'Interactive What-If Simulation sandbox to model delay mitigation strategies',
        'Fast-track dispute resolution requests and inter-agency coordination',
      ],
    },
  };

  const handleRoleChangeInSignup = (role: UserRole) => {
    setSignupRole(role);
    const defaults = designationOptions[role];
    setSignupDesignation(defaults[0]);
    if (role === 'Central Admin') {
      setSignupDepartment('Department of Land Resources (DoLR), Ministry of Rural Development');
      setSignupState('All');
      setSignupDistrict('All');
    } else if (role === 'State Admin') {
      setSignupDepartment('Revenue & Forest Department, Govt. of Maharashtra');
      setSignupDistrict('All');
    } else if (role === 'District Admin') {
      setSignupDepartment(`District Collectorate, ${signupDistrict || 'Pune'}`);
    } else {
      setSignupDepartment('National Highways Authority of India (NHAI)');
    }
  };

  const handleCredentialLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim()) {
      setLoginError('Please enter your official email address.');
      return;
    }

    if (captchaInput.trim() !== captchaCode) {
      setLoginError('Invalid Security PIN code entered. Please verify the code and retry.');
      refreshCaptcha();
      return;
    }

    const success = loginWithCredentials(
      loginEmail,
      loginPassword,
      selectedLoginRole
    );

    if (success) {
      if (onClose) onClose();
    } else {
      setLoginError('Unable to authenticate official credentials. Please verify your role and email.');
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setSignupError('All required administrative officer fields must be completed.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Password and Confirmation Password do not match.');
      return;
    }

    if (!agreeStatutoryTerms) {
      setSignupError('You must acknowledge the statutory data governance and secrecy undertaking to proceed.');
      return;
    }

    const initials = signupName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newUser: AppUser = {
      id: `usr-${Date.now()}`,
      name: signupName.trim(),
      email: signupEmail.trim(),
      role: signupRole,
      designation: signupDesignation,
      department: signupDepartment.trim(),
      state: signupState,
      district: signupDistrict,
      avatarInitials: initials || 'OF',
      rulesSummary: roleMeta[signupRole].keyPowers,
    };

    signup(newUser);
    if (onClose) onClose();
  };

  const handlePresetSelect = (role: UserRole) => {
    loginAsPreset(role);
    if (onClose) onClose();
  };

  return (
    <div
      id="auth-modal-overlay"
      className={
        isFullPage
          ? 'min-h-screen bg-[#F7F8F5] text-[#111814] flex items-center justify-center p-3 sm:p-5 lg:p-8 selection:bg-[#0F3D2E] selection:text-white'
          : 'fixed inset-0 z-50 bg-[#111814]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto'
      }
    >
      {/* Main Dual-Panel Auth Surface */}
      <div
        className={`w-full max-w-6xl bg-white rounded-[4px] border border-[#DFE3DC] overflow-hidden flex flex-col lg:flex-row my-auto transition-all ${
          isFullPage ? 'min-h-[680px]' : 'max-h-[92vh]'
        }`}
      >
        {/* LEFT COLUMN: Government Authority Banner & Mandate (38% width) */}
        <div className="lg:w-5/12 bg-[#0A2218] text-white p-6 sm:p-8 lg:p-9 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#1C4332] relative overflow-hidden">
          {/* Top Institutional Header */}
          <div className="relative z-10">
            {/* Emblem / Department Bar */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-[4px] bg-[#0F3526] border border-[#276449] flex items-center justify-center text-[#D8ECE0] shrink-0">
                <Landmark className="w-6 h-6 text-[#A5C8B6]" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#A5C8B6] tracking-wider uppercase block font-mono-data">
                  Department of Land Resources (DoLR)
                </span>
                <span className="text-[10px] text-[#86A697] font-medium block">
                  Ministry of Rural Development &bull; Government of India
                </span>
              </div>
            </div>

            {/* Portal Title & Mandatory Cadre Notice */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono-data text-[9px] font-bold px-2 py-0.5 rounded-[2px] bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase tracking-wider">
                  SIH 2026 PROTOTYPE — DEMO DATA
                </span>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[10px] font-semibold bg-[#0F3526] text-[#A5C8B6] border border-[#276449] font-mono-data">
                  <Shield className="w-3.5 h-3.5 text-[#48BB78]" />
                  <span>Role-Based Access Control (RBAC)</span>
                </div>
              </div>
              <h1 className="font-serif-heading text-xl sm:text-2xl font-bold tracking-tight text-[#FAFBF9] leading-snug">
                Land Acquisition Delay Warning &amp; Surveillance Portal
              </h1>
              <p className="text-xs sm:text-sm text-[#C4D9CD] leading-relaxed font-normal">
                Mandatory official identification required under the{' '}
                <span className="text-white font-semibold underline decoration-[#48BB78] underline-offset-2">RFCTLARR Act, 2013</span>. Select or register your administrative cadre to enter.
              </p>
            </div>

            {/* 4 Administrative Tiers Summary Pill */}
            <div className="mt-6 pt-5 border-t border-[#143325]">
              <span className="text-[10px] font-bold text-[#A5C8B6] uppercase tracking-wider block mb-3 font-mono-data">
                Identified Administrative Cadres:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-[2px] bg-[#0F3526]/80 border border-[#276449]">
                  <div className="flex items-center gap-1.5 text-white font-bold text-[11px]">
                    <Building2 className="w-3.5 h-3.5 text-[#A5C8B6] shrink-0" />
                    <span>Central Admin</span>
                  </div>
                  <p className="text-[10px] text-[#86A697] mt-0.5">National Oversight &amp; ML Retraining</p>
                </div>

                <div className="p-2.5 rounded-[2px] bg-[#0F3526]/80 border border-[#276449]">
                  <div className="flex items-center gap-1.5 text-white font-bold text-[11px]">
                    <Layers className="w-3.5 h-3.5 text-[#A5C8B6] shrink-0" />
                    <span>State Admin</span>
                  </div>
                  <p className="text-[10px] text-[#86A697] mt-0.5">State Clearances &amp; Sec 11 Gazette</p>
                </div>

                <div className="p-2.5 rounded-[2px] bg-[#0F3526]/80 border border-[#276449]">
                  <div className="flex items-center gap-1.5 text-white font-bold text-[11px]">
                    <Scale className="w-3.5 h-3.5 text-[#F6AD55] shrink-0" />
                    <span>District Admin</span>
                  </div>
                  <p className="text-[10px] text-[#86A697] mt-0.5">CALA Statutory Awards &amp; DBT</p>
                </div>

                <div className="p-2.5 rounded-[2px] bg-[#0F3526]/80 border border-[#276449]">
                  <div className="flex items-center gap-1.5 text-white font-bold text-[11px]">
                    <Briefcase className="w-3.5 h-3.5 text-[#63B3ED] shrink-0" />
                    <span>Project Officer</span>
                  </div>
                  <p className="text-[10px] text-[#86A697] mt-0.5">NHAI Field Execution &amp; What-If</p>
                </div>
              </div>
            </div>

            {/* Core Statutory Pillars */}
            <div className="mt-5 space-y-2 text-xs text-[#C4D9CD]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#48BB78] shrink-0" />
                <span>60–90 Day Pre-emptive Delay Detection</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#48BB78] shrink-0" />
                <span>TreeSHAP Explainable Attribution (Disputes, Approvals, DBT)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#48BB78] shrink-0" />
                <span>Section 25 Statutory Lapsing Prevention Engine</span>
              </div>
            </div>
          </div>

          {/* Bottom Live Metrics Strip */}
          <div className="mt-6 pt-4 border-t border-[#143325] relative z-10 font-mono-data">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-base font-bold text-white">700</div>
                <div className="text-[9px] text-[#86A697] uppercase">Parcels Tracked</div>
              </div>
              <div className="border-x border-[#143325]">
                <div className="text-base font-bold text-[#A5C8B6]">
                  {(mlModel.roc_auc * (mlModel.roc_auc <= 1 ? 100 : 1)).toFixed(1)}%
                </div>
                <div className="text-[9px] text-[#86A697] uppercase">ROC-AUC</div>
              </div>
              <div>
                <div className="text-base font-bold text-[#F6AD55]">4 Cadres</div>
                <div className="text-[9px] text-[#86A697] uppercase">RBAC Tiers</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Cadre Identification & Authentication (62% width) */}
        <div className="lg:w-7/12 bg-white flex flex-col justify-between overflow-y-auto">
          {/* Top Bar with Navigation Tabs & Close Button */}
          <div className="p-5 sm:p-6 pb-3 border-b border-[#DFE3DC] relative bg-[#ECEEEA]/40">
            {onClose && !isFullPage && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 text-[#4E5C55] hover:text-[#141E1A] hover:bg-[#DFE3DC] rounded-[2px] transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-[1px] bg-[#196842]"></span>
                  <h2 className="font-serif-heading text-lg sm:text-xl font-bold text-[#141E1A] tracking-tight">
                    Mandatory Administrative Officer Identification
                  </h2>
                </div>
                <p className="text-xs text-[#4E5C55] mt-0.5">
                  Identify whether you are a <strong>Central Admin</strong>, <strong>State Admin</strong>, <strong>District Admin</strong>, or <strong>Project Officer</strong> to enter.
                </p>
              </div>
            </div>

            {/* Segmented Mode Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-[#DFE3DC] rounded-[4px] mt-4 text-xs font-semibold font-mono-data">
              <button
                id="tab-btn-presets"
                onClick={() => setActiveTab('presets')}
                className={`py-1.5 px-2 rounded-[2px] transition flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                  activeTab === 'presets'
                    ? 'bg-[#0C2B20] text-white font-bold'
                    : 'text-[#4E5C55] hover:text-[#141E1A] hover:bg-white/60'
                }`}
              >
                <Sparkles className="w-3 h-3 shrink-0" />
                <span className="truncate">1-Click Cadre Login</span>
              </button>

              <button
                id="tab-btn-signin"
                onClick={() => setActiveTab('signin')}
                className={`py-1.5 px-2 rounded-[2px] transition flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                  activeTab === 'signin'
                    ? 'bg-[#0C2B20] text-white font-bold'
                    : 'text-[#4E5C55] hover:text-[#141E1A] hover:bg-white/60'
                }`}
              >
                <Lock className="w-3 h-3 shrink-0" />
                <span className="truncate">Official Sign In</span>
              </button>

              <button
                id="tab-btn-signup"
                onClick={() => setActiveTab('signup')}
                className={`py-1.5 px-2 rounded-[2px] transition flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                  activeTab === 'signup'
                    ? 'bg-[#0C2B20] text-white font-bold'
                    : 'text-[#4E5C55] hover:text-[#141E1A] hover:bg-white/60'
                }`}
              >
                <User className="w-3 h-3 shrink-0" />
                <span className="truncate">Register / Sign Up</span>
              </button>

              <button
                id="tab-btn-matrix"
                onClick={() => setActiveTab('matrix')}
                className={`py-1.5 px-2 rounded-[2px] transition flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                  activeTab === 'matrix'
                    ? 'bg-[#0C2B20] text-white font-bold'
                    : 'text-[#4E5C55] hover:text-[#141E1A] hover:bg-white/60'
                }`}
              >
                <Scale className="w-3 h-3 shrink-0 text-[#C0781A]" />
                <span className="truncate">Cadre Matrix</span>
              </button>
            </div>
          </div>

          {/* TAB 1: 1-CLICK CADRE IDENTIFICATION (EASIEST FOR EVALUATION) */}
          {activeTab === 'presets' && (
            <div className="p-5 sm:p-7 space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#111814]">
                    Select Your Administrative Cadre to Enter:
                  </h3>
                  <p className="text-[11px] text-[#5B6660] mt-0.5">
                    Click any authorized officer profile below to immediately launch the dashboard in that cadre scope.
                  </p>
                </div>
              </div>

              {/* 4 Interactive Cadre Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {presetUsers.map((preset) => {
                  const isSelected = currentUser?.id === preset.id && isAuthenticated;
                  const meta = roleMeta[preset.role];

                  return (
                    <div
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset.role)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left group relative ${
                        isSelected
                          ? 'bg-[#0F3D2E]/5 border-[#0F3D2E] ring-2 ring-[#0F3D2E] shadow-sm'
                          : 'bg-white hover:bg-[#F7F8F5] border-[#E4E7E1] hover:border-[#0F3D2E]/50 shadow-2xs hover:shadow-xs'
                      }`}
                    >
                      <div>
                        {/* Header with Avatar & Role Badge */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-[#0F3D2E] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {preset.avatarInitials}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-[#111814] group-hover:text-[#0F3D2E] transition truncate">
                                {preset.name}
                              </h4>
                              <span className="text-[10px] font-medium text-[#5B6660] flex items-center gap-1 truncate">
                                <MapPin className="w-2.5 h-2.5 text-[#5B6660] shrink-0" />
                                <span>{preset.state === 'All' ? 'National Jurisdiction' : `${preset.state} (${preset.district})`}</span>
                              </span>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                              preset.role === 'Central Admin'
                                ? 'bg-[#0F3D2E]/10 text-[#0F3D2E] border-[#0F3D2E]/30'
                                : preset.role === 'State Admin'
                                ? 'bg-[#1F7A4D]/10 text-[#1F7A4D] border-[#1F7A4D]/30'
                                : preset.role === 'District Admin'
                                ? 'bg-[#D98B2B]/10 text-[#D98B2B] border-[#D98B2B]/30'
                                : 'bg-[#2D6CDF]/10 text-[#2D6CDF] border-[#2D6CDF]/30'
                            }`}
                          >
                            {preset.role}
                          </span>
                        </div>

                        {/* Designation & Department */}
                        <p className="text-[11px] font-semibold text-[#111814] leading-snug line-clamp-1">
                          {preset.designation}
                        </p>
                        <p className="text-[10px] text-[#5B6660] truncate mt-0.5">
                          {preset.department}
                        </p>

                        {/* Key Statutory Role Power */}
                        <div className="mt-2.5 p-2 bg-[#F7F8F5] rounded-md border border-[#E4E7E1] text-[10px] text-[#5B6660]">
                          <span className="font-semibold text-[#111814] block">Authority Mandate:</span>
                          <span className="line-clamp-2 leading-tight mt-0.5">{meta.authoritySummary}</span>
                        </div>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="mt-3 pt-2.5 border-t border-[#E4E7E1] flex items-center justify-between text-[11px]">
                        <span className="text-[#5B6660] font-mono text-[10px] truncate max-w-[140px]">
                          {preset.email}
                        </span>
                        <span className="font-semibold text-[#0F3D2E] group-hover:text-[#1F7A4D] flex items-center gap-1 text-[11px]">
                          <span>Enter as {preset.role}</span>
                          <ChevronRight className="w-3.5 h-3.5 transition group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cadre Distinction Help Note */}
              <div className="p-3 bg-[#F7F8F5] rounded-lg border border-[#E4E7E1] flex items-start gap-2.5 text-xs text-[#5B6660]">
                <BadgeCheck className="w-4 h-4 text-[#1F7A4D] shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Role-Based Experience:</strong> Central Admins have national retraining &amp; export privileges; State Admins monitor inter-district clearances; District Admins (CALA) authorize Section 23 awards &amp; DBT disbursement; Project Officers update field milestones and run What-If simulations.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OFFICIAL SIGN IN WITH MANDATORY ROLE IDENTIFICATION */}
          {activeTab === 'signin' && (
            <div className="p-5 sm:p-7 space-y-4 flex-1">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#111814]">
                  Official Government Sign In
                </h3>
                <p className="text-[11px] text-[#5B6660] mt-0.5">
                  Identify your administrative cadre and enter authorized demo credentials.
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-[#C6402C]/10 border border-[#C6402C]/30 text-[#C6402C] text-xs rounded-lg font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleCredentialLogin} className="space-y-3.5 max-w-lg">
                {/* MANDATORY ROLE IDENTIFICATION SELECTOR */}
                <div>
                  <label className="block text-xs font-bold text-[#111814] mb-1.5 flex items-center justify-between">
                    <span>1. Identify Your Administrative Cadre <span className="text-[#C6402C]">*</span></span>
                    <span className="text-[10px] text-[#5B6660] font-normal">Mandatory Statutory Declaration</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Central Admin', 'State Admin', 'District Admin', 'Project Officer'] as UserRole[]).map((r) => {
                      const isRole = selectedLoginRole === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setSelectedLoginRole(r)}
                          className={`p-2 rounded-lg border text-left transition cursor-pointer flex items-center justify-between ${
                            isRole
                              ? 'bg-[#0F3D2E] text-white border-[#0F3D2E] shadow-xs'
                              : 'bg-white hover:bg-[#F7F8F5] text-[#111814] border-[#E4E7E1]'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-bold block">{r}</span>
                            <span className={`text-[10px] block ${isRole ? 'text-emerald-200' : 'text-[#5B6660]'}`}>
                              {r === 'Central Admin'
                                ? 'National Directorate'
                                : r === 'State Admin'
                                ? 'State Revenue Dept'
                                : r === 'District Admin'
                                ? 'Collector / CALA'
                                : 'Executing Agency'}
                            </span>
                          </div>
                          {isRole && <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-xs font-bold text-[#111814] mb-1">
                    2. Official Government / Organization Email <span className="text-[#C6402C]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#5B6660] absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. demo.central@example.org or demo.district@example.org"
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-[#E4E7E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20 focus:border-[#0F3D2E] text-[#111814]"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-bold text-[#111814] mb-1">
                    3. Security Password <span className="text-[#C6402C]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#5B6660] absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter security password"
                      className="w-full pl-9 pr-10 py-2 text-xs bg-white border border-[#E4E7E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20 focus:border-[#0F3D2E] text-[#111814]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[#5B6660] hover:text-[#111814] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Security PIN / Captcha Challenge */}
                <div>
                  <label className="block text-xs font-bold text-[#111814] mb-1">
                    4. Security PIN Verification <span className="text-[#C6402C]">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111814] text-white font-mono font-bold tracking-widest text-sm rounded-lg select-none border border-slate-700">
                      <span>{captchaCode}</span>
                    </div>
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="p-2 border border-[#E4E7E1] hover:bg-[#F7F8F5] rounded-lg text-[#5B6660] transition cursor-pointer"
                      title="Refresh Code"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="text"
                      maxLength={4}
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="Enter 4-digit code"
                      className="flex-1 px-3 py-2 text-xs bg-white border border-[#E4E7E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20 focus:border-[#0F3D2E] text-[#111814] font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0F3D2E] hover:bg-[#164e3b] text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  <KeyRound className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Authenticate as {selectedLoginRole} &amp; Enter Portal</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: OFFICIAL REGISTRATION (SIGN UP) */}
          {activeTab === 'signup' && (
            <div className="p-5 sm:p-7 space-y-4 flex-1">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#111814]">
                  New Officer Registration &amp; Cadre Assignment
                </h3>
                <p className="text-[11px] text-[#5B6660] mt-0.5">
                  Register your official service profile and identify your administrative cadre under the RFCTLARR Act.
                </p>
              </div>

              {signupError && (
                <div className="p-3 bg-[#C6402C]/10 border border-[#C6402C]/30 text-[#C6402C] text-xs rounded-lg font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{signupError}</span>
                </div>
              )}

              <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                {/* 1. MANDATORY CADRE TIER SELECTION */}
                <div>
                  <label className="block text-xs font-bold text-[#111814] mb-1.5 flex items-center justify-between">
                    <span>1. Select Official Cadre Tier <span className="text-[#C6402C]">*</span></span>
                    <span className="text-[10px] text-[#1F7A4D] font-semibold">Defines Statutory Powers</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['Central Admin', 'State Admin', 'District Admin', 'Project Officer'] as UserRole[]).map((r) => {
                      const isSelected = signupRole === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => handleRoleChangeInSignup(r)}
                          className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#0F3D2E] text-white border-[#0F3D2E] shadow-xs'
                              : 'bg-white hover:bg-[#F7F8F5] text-[#111814] border-[#E4E7E1]'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-bold block">{r}</span>
                            {isSelected && <Check className="w-3 h-3 text-emerald-300" />}
                          </div>
                          <span className={`text-[10px] block mt-1 ${isSelected ? 'text-emerald-200' : 'text-[#5B6660]'}`}>
                            {r === 'Central Admin'
                              ? 'National Scope'
                              : r === 'State Admin'
                              ? 'State Scope'
                              : r === 'District Admin'
                              ? 'CALA District'
                              : 'Field Packages'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. OFFICER DETAILS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-[#111814] mb-1">
                      Full Name &amp; Cadre Batch <span className="text-[#C6402C]">*</span>
                    </label>
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="e.g. Demo Officer — State Role"
                      className="w-full px-3 py-2 text-xs border border-[#E4E7E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20 focus:border-[#0F3D2E] text-[#111814]"
                      required
                    />
                  </div>

                  {/* Official Email */}
                  <div>
                    <label className="block text-xs font-bold text-[#111814] mb-1">
                      Demo User Email <span className="text-[#C6402C]">*</span>
                    </label>
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="e.g. demo.state@example.org"
                      className="w-full px-3 py-2 text-xs border border-[#E4E7E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20 focus:border-[#0F3D2E] text-[#111814]"
                      required
                    />
                  </div>

                  {/* Employee ID / Service Code */}
                  <div>
                    <label className="block text-xs font-bold text-[#111814] mb-1">
                      Demo Employee Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={signupEmployeeId}
                      onChange={(e) => setSignupEmployeeId(e.target.value)}
                      placeholder="e.g. DEMO-MAHA-2026-01"
                      className="w-full px-3 py-2 text-xs border border-[#E4E7E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20 focus:border-[#0F3D2E] text-[#111814]"
                    />
                  </div>

                  {/* Official Designation */}
                  <div>
                    <label className="block text-xs font-bold text-[#111814] mb-1">
                      Official Designation <span className="text-[#C6402C]">*</span>
                    </label>
                    <select
                      value={signupDesignation}
                      onChange={(e) => setSignupDesignation(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#E4E7E1] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20 focus:border-[#0F3D2E] text-[#111814] font-medium"
                    >
                      {designationOptions[signupRole].map((desig) => (
                        <option key={desig} value={desig}>
                          {desig}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-bold text-[#111814] mb-1">
                      Department / Agency <span className="text-[#C6402C]">*</span>
                    </label>
                    <input
                      type="text"
                      value={signupDepartment}
                      onChange={(e) => setSignupDepartment(e.target.value)}
                      placeholder="e.g. District Collectorate, Pune"
                      className="w-full px-3 py-2 text-xs border border-[#E4E7E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20 focus:border-[#0F3D2E] text-[#111814]"
                      required
                    />
                  </div>

                  {/* State Jurisdiction */}
                  <div>
                    <label className="block text-xs font-bold text-[#111814] mb-1">
                      State Jurisdiction <span className="text-[#C6402C]">*</span>
                    </label>
                    <select
                      value={signupState}
                      onChange={(e) => setSignupState(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#E4E7E1] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20 focus:border-[#0F3D2E] text-[#111814]"
                      disabled={signupRole === 'Central Admin'}
                    >
                      <option value="All">All States (National Jurisdiction)</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Odisha">Odisha</option>
                    </select>
                  </div>

                  {/* District Jurisdiction */}
                  <div>
                    <label className="block text-xs font-bold text-[#111814] mb-1">
                      District Jurisdiction <span className="text-[#C6402C]">*</span>
                    </label>
                    <select
                      value={signupDistrict}
                      onChange={(e) => setSignupDistrict(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#E4E7E1] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20 focus:border-[#0F3D2E] text-[#111814]"
                      disabled={signupRole === 'Central Admin' || signupRole === 'State Admin'}
                    >
                      <option value="All">All Districts</option>
                      <option value="Pune">Pune</option>
                      <option value="Nagpur">Nagpur</option>
                      <option value="Thane">Thane</option>
                      <option value="Nashik">Nashik</option>
                      <option value="Varanasi">Varanasi</option>
                      <option value="Lucknow">Lucknow</option>
                      <option value="Ahmedabad">Ahmedabad</option>
                      <option value="Surat">Surat</option>
                      <option value="Bengaluru">Bengaluru</option>
                    </select>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-[#111814] mb-1">
                      Security Password <span className="text-[#C6402C]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full px-3 py-2 text-xs border border-[#E4E7E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20 focus:border-[#0F3D2E] text-[#111814]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-2.5 top-2 text-[#5B6660] hover:text-[#111814] cursor-pointer"
                      >
                        {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#111814] mb-1">
                      Confirm Security Password <span className="text-[#C6402C]">*</span>
                    </label>
                    <input
                      type="password"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="Re-enter security password"
                      className="w-full px-3 py-2 text-xs border border-[#E4E7E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20 focus:border-[#0F3D2E] text-[#111814]"
                      required
                    />
                  </div>
                </div>

                {/* Statutory Secrecy Undertaking Checkbox */}
                <div className="p-3 bg-[#F7F8F5] border border-[#E4E7E1] rounded-lg flex items-start gap-2 text-xs text-[#5B6660]">
                  <input
                    type="checkbox"
                    id="statutory-terms-check"
                    checked={agreeStatutoryTerms}
                    onChange={(e) => setAgreeStatutoryTerms(e.target.checked)}
                    className="mt-0.5 rounded border-[#E4E7E1] text-[#0F3D2E] focus:ring-[#0F3D2E]"
                  />
                  <label htmlFor="statutory-terms-check" className="text-[11px] leading-relaxed cursor-pointer">
                    I confirm that I am an authorized public servant operating under the <strong>RFCTLARR Act, 2013</strong> and will maintain data confidentiality and statutory integrity during all surveillance operations.
                  </label>
                </div>

                {/* Submit Registration Button */}
                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('presets')}
                    className="px-4 py-2 text-xs font-semibold text-[#5B6660] hover:text-[#111814] transition cursor-pointer"
                  >
                    Use 1-Click Profile
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0F3D2E] hover:bg-[#164e3b] text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Register as {signupRole} &amp; Enter</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-300" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: CADRE GOVERNANCE MATRIX & STATUTORY POWERS */}
          {activeTab === 'matrix' && (
            <div className="p-5 sm:p-7 space-y-4 flex-1">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#111814]">
                  Administrative Cadre Governance &amp; Statutory Authority Matrix
                </h3>
                <p className="text-[11px] text-[#5B6660] mt-0.5">
                  Comparison of statutory jurisdiction and operational privileges across the 4 administrative roles under RFCTLARR Act 2013.
                </p>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto border border-[#E4E7E1] rounded-xl bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F7F8F5] text-[#111814] border-b border-[#E4E7E1]">
                      <th className="py-2.5 px-3 font-bold">Statutory Dimension</th>
                      <th className="py-2.5 px-3 font-bold text-[#0F3D2E]">Central Admin</th>
                      <th className="py-2.5 px-3 font-bold text-[#1F7A4D]">State Admin</th>
                      <th className="py-2.5 px-3 font-bold text-[#D98B2B]">District Admin (CALA)</th>
                      <th className="py-2.5 px-3 font-bold text-[#2D6CDF]">Project Officer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E7E1] text-[11px] text-[#5B6660]">
                    <tr>
                      <td className="py-2 px-3 font-semibold text-[#111814]">Geographic Scope</td>
                      <td className="py-2 px-3 font-medium text-[#0F3D2E]">National (All 7 States)</td>
                      <td className="py-2 px-3">State Multi-District</td>
                      <td className="py-2 px-3">District Revenue Boundary</td>
                      <td className="py-2 px-3">Project Alignment Package</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-[#111814]">Section 11 (Survey &amp; Gazette)</td>
                      <td className="py-2 px-3">Policy &amp; Corridor Mandate</td>
                      <td className="py-2 px-3 font-medium text-[#1F7A4D]">Gazette Notification Issuance</td>
                      <td className="py-2 px-3 font-medium text-[#D98B2B]">Joint Measurement Survey</td>
                      <td className="py-2 px-3">Field Survey Demarcation</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-[#111814]">Section 19 (Declaration)</td>
                      <td className="py-2 px-3">Surveillance &amp; Lapse Alerts</td>
                      <td className="py-2 px-3 font-medium text-[#1F7A4D]">Inter-Departmental Review</td>
                      <td className="py-2 px-3 font-medium text-[#D98B2B]">Statutory Declaration Authority</td>
                      <td className="py-2 px-3">Roadblock Escalation</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-[#111814]">Section 23 (Award &amp; DBT)</td>
                      <td className="py-2 px-3">Disbursement Monitoring</td>
                      <td className="py-2 px-3 font-medium text-[#1F7A4D]">Fund Allocation Tranches</td>
                      <td className="py-2 px-3 font-medium text-[#D98B2B]">Direct Award Determination</td>
                      <td className="py-2 px-3">Beneficiary List Updating</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-[#111814]">Section 38 (Physical Possession)</td>
                      <td className="py-2 px-3">Corridor Commissioning</td>
                      <td className="py-2 px-3">Law &amp; Order Clearance</td>
                      <td className="py-2 px-3 font-medium text-[#D98B2B]">Statutory Possession Order</td>
                      <td className="py-2 px-3 font-medium text-[#2D6CDF]">Physical Handover &amp; Civil Works</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-[#111814]">AI/ML Model Calibration</td>
                      <td className="py-2 px-3 font-bold text-[#0F3D2E]">Full Retraining &amp; Thresholds</td>
                      <td className="py-2 px-3">Diagnostic Visibility</td>
                      <td className="py-2 px-3">Diagnostic Visibility</td>
                      <td className="py-2 px-3 font-medium text-[#2D6CDF]">What-If Simulation Sandbox</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-[#111814]">Audit Logs &amp; Certification</td>
                      <td className="py-2 px-3 font-bold text-[#0F3D2E]">National Audit Certification</td>
                      <td className="py-2 px-3">State Compliance Log</td>
                      <td className="py-2 px-3">District Tribunal Logs</td>
                      <td className="py-2 px-3">Field Package History</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Quick Action */}
              <div className="p-3 bg-[#F7F8F5] rounded-xl border border-[#E4E7E1] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-[#5B6660]">Ready to test under a specific cadre?</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('presets')}
                  className="px-4 py-1.5 bg-[#0F3D2E] hover:bg-[#164e3b] text-white font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <span>Select Cadre in 1-Click</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-300" />
                </button>
              </div>
            </div>
          )}

          {/* Bottom Statutory Secrecy & Compliance Strip */}
          <div className="bg-[#F7F8F5] px-5 sm:p-6 py-3 border-t border-[#E4E7E1] text-[#5B6660] flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#1F7A4D]" />
              <span className="font-semibold text-[#111814]">Role-Based Statutory Access (RBAC)</span>
            </div>
            <span>Ministry of Rural Development &bull; DoLR Government Portal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
