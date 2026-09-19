import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { calculateProjectPrediction } from '../utils/mlEngine';
import { predictWithTrainedModel } from '../utils/modelApi';
import {
  Code2,
  Terminal,
  Play,
  Copy,
  Check,
  Send,
  Database,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface EndpointSpec {
  method: 'GET' | 'POST';
  path: string;
  description: string;
  category: string;
  defaultPayload?: string;
}

const API_ENDPOINTS: EndpointSpec[] = [
  {
    method: 'POST',
    path: '/api/v1/projects/predict',
    category: 'Predictive Analytics',
    description: 'Calculates the real-time land acquisition risk score (0-100), delay probability, and SHAP factor attribution for a project payload.',
    defaultPayload: JSON.stringify(
      {
        project_name: 'Pune Outer Ring Road Package 3',
        project_type: 'Highway',
        state: 'Maharashtra',
        district: 'Pune',
        land_area_hectares: 145.5,
        affected_families_count: 320,
        compensation_disbursed_pct: 35.0,
        pending_approvals_count: 3,
        legal_disputes_count: 5,
        possession_percentage: 20.0,
        rr_progress_percentage: 15.0,
        avg_stakeholder_response_days: 28,
      },
      null,
      2
    ),
  },
  {
    method: 'GET',
    path: '/api/v1/projects/{project_id}/risk',
    category: 'Projects',
    description: 'Retrieves current predictive risk profile, SHAP attribution vectors, and prescriptive recommendations for an existing project.',
  },
  {
    method: 'POST',
    path: '/api/v1/simulate',
    category: 'Simulation',
    description: 'Runs counterfactual What-If simulation to predict risk reduction and days saved given target administrative interventions.',
    defaultPayload: JSON.stringify(
      {
        project_id: 'PRJ-2024-001',
        target_compensation_disbursed_pct: 85.0,
        target_pending_approvals: 0,
        target_legal_disputes: 1,
      },
      null,
      2
    ),
  },
  {
    method: 'GET',
    path: '/api/v1/districts/{district_name}/risk-summary',
    category: 'Geospatial & Hotspots',
    description: 'Aggregates spatial risk statistics, average delay days, and high-risk project counts for a specified district.',
  },
  {
    method: 'POST',
    path: '/api/v1/ingest/csv',
    category: 'Data Ingestion',
    description: 'Ingests land acquisition records formatted as CSV according to the MoRD PS specification.',
    defaultPayload: 'project_id,project_name,project_type,state,district,land_area_hectares,affected_families,compensation_disbursed_pct\nPRJ-NEW-01,Nagpur Metro Phase 2,Railway,Maharashtra,Nagpur,42.5,120,65.0',
  },
];

export const APIExplorerView: React.FC = () => {
  const { projects, selectedProject } = useApp();

  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointSpec>(API_ENDPOINTS[0]);
  const [requestPayload, setRequestPayload] = useState<string>(API_ENDPOINTS[0].defaultPayload || '');
  const [responseOutput, setResponseOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSelectEndpoint = (ep: EndpointSpec) => {
    setSelectedEndpoint(ep);
    setRequestPayload(ep.defaultPayload || '');
    setResponseOutput('');
  };

  const handleExecute = async () => {
    setIsLoading(true);
    try {
        if (selectedEndpoint.path === '/api/v1/projects/predict') {
          const parsed = JSON.parse(requestPayload);
          // Run through actual local ML engine
          const mockProj: any = {
            project_id: 'PRJ-API-TEST',
            project_name: parsed.project_name || 'API Test Project',
            project_type: parsed.project_type || 'Highway',
            state: parsed.state || 'Maharashtra',
            district: parsed.district || 'Pune',
            land_area_hectares: parsed.land_area_hectares || 100,
            affected_families_count: parsed.affected_families_count || 200,
            current_stage: 'Compensation',
            project_status: 'Ongoing',
            start_date: '2023-01-01',
            planned_end_date: '2025-01-01',
            last_updated_date: new Date().toISOString().split('T')[0],
            compensation: {
              total_compensation_assessed_cr: 100,
              total_compensation_disbursed_cr: parsed.compensation_disbursed_pct || 30,
              families_paid_count: 50,
              families_pending_count: 150,
              disputed_cases_count: parsed.legal_disputes_count || 0,
            },
            approvals: Array.from({ length: parsed.pending_approvals_count || 2 }).map((_, i) => ({
              approval_id: `APP-${i}`,
              approval_type: 'Forest' as const,
              status: 'Pending' as const,
              applied_date: '2023-01-01',
              delay_days: 40,
            })),
            legal_disputes: Array.from({ length: parsed.legal_disputes_count || 0 }).map((_, i) => ({
              case_id: `CASE-${i}`,
              case_type: 'Ownership' as const,
              status: 'Pending' as const,
              filed_date: '2023-01-01',
              court_level: 'High Court' as const,
            })),
            possession: {
              possession_percentage: parsed.possession_percentage || 20,
              encumbrance_free_area_ha: 20,
            },
            rehabilitation: {
              total_affected_families: parsed.affected_families_count || 200,
              families_rehabilitated: Math.round(((parsed.affected_families_count || 200) * (parsed.rr_progress_percentage || 20)) / 100),
              families_pending: 160,
              rr_status: 'In-Progress',
              r_and_r_center_ready: false,
            },
            stakeholder_responsiveness: {
              avg_response_time_days: parsed.avg_stakeholder_response_days || 25,
              missed_meetings_count: 2,
              escalation_count: 1,
            },
          };

          const modelPrediction = await predictWithTrainedModel(parsed);
          const pred = calculateProjectPrediction(mockProj, modelPrediction.probability_of_delay, modelPrediction);
          const response = {
            status: 200,
            success: true,
            model_version: 'RandomForestClassifier (Python trained_model.pkl)',
            timestamp: new Date().toISOString(),
            data: {
              risk_score: pred.risk_score,
              risk_category: pred.risk_category,
              probability_of_delay: pred.probability_of_delay,
              predicted_delay_days: pred.predicted_delay_days,
              confidence_interval: pred.predicted_delay_range_days,
              shap_factor_attributions: pred.top_shap_factors,
              prescriptive_recommendations: pred.recommendations,
              stage_delay_probabilities: pred.stage_delay_probabilities,
            },
          };
          setResponseOutput(JSON.stringify(response, null, 2));
        } else if (selectedEndpoint.path.includes('/risk-summary')) {
          const sampleDist = 'Pune';
          const projs = projects.filter((p) => p.district === sampleDist);
          const highRisk = projs.filter((p) => (p.prediction?.risk_score ?? 0) >= 65).length;
          const avgScore = Math.round(
            projs.reduce((a, b) => a + (b.prediction?.risk_score || 50), 0) / Math.max(1, projs.length)
          );
          const res = {
            status: 200,
            success: true,
            district: sampleDist,
            state: 'Maharashtra',
            total_active_projects: projs.length,
            high_risk_hotspots_count: highRisk,
            average_risk_score: avgScore,
            status_classification: avgScore >= 60 ? 'Critical Hotspot' : 'Moderate Hotspot',
          };
          setResponseOutput(JSON.stringify(res, null, 2));
        } else {
          const target = selectedProject || projects[0];
          const res = {
            status: 200,
            success: true,
            project_id: target.project_id,
            project_name: target.project_name,
            prediction: target.prediction,
          };
          setResponseOutput(JSON.stringify(res, null, 2));
        }
      setIsLoading(false);
    } catch (err: any) {
      setResponseOutput(JSON.stringify({ status: 400, error: err.message }, null, 2));
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(responseOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="api-explorer-view" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Code2 className="w-5 h-5 text-amber-500" />
            <span>REST API Documentation &amp; Live Test Runner</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Interoperable OpenAPI 3.0 endpoints for integrating state revenue departments and infrastructure project management systems.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono bg-slate-900 text-emerald-400 px-2.5 py-1 rounded">
            Base URL: https://api.prototype.internal/v1
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Endpoint Catalog */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Available Endpoints
          </h3>

          <div className="space-y-1.5">
            {API_ENDPOINTS.map((ep) => {
              const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
              return (
                <button
                  key={`${ep.method}-${ep.path}`}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-2.5 rounded text-xs transition cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        ep.method === 'POST'
                          ? isSelected
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-amber-100 text-amber-900'
                          : isSelected
                          ? 'bg-blue-400 text-slate-950'
                          : 'bg-blue-100 text-blue-900'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono text-[11px] truncate">{ep.path}</span>
                  </div>
                  <div
                    className={`text-[10px] mt-1 truncate ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {ep.description}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600">
            <span className="font-bold text-slate-900 block mb-1">Authentication:</span>
            Bearer token header required:
            <code className="block mt-1 font-mono text-[10px] bg-white p-1 rounded border border-slate-200 text-slate-800">
              Authorization: Bearer demo_api_key_sandbox
            </code>
          </div>
        </div>

        {/* Right 2 Cols: Live Runner */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                    selectedEndpoint.method === 'POST'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {selectedEndpoint.method}
                </span>
                <span className="font-mono text-xs font-bold text-slate-900">
                  {selectedEndpoint.path}
                </span>
              </div>
              <button
                onClick={handleExecute}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>{isLoading ? 'Executing...' : 'Execute Live Request'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-600">{selectedEndpoint.description}</p>

            {/* Request Payload Editor */}
            {selectedEndpoint.defaultPayload && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Request Body (JSON / Payload):
                </label>
                <textarea
                  rows={8}
                  value={requestPayload}
                  onChange={(e) => setRequestPayload(e.target.value)}
                  className="w-full font-mono text-[11px] p-3 border border-slate-300 rounded bg-slate-900 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}

            {/* Response Output Viewer */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Server Response (Output):</span>
                </label>
                {responseOutput && (
                  <button
                    onClick={handleCopy}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Output</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="bg-slate-950 rounded-lg p-4 font-mono text-[11px] text-slate-200 overflow-x-auto min-h-[220px] max-h-[360px] border border-slate-800">
                {responseOutput ? (
                  <pre>{responseOutput}</pre>
                ) : (
                  <div className="text-slate-500 text-center py-16">
                    Click &ldquo;Execute Live Request&rdquo; to test this API endpoint in real-time.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
