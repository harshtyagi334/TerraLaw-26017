import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  LandProject,
  UserRole,
  RiskCategory,
  ProjectType,
  ProjectStage,
  AlertNotification,
  AuditLogEntry,
  MLModelMetadata,
  AppUser,
  AppTheme,
  ThemeConfig,
  TelemetryEvent,
} from '../types';
import { generateSyntheticDataset } from '../utils/datasetGenerator';
import { calculateProjectPrediction } from '../utils/mlEngine';
import {
  getTrainedModelMetadata,
  predictBatchWithTrainedModel,
  predictWithTrainedModel,
  retrainTrainedModel,
} from '../utils/modelApi';
import { THEME_CONFIGS } from '../utils/themeConfig';

export type NavTab =
  | 'dashboard'
  | 'gis_map'
  | 'projects'
  | 'project_detail'
  | 'what_if'
  | 'data_ingestion'
  | 'continuous_learning'
  | 'api_explorer'
  | 'audit_trail'
  | 'citizen_portal';

export const PRESET_USERS: AppUser[] = [
  {
    id: 'USR-CENTRAL-01',
    name: 'Demo Officer — Central Role',
    email: 'demo.central@example.org',
    role: 'Central Admin',
    designation: 'Central Nodal Director (Demo Profile)',
    department: 'National Land Governance Directorate (Simulated)',
    state: 'All',
    district: 'All',
    avatarInitials: 'DC',
    rulesSummary: [
      'National Jurisdiction across all 7 monitored states & priority infrastructure corridors',
      'Authority to trigger AI/ML retraining pipeline and calibrate risk threshold parameters',
      'Access to full tamper-evident audit logs and statutory compliance verification under RFCTLARR Act',
      'Issue inter-ministerial policy directives to State Revenue Departments and PM GatiShakti portals',
    ],
  },
  {
    id: 'USR-STATE-01',
    name: 'Demo Officer — State Directorate',
    email: 'demo.state@example.org',
    role: 'State Admin',
    designation: 'State Nodal Officer (Demo Profile)',
    department: 'State Land Revenue Administration (Simulated)',
    state: 'Maharashtra',
    district: 'All',
    avatarInitials: 'DS',
    rulesSummary: [
      'State-level oversight across all 6 districts in Maharashtra',
      'Inter-departmental clearance coordination (Forest, Environment, Revenue)',
      'Section 11 gazette publication and Joint Measurement Survey (JMS) expediting',
      'Statewide compensation fund allocation and DBT disbursement tracking',
    ],
  },
  {
    id: 'USR-DISTRICT-01',
    name: 'Demo Officer — District CALA',
    email: 'demo.district@example.org',
    role: 'District Admin',
    designation: 'Competent Authority & CALA (Demo Profile)',
    department: 'District Collectorate Administration (Simulated)',
    state: 'Maharashtra',
    district: 'Pune',
    avatarInitials: 'DD',
    rulesSummary: [
      'Statutory Competent Authority for Land Acquisition (CALA) under RFCTLARR Act',
      'Section 19 declaration issuance and Section 23 financial compensation award determination',
      'Direct Benefit Transfer (DBT) verification to Project Affected Families (PAFs)',
      'Section 38 Physical Possession order issuance (statutorily requires min 80% disbursement)',
    ],
  },
  {
    id: 'USR-OFFICER-01',
    name: 'Demo Officer — Project Field Executive',
    email: 'demo.officer@example.org',
    role: 'Project Officer',
    designation: 'Senior Land Acquisition Field Officer (Demo Profile)',
    department: 'Project Implementation Agency (Simulated)',
    state: 'Maharashtra',
    district: 'Pune',
    avatarInitials: 'DP',
    rulesSummary: [
      'Ground-level package field execution and encumbrance-free handover tracking',
      'Active stage milestone updates, physical possession progress, and field constraints logging',
      'Interactive What-If Simulation sandbox to model delay mitigation strategies',
      'Fast-track dispute resolution requests and inter-agency coordination',
    ],
  },
];

interface AppContextType {
  projects: LandProject[];
  filteredProjects: LandProject[];
  selectedProject: LandProject | null;
  setSelectedProject: (p: LandProject | null) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;

  // Authentication & Officer Designation
  currentUser: AppUser | null;
  isAuthenticated: boolean;
  loginAsPreset: (role: UserRole) => void;
  loginWithCredentials: (email: string, password?: string, explicitRole?: UserRole, customDesignation?: string, customDepartment?: string) => boolean;
  signup: (userData: Omit<AppUser, 'id' | 'avatarInitials'>) => void;
  logout: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  presetUsers: AppUser[];

  // Filters
  selectedState: string;
  setSelectedState: (s: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (d: string) => void;
  selectedType: string;
  setSelectedType: (t: string) => void;
  selectedStage: string;
  setSelectedStage: (s: string) => void;
  selectedRisk: string;
  setSelectedRisk: (r: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  resetFilters: () => void;

  // Alerts & Notifications
  alerts: AlertNotification[];
  unreadAlertsCount: number;
  acknowledgeAlert: (id: string) => void;
  markAllAlertsRead: () => void;

  // Real-Time Surveillance & Field Telemetry
  isSurveillanceActive: boolean;
  toggleSurveillance: () => void;
  surveillanceIntervalSeconds: number;
  setSurveillanceIntervalSeconds: (sec: number) => void;
  lastSurveillanceSweep: string;
  telemetryStream: TelemetryEvent[];
  simulateFieldTelemetryEvent: (override?: Partial<TelemetryEvent>) => TelemetryEvent;

  // Audit Log
  auditLogs: AuditLogEntry[];
  addAuditLog: (entry: Omit<AuditLogEntry, 'log_id' | 'timestamp'>) => void;

  // ML Model
  mlModel: MLModelMetadata;
  isRetraining: boolean;
  retrainModel: () => Promise<void>;

  // Theme Customization
  appTheme: AppTheme;
  setAppTheme: (theme: AppTheme) => void;
  themeConfig: ThemeConfig;

  // Project Actions
  updateProject: (id: string, updates: Partial<LandProject>) => void;
  addProject: (newProject: Omit<LandProject, 'project_id' | 'prediction'>) => LandProject;
  importCSV: (csvContent: string) => Promise<{ imported: number; errors: string[] }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state with localStorage fallback
  const [appTheme, setAppTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('la_app_theme') as AppTheme;
      if (saved && THEME_CONFIGS[saved]) return saved;
    } catch {
      // ignore
    }
    return 'emerald_forest';
  });

  const handleSetAppTheme = (theme: AppTheme) => {
    setAppTheme(theme);
    try {
      localStorage.setItem('la_app_theme', theme);
    } catch {
      // ignore
    }
  };

  const themeConfig = useMemo(() => THEME_CONFIGS[appTheme] || THEME_CONFIGS.emerald_forest, [appTheme]);

  // Initialize synthetic dataset
  const [projects, setProjects] = useState<LandProject[]>(() => {
    return generateSyntheticDataset(700);
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('Central Admin');
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Authentication & Officer Designation State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('la_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Remap to fictional demo profiles if previously saved with real officer names
        const matched = PRESET_USERS.find((p) => p.id === parsed.id || p.role === parsed.role);
        return matched || parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('la_auth_user');
    } catch {
      return false;
    }
  });
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Filters
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStage, setSelectedStage] = useState<string>('All');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ML Model State
  const [mlModel, setMlModel] = useState<MLModelMetadata>({
    model_id: 'ML-ENS-2026-03',
    model_name: 'LA Delay Predictive Ensemble (Random Forest Classifier)',
    model_type: 'Random Forest Classifier',
    version: 'v3.0.0 (Combined Dataset Ensemble)',
    trained_on_records: 5760,
    test_records: 1440,
    total_records: 7200,
    last_retrained: '2026-09-19T14:12:20',
    accuracy: 84.4,
    precision: 90.9,
    recall: 87.2,
    f1_score: 89.0,
    roc_auc: 0.9297,
    feature_importances: [
      { feature: 'Legal Disputes Count',       weight: 0.2845 },
      { feature: 'Affected Families Count',    weight: 0.1629 },
      { feature: 'Possession %',               weight: 0.1581 },
      { feature: 'R&R Progress %',             weight: 0.1274 },
      { feature: 'Stakeholder Response Days',  weight: 0.1002 },
      { feature: 'Land Area (Hectares)',        weight: 0.0710 },
      { feature: 'Compensation Disbursed %',   weight: 0.0645 },
      { feature: 'Pending Statutory Approvals',weight: 0.0313 },
    ],
    status: 'Production',
    source_breakdown: { original: 700, expanded: 1500, historical: 5000 },
    datasets_loaded: [
      'land_acquisition_synthetic_dataset.csv',
      'expanded_land_acquisition_delays.csv',
      'historical_land_acquisition_delays.csv',
    ],
    confusion_matrix: { TP: 909, FP: 91, FN: 133, TN: 307 },
  });

  const [isRetraining, setIsRetraining] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([predictBatchWithTrainedModel(projects), getTrainedModelMetadata()])
      .then(([predictions, metadata]) => {
        if (!active || predictions.length !== projects.length) return;
        setProjects((current) =>
          current.map((project, index) => ({
            ...project,
            prediction: calculateProjectPrediction(project, predictions[index].probability_of_delay, predictions[index]),
          }))
        );
        setMlModel((previous) => ({
          ...previous,
          ...metadata,
          version: metadata.model_version || previous.version,
          total_records: metadata.total_records,
          source_breakdown: metadata.source_breakdown,
          datasets_loaded: metadata.datasets_loaded,
          confusion_matrix: metadata.confusion_matrix,
          feature_importances: Object.entries(metadata.feature_importance).map(([feature, weight]) => ({ feature, weight })),
          status: 'Production',
        }));
      })
      .catch((error) => {
        console.error('The Python ML service is unavailable:', error);
      });

    return () => {
      active = false;
    };
  }, []);

  // Initial Automated Alerts (derived from high-risk projects)
  const [alerts, setAlerts] = useState<AlertNotification[]>(() => {
    return [
      {
        id: 'ALT-101',
        project_id: 'LA505',
        project_name: 'Industrial Node - Gujarat (Pkg-6)',
        severity: 'Critical',
        title: 'Project Escalated to High Risk (Risk Score: 71)',
        message: '8 pending legal disputes challenging land acquisition award with 4 pending statutory clearances.',
        timestamp: '10 mins ago',
        is_read: false,
        acknowledged: false,
        trigger_type: 'Risk_Threshold',
      },
      {
        id: 'ALT-102',
        project_id: 'LA511',
        project_name: 'Power Transmission Link - Madhya Pradesh (Pkg-3)',
        severity: 'Critical',
        title: 'High-Impact Legal Disputes Filed (9 Disputes)',
        message: 'Multiple writ petitions filed in High Court challenging Section 19 declaration.',
        timestamp: '45 mins ago',
        is_read: false,
        acknowledged: false,
        trigger_type: 'Legal_Dispute',
      },
      {
        id: 'ALT-103',
        project_id: 'LA518',
        project_name: 'Railway Freight Corridor - Tamil Nadu (Pkg-1)',
        severity: 'Warning',
        title: 'Statutory SLA Exceeded for Clearances',
        message: '6 statutory clearances pending with compensation disbursement at 29.5%.',
        timestamp: '2 hours ago',
        is_read: false,
        acknowledged: false,
        trigger_type: 'SLA_Breach',
      },
      {
        id: 'ALT-104',
        project_id: 'LA527',
        project_name: 'Railway Doubling Package - Uttar Pradesh (Pkg-1)',
        severity: 'Critical',
        title: 'High Risk Escalation (Risk Score: 74)',
        message: '8 legal disputes and 3 pending clearances stalling physical possession.',
        timestamp: '5 hours ago',
        is_read: true,
        acknowledged: true,
        trigger_type: 'Disbursement_Stalled',
      },
    ];
  });

  // Comprehensive Audit Log
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      log_id: 'LOG-8801',
      user_id: 'USR-CENTRAL-01',
      user_role: 'Central Admin',
      action: 'RETRAIN',
      entity_type: 'MLModel',
      entity_id: 'v2.0.0',
      timestamp: '2025-02-12 14:30:00',
      details: 'Continuous learning pipeline triggered. Model retrained on 560 completed project records (140 held-out test records). Version v2.0.0 calibrated with ROC-AUC 80.8% and Accuracy 75.7%.',
    },
    {
      log_id: 'LOG-8802',
      user_id: 'USR-MAHA-04',
      user_role: 'State Admin',
      action: 'UPDATE',
      entity_type: 'Compensation',
      entity_id: 'CMP-LA003',
      old_value: 'disbursed_cr: 12.4',
      new_value: 'disbursed_cr: 16.8',
      timestamp: '2025-02-14 09:15:22',
      details: 'Direct Benefit Transfer tranche 2 disbursed to 142 landholders in Haveli block.',
    },
    {
      log_id: 'LOG-8803',
      user_id: 'USR-DIST-PUNE-01',
      user_role: 'District Admin',
      action: 'STAGE_ADVANCE',
      entity_type: 'Project',
      entity_id: 'LA009',
      old_value: 'Survey',
      new_value: 'Compensation',
      timestamp: '2025-02-15 11:40:10',
      details: 'Joint Measurement Survey (JMS) gazette notification published under Section 11.',
    },
  ]);

  const addAuditLog = (entry: Omit<AuditLogEntry, 'log_id' | 'timestamp'>) => {
    const newLog: AuditLogEntry = {
      ...entry,
      log_id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Real-Time Surveillance & Field Telemetry State
  const [isSurveillanceActive, setIsSurveillanceActive] = useState<boolean>(true);
  const [surveillanceIntervalSeconds, setSurveillanceIntervalSeconds] = useState<number>(15);
  const [lastSurveillanceSweep, setLastSurveillanceSweep] = useState<string>(() =>
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [telemetryStream, setTelemetryStream] = useState<TelemetryEvent[]>([
    {
      id: 'TEL-901',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      timeAgo: '1 min ago',
      project_id: 'LA003',
      project_name: 'Pune Ring Road Corridor Pkg-3',
      event_type: 'Drone_Survey',
      severity: 'Success',
      message: 'High-resolution LiDAR & photogrammetry orthomosaic uploaded. 98.4% alignment matched.',
      district: 'Pune',
      state: 'Maharashtra',
      statutory_clause: 'Survey & Joint Measurement',
    },
    {
      id: 'TEL-902',
      timestamp: new Date(Date.now() - 240000).toISOString(),
      timeAgo: '4 mins ago',
      project_id: 'LA012',
      project_name: 'Western Dedicated Freight Corridor (JNPT Link)',
      event_type: 'Court_Order',
      severity: 'Critical',
      message: 'High Court Writ Petition WP-2025/114 admitted challenging Section 19 declaration notice.',
      district: 'Raigad',
      state: 'Maharashtra',
      statutory_clause: 'RFCTLARR Sec 19(7)',
    },
    {
      id: 'TEL-903',
      timestamp: new Date(Date.now() - 720000).toISOString(),
      timeAgo: '12 mins ago',
      project_id: 'LA007',
      project_name: 'Nagpur-Mumbai Samruddhi Expressway (Phase 2)',
      event_type: 'Compensation_Disbursed',
      severity: 'Success',
      message: 'PFMS direct bank credit tranche of ₹4.82 Cr disbursed to 68 Project Affected Families (PAFs).',
      district: 'Nagpur',
      state: 'Maharashtra',
      statutory_clause: 'RFCTLARR Sec 38',
    },
    {
      id: 'TEL-904',
      timestamp: new Date(Date.now() - 1680000).toISOString(),
      timeAgo: '28 mins ago',
      project_id: 'LA018',
      project_name: 'Nashik Agro-Logistics Multi-Modal Park',
      event_type: 'Gazette_Notification',
      severity: 'Info',
      message: 'Section 11(1) preliminary acquisition notification gazetted in Maharashtra Gazette No. 42.',
      district: 'Nashik',
      state: 'Maharashtra',
      statutory_clause: 'RFCTLARR Sec 11',
    },
    {
      id: 'TEL-905',
      timestamp: new Date(Date.now() - 2700000).toISOString(),
      timeAgo: '45 mins ago',
      project_id: 'LA025',
      project_name: 'Metro Line 4 Extension (Ghodbunder Road)',
      event_type: 'Pillar_GeoTagged',
      severity: 'Info',
      message: 'Differential GPS (DGPS) physical boundary pillars geo-tagged across 42.5 hectares.',
      district: 'Thane',
      state: 'Maharashtra',
    },
    {
      id: 'TEL-906',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      timeAgo: '1 hour ago',
      project_id: 'LA031',
      project_name: 'Solapur Ultra Mega Solar Park (Grid Link)',
      event_type: 'SLA_Breach',
      severity: 'Warning',
      message: 'Stage-I Forest Rights Act (FRA) clearance elapsed 194 days vs standard 90-day SLA.',
      district: 'Solapur',
      state: 'Maharashtra',
      statutory_clause: 'Forest Conservation Act 1980',
    },
    {
      id: 'TEL-907',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      timeAgo: '2 hours ago',
      project_id: 'LA009',
      project_name: 'Industrial Node - Gujarat (Pkg-6)',
      event_type: 'Statutory_Clearance',
      severity: 'Success',
      message: 'Joint Measurement Survey (JMS) verified and ratified by CALA.',
      district: 'Ahmedabad',
      state: 'Gujarat',
      statutory_clause: 'RFCTLARR Sec 15',
    },
  ]);

  const toggleSurveillance = () => {
    setIsSurveillanceActive((prev) => {
      const next = !prev;
      addAuditLog({
        user_id: currentUser?.id || 'SYS-SURVEILLANCE',
        user_role: userRole,
        action: 'REALTIME_SURVEILLANCE',
        entity_type: 'Surveillance_Engine',
        entity_id: 'SURV-NODE-01',
        details: `Surveillance node state toggled to ${next ? 'ACTIVE' : 'PAUSED'}.`,
      });
      return next;
    });
  };

  // Background Surveillance Simulation / SLA Tripwire Scanner
  useEffect(() => {
    if (!isSurveillanceActive) return;

    const intervalId = setInterval(() => {
      const nowStr = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastSurveillanceSweep(nowStr);

      const sampleEvents: Array<Omit<TelemetryEvent, 'id' | 'timestamp' | 'timeAgo'>> = [
        {
          project_id: 'LA005',
          project_name: 'Pune-Bengaluru Industrial Corridor (Ph-1)',
          event_type: 'Drone_Survey',
          severity: 'Success',
          message: 'Cadastral drone survey verified 114 land parcel boundaries with zero boundary overlap.',
          district: 'Pune',
          state: 'Maharashtra',
          statutory_clause: 'RFCTLARR Sec 12',
        },
        {
          project_id: 'LA511',
          project_name: 'Power Transmission Link - Madhya Pradesh',
          event_type: 'Court_Order',
          severity: 'Critical',
          message: 'High Court stayed physical possession citing Section 38 non-compliance (disbursement < 80%).',
          district: 'Bhopal',
          state: 'Madhya Pradesh',
          statutory_clause: 'RFCTLARR Sec 38',
        },
        {
          project_id: 'LA014',
          project_name: 'Delhi-Mumbai Expressway Spur (Palghar Package)',
          event_type: 'Compensation_Disbursed',
          severity: 'Success',
          message: '₹6.15 Cr compensation credited directly to 84 Project Affected Families via Aadhaar-DBT.',
          district: 'Palghar',
          state: 'Maharashtra',
          statutory_clause: 'Direct Benefit Transfer (DBT)',
        },
        {
          project_id: 'LA505',
          project_name: 'Industrial Node - Gujarat (Pkg-6)',
          event_type: 'SLA_Breach',
          severity: 'Warning',
          message: 'Section 11 notification approaching 11th month. Risk of statutory lapse under Sec 19(7) within 30 days.',
          district: 'Ahmedabad',
          state: 'Gujarat',
          statutory_clause: 'RFCTLARR Sec 19(7)',
        },
        {
          project_id: 'LA022',
          project_name: 'Coastal Road Phase 2 Connecting Link',
          event_type: 'Statutory_Clearance',
          severity: 'Success',
          message: 'CRZ (Coastal Regulation Zone) Stage-II clearance approved by MoEFCC.',
          district: 'Mumbai Suburban',
          state: 'Maharashtra',
          statutory_clause: 'CRZ Clearance',
        },
      ];

      const picked = sampleEvents[Math.floor(Math.random() * sampleEvents.length)];
      const newEvent: TelemetryEvent = {
        ...picked,
        id: `TEL-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        timeAgo: 'Just now',
      };

      setTelemetryStream((prev) => [newEvent, ...prev.slice(0, 24)]);

      // If event is Critical, auto-dispatch an alert into the real-time alerts feed!
      if (picked.severity === 'Critical') {
        const newAlert: AlertNotification = {
          id: `ALT-SURV-${Math.floor(1000 + Math.random() * 9000)}`,
          project_id: picked.project_id,
          project_name: picked.project_name,
          severity: 'Critical',
          title: `Surveillance Tripwire: ${picked.event_type.replace('_', ' ')}`,
          message: picked.message,
          timestamp: 'Just now',
          is_read: false,
          acknowledged: false,
          trigger_type: 'Realtime_Surveillance',
        };
        setAlerts((prevAlerts) => [newAlert, ...prevAlerts]);
      }
    }, surveillanceIntervalSeconds * 1000);

    return () => clearInterval(intervalId);
  }, [isSurveillanceActive, surveillanceIntervalSeconds]);

  const simulateFieldTelemetryEvent = (override?: Partial<TelemetryEvent>): TelemetryEvent => {
    const templates: Array<Omit<TelemetryEvent, 'id' | 'timestamp' | 'timeAgo'>> = [
      {
        project_id: 'LA003',
        project_name: 'Pune Ring Road Corridor (Package 3)',
        event_type: 'Court_Order',
        severity: 'Critical',
        message: 'High Court issued interim stay order on 4 survey numbers pending market value inquiry.',
        district: 'Pune',
        state: 'Maharashtra',
        statutory_clause: 'RFCTLARR Sec 19',
      },
      {
        project_id: 'LA007',
        project_name: 'Nagpur-Mumbai Samruddhi Expressway (Phase 2)',
        event_type: 'Compensation_Disbursed',
        severity: 'Success',
        message: 'Direct Benefit Transfer tranche of ₹8.40 Cr credited to 120 landholders in Nagpur division.',
        district: 'Nagpur',
        state: 'Maharashtra',
        statutory_clause: 'RFCTLARR Sec 38',
      },
      {
        project_id: 'LA018',
        project_name: 'Nashik Agro-Logistics Multi-Modal Park',
        event_type: 'Drone_Survey',
        severity: 'Success',
        message: 'Drone survey 3D elevation point cloud generated for 180 hectares; slope obstruction cleared.',
        district: 'Nashik',
        state: 'Maharashtra',
      },
      {
        project_id: 'LA518',
        project_name: 'Railway Freight Corridor - Tamil Nadu',
        event_type: 'SLA_Breach',
        severity: 'Warning',
        message: 'Statutory SLA for Revenue Record Mutation exceeded 120-day limit in CALA office.',
        district: 'Chennai',
        state: 'Tamil Nadu',
        statutory_clause: 'State Revenue Code',
      },
    ];

    const chosen = override || templates[Math.floor(Math.random() * templates.length)];
    const event: TelemetryEvent = {
      id: `TEL-SIM-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      timeAgo: 'Just now',
      project_id: chosen.project_id || 'LA003',
      project_name: chosen.project_name || 'Pune Ring Road Corridor',
      event_type: chosen.event_type || 'Court_Order',
      severity: chosen.severity || 'Critical',
      message: chosen.message || 'Simulated field incident detected by surveillance engine.',
      district: chosen.district || 'Pune',
      state: chosen.state || 'Maharashtra',
      statutory_clause: chosen.statutory_clause || 'RFCTLARR Act 2013',
    };

    setTelemetryStream((prev) => [event, ...prev.slice(0, 24)]);

    if (event.severity === 'Critical' || event.severity === 'Warning') {
      const simAlert: AlertNotification = {
        id: `ALT-SIM-${Math.floor(1000 + Math.random() * 9000)}`,
        project_id: event.project_id,
        project_name: event.project_name,
        severity: event.severity,
        title: `Real-Time Incident: ${event.event_type.replace('_', ' ')}`,
        message: event.message,
        timestamp: 'Just now',
        is_read: false,
        acknowledged: false,
        trigger_type: 'Realtime_Surveillance',
      };
      setAlerts((prev) => [simAlert, ...prev]);
    }

    addAuditLog({
      user_id: currentUser?.id || 'USR-DEMO',
      user_role: userRole,
      action: 'REALTIME_SURVEILLANCE',
      entity_type: 'Surveillance_Engine',
      entity_id: event.id,
      details: `Field telemetry simulated: [${event.event_type}] ${event.message} on ${event.project_name}.`,
    });

    return event;
  };

  const handleSetUserRole = (role: UserRole) => {
    setUserRole(role);
    const matching = PRESET_USERS.find((u) => u.role === role);
    if (matching) {
      setCurrentUser(matching);
    }
  };

  const saveUserSession = (user: AppUser) => {
    try {
      localStorage.setItem('la_auth_user', JSON.stringify(user));
    } catch {
      // ignore
    }
  };

  const loginAsPreset = (role: UserRole) => {
    const matched = PRESET_USERS.find((u) => u.role === role) || PRESET_USERS[0];
    setCurrentUser(matched);
    setUserRole(role);
    setIsAuthenticated(true);
    setShowAuthModal(false);
    saveUserSession(matched);

    if (role === 'State Admin') {
      setSelectedState('Maharashtra');
      setSelectedDistrict('All');
    } else if (role === 'District Admin') {
      setSelectedState('Maharashtra');
      setSelectedDistrict('Pune');
    } else if (role === 'Project Officer') {
      setSelectedState('Maharashtra');
      setSelectedDistrict('Pune');
    } else {
      setSelectedState('All');
      setSelectedDistrict('All');
    }

    addAuditLog({
      user_id: matched.id,
      user_role: matched.role,
      action: 'LOGIN',
      entity_type: 'Officer_Session',
      entity_id: matched.id,
      details: `Officer ${matched.name} authenticated with designation '${matched.designation}' (${matched.role}).`,
    });
  };

  const loginWithCredentials = (
    email: string,
    password?: string,
    explicitRole?: UserRole,
    customDesignation?: string,
    customDepartment?: string
  ): boolean => {
    const trimmed = email.trim().toLowerCase();
    const existing = PRESET_USERS.find(
      (u) =>
        u.email.toLowerCase() === trimmed ||
        (trimmed === 'rajesh.varma@nic.in' && u.role === 'Central Admin') ||
        (trimmed === 'anjali.deshmukh@maharashtra.gov.in' && u.role === 'State Admin') ||
        (trimmed === 'patil.vikram@nic.in' && u.role === 'District Admin') ||
        (trimmed === 'amit.shinde@nhai.gov.in' && u.role === 'Project Officer')
    );
    if (existing && !explicitRole) {
      setCurrentUser(existing);
      setUserRole(existing.role);
      setIsAuthenticated(true);
      setShowAuthModal(false);
      saveUserSession(existing);
      addAuditLog({
        user_id: existing.id,
        user_role: existing.role,
        action: 'LOGIN',
        entity_type: 'Officer_Session',
        entity_id: existing.id,
        details: `Official login: ${existing.name} (${existing.designation}).`,
      });
      return true;
    }

    let detectedRole: UserRole = explicitRole || 'Central Admin';
    let desig = customDesignation || 'Officer on Special Duty (OSD)';
    let dept = customDepartment || 'Department of Land Resources (DoLR)';

    if (!explicitRole) {
      if (trimmed.includes('state') || trimmed.includes('revenue') || trimmed.includes('maha')) {
        detectedRole = 'State Admin';
        desig = 'State Land Revenue Officer';
        dept = 'State Revenue Department';
      } else if (trimmed.includes('district') || trimmed.includes('collector') || trimmed.includes('cala')) {
        detectedRole = 'District Admin';
        desig = 'Sub-Divisional Magistrate & CALA';
        dept = 'District Revenue Administration';
      } else if (trimmed.includes('officer') || trimmed.includes('nhai') || trimmed.includes('rail')) {
        detectedRole = 'Project Officer';
        desig = 'Land Acquisition Field Officer';
        dept = 'Project Implementation Unit';
      }
    }

    if (!customDesignation) {
      if (detectedRole === 'Central Admin') desig = 'Joint Secretary & Central Nodal Director';
      else if (detectedRole === 'State Admin') desig = 'State Nodal Officer & Principal Secretary (Revenue)';
      else if (detectedRole === 'District Admin') desig = 'District Collector & District Magistrate (CALA)';
      else if (detectedRole === 'Project Officer') desig = 'Senior Land Acquisition Officer & Implementing Executive';
    }

    if (!customDepartment) {
      if (detectedRole === 'Central Admin') dept = 'Department of Land Resources (DoLR), Ministry of Rural Development';
      else if (detectedRole === 'State Admin') dept = 'Revenue & Forest Department, Govt. of Maharashtra';
      else if (detectedRole === 'District Admin') dept = 'District Collectorate, Pune';
      else if (detectedRole === 'Project Officer') dept = 'National Highways Authority of India (NHAI)';
    }

    const namePart = email.split('@')[0].replace(/[._-]/g, ' ') || 'Official Officer';
    const formattedName = namePart
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    const initials =
      formattedName
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'GO';

    const newUser: AppUser = {
      id: `USR-${Date.now()}`,
      name: formattedName,
      email: email,
      role: detectedRole,
      designation: desig,
      department: dept,
      state: detectedRole === 'State Admin' || detectedRole === 'District Admin' || detectedRole === 'Project Officer' ? 'Maharashtra' : 'All',
      district: detectedRole === 'District Admin' || detectedRole === 'Project Officer' ? 'Pune' : 'All',
      avatarInitials: initials,
      rulesSummary: [
        `Operational access under ${detectedRole} statutory rules and guidelines`,
        'Authorized to perform delay early-warning surveillance and generate reports',
        'Direct integration with RFCTLARR compliance and decision-support pipeline',
      ],
    };

    setCurrentUser(newUser);
    setUserRole(detectedRole);
    setIsAuthenticated(true);
    setShowAuthModal(false);
    saveUserSession(newUser);

    if (detectedRole === 'State Admin') {
      setSelectedState('Maharashtra');
      setSelectedDistrict('All');
    } else if (detectedRole === 'District Admin' || detectedRole === 'Project Officer') {
      setSelectedState('Maharashtra');
      setSelectedDistrict('Pune');
    } else {
      setSelectedState('All');
      setSelectedDistrict('All');
    }

    addAuditLog({
      user_id: newUser.id,
      user_role: newUser.role,
      action: 'LOGIN',
      entity_type: 'Officer_Session',
      entity_id: newUser.id,
      details: `Officer ${newUser.name} (${newUser.designation}) authenticated into portal as ${detectedRole}.`,
    });
    return true;
  };

  const signup = (userData: Omit<AppUser, 'id' | 'avatarInitials'>) => {
    const initials =
      userData.name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'OF';

    const newUser: AppUser = {
      ...userData,
      id: `USR-REG-${Date.now()}`,
      avatarInitials: initials,
    };

    setCurrentUser(newUser);
    setUserRole(newUser.role);
    setIsAuthenticated(true);
    setShowAuthModal(false);
    saveUserSession(newUser);

    if (newUser.state && newUser.state !== 'All') {
      setSelectedState(newUser.state);
    }
    if (newUser.district && newUser.district !== 'All') {
      setSelectedDistrict(newUser.district);
    }

    addAuditLog({
      user_id: newUser.id,
      user_role: newUser.role,
      action: 'REGISTER',
      entity_type: 'Officer_Session',
      entity_id: newUser.id,
      details: `New official registered: ${newUser.name}, Designation: ${newUser.designation} (${newUser.role}), Dept: ${newUser.department}.`,
    });
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog({
        user_id: currentUser.id,
        user_role: currentUser.role,
        action: 'LOGOUT',
        entity_type: 'Officer_Session',
        entity_id: currentUser.id,
        details: `Officer ${currentUser.name} signed out.`,
      });
    }
    try {
      localStorage.removeItem('la_auth_user');
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
    setShowAuthModal(true);
  };

  const selectedProject = useMemo(() => {
    if (!selectedProjectId) {
      // default to first high-risk ongoing project or first project
      const ongoing = projects.find((p) => p.project_status === 'Ongoing' && (p.prediction?.risk_score ?? 0) >= 65);
      return ongoing || projects[0] || null;
    }
    return projects.find((p) => p.project_id === selectedProjectId) || projects[0] || null;
  }, [projects, selectedProjectId]);

  const setSelectedProject = (p: LandProject | null) => {
    setSelectedProjectId(p ? p.project_id : null);
  };

  const unreadAlertsCount = useMemo(() => {
    return alerts.filter((a) => !a.is_read).length;
  }, [alerts]);

  const acknowledgeAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true, is_read: true } : a))
    );
    addAuditLog({
      user_id: `USR-${userRole.replace(/\s+/g, '-').toUpperCase()}`,
      user_role: userRole,
      action: 'UPDATE',
      entity_type: 'Project',
      entity_id: id,
      details: `Alert ${id} acknowledged and marked as addressed.`,
    });
  };

  const markAllAlertsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
  };

  const resetFilters = () => {
    setSelectedState('All');
    setSelectedDistrict('All');
    setSelectedType('All');
    setSelectedStage('All');
    setSelectedRisk('All');
    setSearchQuery('');
  };

  // Filtered projects based on active filters and Role-Based Access Control (RBAC)
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Role scope filter
      if (userRole === 'State Admin' && p.state !== 'Maharashtra') {
        // As an example of State Admin scoping to Maharashtra
        return false;
      }
      if (userRole === 'District Admin' && (p.state !== 'Maharashtra' || p.district !== 'Pune')) {
        // District Admin scoped to Pune
        return false;
      }

      // UI Filters
      if (selectedState !== 'All' && p.state !== selectedState) return false;
      if (selectedDistrict !== 'All' && p.district !== selectedDistrict) return false;
      if (selectedType !== 'All' && p.project_type !== selectedType) return false;
      if (selectedStage !== 'All' && p.current_stage !== selectedStage) return false;
      if (selectedRisk !== 'All' && p.prediction?.risk_category !== selectedRisk) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = p.project_name.toLowerCase().includes(query);
        const matchId = p.project_id.toLowerCase().includes(query);
        const matchDistrict = p.district.toLowerCase().includes(query);
        const matchType = p.project_type.toLowerCase().includes(query);
        if (!matchName && !matchId && !matchDistrict && !matchType) return false;
      }

      return true;
    });
  }, [
    projects,
    userRole,
    selectedState,
    selectedDistrict,
    selectedType,
    selectedStage,
    selectedRisk,
    searchQuery,
  ]);

  // Project update
  const updateProject = (id: string, updates: Partial<LandProject>) => {
    const projectToScore = projects.find((project) => project.project_id === id);
    setProjects((prev) =>
      prev.map((p) => {
        if (p.project_id !== id) return p;
        const updated = { ...p, ...updates, last_updated_date: new Date().toISOString().split('T')[0] };
        // Recalculate prediction
        updated.prediction = calculateProjectPrediction(updated);
        return updated;
      })
    );

    if (projectToScore) {
      const updatedProject = { ...projectToScore, ...updates };
      void predictWithTrainedModel(updatedProject)
        .then((prediction) => {
          setProjects((prev) =>
            prev.map((project) =>
              project.project_id === id
                ? { ...project, prediction: calculateProjectPrediction(project, prediction.probability_of_delay, prediction) }
                : project
            )
          );
        })
        .catch(() => {
          // Keep the local prediction when the model service is unavailable.
        });
    }

    addAuditLog({
      user_id: `USR-${userRole.replace(/\s+/g, '-').toUpperCase()}`,
      user_role: userRole,
      action: 'UPDATE',
      entity_type: 'Project',
      entity_id: id,
      details: `Project parameters updated via ${userRole} interface. ML prediction automatically recalculated.`,
    });
  };

  const addProject = (newProjectData: Omit<LandProject, 'project_id' | 'prediction'>): LandProject => {
    const nextId = `LA${String(projects.length + 1).padStart(3, '0')}`;
    const fullProject: LandProject = {
      ...newProjectData,
      project_id: nextId,
    };
    fullProject.prediction = calculateProjectPrediction(fullProject);

    setProjects((prev) => [fullProject, ...prev]);

    void predictWithTrainedModel(fullProject)
      .then((prediction) => {
        setProjects((prev) =>
          prev.map((project) =>
            project.project_id === nextId
              ? { ...project, prediction: calculateProjectPrediction(project, prediction.probability_of_delay, prediction) }
              : project
          )
        );
      })
      .catch(() => {
        // Keep the local prediction when the model service is unavailable.
      });

    addAuditLog({
      user_id: `USR-${userRole.replace(/\s+/g, '-').toUpperCase()}`,
      user_role: userRole,
      action: 'CREATE',
      entity_type: 'Project',
      entity_id: nextId,
      details: `New project ${fullProject.project_name} registered in ${fullProject.district}, ${fullProject.state}.`,
    });

    return fullProject;
  };

  // Continuous Learning: Retrain Model
  const retrainModel = async () => {
    setIsRetraining(true);
    setMlModel((prev) => ({ ...prev, status: 'Training' }));
    const metadata = await retrainTrainedModel();
    const predictions = await predictBatchWithTrainedModel(projects);
    setMlModel((previous) => ({
      ...previous,
      ...metadata,
      version: metadata.model_version || previous.version,
      total_records: metadata.total_records,
      source_breakdown: metadata.source_breakdown,
      datasets_loaded: metadata.datasets_loaded,
      confusion_matrix: metadata.confusion_matrix,
      feature_importances: Object.entries(metadata.feature_importance).map(([feature, weight]) => ({ feature, weight })),
      last_retrained: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Production',
    }));
    setProjects((previous) => previous.map((project, index) => ({
      ...project,
      prediction: calculateProjectPrediction(project, predictions[index].probability_of_delay, predictions[index]),
    })));
    setIsRetraining(false);

    addAuditLog({
      user_id: `USR-${userRole.replace(/\s+/g, '-').toUpperCase()}`,
      user_role: userRole,
      action: 'RETRAIN',
      entity_type: 'MLModel',
      entity_id: 'trained_model.pkl',
      details: `Python Random Forest retrained on ${metadata.trained_on_records} records with ROC-AUC ${(metadata.roc_auc * 100).toFixed(1)}% and Accuracy ${metadata.accuracy.toFixed(1)}%.`,
    });
  };

  // CSV Ingestion
  const importCSV = async (csvContent: string): Promise<{ imported: number; errors: string[] }> => {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      return { imported: 0, errors: ['CSV file is empty or missing data rows.'] };
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const importedProjects: LandProject[] = [];
    const errors: string[] = [];
    const importedIds = new Set<string>();
    const field = (row: Record<string, string>, ...names: string[]): string => {
      for (const name of names) {
        if (row[name] !== undefined && row[name].trim() !== '') return row[name].trim();
      }
      return '';
    };
    const parseNumber = (value: string | undefined, fallback?: number): number | undefined => {
      if (value === undefined || value.trim() === '') return fallback;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Basic CSV splitter handling quotes
      const values: string[] = [];
      let inQuotes = false;
      let curVal = '';
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(curVal.trim().replace(/^"|"$/g, ''));
          curVal = '';
        } else {
          curVal += char;
        }
      }
      values.push(curVal.trim().replace(/^"|"$/g, ''));

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });

      const projectId = field(row, 'project_id', 'Project ID', 'projectId') || `LA${String(projects.length + importedProjects.length + 1).padStart(3, '0')}`;
      if (importedIds.has(projectId)) {
        errors.push(`Row ${i + 1}: duplicate project_id '${projectId}' skipped.`);
        continue;
      }
      importedIds.add(projectId);
      const projectName = field(row, 'project_name', 'Project Name') || `Ingested Land Project ${projectId}`;
      const pType = (field(row, 'project_type', 'Project Type') as ProjectType) || 'Highway';
      const state = field(row, 'state', 'State') || 'Maharashtra';
      const district = field(row, 'district', 'District') || 'Pune';
      const landArea = parseNumber(field(row, 'land_area_hectares', 'Land Area (Ha)', 'Land Area (Hectares)'), 100)!;
      const families = parseNumber(field(row, 'affected_families', 'affected_families_count', 'Affected Families'), 200)!;
      const compDisbursedPct = parseNumber(field(row, 'compensation_disbursed_pct', 'Compensation Disbursed (%)', 'Compensation Disbursed %'), 40)!;
      const pendingApprovals = parseNumber(field(row, 'pending_approvals_count', 'Pending Approvals'), 0)!;
      const legalDisputes = parseNumber(field(row, 'legal_disputes_count', 'Active Legal Writs', 'Legal Disputes'), 0)!;
      const possessionPct = parseNumber(field(row, 'possession_pct', 'possession_percentage', 'Physical Possession %'), 0)!;
      const rrProgressPct = parseNumber(field(row, 'rr_progress_pct', 'Rehabilitation Progress %'), 0)!;
      const status = (field(row, 'project_status', 'Status') as 'Completed' | 'Ongoing') || 'Ongoing';

      const fullProj: LandProject = {
        project_id: projectId,
        project_name: projectName,
        project_type: pType,
        state,
        district,
        block: 'Block-Central',
        geo_location: {
          lat: 19.0 + Math.random() * 2,
          lng: 73.0 + Math.random() * 3,
          district,
          state,
        },
        land_area_hectares: landArea,
        affected_families_count: families,
        start_date: '2023-01-10',
        planned_end_date: field(row, 'planned_completion_date', 'Planned End Date') || '2025-12-31',
        actual_end_date: field(row, 'actual_completion_date', 'Actual End Date') || null,
        actual_delay_days: field(row, 'actual_delay_days', 'Actual Delay Days') ? parseInt(field(row, 'actual_delay_days', 'Actual Delay Days'), 10) : null,
        current_stage: status === 'Completed' ? 'Completed' : 'Compensation',
        project_status: status,
        last_updated_date: new Date().toISOString().split('T')[0],
        approvals: Array.from({ length: pendingApprovals }).map((_, aIdx) => ({
          approval_id: `APP-${projectId}-${aIdx + 1}`,
          approval_type: 'Forest',
          status: 'Pending',
          applied_date: '2023-02-15',
          delay_days: 60,
        })),
        compensation: {
          compensation_id: `CMP-${projectId}`,
          total_compensation_assessed_cr: parseFloat((landArea * 1.2).toFixed(2)),
          total_compensation_disbursed_cr: parseFloat(((landArea * 1.2 * compDisbursedPct) / 100).toFixed(2)),
          families_paid_count: Math.round((families * compDisbursedPct) / 100),
          families_pending_count: families - Math.round((families * compDisbursedPct) / 100),
          disputed_cases_count: legalDisputes,
          last_updated_date: new Date().toISOString().split('T')[0],
        },
        legal_disputes: Array.from({ length: legalDisputes }).map((_, lIdx) => ({
          case_id: `WP-${2000 + lIdx}/${projectId}`,
          case_type: 'Ownership',
          status: 'Pending',
          filed_date: '2023-04-10',
          court_level: 'High Court',
        })),
        possession: {
          possession_id: `POS-${projectId}`,
          possession_percentage: possessionPct,
          encumbrance_free_area_ha: (landArea * possessionPct) / 100,
        },
        rehabilitation: {
          rr_id: `RR-${projectId}`,
          total_affected_families: families,
          families_rehabilitated: Math.round((families * rrProgressPct) / 100),
          families_pending: families - Math.round((families * rrProgressPct) / 100),
          rr_status: rrProgressPct >= 90 ? 'Completed' : 'In Progress',
          r_and_r_center_ready: rrProgressPct > 50,
        },
        stakeholder_responsiveness: {
          avg_response_time_days: 14,
          missed_meetings_count: parseNumber(field(row, 'missed_meetings_count', 'Missed Meetings'), 0)!,
          escalation_count: parseNumber(field(row, 'escalation_count', 'Escalations'), 0)!,
        },
      };

      importedProjects.push(fullProj);
    }

    if (importedProjects.length > 0) {
      const predictions = await predictBatchWithTrainedModel(importedProjects);
      importedProjects.forEach((project, index) => {
        const prediction = predictions[index];
        project.prediction = calculateProjectPrediction(project, prediction.probability_of_delay, prediction);
        console.info('[CSV ML VALIDATION]', {
          projectId: project.project_id,
          uploadedValues: {
            landArea: project.land_area_hectares,
            compensationPct: Number(((project.compensation.total_compensation_disbursed_cr / project.compensation.total_compensation_assessed_cr) * 100).toFixed(2)),
            possessionPct: project.possession.possession_percentage,
            pendingApprovals: project.approvals.length,
            legalDisputes: project.legal_disputes.length,
            rrProgressPct: Number(((project.rehabilitation.families_rehabilitated / Math.max(1, project.rehabilitation.total_affected_families)) * 100).toFixed(2)),
          },
          processedValues: {
            features: prediction.shap_values?.map((item) => item.feature),
            stageProbabilities: prediction.stage_probabilities,
          },
          predictedValues: {
            probabilityOfDelay: prediction.probability_of_delay,
            riskScore: prediction.risk_score,
            riskCategory: project.prediction.risk_category,
          },
        });
      });
      setProjects((prev) => {
        const incomingIds = new Set(importedProjects.map((project) => project.project_id));
        return [...importedProjects, ...prev.filter((project) => !incomingIds.has(project.project_id))];
      });
      addAuditLog({
        user_id: `USR-${userRole.replace(/\s+/g, '-').toUpperCase()}`,
        user_role: userRole,
        action: 'IMPORT',
        entity_type: 'Project',
        entity_id: `BATCH-${Date.now()}`,
        details: `Batch ingestion completed: ${importedProjects.length} projects imported and validated via Land Acquisition Management System schema parser.`,
      });
    }

    return { imported: importedProjects.length, errors };
  };

  return (
    <AppContext.Provider
      value={{
        projects,
        filteredProjects,
        selectedProject,
        setSelectedProject,
        userRole,
        setUserRole: handleSetUserRole,
        activeTab,
        setActiveTab,
        currentUser,
        isAuthenticated,
        loginAsPreset,
        loginWithCredentials,
        signup,
        logout,
        showAuthModal,
        setShowAuthModal,
        presetUsers: PRESET_USERS,
        selectedState,
        setSelectedState,
        selectedDistrict,
        setSelectedDistrict,
        selectedType,
        setSelectedType,
        selectedStage,
        setSelectedStage,
        selectedRisk,
        setSelectedRisk,
        searchQuery,
        setSearchQuery,
        resetFilters,
        alerts,
        unreadAlertsCount,
        acknowledgeAlert,
        markAllAlertsRead,
        isSurveillanceActive,
        toggleSurveillance,
        surveillanceIntervalSeconds,
        setSurveillanceIntervalSeconds,
        lastSurveillanceSweep,
        telemetryStream,
        simulateFieldTelemetryEvent,
        auditLogs,
        addAuditLog,
        mlModel,
        isRetraining,
        retrainModel,
        appTheme,
        setAppTheme: handleSetAppTheme,
        themeConfig,
        updateProject,
        addProject,
        importCSV,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
