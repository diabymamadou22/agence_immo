import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setFilters, resetFilters } from '../../store/propertiesSlice';
import { openNotaryModal } from '../../store/uiSlice';
import { MALI_LOCATIONS, formatFCFA } from '../../utils/formatters';
import { DealType, PropertyType, DocumentType } from '../../types';
import { 
  Search, 
  MapPin, 
  ShieldCheck, 
  Home, 
  Layers, 
  Building, 
  ArrowRight, 
  Check, 
  SlidersHorizontal,
  Sparkles,
  Calculator,
  Briefcase,
  Tag,
  Key,
  FileCheck
} from 'lucide-react';

export const HeroSearch: React.FC = () => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.properties.filters);
  const properties = useAppSelector((state) => state.properties.items);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const specialties = Array.isArray(agencyConfig?.specialties) ? agencyConfig.specialties : ['vente', 'location', 'gestion'];
  const primarySpecialty = agencyConfig?.primarySpecialty || 'toutes';

  const [activeTab, setActiveTab] = useState<'parcelle_tf' | 'acheter' | 'louer' | 'all'>('parcelle_tf');
  const [selectedCity, setSelectedCity] = useState<string>(filters.city || 'all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>(filters.neighborhood || 'all');
  const [selectedDocType, setSelectedDocType] = useState<string>(filters.documentType || 'all');
  const [maxPrice, setMaxPrice] = useState<number>(filters.maxPrice || 200000000);
  const [keyword, setKeyword] = useState<string>(filters.searchQuery || '');

  // Pre-configured tab handler
  const handleTabChange = (tab: 'parcelle_tf' | 'acheter' | 'louer' | 'all') => {
    setActiveTab(tab);
    if (tab === 'parcelle_tf') {
      dispatch(setFilters({
        dealType: 'vente',
        propertyType: 'parcelle',
        documentType: 'titre_foncier',
        onlyWithTF: true,
      }));
    } else if (tab === 'acheter') {
      dispatch(setFilters({
        dealType: 'vente',
        propertyType: 'all',
        onlyWithTF: false,
      }));
    } else if (tab === 'louer') {
      dispatch(setFilters({
        dealType: 'location',
        propertyType: 'all',
        onlyWithTF: false,
      }));
    } else {
      dispatch(resetFilters());
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setFilters({
      city: selectedCity,
      neighborhood: selectedNeighborhood,
      documentType: selectedDocType as DocumentType | 'all',
      maxPrice: maxPrice,
      searchQuery: keyword,
    }));

    const resultsElement = document.getElementById('properties-catalog-section');
    if (resultsElement) {
      resultsElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative bg-slate-900 text-white overflow-hidden border-b border-slate-800">
      {/* Background with modern dark overlay & subtle blueprint architectural grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25"></div>
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        {/* Top Badges & Agency Specialty Banner */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* Primary Specialty Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500/25 via-amber-400/20 to-amber-500/25 text-amber-300 border border-amber-500/50 shadow-md backdrop-blur-md">
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Spécialité de l'Agence : {
                  primarySpecialty === 'vente'
                    ? 'Vente Immobilière & Parcelles TF'
                    : primarySpecialty === 'location'
                    ? 'Location Résidentielle & Professionnelle'
                    : primarySpecialty === 'gestion'
                    ? 'Gestion Locative Sécurisée & Syndic'
                    : 'Vente, Location & Gestion Locative'
                }
              </span>
            </div>

            {/* Individual active specialties badges */}
            <div className="flex items-center gap-1.5">
              {specialties.includes('vente') && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border transition-all ${
                  primarySpecialty === 'vente'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                    : 'bg-slate-800/90 text-amber-300 border-amber-500/40'
                }`}>
                  <Tag className="w-3 h-3" />
                  Vente
                </span>
              )}
              {specialties.includes('location') && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border transition-all ${
                  primarySpecialty === 'location'
                    ? 'bg-blue-500 text-white border-blue-400 shadow-xs'
                    : 'bg-slate-800/90 text-blue-300 border-blue-500/40'
                }`}>
                  <Key className="w-3 h-3" />
                  Location
                </span>
              )}
              {specialties.includes('gestion') && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border transition-all ${
                  primarySpecialty === 'gestion'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-xs'
                    : 'bg-slate-800/90 text-emerald-300 border-emerald-500/40'
                }`}>
                  <FileCheck className="w-3 h-3" />
                  Gestion
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              100% Titres Fonciers Vérifiés & Notariés au Mali
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              {agencyConfig.city || 'Bamako'} • Kati • Sanankoroba • Koulikoro
            </span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white font-heading leading-tight">
            {primarySpecialty === 'vente' ? (
              <>
                Spécialiste de la Vente Immobilière & <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
                  Parcelles avec Titre Foncier au Mali
                </span>
              </>
            ) : primarySpecialty === 'location' ? (
              <>
                Spécialiste de la Location Immobilière <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
                  Villas, Baux Résidentiels & Commerciaux
                </span>
              </>
            ) : primarySpecialty === 'gestion' ? (
              <>
                Spécialiste de la Gestion Locative & <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
                  Sécurisation des Loyers au Mali
                </span>
              </>
            ) : (
              <>
                Trouvez Votre Parcelle TF ou <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
                  Votre Villa de Rêve à Bamako
                </span>
              </>
            )}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed">
            {agencyConfig.specialtyDetails || agencyConfig.tagline || 'Achat direct de parcelles viabilisées avec Titre Foncier inattaquable, location de villas haut standing et gestion locative sécurisée avec quittances officielles.'}
          </p>
        </div>

        {/* Search Filter Box Card */}
        <div className="max-w-4xl mx-auto bg-slate-950/90 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-2xl">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 mb-5">
            <button
              type="button"
              id="tab-parcelles-tf"
              onClick={() => handleTabChange('parcelle_tf')}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'parcelle_tf'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Parcelles Titre Foncier</span>
            </button>

            <button
              type="button"
              id="tab-acheter-villas"
              onClick={() => handleTabChange('acheter')}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'acheter'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Acheter (Villas & Bâtis)</span>
            </button>

            <button
              type="button"
              id="tab-louer"
              onClick={() => handleTabChange('louer')}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'louer'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Louer (Villas & Bureaux)</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* City / Commune */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Ville / Région
                </label>
                <div className="relative">
                  <select
                    id="filter-city"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 appearance-none focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="all">Toutes les Villes</option>
                    {MALI_LOCATIONS.cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <MapPin className="w-4 h-4 text-amber-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Neighborhood / Quartier */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Quartier / Zone Bamako
                </label>
                <div className="relative">
                  <select
                    id="filter-neighborhood"
                    value={selectedNeighborhood}
                    onChange={(e) => setSelectedNeighborhood(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 appearance-none focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="all">Tous les Quartiers</option>
                    {MALI_LOCATIONS.neighborhoodsBamako.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Legal Document Status */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Document / Papier Légal
                </label>
                <div className="relative">
                  <select
                    id="filter-document"
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 appearance-none focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                  >
                    <option value="all">Tous les Documents</option>
                    <option value="titre_foncier">Titre Foncier (TF) - Recommandé</option>
                    <option value="bail">Bail Commercial / Emphytéotique</option>
                    <option value="lettre_attribution">Lettre d'Attribution</option>
                    <option value="permis_occuper">Permis d'Occuper (CU)</option>
                    <option value="concession_rurale">Concession Rurale</option>
                  </select>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Budget Slider or Max in FCFA */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Budget Max</span>
                  <span className="text-amber-400 font-mono text-[10px]">{formatFCFA(maxPrice)}</span>
                </div>
                <div className="pt-1">
                  <input
                    type="range"
                    id="filter-price-slider"
                    min="1000000"
                    max="200000000"
                    step="1000000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                    <span>1M FCFA</span>
                    <span>50M</span>
                    <span>100M</span>
                    <span>200M+ FCFA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Keyword Search & Submit Button */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  id="filter-keyword"
                  placeholder="Ex : Kalaban Coura d'angle, Villa ACI avec piscine, Terrain 300m²..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl pl-10 pr-4 py-2.5 placeholder:text-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                id="btn-submit-hero-search"
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>Rechercher les Biens</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Micro Stats in Mali */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span><strong>{properties.length}</strong> biens disponibles immédiatement</span>
            </div>

            <button
              type="button"
              onClick={() => dispatch(openNotaryModal())}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Simuler mes frais d'acte notarié au Mali</span>
            </button>
          </div>
        </div>

        {/* 3 Core Agency Specialties Presentation */}
        <div className="max-w-4xl mx-auto mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`p-3.5 rounded-2xl border backdrop-blur-sm transition-all ${
            specialties.includes('vente')
              ? primarySpecialty === 'vente'
                ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                : 'bg-slate-950/70 border-slate-800/90 hover:border-amber-500/30'
              : 'bg-slate-950/30 border-slate-800/40 opacity-50'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Tag className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-black text-white font-heading">Vente Immobilière</span>
              </div>
              {primarySpecialty === 'vente' && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500 text-slate-950">
                  Cœur de métier
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Parcelles viabilisées avec Titre Foncier (TF), concessions, terrains d’angle et villas de standing.
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border backdrop-blur-sm transition-all ${
            specialties.includes('location')
              ? primarySpecialty === 'location'
                ? 'bg-blue-500/10 border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                : 'bg-slate-950/70 border-slate-800/90 hover:border-blue-500/30'
              : 'bg-slate-950/30 border-slate-800/40 opacity-50'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <Key className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-black text-white font-heading">Location & Baux</span>
              </div>
              {primarySpecialty === 'location' && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-500 text-white">
                  Cœur de métier
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Villas haut standing, appartements meublés ou non, locaux commerciaux avec baux réguliers.
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border backdrop-blur-sm transition-all ${
            specialties.includes('gestion')
              ? primarySpecialty === 'gestion'
                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                : 'bg-slate-950/70 border-slate-800/90 hover:border-emerald-500/30'
              : 'bg-slate-950/30 border-slate-800/40 opacity-50'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <FileCheck className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-black text-white font-heading">Gestion Locative</span>
              </div>
              {primarySpecialty === 'gestion' && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500 text-slate-950">
                  Cœur de métier
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Recouvrement rigoureux des loyers, quittances horodatées, gestion des baux et reversements propriétaires.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
