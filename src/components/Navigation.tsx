import React, { useState } from 'react';
import { useApp, NavTab } from '../context/AppContext';
import {
  LayoutDashboard,
  MapPin,
  FolderKanban,
  BrainCircuit,
  Sliders,
  UploadCloud,
  Cpu,
  Webhook,
  History,
  Menu,
  X,
  ChevronRight,
  HeartHandshake,
} from 'lucide-react';

interface TabItem {
  id: NavTab;
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  badge?: string;
  category?: 'primary' | 'analytical' | 'system';
}

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, projects } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const highRiskCount = projects.filter(
    (p) => p.project_status === 'Ongoing' && (p.prediction?.risk_score ?? 0) >= 65
  ).length;

  const tabs: TabItem[] = [
    {
      id: 'dashboard',
      label: 'Executive Surveillance',
      shortLabel: 'Surveillance',
      icon: LayoutDashboard,
      category: 'primary',
    },
    {
      id: 'gis_map',
      label: 'GPS & GIS Digital Map',
      shortLabel: 'GPS Map',
      icon: MapPin,
      badge: highRiskCount > 0 ? `${highRiskCount}` : undefined,
      category: 'primary',
    },
    {
      id: 'projects',
      label: 'Acquisitions Portfolio',
      shortLabel: 'Acquisitions',
      icon: FolderKanban,
      category: 'primary',
    },
    {
      id: 'project_detail',
      label: 'SHAP Explainability',
      shortLabel: 'AI Explainability',
      icon: BrainCircuit,
      category: 'analytical',
    },
    {
      id: 'what_if',
      label: 'What-If Simulation',
      shortLabel: 'What-If Sandbox',
      icon: Sliders,
      category: 'analytical',
    },
    {
      id: 'data_ingestion',
      label: 'Data Ingestion',
      shortLabel: 'Ingestion',
      icon: UploadCloud,
      category: 'system',
    },
    {
      id: 'continuous_learning',
      label: 'ML Registry & Retraining',
      shortLabel: 'ML Registry',
      icon: Cpu,
      category: 'system',
    },
    {
      id: 'api_explorer',
      label: 'API & Gateway Docs',
      shortLabel: 'API Docs',
      icon: Webhook,
      category: 'system',
    },
    {
      id: 'audit_trail',
      label: 'Statutory Audit Trail',
      shortLabel: 'Audit Trail',
      icon: History,
      category: 'system',
    },
    {
      id: 'citizen_portal',
      label: 'Citizen Help Portal',
      shortLabel: 'Citizen Help',
      icon: HeartHandshake,
      category: 'primary',
    },
  ];

  const handleTabClick = (tabId: NavTab) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const activeTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <nav
      id="main-navigation"
      className="bg-[#FFFFFF] border-b border-[#DFE3DC] sticky top-[72px] z-30 transition-all duration-200 ease-in-out shadow-2xs"
    >
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop & Tablet Navigation: Clean Architectural Hairline Style */}
        <div className="hidden md:flex items-center justify-between gap-1 py-1.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => handleTabClick(tab.id)}
                  className={`group relative flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] text-xs font-semibold rounded-[4px] transition-all duration-200 ease-in-out cursor-pointer select-none active:scale-[0.98] ${
                    isActive
                      ? 'bg-[#0C2B20] text-[#FFFFFF] shadow-xs'
                      : 'text-[#4E5C55] hover:text-[#141E1A] hover:bg-[#ECEEEA] focus:outline-none focus:ring-1 focus:ring-[#0C2B20]'
                  }`}
                  title={tab.label}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 transition-colors duration-200 ease-in-out ${
                      isActive
                        ? 'text-[#FFFFFF]'
                        : 'text-[#4E5C55] group-hover:text-[#141E1A]'
                    }`}
                  />
                  <span>{tab.shortLabel || tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`font-mono-data text-[10px] px-1.5 py-0.2 rounded-[2px] font-bold transition-transform duration-200 ease-in-out group-hover:scale-105 ${
                        isActive
                          ? 'bg-[#BA2D1D] text-white'
                          : 'bg-[#FAECEB] text-[#BA2D1D] border border-[#F0B8B3]'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Navigation Header Bar */}
        <div className="flex md:hidden items-center justify-between py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#4E5C55] uppercase tracking-wider font-mono-data">
              Section:
            </span>
            <div className="flex items-center gap-1.5 font-bold text-xs text-[#0C2B20] bg-[#ECEEEA] px-3 py-2 min-h-[44px] rounded-[4px] border border-[#DFE3DC]">
              <activeTabObj.icon className="w-4 h-4" />
              <span>{activeTabObj.label}</span>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#141E1A] bg-[#FFFFFF] hover:bg-[#ECEEEA] border border-[#DFE3DC] px-4 py-2.5 min-h-[44px] rounded-[4px] transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <>
                <X className="w-4 h-4 text-[#4E5C55]" />
                <span>Close</span>
              </>
            ) : (
              <>
                <Menu className="w-4 h-4 text-[#4E5C55]" />
                <span>All Sections</span>
              </>
            )}
          </button>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-[#DFE3DC] animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex items-center justify-between p-3 min-h-[48px] rounded-[4px] text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? 'bg-[#0C2B20] text-white'
                        : 'bg-[#FFFFFF] hover:bg-[#ECEEEA] text-[#4E5C55] border border-[#DFE3DC]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-white' : 'text-[#4E5C55]'
                        }`}
                      />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge ? (
                      <span className="font-mono-data text-[10px] bg-[#BA2D1D] text-white font-bold px-2 py-0.5 rounded-[2px]">
                        {tab.badge} High Risk
                      </span>
                    ) : (
                      <ChevronRight
                        className={`w-3.5 h-3.5 ${
                          isActive ? 'text-[#86A697]' : 'text-[#A0AEC0]'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
