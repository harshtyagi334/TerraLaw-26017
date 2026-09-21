/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { ProjectsListView } from './components/ProjectsListView';
import { ProjectDetailView } from './components/ProjectDetailView';
import { GISMapView } from './components/GISMapView';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { DataIngestionView } from './components/DataIngestionView';
import { ModelPerformanceView } from './components/ModelPerformanceView';
import { APIExplorerView } from './components/APIExplorerView';
import { AuditTrailView } from './components/AuditTrailView';
import { AuthModal } from './components/AuthModal';
import { HomePage } from './components/HomePage';
import { CitizenHelpPortal } from './components/CitizenHelpPortal';
import { Shield, CheckCircle } from 'lucide-react';
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
          {activeTab === 'projects' && <ProjectsListView />}
          {activeTab === 'project_detail' && <ProjectDetailView />}
          {activeTab === 'gis_map' && <GISMapView />}
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
    <div className={`min-h-screen bg-[#F7F8F5] text-[#111814] flex flex-col font-sans ${themeConfig.selectionBg} selection:text-[#111814]`}>
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

      {/* Clean & Spacious Minimal Footer */}
      <footer className="mt-auto border-t border-[#E4E7E1] bg-white text-xs text-[#5B6660] py-5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1536px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[#5B6660]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#111814]">Land Acquisition Delay Warning</span>
            <span>&bull;</span>
            <span className="text-[#5B6660]">Predictive Analytics Platform</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#5B6660]">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-[#1F7A4D]" />
              <span>RFCTLARR Framework</span>
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Shield className={`w-3.5 h-3.5 ${themeConfig.accentText}`} />
              <span>TreeSHAP Explainability</span>
            </span>
            <span>&bull;</span>
            <span>500 Synthetic Records (400 Train / 100 Test)</span>
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
