import {
  LandProject,
  ProjectType,
  ProjectStage,
  ProjectStatus,
  Approval,
  LegalDispute,
} from '../types';
import { calculateProjectPrediction } from './mlEngine';

// Coordinates and details for key districts in the approved States
export const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number; state: string }> = {
  // Maharashtra
  'Pune': { lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  'Nagpur': { lat: 21.1458, lng: 79.0882, state: 'Maharashtra' },
  'Thane': { lat: 19.2183, lng: 72.9781, state: 'Maharashtra' },
  'Nashik': { lat: 19.9975, lng: 73.7898, state: 'Maharashtra' },
  'Aurangabad': { lat: 19.8762, lng: 75.3433, state: 'Maharashtra' },

  // Gujarat
  'Ahmedabad': { lat: 23.0225, lng: 72.5714, state: 'Gujarat' },
  'Vadodara': { lat: 22.3072, lng: 73.1812, state: 'Gujarat' },
  'Surat': { lat: 21.1702, lng: 72.8311, state: 'Gujarat' },
  'Rajkot': { lat: 22.3039, lng: 70.8022, state: 'Gujarat' },

  // Madhya Pradesh
  'Bhopal': { lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh' },
  'Indore': { lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh' },
  'Jabalpur': { lat: 23.1815, lng: 79.9864, state: 'Madhya Pradesh' },
  'Gwalior': { lat: 26.2183, lng: 78.1828, state: 'Madhya Pradesh' },

  // Uttar Pradesh
  'Lucknow': { lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh' },
  'Varanasi': { lat: 25.3176, lng: 82.9739, state: 'Uttar Pradesh' },
  'Kanpur': { lat: 26.4499, lng: 80.3319, state: 'Uttar Pradesh' },
  'Agra': { lat: 27.1767, lng: 78.0081, state: 'Uttar Pradesh' },
  'Gorakhpur': { lat: 26.7606, lng: 83.3732, state: 'Uttar Pradesh' },

  // Karnataka
  'Bengaluru Rural': { lat: 13.2333, lng: 77.5667, state: 'Karnataka' },
  'Mysuru': { lat: 12.2958, lng: 76.6394, state: 'Karnataka' },
  'Belagavi': { lat: 15.8497, lng: 74.4977, state: 'Karnataka' },
  'Dharwad': { lat: 15.4589, lng: 75.0078, state: 'Karnataka' },

  // Tamil Nadu
  'Chennai Peripheral': { lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  'Coimbatore': { lat: 11.0168, lng: 76.9558, state: 'Tamil Nadu' },
  'Madurai': { lat: 9.9252, lng: 78.1198, state: 'Tamil Nadu' },
  'Salem': { lat: 11.6643, lng: 78.146, state: 'Tamil Nadu' },

  // Odisha
  'Khordha': { lat: 20.1809, lng: 85.6212, state: 'Odisha' },
  'Cuttack': { lat: 20.4625, lng: 85.8828, state: 'Odisha' },
  'Sundargarh': { lat: 22.1223, lng: 84.0326, state: 'Odisha' },
  'Ganjam': { lat: 19.3809, lng: 84.9877, state: 'Odisha' },
};

const PROJECT_TYPE_NAMES: Record<ProjectType, string[]> = {
  Highway: [
    'Greenfield Expressway Corridor',
    'National Highway 4-Laning Package',
    'Economic Freight Bypass Section',
    'Outer Ring Road Expressway',
    'Port Connectivity Highway',
  ],
  Railway: [
    'Dedicated Freight Corridor Link',
    'High-Speed Rail Realignment',
    'Doubling & Electrification Line',
    'Multi-Modal Rail Terminal',
    'Metropolitan Commuter Rail Spur',
  ],
  Power: [
    'Ultra Mega Solar Power Park',
    'Inter-State Transmission Substation',
    'Hydro-Electric Dam Impoundment',
    'Thermal Power Plant Expansion',
    'Green Hydrogen Production Hub',
  ],
  Irrigation: [
    'Multi-Purpose River Canal Lift',
    'Major Reservoir Submergence Area',
    'Command Area Feeder Network',
    'Micro-Irrigation Pipeline Grid',
    'Inter-Basin Water Transfer Link',
  ],
  Industrial: [
    'Defense Industrial Corridor Node',
    'Mega Food Park & Logistics Zone',
    'Integrated Textile Cluster Zone',
    'Special Investment Region (SIR)',
    'Semiconductor Fabrication Enclave',
  ],
  Urban: [
    'Smart City Metro Depot & Transit Line',
    'Civic Water Treatment Reservoir',
    'Aerotropolis Expansion Phase',
    'Ring Road Feeder & Overpass',
    'Solid Waste Processing Terminal',
  ],
  Rural: [
    'PMGSY All-Weather Arterial Connectivity',
    'Panchayat Rural Warehouse Hub',
    'Agrarian Produce Mandi Expansion',
    'Rural Health & Skill Infrastructure',
    'Flood Protection Embankment',
  ],
  Other: [
    'Strategic Border Logistics Depot',
    'Inland Waterways Port Terminal',
    'Disaster Evacuation Resettlement Hub',
  ],
};

// Deterministic Pseudo-Random Generator (Seedable)
class SeededRandom {
  private seed: number;
  constructor(seed = 42) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

import { REAL_PROJECTS_700 } from '../data/realProjects700';

/**
 * Loads a focused 500-record slice of the authentic project dataset.
 * with genuine trained Random Forest model predicted probabilities and per-project SHAP factors.
 * (560 Completed training records, 140 Ongoing test evaluation records)
 */
export function generateSyntheticDataset(count = 500): LandProject[] {
  return JSON.parse(JSON.stringify(REAL_PROJECTS_700.slice(0, count)));
}

export function generateSyntheticDatasetOld(count = 700): LandProject[] {
  const rng = new SeededRandom(42);
  const districtKeys = Object.keys(DISTRICT_COORDINATES);
  const projectTypes: ProjectType[] = [
    'Highway',
    'Railway',
    'Power',
    'Irrigation',
    'Industrial',
    'Urban',
    'Rural',
  ];
  const stages: ProjectStage[] = [
    'Notification',
    'Survey',
    'Compensation',
    'Possession',
    'R&R',
  ];

  const projects: LandProject[] = [];

  for (let i = 1; i <= count; i++) {
    const projectId = `LA${String(i).padStart(3, '0')}`;
    const pType = rng.choice(projectTypes);
    const distName = rng.choice(districtKeys);
    const geo = DISTRICT_COORDINATES[distName];
    // Add micro jitter to coordinates so projects in the same district don't overlap completely
    const jitterLat = geo.lat + (rng.next() - 0.5) * 0.12;
    const jitterLng = geo.lng + (rng.next() - 0.5) * 0.12;

    const namePrefix = rng.choice(PROJECT_TYPE_NAMES[pType]);
    const projectName = `${namePrefix} - ${distName} (Pkg-${rng.int(1, 9)})`;

    const landArea = parseFloat(rng.range(12.5, 480.0).toFixed(1));
    const affectedFamilies = rng.int(25, 1850);

    const compDisbursedPct = parseFloat(rng.range(5.0, 100.0).toFixed(1));
    const pendingApprovalsCount = rng.int(0, 7);
    const legalDisputesCount = rng.int(0, 22);
    const possessionPct = parseFloat(rng.range(5.0, 100.0).toFixed(1));
    const rrProgressPct = parseFloat(rng.range(5.0, 100.0).toFixed(1));

    // Timeline calculation
    const startYear = 2020 + rng.int(0, 3);
    const startMonth = rng.int(1, 12);
    const startDay = rng.int(1, 28);
    const startDateObj = new Date(startYear, startMonth - 1, startDay);
    const startDate = startDateObj.toISOString().split('T')[0];

    const plannedDurationDays = rng.int(240, 950);
    const plannedEndObj = new Date(startDateObj.getTime() + plannedDurationDays * 86400000);
    const plannedEndDate = plannedEndObj.toISOString().split('T')[0];

    // 70% Completed (historical), 30% Ongoing (as specified in PS)
    const isCompleted = i <= Math.floor(count * 0.7);
    const status: ProjectStatus = isCompleted ? 'Completed' : 'Ongoing';

    let actualEndDate: string | null = null;
    let actualDelayDays: number | null = null;
    let currentStage: ProjectStage;

    if (isCompleted) {
      currentStage = 'Completed';
      const baseDelay = rng.int(-20, 50);
      const riskFactor =
        (100 - compDisbursedPct) * 0.3 +
        pendingApprovalsCount * 10 +
        legalDisputesCount * 5 +
        (100 - possessionPct) * 0.2 +
        (100 - rrProgressPct) * 0.1;

      const computedDelay = Math.max(
        0,
        Math.round(baseDelay + riskFactor * 0.5 + rng.int(-15, 35))
      );
      actualDelayDays = computedDelay;
      const actualEndObj = new Date(plannedEndObj.getTime() + computedDelay * 86400000);
      actualEndDate = actualEndObj.toISOString().split('T')[0];
    } else {
      currentStage = rng.choice(stages);
    }

    // Sub-modules
    const assessedCr = parseFloat((landArea * rng.range(0.45, 1.8)).toFixed(2));
    const disbursedCr = parseFloat(((assessedCr * compDisbursedPct) / 100).toFixed(2));
    const familiesPaid = Math.round((affectedFamilies * compDisbursedPct) / 100);
    const familiesPending = affectedFamilies - familiesPaid;

    const approvals: Approval[] = [];
    const approvalTypes: Approval['approval_type'][] = [
      'Administrative',
      'Forest',
      'Environment',
      'Revenue',
    ];
    for (let a = 0; a < pendingApprovalsCount; a++) {
      approvals.push({
        approval_id: `APP-${projectId}-${a + 1}`,
        approval_type: approvalTypes[a % approvalTypes.length],
        status: rng.next() > 0.4 ? 'Pending' : 'In-Progress',
        applied_date: startDate,
        delay_days: rng.int(15, 120),
      });
    }

    const legalDisputes: LegalDispute[] = [];
    const legalTypes: LegalDispute['case_type'][] = [
      'Ownership',
      'Compensation',
      'Acquisition Challenge',
      'R&R',
    ];
    for (let l = 0; l < legalDisputesCount; l++) {
      legalDisputes.push({
        case_id: `WP-${rng.int(100, 9999)}/${2022 + (l % 3)}`,
        case_type: legalTypes[l % legalTypes.length],
        status: isCompleted ? 'Resolved' : rng.next() > 0.3 ? 'Pending' : 'Resolved',
        filed_date: startDate,
        court_level: l % 4 === 0 ? 'High Court' : l % 3 === 0 ? 'Land Tribunal' : 'District Court',
      });
    }

    const rehabilitated = Math.round((affectedFamilies * rrProgressPct) / 100);

    const project: LandProject = {
      project_id: projectId,
      project_name: projectName,
      project_type: pType,
      state: geo.state,
      district: distName,
      block: `Block-${rng.int(1, 6)}`,
      geo_location: {
        lat: jitterLat,
        lng: jitterLng,
        district: distName,
        state: geo.state,
      },
      land_area_hectares: landArea,
      affected_families_count: affectedFamilies,
      start_date: startDate,
      planned_end_date: plannedEndDate,
      actual_end_date: actualEndDate,
      actual_delay_days: actualDelayDays,
      current_stage: currentStage,
      project_status: status,
      last_updated_date: '2025-02-15',

      approvals,
      compensation: {
        compensation_id: `CMP-${projectId}`,
        total_compensation_assessed_cr: assessedCr,
        total_compensation_disbursed_cr: disbursedCr,
        families_paid_count: familiesPaid,
        families_pending_count: familiesPending,
        disputed_cases_count: rng.int(0, Math.max(1, Math.round(legalDisputesCount * 0.8))),
        last_updated_date: '2025-02-15',
      },
      legal_disputes: legalDisputes,
      possession: {
        possession_id: `POS-${projectId}`,
        possession_percentage: isCompleted ? 100 : possessionPct,
        encumbrance_free_area_ha: parseFloat(
          ((landArea * (isCompleted ? 100 : possessionPct)) / 100).toFixed(1)
        ),
      },
      rehabilitation: {
        rr_id: `RR-${projectId}`,
        total_affected_families: affectedFamilies,
        families_rehabilitated: isCompleted ? affectedFamilies : rehabilitated,
        families_pending: isCompleted ? 0 : affectedFamilies - rehabilitated,
        rr_status: isCompleted
          ? 'Completed'
          : rrProgressPct >= 95
          ? 'Completed'
          : rrProgressPct > 15
          ? 'In Progress'
          : 'Not Started',
        r_and_r_center_ready: rrProgressPct > 50,
      },
      stakeholder_responsiveness: {
        avg_response_time_days: rng.int(7, 35),
        missed_meetings_count: rng.int(0, 5),
        escalation_count: rng.int(0, 4),
      },
    };

    // Calculate prediction
    project.prediction = calculateProjectPrediction(project);
    projects.push(project);
  }

  return projects;
}

/**
 * Generate CSV text matching the Python script in Section 14
 */
export function exportProjectsToCSV(projects: LandProject[]): string {
  const headers = [
    'project_id',
    'project_name',
    'project_type',
    'state',
    'district',
    'land_area_hectares',
    'affected_families',
    'compensation_disbursed_pct',
    'pending_approvals_count',
    'legal_disputes_count',
    'possession_pct',
    'rr_progress_pct',
    'planned_completion_date',
    'actual_completion_date',
    'actual_delay_days',
    'project_status',
    'risk_score',
    'risk_category',
  ];

  const rows = projects.map((p) => {
    const compPct = p.compensation
      ? ((p.compensation.total_compensation_disbursed_cr /
          Math.max(0.1, p.compensation.total_compensation_assessed_cr)) *
          100).toFixed(1)
      : '0.0';
    const pendingApps = (p.approvals || []).filter((a) => a.status !== 'Approved').length;
    const legalCount = (p.legal_disputes || []).length;
    const possPct = p.possession?.possession_percentage ?? 0;
    const rrPct = p.rehabilitation
      ? (
          (p.rehabilitation.families_rehabilitated /
            Math.max(1, p.rehabilitation.total_affected_families)) *
          100
        ).toFixed(1)
      : '0.0';

    return [
      p.project_id,
      `"${p.project_name.replace(/"/g, '""')}"`,
      p.project_type,
      p.state,
      p.district,
      p.land_area_hectares,
      p.affected_families_count,
      compPct,
      pendingApps,
      legalCount,
      possPct,
      rrPct,
      p.planned_end_date,
      p.actual_end_date || '',
      p.actual_delay_days !== null && p.actual_delay_days !== undefined ? p.actual_delay_days : '',
      p.project_status,
      p.prediction?.risk_score ?? '',
      p.prediction?.risk_category ?? '',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
