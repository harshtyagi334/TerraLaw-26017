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
      label: 'Dashboard',
      icon: LayoutDashboard,
      category: 'primary',
    },
    {
      id: 'gis_map',
      label: 'Map View',
      icon: MapPin,
      badge: highRiskCount > 0 ? `${highRiskCount}` : undefined,
      category: 'primary',
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderKanban,
      category: 'primary',
    },
    {
      id: 'project_detail',
      label: 'Project Details',
      shortLabel: 'Details',
      icon: BrainCircuit,
      category: 'analytical',
    },
    {
      id: 'what_if',
      label: 'Scenario Planner',
      shortLabel: 'Scenarios',
      icon: Sliders,
      category: 'analytical',
    },
    {
      id: 'data_ingestion',
      label: 'Data Upload',
      icon: UploadCloud,
      category: 'system',
    },
    {
      id: 'continuous_learning',
      label: 'ML Models',
      icon: Cpu,
      category: 'system',
    },
    {
      id: 'api_explorer',
      label: 'API Docs',
      icon: Webhook,
      category: 'system',
    },
    {
      id: 'audit_trail',
      label: 'Audit Log',
      icon: History,
      category: 'system',
    },
    {
      id: 'citizen_portal',
      label: 'Help',
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
      className="bg-white border-b border-[#E4E8E2] sticky top-[64px] z-30 shadow-sm"
    >
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-0.5 py-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => handleTabClick(tab.id)}
                className={`group relative flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-sm font-medium rounded-lg transition-all duration-150 ease-in-out cursor-pointer select-none whitespace-nowrap ${
                  isActive
                    ? 'bg-[#1A5C3C]/10 text-[#1A5C3C] font-semibold'
                    : 'text-[#52605A] hover:text-[#1A2520] hover:bg-[#F5F6F3]'
                }`}
                title={tab.label}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#1A5C3C]' : 'text-[#7A8780] group-hover:text-[#1A2520]'
                  }`}
                />
                <span>{tab.shortLabel || tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-red-500 text-white'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#1A5C3C] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Navigation Header Bar */}
        <div className="flex md:hidden items-center justify-between py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 font-semibold text-sm text-[#1A5C3C] bg-[#F0F7F4] px-3 py-2 min-h-[40px] rounded-lg border border-[#C8DFCF]">
              <activeTabObj.icon className="w-4 h-4" />
              <span>{activeTabObj.shortLabel || activeTabObj.label}</span>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center gap-1.5 text-sm font-medium text-[#1A2520] bg-white hover:bg-[#F5F6F3] border border-[#E4E8E2] px-4 py-2 min-h-[40px] rounded-lg transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <>
                <X className="w-4 h-4 text-[#52605A]" />
                <span>Close</span>
              </>
            ) : (
              <>
                <Menu className="w-4 h-4 text-[#52605A]" />
                <span>Menu</span>
              </>
            )}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-[#E4E8E2] animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex items-center justify-between p-3 min-h-[48px] rounded-xl text-sm font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-[#1A5C3C] text-white'
                        : 'bg-white hover:bg-[#F5F6F3] text-[#52605A] border border-[#E4E8E2]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#7A8780]'}`} />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge ? (
                      <span className="text-[10px] bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">
                        {tab.badge} Alert
                      </span>
                    ) : (
                      <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white/60' : 'text-[#C0CAC5]'}`} />
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

