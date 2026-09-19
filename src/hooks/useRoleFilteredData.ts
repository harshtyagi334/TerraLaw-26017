import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { LandProject, UserRole, AppUser, AlertNotification } from '../types';

export interface RoleKpiItem {
  id: string;
  label: string;
  value: string | number;
  subtext: string;
  badge?: string;
  type: 'risk' | 'neutral' | 'success' | 'warning';
}

export interface StatutoryActionDirective {
  id: string;
  title: string;
  actSection: string;
  authority: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  actionableLinkTab: 'projects' | 'compliance' | 'simulation' | 'retrain';
}

export interface RoleFilteredDataResult {
  // Officer Profile & Scope
  role: UserRole;
  user: AppUser | null;
  isAuthenticated: boolean;
  jurisdictionTitle: string;
  jurisdictionSubtitle: string;
  scopeBadgeText: string;
  scopeBadgeColor: string;
  scopedState: string;
  scopedDistrict: string;
  scopedDepartment: string;
  isScopedToState: boolean;
  isScopedToDistrict: boolean;

  // Project Datasets
  roleProjects: LandProject[]; // All projects accessible under this role
  filteredProjects: LandProject[]; // Role projects with UI filters applied
  ongoingProjects: LandProject[];
  completedProjects: LandProject[];
  highRiskProjects: LandProject[];
  mediumRiskProjects: LandProject[];
  lowRiskProjects: LandProject[];

  // Primary Statistical Aggregates
  totalCount: number;
  ongoingCount: number;
  completedCount: number;
  highRiskCount: number;
  medRiskCount: number;
  lowRiskCount: number;
  highRiskPct: string;
  medRiskPct: string;
  lowRiskPct: string;
  avgPredictedDelayDays: number;
  totalLandAreaHa: number;
  totalAffectedFamilies: number;
  totalCompensationAssessedCr: number;
  totalCompensationDisbursedCr: number;
  compensationDisbursedPct: string;

  // Role-Specific Tailored KPIs (Dynamic 4-card metric suite)
  roleKpis: RoleKpiItem[];

  // Breakdowns
  stageBottlenecks: { stage: string; avgDelay: number; count: number; highRiskCount: number }[];
  geographicBreakdown: { name: string; avgDelay: number; count: number; highRiskCount: number }[];
  topPriorityProjects: LandProject[];
  roleAlerts: AlertNotification[];
  statutoryDirectives: StatutoryActionDirective[];
}

/**
 * useRoleFilteredData - Custom hook and context selector that fetches, scopes,
 * filters, and aggregates land acquisition surveillance data specifically tailored
 * to the authenticated officer's administrative role (Central Admin, State Admin,
 * District Admin / CALA, or Project Officer).
 */
export const useRoleFilteredData = (): RoleFilteredDataResult => {
  const {
    projects,
    userRole,
    currentUser,
    isAuthenticated,
    selectedState,
    selectedDistrict,
    selectedType,
    selectedStage,
    selectedRisk,
    searchQuery,
    alerts,
    mlModel,
  } = useApp();

  // 1. Determine Administrative Scope Boundaries
  const userState = currentUser?.state || 'All';
  const userDistrict = currentUser?.district || 'All';
  const userDept = currentUser?.department || 'Department of Land Resources (DoLR)';

  const isStateAdmin = userRole === 'State Admin';
  const isDistrictAdmin = userRole === 'District Admin';
  const isProjectOfficer = userRole === 'Project Officer';
  const isCentralAdmin = userRole === 'Central Admin';

  // Resolved Scope Labels
  const effectiveState = isCentralAdmin ? selectedState : userState !== 'All' ? userState : selectedState;
  const effectiveDistrict = isDistrictAdmin
    ? userDistrict !== 'All'
      ? userDistrict
      : selectedDistrict
    : selectedDistrict;

  // 2. Filter Base Dataset to Role Jurisdiction
  const roleBaseProjects = useMemo(() => {
    return projects.filter((p) => {
      // Role-Based Boundary Enforcement:
      if (isStateAdmin) {
        // State Admin is bounded to their specific State (e.g. Maharashtra)
        const targetState = userState !== 'All' ? userState : 'Maharashtra';
        if (p.state !== targetState) return false;
      } else if (isDistrictAdmin) {
        // District Admin / CALA is bounded to their specific District & State (e.g. Pune, Maharashtra)
        const targetState = userState !== 'All' ? userState : 'Maharashtra';
        const targetDistrict = userDistrict !== 'All' ? userDistrict : 'Pune';
        if (p.state !== targetState || p.district !== targetDistrict) return false;
      } else if (isProjectOfficer) {
        // Project Officer is bounded to their field package territory or agency
        const targetState = userState !== 'All' ? userState : 'Maharashtra';
        const targetDistrict = userDistrict !== 'All' ? userDistrict : 'Pune';
        if (p.state !== targetState) return false;
        // If district is designated, prioritize that district
        if (targetDistrict !== 'All' && p.district !== targetDistrict) return false;
      }
      // Central Admin has full National Access (all states)
      return true;
    });
  }, [projects, userRole, userState, userDistrict, isStateAdmin, isDistrictAdmin, isProjectOfficer]);

  // 3. Apply Active UI Filters on Top of Role Scope
  const filteredProjects = useMemo(() => {
    return roleBaseProjects.filter((p) => {
      // If user selected specific state/district in UI filter (if permitted for that role)
      if (isCentralAdmin && selectedState !== 'All' && p.state !== selectedState) return false;
      if (!isDistrictAdmin && selectedDistrict !== 'All' && p.district !== selectedDistrict) return false;
      if (selectedType !== 'All' && p.project_type !== selectedType) return false;
      if (selectedStage !== 'All' && p.current_stage !== selectedStage) return false;
      if (selectedRisk !== 'All' && p.prediction?.risk_category !== selectedRisk) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.project_name.toLowerCase().includes(q);
        const matchId = p.project_id.toLowerCase().includes(q);
        const matchDistrict = p.district.toLowerCase().includes(q);
        const matchType = p.project_type.toLowerCase().includes(q);
        const matchBlock = p.block.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchDistrict && !matchType && !matchBlock) return false;
      }

      return true;
    });
  }, [
    roleBaseProjects,
    isCentralAdmin,
    isDistrictAdmin,
    selectedState,
    selectedDistrict,
    selectedType,
    selectedStage,
    selectedRisk,
    searchQuery,
  ]);

  // 4. Compute Statistical Slices
  const totalCount = filteredProjects.length;
  const ongoingProjects = useMemo(() => filteredProjects.filter((p) => p.project_status === 'Ongoing'), [filteredProjects]);
  const completedProjects = useMemo(() => filteredProjects.filter((p) => p.project_status === 'Completed'), [filteredProjects]);

  const highRiskProjects = useMemo(() => ongoingProjects.filter((p) => (p.prediction?.risk_score ?? 0) >= 65), [ongoingProjects]);
  const mediumRiskProjects = useMemo(
    () => ongoingProjects.filter((p) => (p.prediction?.risk_score ?? 0) >= 35 && (p.prediction?.risk_score ?? 0) < 65),
    [ongoingProjects]
  );
  const lowRiskProjects = useMemo(() => ongoingProjects.filter((p) => (p.prediction?.risk_score ?? 0) < 35), [ongoingProjects]);

  const ongoingCount = ongoingProjects.length;
  const completedCount = completedProjects.length;
  const highRiskCount = highRiskProjects.length;
  const medRiskCount = mediumRiskProjects.length;
  const lowRiskCount = lowRiskProjects.length;

  const highRiskPct = ongoingCount > 0 ? ((highRiskCount / ongoingCount) * 100).toFixed(1) : '0.0';
  const medRiskPct = ongoingCount > 0 ? ((medRiskCount / ongoingCount) * 100).toFixed(1) : '0.0';
  const lowRiskPct = ongoingCount > 0 ? ((lowRiskCount / ongoingCount) * 100).toFixed(1) : '0.0';

  // Aggregate compensation
  const totalCompensationAssessedCr = useMemo(
    () => filteredProjects.reduce((acc, p) => acc + (p.compensation?.total_compensation_assessed_cr || 0), 0),
    [filteredProjects]
  );
  const totalCompensationDisbursedCr = useMemo(
    () => filteredProjects.reduce((acc, p) => acc + (p.compensation?.total_compensation_disbursed_cr || 0), 0),
    [filteredProjects]
  );
  const compensationDisbursedPct =
    totalCompensationAssessedCr > 0
      ? ((totalCompensationDisbursedCr / totalCompensationAssessedCr) * 100).toFixed(1)
      : '0.0';

  // Delay & Land Metrics
  const avgPredictedDelayDays = useMemo(() => {
    if (ongoingCount === 0) return 0;
    const total = ongoingProjects.reduce((acc, p) => acc + (p.prediction?.predicted_delay_days || 0), 0);
    return Math.round(total / ongoingCount);
  }, [ongoingProjects, ongoingCount]);

  const totalLandAreaHa = useMemo(
    () => Math.round(filteredProjects.reduce((acc, p) => acc + (p.land_area_hectares || 0), 0)),
    [filteredProjects]
  );

  const totalAffectedFamilies = useMemo(
    () => filteredProjects.reduce((acc, p) => acc + (p.affected_families_count || 0), 0),
    [filteredProjects]
  );

  // 5. Tailor Role-Specific KPIs (4-card metric suite)
  const roleKpis = useMemo<RoleKpiItem[]>(() => {
    if (isCentralAdmin) {
      return [
        {
          id: 'kpi-national-corridors',
          label: 'National Corridors Monitored',
          value: totalCount,
          subtext: `${highRiskCount} corridors flagged at High Risk (${highRiskPct}%)`,
          badge: '7 States Portfolio',
          type: highRiskCount > 0 ? 'risk' : 'neutral',
        },
        {
          id: 'kpi-ml-reliability',
          label: 'ML Ensemble ROC-AUC',
          value: `${(mlModel.roc_auc * (mlModel.roc_auc <= 1 ? 100 : 1)).toFixed(1)}%`,
          subtext: `Precision ${(mlModel.precision <= 1 ? mlModel.precision * 100 : mlModel.precision).toFixed(1)}% &bull; Calibrated on ${mlModel.trained_on_records} records`,
          badge: `Production ${mlModel.version}`,
          type: 'success',
        },
        {
          id: 'kpi-system-budget',
          label: 'Statutory Budget Disbursed',
          value: `₹${Math.round(totalCompensationDisbursedCr).toLocaleString('en-IN')} Cr`,
          subtext: `${compensationDisbursedPct}% of ₹${Math.round(totalCompensationAssessedCr).toLocaleString('en-IN')} Cr assessed`,
          badge: 'Central DBT Gateway',
          type: Number(compensationDisbursedPct) >= 80 ? 'neutral' : 'warning',
        },
        {
          id: 'kpi-sec25-warnings',
          label: 'Section 25 Lapsing Warnings',
          value: highRiskProjects.filter((p) => p.current_stage === 'Compensation' || p.current_stage === 'Survey').length,
          subtext: 'Projects with >240 days delay risk nearing statutory lapse',
          badge: 'Mandatory Audit',
          type: 'risk',
        },
      ];
    }

    if (isStateAdmin) {
      const pendingClearances = filteredProjects.reduce(
        (acc, p) => acc + (p.approvals?.filter((a) => a.status === 'Pending').length || 0),
        0
      );

      return [
        {
          id: 'kpi-state-projects',
          label: `${userState !== 'All' ? userState : 'State'} Infrastructure Packages`,
          value: totalCount,
          subtext: `${ongoingCount} ongoing &bull; ${highRiskCount} in critical risk zone`,
          badge: 'State Directorate',
          type: highRiskCount > 0 ? 'risk' : 'neutral',
        },
        {
          id: 'kpi-state-clearances',
          label: 'Inter-Dept Clearances Pending',
          value: pendingClearances,
          subtext: 'Forest, Wildlife & Environment SLA tracking',
          badge: 'MoEFCC / Revenue',
          type: pendingClearances > 5 ? 'warning' : 'neutral',
        },
        {
          id: 'kpi-state-dbt-progress',
          label: 'State DBT Compensation Ratio',
          value: `${compensationDisbursedPct}%`,
          subtext: `₹${Math.round(totalCompensationDisbursedCr).toLocaleString('en-IN')} Cr of ₹${Math.round(totalCompensationAssessedCr).toLocaleString('en-IN')} Cr`,
          badge: 'Treasury Release',
          type: Number(compensationDisbursedPct) >= 80 ? 'success' : 'warning',
        },
        {
          id: 'kpi-state-avg-delay',
          label: 'Statewide Avg Predicted Delay',
          value: `+${avgPredictedDelayDays} Days`,
          subtext: 'Across all active district acquisition corridors',
          badge: 'AI Pre-emptive Warning',
          type: avgPredictedDelayDays > 120 ? 'risk' : 'warning',
        },
      ];
    }

    if (isDistrictAdmin) {
      const sec19LapsingRisk = highRiskProjects.filter((p) => p.current_stage === 'Notification' || p.current_stage === 'Survey').length;
      const sec23AwardsReady = filteredProjects.filter((p) => p.current_stage === 'Compensation').length;
      const below80Disbursement = Number(compensationDisbursedPct) < 80;

      return [
        {
          id: 'kpi-cala-packages',
          label: `${userDistrict !== 'All' ? userDistrict : 'District'} CALA Packages`,
          value: totalCount,
          subtext: `${highRiskCount} flagged for urgent Collectorate review`,
          badge: 'CALA Jurisdiction',
          type: highRiskCount > 0 ? 'risk' : 'neutral',
        },
        {
          id: 'kpi-sec19-risk',
          label: 'Sec 19 Declaration Lapsing Alerts',
          value: sec19LapsingRisk,
          subtext: 'Must gazette within 12 months under Sec 25 or lapse',
          badge: 'RFCTLARR Sec 25',
          type: sec19LapsingRisk > 0 ? 'risk' : 'success',
        },
        {
          id: 'kpi-sec23-awards',
          label: 'Sec 23 Compensation Awards',
          value: sec23AwardsReady,
          subtext: `₹${Math.round(totalCompensationAssessedCr).toLocaleString('en-IN')} Cr total assessed in district`,
          badge: 'Direct CALA Powers',
          type: 'neutral',
        },
        {
          id: 'kpi-dbt-threshold',
          label: 'DBT PAF Disbursement Rate',
          value: `${compensationDisbursedPct}%`,
          subtext: below80Disbursement ? '⚠️ Under 80% threshold — Blocks Sec 38 Possession' : '✓ >80% threshold met for Sec 38 Possession',
          badge: below80Disbursement ? 'Possession Blocked' : 'Possession Ready',
          type: below80Disbursement ? 'warning' : 'success',
        },
      ];
    }

    // Project Officer / Executing Agency
    const totalEncumbranceFreeHa = Math.round(
      filteredProjects.reduce((acc, p) => acc + (p.possession?.encumbrance_free_area_ha || 0), 0)
    );
    const avgPossessionPct = Math.round(
      filteredProjects.reduce((acc, p) => acc + (p.possession?.possession_percentage || 0), 0) / Math.max(1, totalCount)
    );

    return [
      {
        id: 'kpi-po-packages',
        label: 'Field Package Alignments',
        value: totalCount,
        subtext: `${ongoingCount} active under civil contract & survey`,
        badge: userDept.split(',')[0] || 'Executing PIU',
        type: 'neutral',
      },
      {
        id: 'kpi-po-possession',
        label: 'Physical RoW Possession',
        value: `${avgPossessionPct}%`,
        subtext: `${totalEncumbranceFreeHa} ha encumbrance-free of ${totalLandAreaHa} ha`,
        badge: 'Civil Works Access',
        type: avgPossessionPct >= 80 ? 'success' : 'warning',
      },
      {
        id: 'kpi-po-delay-mitigation',
        label: 'Avg Predicted Package Delay',
        value: `+${avgPredictedDelayDays} Days`,
        subtext: 'TreeSHAP key driver: Joint Measurement & Encumbrances',
        badge: 'What-If Simulation Ready',
        type: avgPredictedDelayDays > 120 ? 'risk' : 'warning',
      },
      {
        id: 'kpi-po-affected-families',
        label: 'Project Affected Families (PAFs)',
        value: totalAffectedFamilies.toLocaleString('en-IN'),
        subtext: `${compensationDisbursedPct}% compensation disbursed via DBT`,
        badge: 'R&R Compliance',
        type: 'neutral',
      },
    ];
  }, [
    isCentralAdmin,
    isStateAdmin,
    isDistrictAdmin,
    totalCount,
    highRiskCount,
    highRiskPct,
    ongoingCount,
    mlModel,
    totalCompensationDisbursedCr,
    totalCompensationAssessedCr,
    compensationDisbursedPct,
    highRiskProjects,
    filteredProjects,
    userState,
    userDistrict,
    userDept,
    avgPredictedDelayDays,
    totalLandAreaHa,
    totalAffectedFamilies,
  ]);

  // 6. Geographic Breakdown (Grouped by State for Central, by District for State/District)
  const geographicBreakdown = useMemo(() => {
    const geoMap: Record<string, { totalDelay: number; count: number; highRiskCount: number }> = {};

    filteredProjects.forEach((p) => {
      const key = isCentralAdmin ? p.state : p.district;
      const delay = p.project_status === 'Completed' ? p.actual_delay_days || 0 : p.prediction?.predicted_delay_days || 0;
      const isHigh = (p.prediction?.risk_score ?? 0) >= 65;

      if (!geoMap[key]) {
        geoMap[key] = { totalDelay: 0, count: 0, highRiskCount: 0 };
      }
      geoMap[key].totalDelay += delay;
      geoMap[key].count += 1;
      if (isHigh) geoMap[key].highRiskCount += 1;
    });

    return Object.entries(geoMap)
      .map(([name, data]) => ({
        name,
        avgDelay: Math.round(data.totalDelay / Math.max(1, data.count)),
        count: data.count,
        highRiskCount: data.highRiskCount,
      }))
      .sort((a, b) => b.avgDelay - a.avgDelay)
      .slice(0, 8);
  }, [filteredProjects, isCentralAdmin]);

  // 7. Stage Bottlenecks in Current Role Scope
  const stageBottlenecks = useMemo(() => {
    const stageMap: Record<string, { totalDelay: number; count: number; highRiskCount: number }> = {
      Notification: { totalDelay: 0, count: 0, highRiskCount: 0 },
      Survey: { totalDelay: 0, count: 0, highRiskCount: 0 },
      Compensation: { totalDelay: 0, count: 0, highRiskCount: 0 },
      Possession: { totalDelay: 0, count: 0, highRiskCount: 0 },
      'R&R': { totalDelay: 0, count: 0, highRiskCount: 0 },
    };

    filteredProjects.forEach((p) => {
      if (stageMap[p.current_stage]) {
        const delay = p.project_status === 'Completed' ? p.actual_delay_days || 0 : p.prediction?.predicted_delay_days || 0;
        stageMap[p.current_stage].totalDelay += delay;
        stageMap[p.current_stage].count += 1;
        if ((p.prediction?.risk_score ?? 0) >= 65) {
          stageMap[p.current_stage].highRiskCount += 1;
        }
      }
    });

    return Object.entries(stageMap).map(([stage, data]) => ({
      stage,
      avgDelay: data.count > 0 ? Math.round(data.totalDelay / data.count) : 0,
      count: data.count,
      highRiskCount: data.highRiskCount,
    }));
  }, [filteredProjects]);

  // 8. Top Priority Projects (Ranked by Risk Score & Delay Days)
  const topPriorityProjects = useMemo(() => {
    return [...ongoingProjects]
      .sort((a, b) => (b.prediction?.risk_score ?? 0) - (a.prediction?.risk_score ?? 0))
      .slice(0, 5);
  }, [ongoingProjects]);

  // 9. Role-Filtered Alerts
  const roleAlerts = useMemo(() => {
    return alerts.filter((alt) => {
      if (isCentralAdmin) return true;
      const matchedProj = filteredProjects.find((p) => p.project_id === alt.project_id);
      return !!matchedProj;
    });
  }, [alerts, isCentralAdmin, filteredProjects]);

  // 10. Role-Specific Statutory Directives & Action Recommendations
  const statutoryDirectives = useMemo<StatutoryActionDirective[]>(() => {
    if (isCentralAdmin) {
      return [
        {
          id: 'dir-retrain',
          title: 'Trigger Quarterly AI/ML Model Retraining',
          actSection: 'National Predictive Reliability Mandate',
          authority: 'Joint Secretary & Central Nodal Director',
          description: 'Retrain Random Forest classifier (n_estimators=300, class_weight=balanced) on recent completed expressway datasets.',
          priority: 'Medium',
          actionableLinkTab: 'retrain',
        },
        {
          id: 'dir-audit',
          title: 'Certify National Statutory Audit Trail',
          actSection: 'Section 48 RFCTLARR Act 2013',
          authority: 'Department of Land Resources (DoLR)',
          description: 'Generate digitally signed compliance ledger across 7 monitored infrastructure corridors.',
          priority: 'High',
          actionableLinkTab: 'compliance',
        },
      ];
    }

    if (isStateAdmin) {
      return [
        {
          id: 'dir-forest-sla',
          title: 'Expedite Stage-I Forest & Wildlife Clearances',
          actSection: 'Forest Conservation Act 1980 / RFCTLARR Section 11',
          authority: 'Principal Secretary (Revenue & Forest)',
          description: 'Clear inter-departmental SLA backlogs in high-priority highway & rail packages.',
          priority: 'High',
          actionableLinkTab: 'projects',
        },
        {
          id: 'dir-dbt-release',
          title: 'Authorize State Compensation Treasury Release',
          actSection: 'RFCTLARR Section 23 / State DBT Scheme',
          authority: 'State Nodal Director',
          description: 'Release pending compensation tranches to district escrow accounts.',
          priority: 'Medium',
          actionableLinkTab: 'compliance',
        },
      ];
    }

    if (isDistrictAdmin) {
      return [
        {
          id: 'dir-sec25-lapse',
          title: 'Prevent Section 25 Lapsing of Preliminary Notifications',
          actSection: 'RFCTLARR Section 25 (12-Month Lapsing Rule)',
          authority: 'District Magistrate & CALA',
          description: 'Issue Section 19 declarations before statutory 12-month window expires.',
          priority: 'High',
          actionableLinkTab: 'compliance',
        },
        {
          id: 'dir-sec38-possession',
          title: 'Enforce Section 38 80% DBT Disbursement for Possession',
          actSection: 'RFCTLARR Section 38 (Physical Possession)',
          authority: 'CALA / Sub-Divisional Magistrate',
          description: 'Ensure min 80% compensation is credited into beneficiary accounts prior to handover.',
          priority: 'High',
          actionableLinkTab: 'projects',
        },
      ];
    }

    // Project Officer
    return [
      {
        id: 'dir-whatif-sim',
        title: 'Simulate Fast-Track Possession Interventions',
        actSection: 'Field Package Delivery Protocol',
        authority: 'Senior Land Acquisition Officer & Implementing Exec',
        description: 'Run What-If scenario simulations to test expedited survey camps and alternate alignment.',
        priority: 'High',
        actionableLinkTab: 'simulation',
      },
      {
        id: 'dir-jms-completion',
        title: 'Update Joint Measurement Survey (JMS) Milestones',
        actSection: 'RFCTLARR Section 12',
        authority: 'Field Revenue Officer / NHAI PIU',
        description: 'Upload certified field survey demarcation records for package encumbrance release.',
        priority: 'Medium',
        actionableLinkTab: 'projects',
      },
    ];
  }, [isCentralAdmin, isStateAdmin, isDistrictAdmin]);

  // Scope Badge metadata
  const scopeBadgeText = isCentralAdmin
    ? 'National Oversight (All 7 States)'
    : isStateAdmin
    ? `Statewide Jurisdiction (${userState !== 'All' ? userState : 'Maharashtra'})`
    : isDistrictAdmin
    ? `District CALA Scope (${userDistrict !== 'All' ? userDistrict : 'Pune'}, ${userState !== 'All' ? userState : 'Maharashtra'})`
    : `Field Implementation (${userDept.split(',')[0] || 'NHAI PIU'})`;

  const scopeBadgeColor = isCentralAdmin
    ? 'bg-[#0F3D2E] text-white border-[#0F3D2E]'
    : isStateAdmin
    ? 'bg-[#1F7A4D] text-white border-[#1F7A4D]'
    : isDistrictAdmin
    ? 'bg-[#D98B2B] text-white border-[#D98B2B]'
    : 'bg-[#2D6CDF] text-white border-[#2D6CDF]';

  const jurisdictionTitle = isCentralAdmin
    ? 'National Land Acquisition Delay Surveillance'
    : isStateAdmin
    ? `${userState !== 'All' ? userState : 'State'} Revenue & Clearance Surveillance`
    : isDistrictAdmin
    ? `${userDistrict !== 'All' ? userDistrict : 'Pune'} District CALA Statutory Dashboard`
    : `${userDept.split(',')[0] || 'Implementing Agency'} Field Package Surveillance`;

  const jurisdictionSubtitle = isCentralAdmin
    ? 'Surveillance across all 7 monitored states and central infrastructure corridors.'
    : isStateAdmin
    ? `Monitoring state-wide infrastructure packages and inter-departmental statutory clearances across all districts in ${userState !== 'All' ? userState : 'Maharashtra'}.`
    : isDistrictAdmin
    ? `Statutory Competent Authority for Land Acquisition (CALA) oversight in ${userDistrict !== 'All' ? userDistrict : 'Pune'} under the RFCTLARR Act 2013.`
    : `Package-level ground execution, survey milestones, encumbrance-free RoW handover, and What-If delay mitigation.`;

  return {
    role: userRole,
    user: currentUser,
    isAuthenticated,
    jurisdictionTitle,
    jurisdictionSubtitle,
    scopeBadgeText,
    scopeBadgeColor,
    scopedState: effectiveState,
    scopedDistrict: effectiveDistrict,
    scopedDepartment: userDept,
    isScopedToState: isStateAdmin || isDistrictAdmin || isProjectOfficer,
    isScopedToDistrict: isDistrictAdmin || isProjectOfficer,

    roleProjects: roleBaseProjects,
    filteredProjects,
    ongoingProjects,
    completedProjects,
    highRiskProjects,
    mediumRiskProjects,
    lowRiskProjects,

    totalCount,
    ongoingCount,
    completedCount,
    highRiskCount,
    medRiskCount,
    lowRiskCount,
    highRiskPct,
    medRiskPct,
    lowRiskPct,
    avgPredictedDelayDays,
    totalLandAreaHa,
    totalAffectedFamilies,
    totalCompensationAssessedCr,
    totalCompensationDisbursedCr,
    compensationDisbursedPct,

    roleKpis,
    stageBottlenecks,
    geographicBreakdown,
    topPriorityProjects,
    roleAlerts,
    statutoryDirectives,
  };
};
