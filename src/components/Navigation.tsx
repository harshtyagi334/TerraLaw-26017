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
  Target,
  FileText,
  Compass,
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
      id: 'projects',
      label: 'Project Analysis',
      icon: Target,
      category: 'primary',
    },
    {
      id: 'gis_map',
      label: 'GIS Explorer',
      icon: Compass,
      badge: highRiskCount > 0 ? `${highRiskCount}` : undefined,
      category: 'primary',
    },
    {
      id: 'what_if',
      label: 'Risk Analysis',
      shortLabel: 'Risk',
      icon: Sliders,
      category: 'analytical',
    },
    {
      id: 'project_detail',
      label: 'Reports',
      shortLabel: 'Reports',
      icon: FileText,
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
      className="bg-[#1A1A1A] border-b border-[#2A2A2A] sticky top-[64px] z-30"
    >
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-0.5 py-0 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => handleTabClick(tab.id)}
                className={`group relative flex items-center gap-1.5 px-3.5 py-3 text-sm font-medium transition-all duration-150 ease-in-out cursor-pointer select-none whitespace-nowrap ${
                  isActive
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/80'
                }`}
                title={tab.label}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#B9B7FA]' : 'text-white/40 group-hover:text-white/70'
                  }`}
                />
                <span>{tab.shortLabel || tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-[#E5484D] text-white'
                        : 'bg-[#E5484D]/20 text-[#E5484D]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#6C63E0] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Navigation Header Bar */}
        <div className="flex md:hidden items-center justify-between py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 font-semibold text-sm text-white bg-[#6C63E0]/20 px-3 py-2 min-h-[40px] rounded-lg border border-[#6C63E0]/30">
              <activeTabObj.icon className="w-4 h-4 text-[#B9B7FA]" />
              <span>{activeTabObj.shortLabel || activeTabObj.label}</span>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center gap-1.5 text-sm font-medium text-white bg-white/8 hover:bg-white/15 border border-white/15 px-4 py-2 min-h-[40px] rounded-lg transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <>
                <X className="w-4 h-4 text-white/60" />
                <span>Close</span>
              </>
            ) : (
              <>
                <Menu className="w-4 h-4 text-white/60" />
                <span>Menu</span>
              </>
            )}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-[#2A2A2A] animate-in fade-in slide-in-from-top-2 duration-150">
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
                        ? 'bg-[#6C63E0] text-white'
                        : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/50'}`} />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge ? (
                      <span className="text-[10px] bg-[#E5484D] text-white font-bold px-2 py-0.5 rounded-full">
                        {tab.badge} Alert
                      </span>
                    ) : (
                      <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white/60' : 'text-white/30'}`} />
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
