export type ProjectType =
  | 'Highway'
  | 'Railway'
  | 'Power'
  | 'Irrigation'
  | 'Industrial'
  | 'Urban'
  | 'Rural'
  | 'Other';

export type ProjectStatus = 'Completed' | 'Ongoing';

export type ProjectStage =
  | 'Notification'
  | 'Survey'
  | 'Compensation'
  | 'Possession'
  | 'R&R'
  | 'Completed';

export type RiskCategory = 'Low' | 'Medium' | 'High';

export type UserRole =
  | 'Central Admin'
  | 'State Admin'
  | 'District Admin'
  | 'Project Officer';

export interface GeoLocation {
  lat: number;
  lng: number;
  district: string;
  state: string;
}

export interface Approval {
  approval_id: string;
  approval_type: 'Administrative' | 'Forest' | 'Environment' | 'Revenue' | 'Other';
  status: 'Pending' | 'In-Progress' | 'Approved';
  applied_date: string;
  approved_date?: string | null;
  delay_days: number; // vs standard SLA (e.g. 45 days)
}

export interface CompensationData {
  compensation_id: string;
  total_compensation_assessed_cr: number; // in Crores INR
  total_compensation_disbursed_cr: number;
  families_paid_count: number;
  families_pending_count: number;
  disputed_cases_count: number;
  last_updated_date: string;
}

export interface LegalDispute {
  case_id: string;
  case_type: 'Ownership' | 'Compensation' | 'Acquisition Challenge' | 'R&R' | 'Other';
  status: 'Pending' | 'Resolved' | 'Dismissed';
  filed_date: string;
  last_hearing_date?: string | null;
  court_level: 'District Court' | 'High Court' | 'Supreme Court' | 'Land Tribunal';
}

export interface PossessionData {
  possession_id: string;
  possession_percentage: number;
  possession_date?: string | null;
  encumbrance_free_area_ha: number;
}

export interface RehabilitationResettlementData {
  rr_id: string;
  total_affected_families: number;
  families_rehabilitated: number;
  families_pending: number;
  rr_status: 'Not Started' | 'In Progress' | 'Completed';
  r_and_r_center_ready: boolean;
}

export interface StakeholderResponsiveness {
  avg_response_time_days: number;
  missed_meetings_count: number;
  escalation_count: number;
}

export interface ShapFactor {
  factor: string;
  category: 'Approvals' | 'Compensation' | 'Legal' | 'Possession' | 'R&R' | 'Historical' | 'Documentation';
  contribution: number; // e.g. +22 or -8
  description: string;
  impact: 'increases_risk' | 'reduces_risk';
}

export interface Recommendation {
  id: string;
  priority: 'High' | 'Medium' | 'Low';
  action: string;
  rationale: string;
  responsible_authority: string;
  deadline_days: number;
}

export interface StageGateIssue {
  type: 'Error' | 'Warning';
  rule: string;
  message: string;
}

export interface ProjectPrediction {
  probability_of_delay: number; // 0.00 to 1.00
  risk_score: number; // 0 to 100
  risk_category: RiskCategory;
  predicted_delay_range_days: [number, number]; // e.g. [120, 180]
  predicted_delay_days: number;
  top_shap_factors: ShapFactor[];
  recommendations: Recommendation[];
  stage_delay_probabilities: {
    Notification: number;
    Survey: number;
    Compensation: number;
    Possession: number;
    RR: number;
  };
  data_completeness_pct: number;
  data_quality_warnings: string[];
  stage_gate_issues: StageGateIssue[];
}

export interface LandProject {
  project_id: string;
  project_name: string;
  project_type: ProjectType;
  state: string;
  district: string;
  block: string;
  geo_location: GeoLocation;
  land_area_hectares: number;
  affected_families_count: number;
  start_date: string;
  planned_end_date: string;
  actual_end_date?: string | null;
  actual_delay_days?: number | null;
  current_stage: ProjectStage;
  project_status: ProjectStatus;
  last_updated_date: string;

  // Sub-modules
  approvals: Approval[];
  compensation: CompensationData;
  legal_disputes: LegalDispute[];
  possession: PossessionData;
  rehabilitation: RehabilitationResettlementData;
  stakeholder_responsiveness: StakeholderResponsiveness;

  // ML / Derived
  prediction?: ProjectPrediction;
}

export interface AuditLogEntry {
  log_id: string;
  user_id: string;
  user_role: UserRole;
  action:
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'STAGE_ADVANCE'
    | 'RETRAIN'
    | 'IMPORT'
    | 'LOGIN'
    | 'LOGOUT'
    | 'REGISTER'
    | 'GENAI_REPORT'
    | 'REALTIME_SURVEILLANCE';
  entity_type:
    | 'Project'
    | 'Compensation'
    | 'LegalDispute'
    | 'Approval'
    | 'R&R'
    | 'MLModel'
    | 'Officer_Session'
    | 'GenAI_Intelligence'
    | 'Surveillance_Engine';
  entity_id: string;
  old_value?: string;
  new_value?: string;
  timestamp: string;
  details?: string;
}

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  timeAgo: string;
  project_id: string;
  project_name: string;
  event_type:
    | 'Drone_Survey'
    | 'SLA_Breach'
    | 'Compensation_Disbursed'
    | 'Court_Order'
    | 'Pillar_GeoTagged'
    | 'Gazette_Notification'
    | 'Statutory_Clearance';
  severity: 'Critical' | 'Warning' | 'Info' | 'Success';
  message: string;
  district: string;
  state: string;
  statutory_clause?: string;
}

export interface AlertNotification {
  id: string;
  project_id: string;
  project_name: string;
  severity: 'Critical' | 'Warning' | 'Info';
  title: string;
  message: string;
  timestamp: string;
  is_read: boolean;
  acknowledged: boolean;
  trigger_type:
    | 'Risk_Threshold'
    | 'Disbursement_Stalled'
    | 'Legal_Dispute'
    | 'SLA_Breach'
    | 'Category_Escalation'
    | 'Realtime_Surveillance';
}

export interface MLModelMetadata {
  model_id: string;
  model_name: string;
  model_type: 'Random Forest Classifier';
  version: string;
  trained_on_records: number;
  test_records?: number;
  total_records?: number;
  last_retrained: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  feature_importances: { feature: string; weight: number }[];
  status: 'Production' | 'Training' | 'Evaluating';
  source_breakdown?: Record<string, number>;
  datasets_loaded?: string[];
  confusion_matrix?: { TP: number; FP: number; FN: number; TN: number };
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  department: string;
  state?: string;
  district?: string;
  avatarInitials: string;
  rulesSummary: string[];
}

export type AppTheme =
  | 'emerald_forest'
  | 'terracotta_amber'
  | 'royal_violet'
  | 'teal_ocean'
  | 'crimson_garnet';

export interface ThemeConfig {
  id: AppTheme;
  name: string;
  tagline: string;
  headerBg: string;
  headerBorder: string;
  navActiveBg: string;
  navActiveText: string;
  accentBg: string;
  accentText: string;
  primaryButton: string;
  badgeBorder: string;
  selectionBg: string;
  colorSwatch: string[];
}
