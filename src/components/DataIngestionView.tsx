import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportProjectsToCSV } from '../utils/datasetGenerator';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Database,
  RefreshCw,
  FileCode,
  ShieldCheck,
} from 'lucide-react';

export const DataIngestionView: React.FC = () => {
  const { projects, importCSV, setActiveTab } = useApp();

  const [csvInput, setCsvInput] = useState('');
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDownloadSampleCSV = () => {
    const csvContent = exportProjectsToCSV(projects);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'land_acquisition_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessImport = (contentToImport: string) => {
    if (!contentToImport.trim()) return;
    setIsProcessing(true);
    void importCSV(contentToImport).then((result) => {
      setImportResult(result);
    }).catch((error: Error) => {
      setImportResult({ imported: 0, errors: [error.message] });
    }).finally(() => {
      setIsProcessing(false);
      setCsvInput('');
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        handleProcessImport(text);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        handleProcessImport(text);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div id="data-ingestion-view" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-amber-500" />
            <span>Data Ingestion Module &amp; LA System Gateway</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingest land acquisition datasets from state revenue portals, Bhoomi, Mahabhumi, and PM GatiShakti databases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSampleCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download PS Benchmark CSV (500 records)</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Current Database Size</span>
            <Database className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{projects.length} Records</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {projects.filter((p) => p.project_status === 'Completed').length} Historical &bull;{' '}
            {projects.filter((p) => p.project_status === 'Ongoing').length} Ongoing
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Approved Data Schema</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">PS Aligned</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Only 12 approved problem statement categories permitted
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Automated Pre-Processing</span>
            <FileCode className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">Active</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Instant SHAP feature vector derivation on parse
          </p>
        </div>
      </div>

      {/* Ingestion Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload & Drag Drop */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Upload Land Acquisition Records (.CSV)
          </h3>
          <p className="text-xs text-slate-500">
            Import projects matching the problem statement schema with automated schema validation and field sanitization.
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer ${
              dragActive ? 'border-amber-500 bg-amber-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-800">
              Drag and drop your CSV file here, or browse
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports Land Acquisition Management System exports (.csv)
            </p>

            <label className="mt-3 inline-block">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 cursor-pointer inline-block">
                Browse Files
              </span>
            </label>
          </div>

          {/* Paste Raw CSV Area */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700">
              Or Paste CSV Content Directly:
            </label>
            <textarea
              rows={5}
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              placeholder="project_id,project_name,project_type,state,district,land_area_hectares,affected_families,compensation_disbursed_pct..."
              className="w-full font-mono text-[11px] p-2.5 border border-slate-300 rounded bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <div className="flex justify-end">
              <button
                disabled={!csvInput.trim() || isProcessing}
                onClick={() => handleProcessImport(csvInput)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-xs"
              >
                {isProcessing ? 'Validating & Ingesting...' : 'Parse & Ingest CSV'}
              </button>
            </div>
          </div>
        </div>

        {/* Ingestion Results & PS Schema Reference */}
        <div className="space-y-4">
          {importResult && (
            <div
              className={`p-4 rounded-lg border text-xs space-y-2 ${
                importResult.errors.length > 0
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Successfully Ingested {importResult.imported} Project Records</span>
              </div>
              <p className="text-[11px]">
                Records have been inserted into the local database and real-time Random Forest predictions have been computed.
              </p>
              <button
                onClick={() => setActiveTab('projects')}
                className="font-bold underline cursor-pointer text-[11px]"
              >
                View in Projects Directory &rarr;
              </button>
            </div>
          )}

          {/* Schema Reference Card */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Approved PS Schema Specification (Data Policy Compliance)
            </h3>
            <p className="text-xs text-slate-500">
              Only standard attributes specified in Ministry of Rural Development (DoLR) data governance guidelines are evaluated.
            </p>

            <div className="space-y-2 text-xs">
              {[
                { field: 'project_type', type: 'String', desc: 'Highway, Railway, Power, Irrigation, Industrial, Urban, Rural' },
                { field: 'land_area_hectares', type: 'Float', desc: 'Total land parcel extent in hectares' },
                { field: 'affected_families', type: 'Integer', desc: 'Displaced/affected families from Social Impact Assessment' },
                { field: 'compensation_disbursed_pct', type: 'Float (0-100)', desc: 'Disbursed compensation / assessed compensation * 100' },
                { field: 'pending_approvals_count', type: 'Integer', desc: 'Forest, Environmental, and Revenue clearances pending' },
                { field: 'legal_disputes_count', type: 'Integer', desc: 'Active writ petitions, title disputes, and court stay orders' },
                { field: 'possession_pct', type: 'Float (0-100)', desc: 'Physical unencumbered possession taken over' },
                { field: 'rr_progress_pct', type: 'Float (0-100)', desc: 'Rehabilitation and Resettlement colony readiness' },
              ].map((item) => (
                <div key={item.field} className="p-2 rounded bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px]">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{item.field}</span>
                    <span className="text-slate-400 ml-1">({item.type})</span>
                  </div>
                  <span className="text-slate-600 sm:text-right mt-0.5 sm:mt-0">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
