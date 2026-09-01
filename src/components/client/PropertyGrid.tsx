import React, { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { resetFilters } from '../../store/propertiesSlice';
import { PropertyCard } from './PropertyCard';
import { InteractiveMapSimulation } from './InteractiveMapSimulation';
import { Property } from '../../types';
import { 
  LayoutGrid, 
  Map, 
  ArrowUpDown, 
  SearchX, 
  Building2, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const PropertyGrid: React.FC = () => {
  const dispatch = useAppDispatch();
  const properties = useAppSelector((state) => state.properties.items);
  const filters = useAppSelector((state) => state.properties.filters);

  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc' | 'surface_desc'>('recent');
  const [viewLayout, setViewLayout] = useState<'grid' | 'map'>('grid');

  // Filter properties in memory based on filters
  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      // Deal Type filter
      if (filters.dealType !== 'all' && prop.dealType !== filters.dealType) {
        return false;
      }

      // Property Type filter
      if (filters.propertyType !== 'all' && prop.propertyType !== filters.propertyType) {
        return false;
      }

      // City filter
      if (filters.city !== 'all' && filters.city && prop.city.toLowerCase() !== filters.city.toLowerCase()) {
        return false;
      }

      // Neighborhood filter
      if (filters.neighborhood !== 'all' && filters.neighborhood && !prop.neighborhood.toLowerCase().includes(filters.neighborhood.toLowerCase())) {
        return false;
      }

      // Document Type filter
      if (filters.documentType !== 'all' && prop.documentType !== filters.documentType) {
        return false;
      }

      // Only TF
      if (filters.onlyWithTF && prop.documentType !== 'titre_foncier') {
        return false;
      }

      // Price filter
      if (filters.maxPrice && prop.price > filters.maxPrice) {
        return false;
      }
      if (filters.minPrice && prop.price < filters.minPrice) {
        return false;
      }

      // Surface filter
      if (filters.minSurface && prop.surface < filters.minSurface) {
        return false;
      }
      if (filters.maxSurface && prop.surface > filters.maxSurface) {
        return false;
      }

      // Amenities filter (must have all selected amenities)
      if (filters.amenities.length > 0) {
        const hasAllAmenities = filters.amenities.every((a) => prop.amenities.includes(a));
        if (!hasAllAmenities) return false;
      }

      // Keyword query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = prop.title.toLowerCase().includes(q);
        const matchesDesc = prop.description.toLowerCase().includes(q);
        const matchesRef = prop.reference.toLowerCase().includes(q);
        const matchesNeigh = prop.neighborhood.toLowerCase().includes(q);
        const matchesLot = prop.lotNumber?.toLowerCase().includes(q);
        const matchesTF = prop.documentNumber?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesRef && !matchesNeigh && !matchesLot && !matchesTF) {
          return false;
        }
      }

      return true;
    });
  }, [properties, filters]);

  // Sort properties
  const sortedProperties = useMemo(() => {
    const list = [...filteredProperties];
    if (sortBy === 'price_asc') {
      return list.sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price_desc') {
      return list.sort((a, b) => b.price - a.price);
    }
    if (sortBy === 'surface_desc') {
      return list.sort((a, b) => b.surface - a.surface);
    }
    // Default newest
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredProperties, sortBy]);

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-900 font-heading">
              Biens Disponibles au Mali
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950">
              {sortedProperties.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mises à jour en direct • Transactions notariées et vérifiées
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="sort-properties-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="recent">Plus récents d'abord</option>
              <option value="price_asc">Prix croissant (FCFA)</option>
              <option value="price_desc">Prix décroissant (FCFA)</option>
              <option value="surface_desc">Plus grande surface (m²)</option>
            </select>
          </div>

          {/* View Mode Toggle: Grid vs Map */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              id="btn-view-grid"
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewLayout === 'grid'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Vue Grille"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="btn-view-map"
              onClick={() => setViewLayout('map')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewLayout === 'map'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Vue Carte & Cadastre"
            >
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content: Grid or Map */}
      {sortedProperties.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <SearchX className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-slate-900 text-base">Aucun bien ne correspond à ces critères</h3>
            <p className="text-xs text-slate-500">
              Essayez d'élargir votre zone géographique (ex: Toutes les villes) ou d'augmenter le budget maximum en FCFA.
            </p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(resetFilters())}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-amber-500 hover:text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Réinitialiser tous les filtres
          </button>
        </div>
      ) : viewLayout === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <InteractiveMapSimulation properties={sortedProperties} />
      )}
    </div>
  );
};
