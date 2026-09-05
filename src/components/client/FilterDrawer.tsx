import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setFilters, resetFilters } from '../../store/propertiesSlice';
import { AMENITY_DEFINITIONS, MALI_LOCATIONS, formatFCFA, formatSurface } from '../../utils/formatters';
import { DealType, PropertyType, DocumentType } from '../../types';
import { Filter, RotateCcw, ShieldCheck, Check, SlidersHorizontal, Sparkles } from 'lucide-react';

export const FilterDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.properties.filters);

  const handleDealTypeChange = (dealType: DealType | 'all') => {
    dispatch(setFilters({ dealType }));
  };

  const handlePropertyTypeChange = (propertyType: PropertyType | 'all') => {
    dispatch(setFilters({ propertyType }));
  };

  const handleAmenityToggle = (amenityKey: string) => {
    const current = [...(filters.amenities || [])];
    const exists = current.includes(amenityKey);
    const updated = exists ? current.filter((a) => a !== amenityKey) : [...current, amenityKey];
    dispatch(setFilters({ amenities: updated }));
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm font-heading">
          <SlidersHorizontal className="w-4 h-4 text-amber-500" />
          <span>Filtres Avancés</span>
        </div>
        <button
          id="btn-reset-filters"
          type="button"
          onClick={() => dispatch(resetFilters())}
          className="text-xs text-slate-500 hover:text-amber-600 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Réinitialiser</span>
        </button>
      </div>

      {/* Transaction Type */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Type d'Opération
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => handleDealTypeChange('all')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              filters.dealType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tous
          </button>
          <button
            type="button"
            onClick={() => handleDealTypeChange('vente')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              filters.dealType === 'vente' ? 'bg-white text-amber-600 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Acheter
          </button>
          <button
            type="button"
            onClick={() => handleDealTypeChange('location')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              filters.dealType === 'location' ? 'bg-white text-blue-600 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Louer
          </button>
        </div>
      </div>

      {/* Titre Foncier Priority Toggle */}
      <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="text-xs font-bold text-emerald-950 block">Titre Foncier (TF) Uniquement</span>
            <span className="text-[10px] text-emerald-700">Garantie juridique absolue</span>
          </div>
        </div>
        <input
          type="checkbox"
          id="filter-only-tf"
          checked={filters.onlyWithTF}
          onChange={(e) => {
            dispatch(setFilters({
              onlyWithTF: e.target.checked,
              documentType: e.target.checked ? 'titre_foncier' : 'all',
            }));
          }}
          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
        />
      </div>

      {/* Property Type */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Catégorie de Bien
        </label>
        <div className="space-y-1">
          {[
            { id: 'all', label: 'Toutes les catégories' },
            { id: 'parcelle', label: 'Parcelle / Terrain' },
            { id: 'maison', label: 'Maison / Villa' },
            { id: 'appartement', label: 'Appartement' },
            { id: 'magasin_bureau', label: 'Magasin / Bureau' },
            { id: 'immeuble', label: 'Immeuble / R+X' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handlePropertyTypeChange(item.id as PropertyType | 'all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                filters.propertyType === item.id
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{item.label}</span>
              {filters.propertyType === item.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
            </button>
          ))}
        </div>
      </div>

      {/* Surface Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="uppercase tracking-wider">Surface Min</span>
          <span className="text-amber-600 font-bold">{formatSurface(filters.minSurface)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="2000"
          step="50"
          value={filters.minSurface}
          onChange={(e) => dispatch(setFilters({ minSurface: Number(e.target.value) }))}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>0 m²</span>
          <span>300 m² (Standard)</span>
          <span>2000+ m²</span>
        </div>
      </div>

      {/* Equipment / Amenities Checklist */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Viabilisation & Équipements
        </label>
        <div className="grid grid-cols-1 gap-1.5">
          {Object.entries(AMENITY_DEFINITIONS).slice(0, 6).map(([key, def]) => {
            const isChecked = (filters.amenities || []).includes(key);
            return (
              <label
                key={key}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  isChecked
                    ? 'border-amber-500 bg-amber-50/50 text-slate-900 font-bold'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleAmenityToggle(key)}
                  className="w-3.5 h-3.5 text-amber-600 rounded focus:ring-amber-500"
                />
                <span className="truncate">{def.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};
