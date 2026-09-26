import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AlertCircle, CheckCircle2, FileSpreadsheet, UploadCloud } from 'lucide-react';

type UploadStatus = 'idle' | 'processing' | 'complete' | 'error';

export const DataIngestionView: React.FC = () => {
  const { importCSV } = useApp();
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setStatus('error');
      setError('Choose a CSV file to continue.');
      return;
    }
    setStatus('processing');
    setError('');
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result;
        if (typeof content !== 'string' || !content.trim()) throw new Error('The selected file is empty.');
        const result = await importCSV(content);
        if (result.errors.length) throw new Error(result.errors[0]);
        setStatus('complete');
      } catch (cause) {
        setStatus('error');
        setError(cause instanceof Error ? cause.message : 'Could not process this file.');
      }
    };
    reader.onerror = () => {
      setStatus('error');
      setError('The selected file could not be read.');
    };
    reader.readAsText(file);
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
      <header className="mb-8">
        <p className="text-sm text-slate-500">Update the dataset used for portfolio insights</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Upload data</h1>
      </header>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <div
          onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => { event.preventDefault(); setDragActive(false); handleFile(event.dataTransfer.files[0]); }}
          className={`rounded-xl border-2 border-dashed p-10 text-center transition ${dragActive ? 'border-slate-700 bg-slate-50' : 'border-slate-300'}`}
        >
          <FileSpreadsheet className="mx-auto h-10 w-10 text-slate-500" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Choose a CSV file</h2>
          <p className="mt-2 text-sm text-slate-600">Each upload replaces the current dataset. Uploaded rows stay private and are not shown here.</p>
          <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700">
            <UploadCloud className="h-4 w-4" /> Browse files
            <input type="file" accept=".csv,text/csv" disabled={status === 'processing'} onChange={(event) => handleFile(event.target.files?.[0])} className="sr-only" />
          </label>
          <p className="mt-3 text-xs text-slate-500">or drag and drop a .csv file</p>
        </div>

        {status !== 'idle' && <div role="status" aria-live="polite" className={`mt-5 flex items-start gap-3 rounded-xl border p-4 ${status === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-slate-200 bg-slate-50 text-slate-800'}`}>
          {status === 'error' ? <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> : status === 'complete' ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /> : <span className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />}
          <div><p className="font-semibold">{status === 'processing' ? 'Data received. Updating risk insights…' : status === 'complete' ? 'Insights updated' : 'Upload needs attention'}</p>{status === 'error' && <p className="mt-1 text-sm">{error}</p>}</div>
        </div>}
      </section>
    </main>
  );
};
