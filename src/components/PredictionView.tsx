import React, { useState } from 'react';
import { AlertCircle, BrainCircuit, CheckCircle2, FileUp, ShieldAlert } from 'lucide-react';
import { LandProject, ProjectStage, ProjectType } from '../types';
import { calculateProjectPrediction } from '../utils/mlEngine';
import { ModelPrediction, predictWithTrainedModel } from '../utils/modelApi';

interface PredictionInput {
  name: string;
  state: string;
  district: string;
  type: ProjectType;
  stage: ProjectStage;
  area: string;
  families: string;
  compensation: string;
  approvals: string;
  disputes: string;
  possession: string;
}

const emptyInput: PredictionInput = {
  name: '', state: '', district: '', type: 'Highway', stage: 'Compensation',
  area: '', families: '', compensation: '', approvals: '', disputes: '', possession: '',
};

const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell.trim()); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell.trim());
      if (row.some((value) => value)) rows.push(row);
      row = []; cell = '';
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some((value) => value)) rows.push(row);
  return rows;
};

export const PredictionView: React.FC = () => {
  const [input, setInput] = useState<PredictionInput>(emptyInput);
  const [prediction, setPrediction] = useState<{ result: ReturnType<typeof calculateProjectPrediction>; model: ModelPrediction } | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [error, setError] = useState('');
  const [fileMessage, setFileMessage] = useState('');

  const setField = <K extends keyof PredictionInput>(key: K, value: PredictionInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
    setPrediction(null);
  };

  const readCsv = (file?: File) => {
    if (!file) return;
    setError('');
    setFileMessage('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCsv(String(reader.result || ''));
        if (rows.length < 2) throw new Error('This CSV needs a header and at least one project row.');
        const headers = rows[0].map((header) => header.toLowerCase().trim().replace(/[\s-]+/g, '_'));
        const values = rows[1];
        const get = (...names: string[]) => {
          const index = headers.findIndex((header) => names.includes(header));
          return index >= 0 ? (values[index] || '') : '';
        };
        const numeric = (value: string) => value.replace(/[^\d.-]/g, '');
        const stage = get('current_stage', 'stage');
        const projectType = get('project_type', 'type');
        setInput((current) => ({
          ...current,
          name: get('project_name', 'name') || current.name,
          state: get('state') || current.state,
          district: get('district') || current.district,
          type: (['Highway', 'Railway', 'Power', 'Irrigation', 'Industrial', 'Urban', 'Rural', 'Other'].find((value) => value.toLowerCase() === projectType.toLowerCase()) || current.type) as ProjectType,
          stage: (['Notification', 'Survey', 'Compensation', 'Possession', 'R&R', 'Completed'].find((value) => value.toLowerCase() === stage.toLowerCase()) || current.stage) as ProjectStage,
          area: numeric(get('land_area_hectares', 'land_area', 'area')) || current.area,
          families: numeric(get('affected_families', 'affected_families_count', 'number_of_owners')) || current.families,
          compensation: numeric(get('compensation_disbursed_pct', 'compensation_pct', 'compensation')) || current.compensation,
          approvals: numeric(get('pending_approvals_count', 'pending_approvals', 'government_approval_days')) || current.approvals,
          disputes: numeric(get('legal_disputes_count', 'legal_disputes', 'stakeholder_objections')) || current.disputes,
          possession: numeric(get('possession_pct', 'possession_percentage')) || current.possession,
        }));
        setPrediction(null);
        setFileMessage('Project details loaded. Review the fields, then select Predict delay.');
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not read this CSV.');
      }
    };
    reader.onerror = () => setError('Could not read this CSV file.');
    reader.readAsText(file);
  };

  const handlePredict = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const area = Number(input.area);
    const families = Number(input.families);
    const compensationPct = Number(input.compensation);
    const approvalCount = Number(input.approvals);
    const disputeCount = Number(input.disputes);
    const possessionPct = Number(input.possession || 0);
    if (!input.name.trim() || !input.state.trim() || !input.district.trim()) { setError('Enter the project name, state, and district.'); return; }
    if (![area, families, compensationPct, approvalCount, disputeCount, possessionPct].every(Number.isFinite) || area <= 0 || families < 0 || compensationPct < 0 || compensationPct > 100 || approvalCount < 0 || disputeCount < 0 || possessionPct < 0 || possessionPct > 100) {
      setError('Check the numeric fields. Area must be greater than zero, and percentages must be between 0 and 100.'); return;
    }

    const now = new Date().toISOString().slice(0, 10);
    const project: Partial<LandProject> = {
      project_id: 'ONE-OFF-PREDICTION', project_name: input.name.trim(), project_type: input.type,
      state: input.state.trim(), district: input.district.trim(), block: '',
      geo_location: { lat: 0, lng: 0, state: input.state.trim(), district: input.district.trim() },
      land_area_hectares: area, affected_families_count: families,
      start_date: now, planned_end_date: now, current_stage: input.stage,
      project_status: 'Ongoing', last_updated_date: now,
      approvals: Array.from({ length: Math.min(100, Math.floor(approvalCount)) }, (_, index) => ({ approval_id: `PRED-APP-${index}`, approval_type: 'Other' as const, status: 'Pending' as const, applied_date: now, delay_days: 0 })),
      legal_disputes: Array.from({ length: Math.min(100, Math.floor(disputeCount)) }, (_, index) => ({ case_id: `PRED-CASE-${index}`, case_type: 'Other' as const, status: 'Pending' as const, filed_date: now, court_level: 'District Court' as const })),
      compensation: { compensation_id: 'PRED-CMP', total_compensation_assessed_cr: 100, total_compensation_disbursed_cr: compensationPct, families_paid_count: Math.round(families * compensationPct / 100), families_pending_count: Math.round(families * (100 - compensationPct) / 100), disputed_cases_count: Math.floor(disputeCount), last_updated_date: now },
      possession: { possession_id: 'PRED-POS', possession_percentage: possessionPct, encumbrance_free_area_ha: area * possessionPct / 100 },
      rehabilitation: { rr_id: 'PRED-RR', total_affected_families: families, families_rehabilitated: 0, families_pending: families, rr_status: 'Not Started', r_and_r_center_ready: false },
      stakeholder_responsiveness: { avg_response_time_days: 14, missed_meetings_count: 0, escalation_count: 0 },
    };
    setIsPredicting(true);
    try {
      const model = await predictWithTrainedModel(project);
      const result = calculateProjectPrediction(project, model.probability_of_delay, { shap_values: model.shap_values, stage_probabilities: model.stage_probabilities });
      const predictedDays = (model as ModelPrediction & { predicted_delay_days?: number }).predicted_delay_days;
      if (predictedDays !== undefined) {
        result.predicted_delay_days = predictedDays;
        result.predicted_delay_range_days = [Math.max(0, Math.round(predictedDays * 0.8)), Math.round(predictedDays * 1.2)];
      }
      setPrediction({ result, model });
    } catch {
      setError('The prediction service is unavailable. Start the app with npm run dev and try again.');
    } finally { setIsPredicting(false); }
  };

  const riskColor = prediction?.result.risk_category === 'High' ? 'text-red-700 bg-red-50 border-red-200' : prediction?.result.risk_category === 'Medium' ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-emerald-800 bg-emerald-50 border-emerald-200';

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-7 px-5 py-9 lg:grid-cols-[1fr_0.85fr] sm:px-8">
      <section>
        <header className="mb-7"><p className="text-sm text-slate-500">One-off project assessment</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Predict delay risk</h1><p className="mt-2 text-base text-slate-600">Enter project details or upload a CSV row. This assessment does not change the shared portfolio.</p></header>
        <div className="mb-5 rounded-xl border border-dashed border-slate-300 bg-white p-4">
          <label className="flex cursor-pointer items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100"><FileUp className="h-5 w-5 text-slate-700" /></span><span><span className="block text-sm font-semibold text-slate-900">Upload project data (.csv)</span><span className="block text-xs text-slate-500">Uses the first data row to fill the form. Your file is not added to the portfolio.</span></span><input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => readCsv(event.target.files?.[0])} /></label>
          {fileMessage && <p className="mt-3 text-sm text-emerald-800">{fileMessage}</p>}
        </div>
        <form onSubmit={handlePredict} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project name"><input required value={input.name} onChange={(e) => setField('name', e.target.value)} className={inputClass} placeholder="e.g. North Link Highway" /></Field>
            <Field label="Project type"><select value={input.type} onChange={(e) => setField('type', e.target.value as ProjectType)} className={inputClass}>{['Highway','Railway','Power','Irrigation','Industrial','Urban','Rural','Other'].map((type) => <option key={type}>{type}</option>)}</select></Field>
            <Field label="State"><input required value={input.state} onChange={(e) => setField('state', e.target.value)} className={inputClass} placeholder="State" /></Field>
            <Field label="District"><input required value={input.district} onChange={(e) => setField('district', e.target.value)} className={inputClass} placeholder="District" /></Field>
            <Field label="Acquisition stage"><select value={input.stage} onChange={(e) => setField('stage', e.target.value as ProjectStage)} className={inputClass}>{['Notification','Survey','Compensation','Possession','R&R','Completed'].map((stage) => <option key={stage}>{stage}</option>)}</select></Field>
            <Field label="Land area (hectares)"><input required type="number" min="0.01" step="any" value={input.area} onChange={(e) => setField('area', e.target.value)} className={inputClass} placeholder="e.g. 120" /></Field>
            <Field label="Affected families"><input required type="number" min="0" step="1" value={input.families} onChange={(e) => setField('families', e.target.value)} className={inputClass} placeholder="e.g. 250" /></Field>
            <Field label="Compensation paid (%)"><input required type="number" min="0" max="100" value={input.compensation} onChange={(e) => setField('compensation', e.target.value)} className={inputClass} placeholder="0–100" /></Field>
            <Field label="Pending approvals"><input required type="number" min="0" step="1" value={input.approvals} onChange={(e) => setField('approvals', e.target.value)} className={inputClass} placeholder="e.g. 2" /></Field>
            <Field label="Legal disputes"><input required type="number" min="0" step="1" value={input.disputes} onChange={(e) => setField('disputes', e.target.value)} className={inputClass} placeholder="e.g. 1" /></Field>
            <Field label="Possession secured (%)"><input type="number" min="0" max="100" value={input.possession} onChange={(e) => setField('possession', e.target.value)} className={inputClass} placeholder="0–100" /></Field>
          </div>
          {error && <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
          <button type="submit" disabled={isPredicting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0C2B20] px-5 py-3.5 text-base font-semibold text-white hover:bg-[#164734] disabled:cursor-wait disabled:opacity-60"><BrainCircuit className="h-5 w-5" />{isPredicting ? 'Calculating prediction…' : 'Predict delay'}</button>
        </form>
      </section>

      <aside className="lg:pt-[5.3rem]">
        {prediction ? <section className="sticky top-28 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-live="polite">
          <div className="flex items-start justify-between gap-3"><div><p className="text-sm text-slate-500">Prediction for</p><h2 className="mt-1 text-xl font-bold text-slate-900">{input.name}</h2></div><CheckCircle2 className="h-6 w-6 text-emerald-700" /></div>
          <div className={`rounded-xl border p-5 ${riskColor}`}><p className="text-sm font-semibold">Delay risk · {prediction.result.risk_category}</p><p className="mt-2 text-5xl font-bold">{prediction.result.risk_score}<span className="ml-1 text-lg font-medium">/100</span></p><p className="mt-2 text-sm">Estimated delay: <strong>{prediction.result.predicted_delay_days} days</strong> ({prediction.result.predicted_delay_range_days[0]}–{prediction.result.predicted_delay_range_days[1]} day range)</p></div>
          <p className="text-sm leading-relaxed text-slate-600">{prediction.result.top_shap_factors[0]?.description || 'Prediction is based on the project details provided.'}</p>
          <details className="rounded-lg border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-800">View details</summary><div className="mt-4 space-y-4"><div><h3 className="text-sm font-semibold text-slate-900">Main risk factors</h3><ul className="mt-2 space-y-2">{prediction.result.top_shap_factors.map((factor, index) => <li key={`${factor.factor}-${index}`} className="flex justify-between gap-3 text-sm"><span className="text-slate-600">{factor.factor}</span><span className={`shrink-0 font-semibold ${factor.impact === 'increases_risk' ? 'text-red-700' : 'text-emerald-700'}`}>{factor.impact === 'increases_risk' ? '+' : ''}{factor.contribution}</span></li>)}</ul></div><div><h3 className="text-sm font-semibold text-slate-900">Suggested actions</h3><ul className="mt-2 list-inside list-disc space-y-2 text-sm text-slate-600">{prediction.result.recommendations.slice(0, 4).map((recommendation) => <li key={recommendation.id}>{recommendation.action}: {recommendation.rationale}</li>)}</ul></div></div></details>
          <p className="text-xs text-slate-500">This individual assessment was not saved to the shared project list.</p>
        </section> : <section className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm"><ShieldAlert className="mx-auto h-9 w-9 text-slate-400" /><h2 className="mt-4 text-lg font-semibold text-slate-900">Your prediction will appear here</h2><p className="mt-2 text-sm leading-relaxed text-slate-500">Add project details or upload a CSV, then select Predict delay to see the risk score, estimated timeline, and recommended actions.</p></section>}
      </aside>
    </main>
  );
};

const inputClass = 'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => <label className="block text-sm font-medium text-slate-700">{label}{children}</label>;
