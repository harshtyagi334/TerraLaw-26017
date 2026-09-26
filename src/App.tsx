/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { AlertsView } from './components/AlertsView';
import { ProjectsListView } from './components/ProjectsListView';
import { PredictionView } from './components/PredictionView';
import { ProjectDetailView } from './components/ProjectDetailView';
const GISMapView = lazy(() => import('./components/GISMapView').then((module) => ({ default: module.GISMapView })));
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { DataIngestionView } from './components/DataIngestionView';
import { ModelPerformanceView } from './components/ModelPerformanceView';
import { APIExplorerView } from './components/APIExplorerView';
import { AuditTrailView } from './components/AuditTrailView';
import { AuthModal } from './components/AuthModal';
import { HomePage } from './components/HomePage';
import { CitizenHelpPortal } from './components/CitizenHelpPortal';
import { Shield, CheckCircle, Hexagon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <main className="flex-1 pb-16">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
        >
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'alerts' && <AlertsView />}
          {activeTab === 'alerts' && <AlertsView />}
          {activeTab === 'projects' && <ProjectsListView />}
          {activeTab === 'prediction' && <PredictionView />}
          {activeTab === 'project_detail' && <ProjectDetailView />}
          {activeTab === 'gis_map' && <Suspense fallback={<div className="max-w-7xl mx-auto px-6 py-12 text-slate-600">Loading map…</div>}><GISMapView /></Suspense>}
          {activeTab === 'what_if' && <WhatIfSimulator />}
          {(activeTab === 'data_ingestion' || (activeTab as string) === 'data_ingest') && <DataIngestionView />}
          {(activeTab === 'continuous_learning' || (activeTab as string) === 'model_metrics') && <ModelPerformanceView />}
          {(activeTab === 'api_explorer' || (activeTab as string) === 'api_docs') && <APIExplorerView />}
          {activeTab === 'audit_trail' && <AuditTrailView />}
          {activeTab === 'citizen_portal' && <CitizenHelpPortal />}
        </motion.div>
      </AnimatePresence>
    </main>
  );
};

const AppShell: React.FC = () => {
  const { isAuthenticated, showAuthModal, setShowAuthModal, themeConfig } = useApp();

  if (!isAuthenticated) {
    return <HomePage />;
  }

  return (
    <div className="min-h-screen bg-[#F6F6FB] text-[#1A1A2E] flex flex-col font-sans selection:bg-[#6C63E0]/15 selection:text-[#1A1A2E]">
      <Header />
      <Navigation />
      <MainContent />

      {/* Auth Modal for Switching Designation / Registering */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          isFullPage={false}
        />
      )}

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-[#E4E4F0] bg-white text-xs text-[#64648C] py-5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1536px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[#64648C]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1A1A2E]">LANDINTEL</span>
            <span>&bull;</span>
            <span className="text-[#64648C]">Land Acquisition Intelligence Platform</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#9494B8]">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>RFCTLARR Framework</span>
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-[#6C63E0]" />
              <span>TreeSHAP Explainability</span>
            </span>
            <span>&bull;</span>
            <span>ML-Powered Prediction</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
