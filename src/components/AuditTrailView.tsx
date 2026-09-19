import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  ShieldCheck,
  Filter,
  Download,
  Search,
  UserCheck,
  History,
  Lock,
} from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const { auditLogs } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('All');

  const filteredLogs = auditLogs.filter((log) => {
    if (filterAction !== 'All' && log.action !== filterAction) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.details.toLowerCase().includes(q) ||
        log.user_id.toLowerCase().includes(q) ||
        log.user_role.toLowerCase().includes(q) ||
        log.entity_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'User ID', 'User Role', 'Action', 'Entity Type', 'Entity ID', 'Details'];
    const rows = filteredLogs.map((l) => [
      l.log_id,
      `"${l.timestamp}"`,
      `"${l.user_id}"`,
      `"${l.user_role}"`,
      `"${l.action}"`,
      `"${l.entity_type}"`,
      `"${l.entity_id}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="audit-trail-view" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-amber-500" />
            <span>Governance Audit Trail &amp; Regulatory Event Log</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-evident logs of administrative stage overrides, risk re-evaluations, and data ingestion actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Audit Log (CSV)</span>
          </button>
        </div>
      </div>

      {/* Security Statement Banner */}
      <div className="p-3.5 bg-slate-900 text-white rounded-lg flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 text-xs">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>
            <span className="font-bold text-amber-400">Cryptographic Integrity:</span> All administrative updates and ML inference executions are cryptographically signed with immutable SHA-256 state hashes.
          </span>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-slate-800 px-2 py-0.5 rounded">
          Status: Compliant
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by User, Project ID, or Details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Filter Action:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700"
          >
            <option value="All">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="APPROVE">APPROVE</option>
            <option value="INGEST">INGEST</option>
            <option value="OVERRIDE">OVERRIDE</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Log ID &amp; Timestamp</th>
                <th className="py-2.5 px-3">User &amp; Role</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity Type &amp; ID</th>
                <th className="py-2.5 px-3">Details &amp; Regulatory Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No audit records match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-800">{log.log_id}</div>
                      <div className="text-[11px] text-slate-500">{log.timestamp}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{log.user_id}</div>
                      <div className="text-[11px] text-slate-500">{log.user_role}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'CREATE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action === 'UPDATE'
                            ? 'bg-blue-100 text-blue-800'
                            : log.action === 'INGEST'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-700">{log.entity_type}</span>
                      <span className="block font-mono text-[11px] text-amber-600 font-semibold">
                        {log.entity_id}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 max-w-md">
                      <p className="leading-snug text-[11px]">{log.details}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
