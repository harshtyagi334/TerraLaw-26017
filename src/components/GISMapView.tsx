import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import { LandProject } from '../types';
import {
  MapPin,
  Layers,
  Filter,
  Eye,
  Info,
  ExternalLink,
  ShieldAlert,
  Search,
  SlidersHorizontal,
  Compass,
  Maximize2,
  Minimize2,
  Crosshair,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  X,
  FileText,
  Scale,
  Zap,
} from 'lucide-react';
import { DISTRICT_COORDINATES } from '../utils/datasetGenerator';

// State bounding boxes for smooth pan/zoom
const STATE_BOUNDS: Record<string, { center: [number, number]; zoom: number }> = {
  All: { center: [22.8, 79.6], zoom: 5 },
  Maharashtra: { center: [19.5, 76.0], zoom: 6.5 },
  Gujarat: { center: [22.4, 71.8], zoom: 7 },
  'Madhya Pradesh': { center: [23.5, 78.5], zoom: 6.5 },
  'Uttar Pradesh': { center: [26.8, 80.9], zoom: 6.8 },
  Karnataka: { center: [14.8, 75.8], zoom: 6.8 },
  'Tamil Nadu': { center: [11.1, 78.6], zoom: 7 },
  Odisha: { center: [20.5, 84.4], zoom: 7 },
};

// Base map tile options (all free, high-performance, and watermark-free)
const TILE_PROVIDERS = {
  osm: {
    name: 'OpenStreetMap Clean',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: ['a', 'b', 'c'],
  },
  esriLight: {
    name: 'Esri Light Canvas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    subdomains: ['server'],
  },
  esriTopo: {
    name: 'Esri World Topographic',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom',
    subdomains: ['server'],
  },
  esriSat: {
    name: 'Satellite Hybrid',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
    subdomains: ['server'],
  },
};

export const GISMapView: React.FC = () => {
  const {
    filteredProjects,
    setSelectedProject,
    setActiveTab,
    selectedState,
    setSelectedState,
    selectedDistrict,
    setSelectedDistrict,
    userRole,
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Filter states
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [activeTileType, setActiveTileType] = useState<keyof typeof TILE_PROVIDERS>('osm');
  const [selectedMapProject, setSelectedMapProject] = useState<LandProject | null>(null);
  const [dotSize, setDotSize] = useState<'small' | 'dense' | 'standard'>('small');
  const [showPulseAnimation, setShowPulseAnimation] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number } | null>({ lat: 20.5937, lng: 78.9629 });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Filtered dataset for map display
  const mapProjects = useMemo(() => {
    return filteredProjects.filter((p) => {
      const risk = p.prediction?.risk_score ?? 50;
      if (riskFilter === 'high' && risk < 65) return false;
      if (riskFilter === 'medium' && (risk < 35 || risk >= 65)) return false;
      if (riskFilter === 'low' && risk >= 35) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = p.project_name.toLowerCase().includes(query);
        const matchId = p.project_id.toLowerCase().includes(query);
        const matchDist = p.district.toLowerCase().includes(query);
        const matchState = p.state.toLowerCase().includes(query);
        if (!matchName && !matchId && !matchDist && !matchState) return false;
      }

      return true;
    });
  }, [filteredProjects, riskFilter, searchQuery]);

  // Breakdown statistics for plotted projects
  const stats = useMemo(() => {
    const total = filteredProjects.length;
    const high = filteredProjects.filter((p) => (p.prediction?.risk_score ?? 0) >= 65).length;
    const medium = filteredProjects.filter((p) => {
      const r = p.prediction?.risk_score ?? 0;
      return r >= 35 && r < 65;
    }).length;
    const low = filteredProjects.filter((p) => (p.prediction?.risk_score ?? 0) < 35).length;
    return { total, high, medium, low };
  }, [filteredProjects]);

  // Set default selected project on initial mount if none selected
  useEffect(() => {
    if (!selectedMapProject && mapProjects.length > 0) {
      // Find a high risk project or default first
      const sample = mapProjects.find((p) => (p.prediction?.risk_score ?? 0) >= 65) || mapProjects[0];
      setSelectedMapProject(sample);
    }
  }, [mapProjects, selectedMapProject]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create map instance
    const initialCenter: [number, number] = [22.8, 79.6];
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 5,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: false,
    });

    // Add zoom control at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer
    const provider = TILE_PROVIDERS.osm;
    const tileLayer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      subdomains: provider.subdomains,
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Create layer group for project dots
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Mousemove GPS telemetry tracker
    map.on('mousemove', (e) => {
      setLiveCoords({
        lat: parseFloat(e.latlng.lat.toFixed(4)),
        lng: parseFloat(e.latlng.lng.toFixed(4)),
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const provider = TILE_PROVIDERS[activeTileType];
    tileLayerRef.current.setUrl(provider.url);
  }, [activeTileType]);

  // Handle State/District Zoom Bounds
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (selectedDistrict !== 'All' && DISTRICT_COORDINATES[selectedDistrict]) {
      const coords = DISTRICT_COORDINATES[selectedDistrict];
      mapInstanceRef.current.flyTo([coords.lat, coords.lng], 9, {
        duration: 1.2,
      });
    } else if (selectedState in STATE_BOUNDS) {
      const target = STATE_BOUNDS[selectedState];
      mapInstanceRef.current.flyTo(target.center, target.zoom, {
        duration: 1.2,
      });
    } else {
      mapInstanceRef.current.flyTo(STATE_BOUNDS.All.center, STATE_BOUNDS.All.zoom, {
        duration: 1.2,
      });
    }
  }, [selectedState, selectedDistrict]);

  // Render GPS Dots on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    // Determine dot radius based on selection
    const baseRadius = dotSize === 'dense' ? 4 : dotSize === 'standard' ? 8 : 6;

    mapProjects.forEach((project) => {
      const { lat, lng } = project.geo_location;
      if (!lat || !lng) return;

      const risk = project.prediction?.risk_score ?? 50;
      const isHigh = risk >= 65;
      const isMedium = risk >= 35 && risk < 65;
      const isSelected = selectedMapProject?.project_id === project.project_id;

      const color = isHigh ? '#BA2D1D' : isMedium ? '#C0781A' : '#196842';
      const fillColor = isHigh ? '#EF4444' : isMedium ? '#F59E0B' : '#10B981';

      // Use Leaflet DivIcon for ultra-crisp GPS Dots with white outline and optional radar glow
      const markerHtml = `
        <div style="position: relative; width: ${baseRadius * 2 + 4}px; height: ${baseRadius * 2 + 4}px; display: flex; align-items: center; justify-content: center;">
          ${
            isHigh && showPulseAnimation
              ? `<div class="gps-pulse-ring" style="border: 2px solid ${fillColor}; opacity: 0.6;"></div>`
              : ''
          }
          <div class="gps-marker-dot" style="
            width: ${isSelected ? baseRadius * 2 + 4 : baseRadius * 2}px;
            height: ${isSelected ? baseRadius * 2 + 4 : baseRadius * 2}px;
            background-color: ${fillColor};
            border: ${isSelected ? '2.5px solid #0C2B20' : '2px solid #FFFFFF'};
            border-radius: 50%;
            box-shadow: 0 2px 5px rgba(0,0,0,0.35);
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-gps-dot',
        html: markerHtml,
        iconSize: [baseRadius * 2 + 4, baseRadius * 2 + 4],
        iconAnchor: [(baseRadius * 2 + 4) / 2, (baseRadius * 2 + 4) / 2],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Custom tooltip with GPS summary
      const popupHtml = `
        <div style="font-size: 11px;">
          <div style="font-weight: 700; color: #F4F5F0; margin-bottom: 2px;">${project.project_name}</div>
          <div style="color: #A0ABA4; font-size: 10px; margin-bottom: 6px;">
            ${project.district}, ${project.state} &bull; <span style="font-family: monospace;">${lat.toFixed(3)}&deg;N, ${lng.toFixed(3)}&deg;E</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #234839; padding-top: 5px; font-size: 10px;">
            <span style="color: ${fillColor}; font-weight: 700;">
              Risk: ${risk}/100 (${project.prediction?.risk_category || (isHigh ? 'High' : isMedium ? 'Medium' : 'Low')})
            </span>
            <span style="color: #DFE3DC;">
              Est Delay: +${Math.round((project.prediction?.predicted_delay_days ?? 60) / 30)} mo
            </span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'custom-gps-popup',
        closeButton: false,
        offset: [0, -6],
      });

      marker.on('mouseover', function () {
        this.openPopup();
      });

      marker.on('mouseout', function () {
        this.closePopup();
      });

      marker.on('click', () => {
        setSelectedMapProject(project);
        setIsSidebarCollapsed(false);
      });

      markersLayer.addLayer(marker);
    });
  }, [mapProjects, selectedMapProject, dotSize, showPulseAnimation]);

  const handleNavigateToDetails = (p: LandProject) => {
    setSelectedProject(p);
    setActiveTab('project_detail');
  };

  const handleNavigateToSimulation = (p: LandProject) => {
    setSelectedProject(p);
    setActiveTab('what_if');
  };

  // State selection helper
  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    setSelectedDistrict('All');
  };

  return (
    <div id="gps-digital-risk-map" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#DFE3DC]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-[4px] bg-[#0C2B20] text-white">
              <Compass className="w-4 h-4 text-[#52B788]" />
            </span>
            <h1 className="font-serif-heading text-lg sm:text-xl font-bold text-[#141E1A] tracking-tight flex items-center gap-2">
              <span>GPS &amp; GIS Spatial Land Surveillance Map</span>
            </h1>
            <span className="status-tag-live hidden sm:inline-flex">
              <Crosshair className="w-3 h-3 text-[#196842] animate-spin" style={{ animationDuration: '8s' }} />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-[#4E5C55] mt-1 max-w-[65ch]">
            Real-time geospatial plotting of all monitored national infrastructure land parcels, CALA jurisdictions, and delay risk clusters across India.
          </p>
        </div>

        {/* Quick Actions & Basemap Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tile Layer Selector */}
          <div className="flex items-center bg-[#ECEEEA] p-0.5 rounded-[4px] border border-[#DFE3DC] text-xs">
            <button
              onClick={() => setActiveTileType('osm')}
              className={`px-2.5 py-1 rounded-[2px] font-semibold transition cursor-pointer ${
                activeTileType === 'osm' ? 'bg-[#0C2B20] text-white' : 'text-[#4E5C55] hover:text-[#141E1A]'
              }`}
            >
              Street OSM
            </button>
            <button
              onClick={() => setActiveTileType('esriLight')}
              className={`px-2.5 py-1 rounded-[2px] font-semibold transition cursor-pointer ${
                activeTileType === 'esriLight' ? 'bg-[#0C2B20] text-white' : 'text-[#4E5C55] hover:text-[#141E1A]'
              }`}
            >
              Clean Gray
            </button>
            <button
              onClick={() => setActiveTileType('esriTopo')}
              className={`px-2.5 py-1 rounded-[2px] font-semibold transition cursor-pointer ${
                activeTileType === 'esriTopo' ? 'bg-[#0C2B20] text-white' : 'text-[#4E5C55] hover:text-[#141E1A]'
              }`}
            >
              Topographic
            </button>
            <button
              onClick={() => setActiveTileType('esriSat')}
              className={`px-2.5 py-1 rounded-[2px] font-semibold transition cursor-pointer ${
                activeTileType === 'esriSat' ? 'bg-[#0C2B20] text-white' : 'text-[#4E5C55] hover:text-[#141E1A]'
              }`}
            >
              Satellite
            </button>
          </div>

          {/* Dot Size Control */}
          <div className="flex items-center bg-[#ECEEEA] p-0.5 rounded-[4px] border border-[#DFE3DC] text-xs">
            <span className="px-2 text-[10px] font-mono-data text-[#78857E] uppercase font-bold">Dot Size:</span>
            <button
              onClick={() => setDotSize('small')}
              className={`px-2 py-1 rounded-[2px] text-[11px] font-semibold transition cursor-pointer ${
                dotSize === 'small' ? 'bg-[#0C2B20] text-white' : 'text-[#4E5C55] hover:text-[#141E1A]'
              }`}
            >
              Small
            </button>
            <button
              onClick={() => setDotSize('dense')}
              className={`px-2 py-1 rounded-[2px] text-[11px] font-semibold transition cursor-pointer ${
                dotSize === 'dense' ? 'bg-[#0C2B20] text-white' : 'text-[#4E5C55] hover:text-[#141E1A]'
              }`}
            >
              Micro
            </button>
            <button
              onClick={() => setDotSize('standard')}
              className={`px-2 py-1 rounded-[2px] text-[11px] font-semibold transition cursor-pointer ${
                dotSize === 'standard' ? 'bg-[#0C2B20] text-white' : 'text-[#4E5C55] hover:text-[#141E1A]'
              }`}
            >
              Standard
            </button>
          </div>
        </div>
      </div>

      {/* Main Spatial Map Stage & Overlays */}
      <div className="relative w-full rounded-[4px] border border-[#DFE3DC] overflow-hidden shadow-xs bg-[#E5E9EC]">
        {/* Leaflet Map DOM Canvas */}
        <div
          ref={mapContainerRef}
          className="w-full h-[620px] sm:h-[680px] lg:h-[720px] z-0"
          style={{ cursor: 'crosshair' }}
        />

        {/* TOP FLOATING OVERLAY: Title, Count, and Filter Tabs (Matches Exact Screenshot Layout) */}
        <div className="absolute top-3 left-3 right-3 sm:right-auto z-1000 max-w-2xl bg-white/95 backdrop-blur-md rounded-[4px] border border-[#DFE3DC] p-3 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Title & Count Badge */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[4px] bg-[#0C2B20] text-white flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-[#52B788]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif-heading font-bold text-sm sm:text-base text-[#141E1A]">
                    GPS Digital Risk Map
                  </span>
                  <span className="font-mono-data text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-[#ECEEEA] text-[#141E1A] border border-[#DFE3DC]">
                    {mapProjects.length} Plotted
                  </span>
                </div>
                {/* Micro Stats */}
                <div className="flex items-center gap-2.5 text-[11px] font-mono-data text-[#4E5C55] mt-0.5">
                  <span className="flex items-center gap-1 font-semibold text-[#BA2D1D]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#BA2D1D]"></span>
                    {stats.high} High
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1 font-semibold text-[#C0781A]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C0781A]"></span>
                    {stats.medium} Med
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1 font-semibold text-[#27774E]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#27774E]"></span>
                    {stats.low} Low
                  </span>
                </div>
              </div>
            </div>

            {/* Risk Filter Buttons (All, High, Medium, Low) */}
            <div className="flex items-center gap-1 bg-[#ECEEEA] p-0.5 rounded-[4px] border border-[#DFE3DC] text-xs font-medium">
              <button
                onClick={() => setRiskFilter('all')}
                className={`px-2.5 py-1 rounded-[2px] font-semibold transition cursor-pointer ${
                  riskFilter === 'all'
                    ? 'bg-[#0C2B20] text-white shadow-xs'
                    : 'text-[#4E5C55] hover:text-[#141E1A]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setRiskFilter('high')}
                className={`px-2.5 py-1 rounded-[2px] font-semibold transition cursor-pointer ${
                  riskFilter === 'high'
                    ? 'bg-[#BA2D1D] text-white shadow-xs'
                    : 'text-[#BA2D1D] hover:bg-[#FAECEB]'
                }`}
              >
                High
              </button>
              <button
                onClick={() => setRiskFilter('medium')}
                className={`px-2.5 py-1 rounded-[2px] font-semibold transition cursor-pointer ${
                  riskFilter === 'medium'
                    ? 'bg-[#C0781A] text-white shadow-xs'
                    : 'text-[#C0781A] hover:bg-[#FDF3E7]'
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setRiskFilter('low')}
                className={`px-2.5 py-1 rounded-[2px] font-semibold transition cursor-pointer ${
                  riskFilter === 'low'
                    ? 'bg-[#27774E] text-white shadow-xs'
                    : 'text-[#27774E] hover:bg-[#EAF4EE]'
                }`}
              >
                Low
              </button>
            </div>
          </div>

          {/* Search & State Filter Row */}
          <div className="mt-2.5 pt-2 border-t border-[#DFE3DC] flex flex-wrap items-center gap-2">
            {/* Quick State Select */}
            <div className="flex items-center gap-1 text-xs">
              <label className="text-[10px] font-mono-data text-[#4E5C55] uppercase font-bold">State:</label>
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="bg-[#ECEEEA] border border-[#DFE3DC] rounded-[2px] px-2 py-1 text-xs font-semibold text-[#141E1A] focus:outline-hidden"
              >
                <option value="All">All India (7 States)</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Odisha">Odisha</option>
              </select>
            </div>

            {/* Quick District Select */}
            {selectedState !== 'All' && (
              <div className="flex items-center gap-1 text-xs">
                <label className="text-[10px] font-mono-data text-[#4E5C55] uppercase font-bold">District:</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-[#ECEEEA] border border-[#DFE3DC] rounded-[2px] px-2 py-1 text-xs font-semibold text-[#141E1A] focus:outline-hidden"
                >
                  <option value="All">All Districts</option>
                  {Object.entries(DISTRICT_COORDINATES)
                    .filter(([_, data]) => data.state === selectedState)
                    .map(([dist]) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Search Input */}
            <div className="relative flex-1 min-w-[140px]">
              <Search className="w-3 h-3 text-[#78857E] absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search package ID, name..."
                className="w-full bg-[#ECEEEA] border border-[#DFE3DC] rounded-[2px] pl-6 pr-2 py-1 text-xs text-[#141E1A] placeholder-[#78857E] focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#78857E] hover:text-[#141E1A]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Reset View Button */}
            {(selectedState !== 'All' || selectedDistrict !== 'All' || riskFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedState('All');
                  setSelectedDistrict('All');
                  setRiskFilter('all');
                  setSearchQuery('');
                }}
                className="flex items-center gap-1 text-[10px] font-mono-data font-bold text-[#4E5C55] hover:text-[#BA2D1D] bg-[#ECEEEA] px-2 py-1 rounded-[2px] border border-[#DFE3DC] cursor-pointer"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* BOTTOM-LEFT FLOATING OVERLAY: Delay Risk Severity Legend (Matches Screenshot) */}
        <div className="absolute bottom-6 left-3 z-1000 bg-white/95 backdrop-blur-md rounded-[4px] border border-[#DFE3DC] p-3 shadow-md text-xs min-w-[210px]">
          <div className="font-mono-data text-[10px] font-bold tracking-wider uppercase text-[#4E5C55] mb-2 pb-1 border-b border-[#DFE3DC]">
            Delay Risk Severity
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] border border-white shadow-xs"></span>
                <span className="font-medium text-[#141E1A]">High Risk (Score &ge; 65)</span>
              </div>
              <span className="font-mono-data font-bold text-[#BA2D1D]">{stats.high}</span>
            </div>

            <div className="flex items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] border border-white shadow-xs"></span>
                <span className="font-medium text-[#141E1A]">Medium Risk (Score 35–64)</span>
              </div>
              <span className="font-mono-data font-bold text-[#C0781A]">{stats.medium}</span>
            </div>

            <div className="flex items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] border border-white shadow-xs"></span>
                <span className="font-medium text-[#141E1A]">Low Risk (Score &lt; 35)</span>
              </div>
              <span className="font-mono-data font-bold text-[#27774E]">{stats.low}</span>
            </div>
          </div>

          {/* Pulse Toggle */}
          <div className="mt-2.5 pt-2 border-t border-[#DFE3DC] flex items-center justify-between text-[10px] text-[#4E5C55]">
            <span>Radar Pulse:</span>
            <button
              onClick={() => setShowPulseAnimation(!showPulseAnimation)}
              className={`px-1.5 py-0.5 rounded-[2px] font-mono-data font-bold cursor-pointer ${
                showPulseAnimation ? 'bg-[#EAF4EE] text-[#196842] border border-[#B8DCBE]' : 'bg-[#ECEEEA] text-[#78857E]'
              }`}
            >
              {showPulseAnimation ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* PROJECT DETAIL INSPECTOR: Mobile Bottom Sheet / Desktop Floating Slide-Over */}
        {selectedMapProject && !isSidebarCollapsed && (
          <div className="fixed inset-x-0 bottom-0 z-1050 max-h-[85vh] sm:max-h-[calc(100%-24px)] rounded-t-xl sm:rounded-[4px] sm:absolute sm:top-3 sm:right-3 sm:bottom-3 sm:inset-x-auto sm:w-[380px] lg:w-[420px] bg-white/98 backdrop-blur-md border border-[#DFE3DC] shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-bottom-6 sm:slide-in-from-right-4 duration-200">
            {/* Mobile Sheet Pull Bar */}
            <div className="sm:hidden w-full flex justify-center pt-2 pb-1 bg-[#F7F8F5]">
              <div className="w-12 h-1.5 bg-[#CBD5E1] rounded-full"></div>
            </div>

            {/* Header with Title and Close */}
            <div className="p-4 border-b border-[#DFE3DC] bg-[#F7F8F5]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 font-mono-data text-[10px] text-[#4E5C55] mb-1">
                    <span className="font-bold text-[#141E1A]">{selectedMapProject.project_id}</span>
                    <span>&bull;</span>
                    <span className="uppercase">{selectedMapProject.project_type}</span>
                  </div>
                  <h3 className="font-serif-heading text-base font-bold text-[#141E1A] leading-snug">
                    {selectedMapProject.project_name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#4E5C55] mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#196842] shrink-0" />
                    <span className="truncate">
                      {selectedMapProject.district}, {selectedMapProject.state}
                    </span>
                    <span className="font-mono-data text-[10px] text-[#78857E] hidden sm:inline">
                      ({selectedMapProject.geo_location.lat.toFixed(3)}&deg;N, {selectedMapProject.geo_location.lng.toFixed(3)}&deg;E)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-2 min-h-[40px] min-w-[40px] rounded-[4px] hover:bg-[#DFE3DC] text-[#4E5C55] hover:text-[#141E1A] cursor-pointer flex items-center justify-center"
                  title="Close Inspector"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 4-Metric Surveillance Grid */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-[#DFE3DC]">
                {/* Delay Probability */}
                <div className="p-2.5 bg-white rounded-[4px] border border-[#DFE3DC]">
                  <div className="text-[10px] font-mono-data uppercase font-bold text-[#78857E]">
                    Delay Probability
                  </div>
                  <div className="font-mono-data text-lg font-bold mt-0.5 text-[#BA2D1D]">
                    {((selectedMapProject.prediction?.probability_of_delay || 0.1) * 100).toFixed(0)}%
                  </div>
                </div>

                {/* Est. Delay */}
                <div className="p-2.5 bg-white rounded-[4px] border border-[#DFE3DC]">
                  <div className="text-[10px] font-mono-data uppercase font-bold text-[#78857E]">
                    Est. Delay
                  </div>
                  <div className="font-mono-data text-lg font-bold mt-0.5 text-[#141E1A]">
                    +{Math.round((selectedMapProject.prediction?.predicted_delay_days || 0) / 30)} mo
                  </div>
                </div>

                {/* Land Area */}
                <div className="p-2.5 bg-white rounded-[4px] border border-[#DFE3DC]">
                  <div className="text-[10px] font-mono-data uppercase font-bold text-[#78857E]">
                    Land Area
                  </div>
                  <div className="font-mono-data text-base font-bold mt-0.5 text-[#141E1A]">
                    {selectedMapProject.land_area_hectares} Ha
                  </div>
                </div>

                {/* Litigation */}
                <div className="p-2.5 bg-white rounded-[4px] border border-[#DFE3DC]">
                  <div className="text-[10px] font-mono-data uppercase font-bold text-[#78857E]">
                    Litigation
                  </div>
                  <div className="font-mono-data text-sm font-bold mt-0.5 text-[#141E1A] truncate">
                    {selectedMapProject.legal_disputes && selectedMapProject.legal_disputes.length > 0
                      ? selectedMapProject.legal_disputes[0].case_type || 'Ownership'
                      : 'None'}
                  </div>
                </div>
              </div>
            </div>

            {/* Body: Explainable Delay Drivers (SHAP) & Recommendations */}
            <div className="p-4 space-y-4 flex-1">
              {/* SHAP Attribution Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-serif-heading text-xs font-bold text-[#141E1A]">
                    Explainable Delay Drivers (SHAP)
                  </h4>
                  <span className="font-mono-data text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] bg-[#EAF4EE] text-[#196842] border border-[#B8DCBE]">
                    GBDT + TreeSHAP
                  </span>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-between text-[10px] font-mono-data text-[#4E5C55] mb-2.5 pb-1.5 border-b border-[#DFE3DC]">
                  <span className="text-[#78857E]">SHAP Feature Attribution</span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[#BA2D1D]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#BA2D1D]"></span>
                      Increases (+)
                    </span>
                    <span className="flex items-center gap-1 text-[#27774E]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#27774E]"></span>
                      Mitigates (-)
                    </span>
                  </div>
                </div>

                {/* SHAP Feature Bars */}
                <div className="space-y-2.5">
                  {selectedMapProject.prediction?.top_shap_factors && selectedMapProject.prediction.top_shap_factors.length > 0 ? (
                    selectedMapProject.prediction.top_shap_factors.slice(0, 3).map((factor, idx) => {
                      const numericContribution =
                        typeof factor.contribution === 'number'
                          ? factor.contribution
                          : typeof factor.impact === 'number'
                          ? (factor.impact as unknown as number)
                          : 0;
                      const isNegative =
                        factor.impact === 'reduces_risk' ||
                        numericContribution < 0;
                      const absImpact = Math.abs(numericContribution);
                      const barWidth = Math.min(100, Math.round(absImpact * 4));

                      return (
                        <div key={idx} className="p-2 bg-[#F7F8F5] rounded-[4px] border border-[#DFE3DC] space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#141E1A] line-clamp-1">{factor.factor}</span>
                            <div className="flex items-center gap-1">
                              {factor.category && (
                                <span className="font-mono-data text-[9px] uppercase px-1 py-0.2 rounded-[2px] bg-[#ECEEEA] text-[#4E5C55]">
                                  {factor.category}
                                </span>
                              )}
                              <span
                                className={`font-mono-data font-bold text-[11px] px-1.5 py-0.2 rounded-[2px] ${
                                  isNegative ? 'bg-[#EAF4EE] text-[#196842]' : 'bg-[#FAECEB] text-[#BA2D1D]'
                                }`}
                              >
                                {numericContribution > 0 ? `+${numericContribution.toFixed(1)}` : numericContribution.toFixed(1)} pts
                              </span>
                            </div>
                          </div>
                          {/* Progress Meter */}
                          <div className="w-full bg-[#ECEEEA] rounded-[2px] h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${isNegative ? 'bg-[#27774E]' : 'bg-[#BA2D1D]'}`}
                              style={{ width: `${Math.max(15, barWidth)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-2 bg-[#F7F8F5] rounded-[4px] border border-[#DFE3DC] text-xs text-[#4E5C55]">
                      Standard statutory timelines; low risk drivers detected.
                    </div>
                  )}
                </div>
              </div>

              {/* Predictive Recommended Action Box */}
              <div className="p-3 bg-[#FDF3E7] rounded-[4px] border border-[#F8DCB8] text-xs text-[#141E1A] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#C0781A]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Predictive Recommended Action</span>
                </div>
                <p className="text-[11px] text-[#4E5C55] leading-relaxed">
                  {selectedMapProject.prediction?.recommendations?.[0]?.action ||
                    selectedMapProject.prediction?.recommendations?.[0]?.rationale ||
                    'Review Section 19 declaration timeline to prevent statutory lapse before the 12-month limit under LARR 2013.'}
                </p>
              </div>
            </div>

            {/* Footer Action Buttons (44px min touch height) */}
            <div className="p-3 border-t border-[#DFE3DC] bg-[#F7F8F5] flex items-center gap-2">
              <button
                onClick={() => handleNavigateToDetails(selectedMapProject)}
                className="flex-1 min-h-[44px] py-2.5 px-3 bg-[#0C2B20] hover:bg-[#141E1A] text-white rounded-[4px] text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>SHAP Explainability</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleNavigateToSimulation(selectedMapProject)}
                className="min-h-[44px] py-2.5 px-3 bg-white hover:bg-[#ECEEEA] text-[#141E1A] border border-[#DFE3DC] rounded-[4px] text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                title="Run What-If Scenario"
              >
                <Sliders className="w-3.5 h-3.5 text-[#196842]" />
                <span>Simulate</span>
              </button>
            </div>
          </div>
        )}

        {/* Collapsed Sidebar Restore Tab */}
        {selectedMapProject && isSidebarCollapsed && (
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="absolute top-3 right-3 z-1000 bg-white/95 backdrop-blur-md rounded-[4px] border border-[#DFE3DC] p-2 shadow-md text-xs font-semibold text-[#141E1A] flex items-center gap-1.5 cursor-pointer hover:bg-[#ECEEEA]"
          >
            <MapPin className="w-3.5 h-3.5 text-[#196842]" />
            <span>Inspector: {selectedMapProject.project_id}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* GPS Coordinate Telemetry & State Quick Zoom Ribbon */}
      <div className="mt-3 p-3 bg-white rounded-[4px] border border-[#DFE3DC] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Live GPS Telemetry */}
        <div className="flex items-center gap-2 font-mono-data text-[11px] text-[#4E5C55]">
          <Crosshair className="w-3.5 h-3.5 text-[#196842]" />
          <span>
            GPS Cursor: <strong className="text-[#141E1A]">{liveCoords?.lat}&deg; N, {liveCoords?.lng}&deg; E</strong>
          </span>
          <span className="hidden sm:inline">&bull;</span>
          <span className="hidden sm:inline">Datum: WGS84</span>
          <span className="hidden sm:inline">&bull;</span>
          <span className="hidden sm:inline">Cadastral Precision: 99.8%</span>
        </div>

        {/* State Quick Zoom Pills */}
        <div className="flex flex-wrap items-center gap-1 text-[11px] font-mono-data">
          <span className="text-[#78857E] text-[10px] uppercase font-bold mr-1">Quick Pan:</span>
          {Object.keys(STATE_BOUNDS).map((stateKey) => (
            <button
              key={stateKey}
              onClick={() => handleStateChange(stateKey)}
              className={`px-2 py-0.5 rounded-[2px] transition cursor-pointer ${
                selectedState === stateKey
                  ? 'bg-[#0C2B20] text-white font-bold'
                  : 'bg-[#ECEEEA] text-[#4E5C55] hover:text-[#141E1A]'
              }`}
            >
              {stateKey === 'All' ? 'Pan-India' : stateKey}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
