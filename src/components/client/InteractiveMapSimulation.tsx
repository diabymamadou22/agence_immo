import React, { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setSelectedPropertyId } from '../../store/propertiesSlice';
import { Property, PropertyType, DealType } from '../../types';
import { formatFCFA, formatSurface, getDocumentBadgeInfo, generateWhatsAppLink } from '../../utils/formatters';
import { 
  MapPin, 
  Navigation, 
  Eye, 
  MessageCircle, 
  Layers, 
  ShieldCheck, 
  Maximize2, 
  Filter, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Sparkles,
  Home,
  CheckCircle2
} from 'lucide-react';

interface InteractiveMapSimulationProps {
  properties: Property[];
}

export const InteractiveMapSimulation: React.FC<InteractiveMapSimulationProps> = ({ properties }) => {
  const dispatch = useAppDispatch();
  const agencyConfig = useAppSelector((state) => state.agency.config);

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'parcelle' | 'maison'>('all');
  const [filterDeal, setFilterDeal] = useState<'all' | 'vente' | 'location'>('all');
  const [selectedCommune, setSelectedCommune] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Active property
  const [activePropertyId, setActivePropertyId] = useState<string | null>(properties[0]?.id || null);

  const communesList = [
    { id: 'all', label: 'Tout Bamako' },
    { id: 'Commune IV', label: 'Commune IV (ACI 2000, Hamdallaye)' },
    { id: 'Commune V', label: 'Commune V (Kalaban, Baco)' },
    { id: 'Commune I', label: 'Commune I (Sotuba, Korofina)' },
    { id: 'Commune VI', label: 'Commune VI (Yirimadio, Faladié)' },
    { id: 'Kati', label: 'Cercle de Kati (Grand Bamako)' },
  ];

  // Filter properties
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (filterType !== 'all' && p.propertyType !== filterType) return false;
      if (filterDeal !== 'all' && p.dealType !== filterDeal) return false;
      if (selectedCommune !== 'all') {
        const comm = (p.commune || '').toLowerCase();
        const neigh = (p.neighborhood || '').toLowerCase();
        const target = selectedCommune.toLowerCase();
        if (!comm.includes(target) && !neigh.includes(target)) {
          // Special commune heuristics for Bamako
          if (target.includes('commune iv') && (neigh.includes('aci 2000') || neigh.includes('hamdallaye') || neigh.includes('sebenikoro'))) {
            return true;
          }
          if (target.includes('commune v') && (neigh.includes('kalaban') || neigh.includes('baco') || neigh.includes('torokorobougou') || neigh.includes('daoudabougou'))) {
            return true;
          }
          if (target.includes('commune i') && (neigh.includes('sotuba') || neigh.includes('korofina') || neigh.includes('banconi'))) {
            return true;
          }
          if (target.includes('commune vi') && (neigh.includes('yirimadio') || neigh.includes('faladie') || neigh.includes('sogoniko') || neigh.includes('missabougou'))) {
            return true;
          }
          if (target.includes('kati') && (neigh.includes('kati') || neigh.includes('sanankoroba') || neigh.includes('moribabougou'))) {
            return true;
          }
          return false;
        }
      }
      return true;
    });
  }, [properties, filterType, filterDeal, selectedCommune]);

  const activeProperty = useMemo(() => {
    return filteredProperties.find((p) => p.id === activePropertyId) || filteredProperties[0] || properties[0];
  }, [filteredProperties, activePropertyId, properties]);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 1.75));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setSelectedCommune('all');
    setFilterType('all');
    setFilterDeal('all');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      
      {/* Top Map Filter Toolbar */}
      <div className="p-3 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm font-heading">
              Cadastre Interactif & Géolocalisation Bamako
            </h3>
            <p className="text-[10px] text-slate-400">
              {filteredProperties.length} bien(s) cartographié(s) • Fleuve Niger & Rives Droite/Gauche
            </p>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Deal type toggle */}
          <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setFilterDeal('all')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterDeal === 'all' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
              }`}
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => setFilterDeal('vente')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterDeal === 'vente' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
              }`}
            >
              Vente
            </button>
            <button
              type="button"
              onClick={() => setFilterDeal('location')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterDeal === 'location' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
              }`}
            >
              Location
            </button>
          </div>

          {/* Property type toggle */}
          <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterType === 'all' ? 'bg-slate-900 text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tout type
            </button>
            <button
              type="button"
              onClick={() => setFilterType('parcelle')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                filterType === 'parcelle' ? 'bg-emerald-600 text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Parcelles</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('maison')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                filterType === 'maison' ? 'bg-blue-600 text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Home className="w-3 h-3" />
              <span>Bâtis</span>
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 cursor-pointer"
              title="Zoom avant"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 cursor-pointer"
              title="Zoom arrière"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 cursor-pointer"
              title="Réinitialiser vue"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Commune filter bar */}
      <div className="bg-slate-800/90 px-3 py-2 flex items-center gap-1.5 overflow-x-auto border-b border-slate-700 text-xs shrink-0">
        <span className="text-[10px] uppercase font-extrabold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-amber-400" />
          <span>Secteur :</span>
        </span>
        {communesList.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedCommune(c.id)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCommune === c.id
                ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Main Map Body: Canvas + Sidebar */}
      <div className="flex flex-col lg:flex-row h-[560px]">
        
        {/* Map Canvas Simulation */}
        <div className="relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center">
          
          <div 
            className="absolute inset-0 transition-transform duration-300 origin-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Cadastral Blueprint Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:36px_36px] opacity-40"></div>
            
            {/* Fleuve Niger Curve (Niger River Bamako) */}
            <svg className="absolute inset-0 w-full h-full opacity-35" preserveAspectRatio="none" viewBox="0 0 500 500">
              <path
                d="M0,350 C150,300 250,420 380,300 C430,250 480,220 500,210"
                fill="none"
                stroke="#0284c7"
                strokeWidth="42"
                strokeLinecap="round"
              />
              {/* Ponts de Bamako (Pont des Martyrs, Pont du Roi Fahd, 3ème Pont) */}
              <line x1="180" y1="290" x2="210" y2="340" stroke="#f59e0b" strokeWidth="4" strokeDasharray="3,3" />
              <line x1="280" y1="330" x2="310" y2="390" stroke="#f59e0b" strokeWidth="4" strokeDasharray="3,3" />
              <line x1="390" y1="270" x2="410" y2="320" stroke="#f59e0b" strokeWidth="4" strokeDasharray="3,3" />
            </svg>

            {/* Geographic District Labels */}
            <div className="absolute top-6 left-10 text-[10px] font-black tracking-widest text-slate-400/70 uppercase">
              Rive Gauche • Commune IV (ACI 2000 / Hamdallaye)
            </div>
            <div className="absolute top-10 right-14 text-[10px] font-black tracking-widest text-slate-400/70 uppercase">
              Commune I • Sotuba ACI / Route de Koulikoro
            </div>
            <div className="absolute bottom-10 left-12 text-[10px] font-black tracking-widest text-slate-400/70 uppercase">
              Rive Droite • Commune V (Kalaban Coura / Baco-Djicoroni)
            </div>
            <div className="absolute bottom-6 right-10 text-[10px] font-black tracking-widest text-slate-400/70 uppercase">
              Commune VI • Yirimadio / Stade du 26 Mars
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sky-400/50 font-black text-xs tracking-widest uppercase pointer-events-none flex items-center gap-1.5">
              <span>🌊 Fleuve Niger (Bamako)</span>
            </div>

            {/* Property Map Pins */}
            <div className="absolute inset-0 p-8 flex items-center justify-center">
              <div className="relative w-full h-full max-w-2xl max-h-[460px]">
                {filteredProperties.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-slate-900/90 text-white p-4 rounded-2xl border border-slate-700 text-center max-w-xs shadow-xl backdrop-blur-md">
                      <MapPin className="w-8 h-8 text-amber-500 mx-auto mb-1.5" />
                      <p className="text-xs font-extrabold">Aucun bien pour ces filtres</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Modifiez le secteur ou les critères de recherche.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredProperties.map((prop, idx) => {
                    const positions = [
                      { top: '35%', left: '22%' }, // ACI 2000
                      { top: '72%', left: '28%' }, // Kalaban Coura
                      { top: '25%', left: '72%' }, // Sotuba
                      { top: '65%', left: '75%' }, // Yirimadio
                      { top: '15%', left: '15%' }, // Kati
                      { top: '30%', left: '30%' }, // Hamdallaye
                      { top: '48%', left: '42%' }, // Golf
                      { top: '80%', left: '85%' }, // Dialakorobougou
                    ];
                    const pos = positions[idx % positions.length];
                    const isSelected = prop.id === (activeProperty?.id || activePropertyId);

                    return (
                      <div
                        key={prop.id}
                        style={{ top: pos.top, left: pos.left }}
                        onClick={() => setActivePropertyId(prop.id)}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all z-20 group ${
                          isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                        }`}
                      >
                        <div className={`px-2.5 py-1.5 rounded-xl font-extrabold text-[11px] flex items-center gap-1.5 shadow-2xl border backdrop-blur-md transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-200 ring-4 ring-amber-500/30 font-black'
                            : prop.propertyType === 'parcelle'
                            ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/60 hover:bg-emerald-900'
                            : 'bg-slate-900/90 text-white border-slate-700 hover:bg-slate-800'
                        }`}>
                          <MapPin className={`w-3.5 h-3.5 ${
                            isSelected 
                              ? 'text-slate-950 fill-slate-950' 
                              : prop.propertyType === 'parcelle' 
                              ? 'text-emerald-400 fill-emerald-400' 
                              : 'text-amber-400'
                          }`} />
                          <span className="font-mono">{formatFCFA(prop.price)}</span>
                        </div>

                        {/* Parcelle TF pulse badge */}
                        {prop.propertyType === 'parcelle' && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-900"></span>
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-[10px] text-slate-300 space-y-1 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-400/40"></span>
              <span className="font-bold">Bien sélectionné</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>Parcelle Titre Foncier</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
              <span>Maison / Villa / Bâti</span>
            </div>
          </div>

        </div>

        {/* Selected Property Preview Sidebar */}
        {activeProperty && (
          <div className="w-full lg:w-84 p-4 sm:p-5 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-3">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 shadow-2xs">
                <img
                  src={activeProperty.featuredImage || activeProperty.images[0]}
                  alt={activeProperty.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white">
                  {activeProperty.dealType === 'vente' ? 'À Vendre' : 'À Louer'}
                </span>
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950">
                  {activeProperty.propertyType === 'parcelle' ? 'Parcelle / Terrain' : 'Bâti'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-mono block">Réf : {activeProperty.reference}</span>
                <h3 className="font-extrabold text-sm text-slate-900 font-heading leading-snug line-clamp-2 mt-0.5">
                  {activeProperty.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">{activeProperty.neighborhood}, {activeProperty.city}</span>
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Superficie :</span>
                  <span className="font-bold text-slate-900">{formatSurface(activeProperty.surface)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Sécurité Foncière :</span>
                  <span className="font-bold text-emerald-700">{getDocumentBadgeInfo(activeProperty.documentType).shortLabel}</span>
                </div>
                {activeProperty.lotNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Lotissement :</span>
                    <span className="font-mono font-bold text-slate-800">{activeProperty.lotNumber}</span>
                  </div>
                )}
              </div>

              <div className="text-lg font-black text-amber-700 font-heading">
                {formatFCFA(activeProperty.price)}
                {activeProperty.dealType === 'location' && <span className="text-xs font-normal text-slate-500"> / mois</span>}
              </div>
            </div>

            <div className="pt-3 space-y-2 border-t border-slate-100 mt-2">
              <button
                onClick={() => dispatch(setSelectedPropertyId(activeProperty.id))}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Eye className="w-4 h-4" />
                <span>Consulter Fiche & Cadastre</span>
              </button>
              <a
                href={generateWhatsAppLink(
                  activeProperty.title, 
                  activeProperty.reference, 
                  activeProperty.price, 
                  activeProperty.dealType,
                  undefined,
                  agencyConfig.whatsappNumber,
                  agencyConfig.name
                )}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Échanger sur WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
