import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RotateCcw, Filter, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { DISTRICT_COORDINATES } from '../utils/datasetGenerator';

export const FilterBar: React.FC = () => {
  const {
    selectedState,
    setSelectedState,
    selectedDistrict,
    setSelectedDistrict,
    selectedType,
    setSelectedType,
    selectedStage,
    setSelectedStage,
    selectedRisk,
    setSelectedRisk,
    resetFilters,
    filteredProjects,
    projects,
    userRole,
  } = useApp();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const states = [
    'All',
    'Maharashtra',
    'Gujarat',
    'Madhya Pradesh',
    'Uttar Pradesh',
    'Karnataka',
    'Tamil Nadu',
    'Odisha',
  ];
  const projectTypes = [
    'All',
    'Highway',
    'Railway',
    'Power',
    'Irrigation',
    'Industrial',
    'Urban',
    'Rural',
  ];
  const stages = [
    'All',
    'Notification',
    'Survey',
    'Compensation',
    'Possession',
    'R&R',
    'Completed',
  ];
  const riskCategories = ['All', 'High', 'Medium', 'Low'];

  // Available districts based on selected state
  const availableDistricts = [
    'All',
    ...Object.entries(DISTRICT_COORDINATES)
      .filter(([_, info]) => selectedState === 'All' || info.state === selectedState)
      .map(([dist]) => dist),
  ];

  // Count active non-default filters
  const activeFilterCount = [
    selectedState !== 'All',
    selectedDistrict !== 'All',
    selectedType !== 'All',
    selectedStage !== 'All',
    selectedRisk !== 'All',
  ].filter(Boolean).length;

  const hasAdvancedActive = selectedDistrict !== 'All' || selectedType !== 'All';

  return (
    <div
      id="filter-bar"
      className="bg-[#FFFFFF] border border-[#DFE3DC] rounded-[4px] p-3 sm:p-3.5 mb-6 transition-all"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        {/* Left: Section label & project count */}
        <div className="flex items-center gap-2.5 font-bold text-[#141E1A] shrink-0">
          <div className="w-6 h-6 rounded-[2px] bg-[#ECEEEA] border border-[#DFE3DC] flex items-center justify-center text-[#0C2B20]">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold">Filter Acquisitions</span>
          <span className="font-mono-data bg-[#ECEEEA] text-[#141E1A] px-2 py-0.5 rounded-[2px] text-[10px] font-bold border border-[#DFE3DC]">
            {filteredProjects.length} / {projects.length} Parcels
          </span>
          {activeFilterCount > 0 && (
            <span className="font-mono-data text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-[#EAF4EE] text-[#196842] border border-[#B8DCBE]">
              {activeFilterCount} Active
            </span>
          )}
        </div>

        {/* Right: Clean Horizontal Filters with Architectural Selectors */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* State Filter */}
          <div className="flex items-center gap-1.5 bg-[#ECEEEA]/50 border border-[#DFE3DC] rounded-[4px] px-2.5 py-1.5 min-h-[40px] flex-1 sm:flex-initial">
            <label className="text-[10px] font-bold text-[#4E5C55] font-mono-data uppercase shrink-0">State:</label>
            <select
              id="filter-state-select"
              value={selectedState}
              disabled={userRole === 'State Admin' || userRole === 'District Admin'}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict('All');
              }}
              className="bg-transparent text-[#141E1A] focus:outline-none text-xs font-semibold cursor-pointer disabled:text-[#78857E] w-full"
            >
              {states.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All 7 States' : s}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-1.5 bg-[#ECEEEA]/50 border border-[#DFE3DC] rounded-[4px] px-2.5 py-1.5 min-h-[40px] flex-1 sm:flex-initial">
            <label className="text-[10px] font-bold text-[#4E5C55] font-mono-data uppercase shrink-0">Risk:</label>
            <select
              id="filter-risk-select"
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className={`bg-transparent text-xs font-bold cursor-pointer focus:outline-none w-full ${
                selectedRisk === 'High'
                  ? 'text-[#BA2D1D]'
                  : selectedRisk === 'Medium'
                  ? 'text-[#C0781A]'
                  : selectedRisk === 'Low'
                  ? 'text-[#27774E]'
                  : 'text-[#141E1A]'
              }`}
            >
              {riskCategories.map((r) => (
                <option key={r} value={r}>
                  {r === 'All' ? 'All Risks' : `${r} Risk`}
                </option>
              ))}
            </select>
          </div>

          {/* Stage Filter */}
          <div className="flex items-center gap-1.5 bg-[#ECEEEA]/50 border border-[#DFE3DC] rounded-[4px] px-2.5 py-1.5 min-h-[40px] flex-1 sm:flex-initial">
            <label className="text-[10px] font-bold text-[#4E5C55] font-mono-data uppercase shrink-0">Stage:</label>
            <select
              id="filter-stage-select"
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="bg-transparent text-[#141E1A] focus:outline-none text-xs font-semibold cursor-pointer w-full"
            >
              {stages.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All 5 Stages' : s}
                </option>
              ))}
            </select>
          </div>

          {/* Expand Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] rounded-[4px] text-xs font-semibold transition-all duration-200 ease-in-out active:scale-[0.98] cursor-pointer border flex-1 sm:flex-initial ${
              showAdvanced || hasAdvancedActive
                ? 'bg-[#EAF4EE] text-[#196842] border-[#B8DCBE]'
                : 'bg-[#FFFFFF] hover:bg-[#ECEEEA] text-[#4E5C55] border-[#DFE3DC]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>More Filters</span>
            {hasAdvancedActive && (
              <span className="w-1.5 h-1.5 rounded-[1px] bg-[#196842]"></span>
            )}
            {showAdvanced ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Subtle Reset Button */}
          {activeFilterCount > 0 && (
            <button
              id="filter-reset-btn"
              onClick={resetFilters}
              className="flex items-center justify-center gap-1 px-3 py-2 min-h-[40px] text-xs text-[#4E5C55] hover:text-[#141E1A] hover:bg-[#ECEEEA] active:scale-[0.98] rounded-[4px] transition-all duration-200 ease-in-out cursor-pointer font-medium font-mono-data border border-[#DFE3DC] sm:border-transparent"
              title="Reset all filters to defaults"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Secondary Filters Drawer */}
      {showAdvanced && (
        <div className="mt-3 pt-3 border-t border-[#DFE3DC] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-1 text-xs">
          {/* District Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[#4E5C55] font-semibold min-w-[70px] font-mono-data text-[11px]">District:</label>
            <select
              id="filter-district-select"
              value={selectedDistrict}
              disabled={userRole === 'District Admin'}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="flex-1 bg-[#FFFFFF] hover:bg-[#ECEEEA]/40 border border-[#DFE3DC] rounded-[4px] px-2.5 py-1.5 text-[#141E1A] focus:outline-none text-xs disabled:bg-[#ECEEEA] disabled:text-[#78857E] font-medium cursor-pointer"
            >
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d === 'All' ? 'All Districts' : d}
                </option>
              ))}
            </select>
          </div>

          {/* Project Type Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[#4E5C55] font-semibold min-w-[70px] font-mono-data text-[11px]">Type:</label>
            <select
              id="filter-type-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="flex-1 bg-[#FFFFFF] hover:bg-[#ECEEEA]/40 border border-[#DFE3DC] rounded-[4px] px-2.5 py-1.5 text-[#141E1A] focus:outline-none text-xs font-medium cursor-pointer"
            >
              {projectTypes.map((t) => (
                <option key={t} value={t}>
                  {t === 'All' ? 'All Sectors' : t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setSelectedDistrict('All');
                setSelectedType('All');
              }}
              className="text-[11px] text-[#4E5C55] hover:text-[#141E1A] font-semibold cursor-pointer font-mono-data"
            >
              Clear Secondary Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
