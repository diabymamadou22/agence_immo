import React, { useState } from 'react';
import { useAppDispatch } from '../../store';
import { setSelectedPropertyId } from '../../store/propertiesSlice';
import { Property } from '../../types';
import { formatFCFA, formatSurface, getDocumentBadgeInfo, generateWhatsAppLink } from '../../utils/formatters';
import { MapPin, Navigation, Eye, MessageCircle, Layers, ShieldCheck, Maximize2 } from 'lucide-react';

interface InteractiveMapSimulationProps {
  properties: Property[];
}

export const InteractiveMapSimulation: React.FC<InteractiveMapSimulationProps> = ({ properties }) => {
  const dispatch = useAppDispatch();
  const [activePropertyId, setActivePropertyId] = useState<string | null>(properties[0]?.id || null);

  const activeProperty = properties.find((p) => p.id === activePropertyId) || properties[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row h-[600px]">
      {/* Map Canvas Simulation */}
      <div className="relative flex-1 bg-slate-900 overflow-hidden flex items-center justify-center">
        {/* Stylized Bamako & Niger River Vector simulation */}
        <div className="absolute inset-0 bg-slate-950">
          {/* Cadastral Blueprint Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-40"></div>
          
          {/* Simulated Fleuve Niger Curve (Niger River Bamako) */}
          <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none" viewBox="0 0 500 500">
            <path
              d="M0,350 C150,300 250,420 380,300 C430,250 480,220 500,210"
              fill="none"
              stroke="#0284c7"
              strokeWidth="38"
              strokeLinecap="round"
            />
            {/* Ponts de Bamako (Pont des Martyrs, Pont du Roi Fahd, 3ème Pont) */}
            <line x1="180" y1="290" x2="210" y2="340" stroke="#f59e0b" strokeWidth="4" strokeDasharray="3,3" />
            <line x1="280" y1="330" x2="310" y2="390" stroke="#f59e0b" strokeWidth="4" strokeDasharray="3,3" />
            <line x1="390" y1="270" x2="410" y2="320" stroke="#f59e0b" strokeWidth="4" strokeDasharray="3,3" />
          </svg>

          {/* District Labels */}
          <div className="absolute top-8 left-12 text-[11px] font-black tracking-widest text-slate-400/60 uppercase">
            Commune IV • Hamdallaye ACI 2000
          </div>
          <div className="absolute top-12 right-16 text-[11px] font-black tracking-widest text-slate-400/60 uppercase">
            Commune I • Sotuba ACI / 3ème Pont
          </div>
          <div className="absolute bottom-12 left-16 text-[11px] font-black tracking-widest text-slate-400/60 uppercase">
            Commune V • Kalaban Coura / Baco-Djicoroni
          </div>
          <div className="absolute bottom-8 right-12 text-[11px] font-black tracking-widest text-slate-400/60 uppercase">
            Commune VI • Yirimadio / Stade 26 Mars
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sky-400/40 font-black text-xs tracking-widest uppercase pointer-events-none">
            🌊 Fleuve Niger (Bamako)
          </div>
        </div>

        {/* Property Map Pins */}
        <div className="absolute inset-0 p-8 flex items-center justify-center">
          <div className="relative w-full h-full max-w-2xl max-h-[480px]">
            {properties.map((prop, idx) => {
              // Distribute pins across Bamako map coordinates visually
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
              const isSelected = prop.id === activePropertyId;

              return (
                <div
                  key={prop.id}
                  style={{ top: pos.top, left: pos.left }}
                  onClick={() => setActivePropertyId(prop.id)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all z-20 group ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                  }`}
                >
                  <div className={`px-2.5 py-1.5 rounded-xl font-extrabold text-[11px] flex items-center gap-1.5 shadow-xl border backdrop-blur-md transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-300 ring-4 ring-amber-500/30'
                      : 'bg-slate-900/90 text-white border-slate-700 hover:bg-slate-800'
                  }`}>
                    <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950 fill-slate-950' : 'text-amber-400'}`} />
                    <span className="font-mono">{formatFCFA(prop.price)}</span>
                  </div>

                  {/* Lotissement pulse badge */}
                  {prop.propertyType === 'parcelle' && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900"></span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Sélection active</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>Parcelle avec Titre Foncier</span>
          </div>
        </div>
      </div>

      {/* Selected Property Preview Sidebar */}
      {activeProperty && (
        <div className="w-full lg:w-80 p-5 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100">
              <img
                src={activeProperty.featuredImage || activeProperty.images[0]}
                alt={activeProperty.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white">
                {activeProperty.dealType === 'vente' ? 'À Vendre' : 'À Louer'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-mono block">Réf : {activeProperty.reference}</span>
              <h3 className="font-extrabold text-sm text-slate-900 font-heading leading-snug line-clamp-2">
                {activeProperty.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>{activeProperty.neighborhood}, {activeProperty.city}</span>
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Surface :</span>
                <span className="font-bold text-slate-900">{formatSurface(activeProperty.surface)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Document :</span>
                <span className="font-bold text-emerald-700">{getDocumentBadgeInfo(activeProperty.documentType).shortLabel}</span>
              </div>
              {activeProperty.lotNumber && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Lot / Section :</span>
                  <span className="font-mono font-bold text-slate-800">{activeProperty.lotNumber}</span>
                </div>
              )}
            </div>

            <div className="text-lg font-extrabold text-amber-700 font-heading">
              {formatFCFA(activeProperty.price)}
              {activeProperty.dealType === 'location' && <span className="text-xs font-normal text-slate-500"> / mois</span>}
            </div>
          </div>

          <div className="pt-4 space-y-2 border-t border-slate-100">
            <button
              onClick={() => dispatch(setSelectedPropertyId(activeProperty.id))}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Voir la Fiche Complète</span>
            </button>
            <a
              href={generateWhatsAppLink(activeProperty.title, activeProperty.reference, activeProperty.price, activeProperty.dealType)}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Discuter sur WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
