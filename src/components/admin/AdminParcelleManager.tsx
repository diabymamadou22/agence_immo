import React, { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { openPropertyForm, addToast, openRecordSaleModal, openSaleReceiptModal } from '../../store/uiSlice';
import { deleteProperty, updatePropertyStatus, setSelectedPropertyId } from '../../store/propertiesSlice';
import { setActiveReceiptForPrint, setSelectedPropertyForSale } from '../../store/salesSlice';
import { firestoreService } from '../../services/firestoreService';
import { Property, PropertyStatus, DocumentType } from '../../types';
import { 
  formatFCFA, 
  formatSurface, 
  getDocumentBadgeInfo, 
  getStatusBadgeInfo,
  MALI_LOCATIONS 
} from '../../utils/formatters';
import { exportPropertiesToCSV } from '../../utils/exportUtils';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { AdminSaleReceiptsList } from './AdminSaleReceiptsList';
import { 
  Layers, 
  Plus, 
  Search, 
  ShieldCheck, 
  Edit, 
  Trash2, 
  Eye, 
  Filter, 
  CheckCircle2, 
  Maximize2,
  FileText,
  MapPin,
  FileSpreadsheet,
  Receipt,
  Printer,
  X,
  Coins,
  DollarSign,
  ArrowUpDown,
  RotateCcw,
  Building
} from 'lucide-react';

export const AdminParcelleManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const properties = useAppSelector((state) => state.properties.items);
  const sales = useAppSelector((state) => state.sales.items);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const [activeTab, setActiveTab] = useState<'inventory' | 'receipts'>('inventory');
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [pricePreset, setPricePreset] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [filterDoc, setFilterDoc] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'surface_asc' | 'surface_desc'>('newest');
  const [showAdvancedPrice, setShowAdvancedPrice] = useState<boolean>(false);
  
  const [parcelleToDelete, setParcelleToDelete] = useState<Property | null>(null);

  const parcelles = useMemo(() => {
    return properties.filter((p) => p.propertyType === 'parcelle');
  }, [properties]);

  // Extract unique cities from parcelles & default lists
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    // Pre-populate with typical major Malian cities
    ['Bamako', 'Kati', 'Koulikoro', 'Sanankoroba', 'Sikasso', 'Ségou'].forEach(c => set.add(c));
    // Add all cities found in current database
    parcelles.forEach(p => {
      if (p.city?.trim()) set.add(p.city.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [parcelles]);

  // Extract unique neighborhoods from parcelles, filtered by selectedCity if active
  const availableNeighborhoods = useMemo(() => {
    const set = new Set<string>();
    parcelles.forEach(p => {
      const cityMatches = selectedCity === 'all' || p.city?.toLowerCase() === selectedCity.toLowerCase();
      if (cityMatches && p.neighborhood?.trim()) {
        set.add(p.neighborhood.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [parcelles, selectedCity]);

  // Main Filter & Search Pipeline
  const filteredParcelles = useMemo(() => {
    return parcelles.filter((parcel) => {
      // 1. Document type filter
      if (filterDoc !== 'all' && parcel.documentType !== filterDoc) return false;

      // 2. Status filter
      if (filterStatus !== 'all' && parcel.status !== filterStatus) return false;

      // 3. Geographic Zone: City
      if (selectedCity !== 'all' && parcel.city?.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }

      // 4. Geographic Zone: Neighborhood
      if (selectedNeighborhood !== 'all' && parcel.neighborhood?.toLowerCase() !== selectedNeighborhood.toLowerCase()) {
        return false;
      }

      // 5. Price Preset Filter
      const price = parcel.price || 0;
      if (pricePreset === 'under10m' && price >= 10000000) return false;
      if (pricePreset === '10m-25m' && (price < 10000000 || price > 25000000)) return false;
      if (pricePreset === '25m-50m' && (price < 25000000 || price > 50000000)) return false;
      if (pricePreset === '50m-100m' && (price < 50000000 || price > 100000000)) return false;
      if (pricePreset === 'above100m' && price <= 100000000) return false;

      // 6. Custom Min / Max Price in FCFA
      if (minPrice && !isNaN(Number(minPrice)) && price < Number(minPrice)) return false;
      if (maxPrice && !isNaN(Number(maxPrice)) && price > Number(maxPrice)) return false;

      // 7. General Keyword Search (TF N°, Lot, Section, Neighborhood, City, Commune, Lotissement, Reference, Title)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = parcel.title?.toLowerCase().includes(q);
        const matchesRef = parcel.reference?.toLowerCase().includes(q);
        const matchesLot = parcel.lotNumber?.toLowerCase().includes(q);
        const matchesTF = parcel.documentNumber?.toLowerCase().includes(q);
        const matchesNeigh = parcel.neighborhood?.toLowerCase().includes(q);
        const matchesCity = parcel.city?.toLowerCase().includes(q);
        const matchesCommune = parcel.commune?.toLowerCase().includes(q);
        const matchesLotiss = parcel.lotissement?.toLowerCase().includes(q);
        const matchesSection = parcel.section?.toLowerCase().includes(q);
        const matchesIlot = parcel.ilotNumber?.toLowerCase().includes(q);
        
        if (
          !matchesTitle && 
          !matchesRef && 
          !matchesLot && 
          !matchesTF && 
          !matchesNeigh && 
          !matchesCity && 
          !matchesCommune && 
          !matchesLotiss && 
          !matchesSection &&
          !matchesIlot
        ) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'surface_asc') return (a.surface || 0) - (b.surface || 0);
      if (sortBy === 'surface_desc') return (b.surface || 0) - (a.surface || 0);
      // 'newest'
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [
    parcelles, 
    filterDoc, 
    filterStatus, 
    selectedCity, 
    selectedNeighborhood, 
    pricePreset, 
    minPrice, 
    maxPrice, 
    searchTerm, 
    sortBy
  ]);

  // Check if any filter is active to show the reset button & filter chips
  const hasActiveFilters = 
    searchTerm.trim() !== '' || 
    selectedCity !== 'all' || 
    selectedNeighborhood !== 'all' || 
    pricePreset !== 'all' || 
    minPrice !== '' || 
    maxPrice !== '' || 
    filterDoc !== 'all' || 
    filterStatus !== 'all';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCity('all');
    setSelectedNeighborhood('all');
    setPricePreset('all');
    setMinPrice('');
    setMaxPrice('');
    setFilterDoc('all');
    setFilterStatus('all');
    setSortBy('newest');
    setShowAdvancedPrice(false);
  };

  const handleConfirmDelete = async () => {
    if (!parcelleToDelete) return;
    const { id, reference, title } = parcelleToDelete;
    try {
      dispatch(deleteProperty(id));
      await firestoreService.deleteProperty(id);
      dispatch(addToast({
        type: 'info',
        message: `Parcelle "${reference} - ${title}" supprimée avec succès du cadastre.`,
      }));
    } catch (err) {
      console.error('Error deleting parcelle:', err);
      dispatch(addToast({
        type: 'error',
        message: `Erreur lors de la suppression de la parcelle ${reference}.`,
      }));
    }
  };

  const handleExportParcellesCSV = () => {
    const filename = `registre_parcelles_foncier_${agencyConfig.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
    exportPropertiesToCSV(filteredParcelles, filename);
    dispatch(addToast({
      type: 'success',
      message: `${filteredParcelles.length} parcelles exportées au format CSV (Excel).`,
    }));
  };

  const handleStatusChange = async (id: string, status: PropertyStatus) => {
    dispatch(updatePropertyStatus({ id, status }));
    dispatch(addToast({
      type: 'success',
      message: `Statut mis à jour : ${status.toUpperCase()}`,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-extrabold text-slate-900 font-heading">
              Gestion du Foncier & des Parcelles
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950">
              {filteredParcelles.length} Parcelles
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre et réserves foncières : Titres Fonciers (TF), Concessions Urbaines d'Habitation (CUH), Lettres et Permis d'occuper.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Reçu de Vente Button */}
          <button
            onClick={() => {
              dispatch(setSelectedPropertyForSale(null));
              dispatch(openRecordSaleModal());
            }}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Émettre et imprimer un reçu de vente avec informations client"
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>Émettre Reçu de Vente</span>
          </button>

          {/* Export CSV Parcelles */}
          <button
            onClick={handleExportParcellesCSV}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Exporter le registre des parcelles au format CSV pour Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV Cadastre</span>
          </button>

          <button
            id="btn-add-parcelle-manager"
            onClick={() => dispatch(openPropertyForm({ type: 'parcelle' }))}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une Parcelle TF</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs: Inventaire vs Reçus de Vente */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Inventaire & Cadastre des Parcelles ({parcelles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('receipts')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'receipts'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-emerald-400" />
          <span>Reçus de Vente Foncier ({sales.filter(s => s.propertyType === 'parcelle').length})</span>
        </button>
      </div>

      {activeTab === 'receipts' ? (
        <AdminSaleReceiptsList />
      ) : (
        <>
          {/* Advanced Search and Multi-Criteria Filtering Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            {/* Row 1: Search & Geographic Zone & Price Preset */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              {/* 1. Keyword Search (Cols 4) */}
              <div className="lg:col-span-4 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Rechercher par TF N°, Lot, Réf, Quartier, Titre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium placeholder:text-slate-400"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                    title="Effacer la recherche"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 2. Geographic Zone: City / Region (Cols 3) */}
              <div className="lg:col-span-3 relative">
                <MapPin className="w-4 h-4 text-amber-500 absolute left-3 top-2.5 pointer-events-none" />
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setSelectedNeighborhood('all'); // Reset neighborhood when city changes
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="all">📍 Toutes les Villes / Régions</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Geographic Zone: Neighborhood / Sector (Cols 2) */}
              <div className="lg:col-span-2 relative">
                <Building className="w-3.5 h-3.5 text-blue-500 absolute left-3 top-3 pointer-events-none" />
                <select
                  value={selectedNeighborhood}
                  onChange={(e) => setSelectedNeighborhood(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium text-slate-800 cursor-pointer truncate"
                >
                  <option value="all">Tous Quartiers</option>
                  {availableNeighborhoods.map((neigh) => (
                    <option key={neigh} value={neigh}>
                      {neigh}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Price Presets Dropdown (Cols 3) */}
              <div className="lg:col-span-3 relative">
                <Coins className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5 pointer-events-none" />
                <select
                  value={pricePreset}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPricePreset(val);
                    if (val !== 'custom') {
                      setMinPrice('');
                      setMaxPrice('');
                    } else {
                      setShowAdvancedPrice(true);
                    }
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="all">💰 Tous les Budgets</option>
                  <option value="under10m">&lt; 10 Millions FCFA</option>
                  <option value="10m-25m">10M - 25 Millions FCFA</option>
                  <option value="25m-50m">25M - 50 Millions FCFA</option>
                  <option value="50m-100m">50M - 100 Millions FCFA</option>
                  <option value="above100m">&gt; 100 Millions FCFA</option>
                  <option value="custom">✏️ Budget Personnalisé (Min / Max)</option>
                </select>
              </div>
            </div>

            {/* Row 2: Secondary Filters (Document Type, Status, Sorting, Custom Price Range) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-1 border-t border-slate-100">
              {/* Document Type Filter (Cols 3) */}
              <div className="lg:col-span-3">
                <select
                  value={filterDoc}
                  onChange={(e) => setFilterDoc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium text-slate-800 cursor-pointer"
                >
                  <option value="all">📜 Tous les Documents Fonciers</option>
                  <option value="titre_foncier">Titre Foncier (TF) uniquement</option>
                  <option value="lettre_attribution">Lettre d'Attribution</option>
                  <option value="concession_rurale">Concession Rurale</option>
                  <option value="bail">Bail</option>
                </select>
              </div>

              {/* Status Filter (Cols 3) */}
              <div className="lg:col-span-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium text-slate-800 cursor-pointer"
                >
                  <option value="all">🏷️ Tous les Statuts</option>
                  <option value="disponible">🟢 Disponible</option>
                  <option value="reserve">🟠 Réservé</option>
                  <option value="vendu">🔴 Vendu</option>
                </select>
              </div>

              {/* Sorting Filter (Cols 3) */}
              <div className="lg:col-span-3 relative">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium text-slate-800 cursor-pointer"
                >
                  <option value="newest">Trier par : Plus récents</option>
                  <option value="price_asc">Prix : Croissant</option>
                  <option value="price_desc">Prix : Décroissant</option>
                  <option value="surface_asc">Surface : Croissante</option>
                  <option value="surface_desc">Surface : Décroissante</option>
                </select>
              </div>

              {/* Toggle Custom Min/Max Price or Reset (Cols 3) */}
              <div className="lg:col-span-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdvancedPrice(!showAdvancedPrice)}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    showAdvancedPrice || minPrice || maxPrice || pricePreset === 'custom'
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Spécifier une fourchette exacte de prix en FCFA"
                >
                  <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                  <span>{showAdvancedPrice ? 'Masquer Budget Min/Max' : 'Budget Min/Max (FCFA)'}</span>
                </button>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="p-2 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                    title="Réinitialiser tous les filtres"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Custom Min / Max Price Inputs Box (Collapsible) */}
            {(showAdvancedPrice || pricePreset === 'custom') && (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-center animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-bold text-amber-950 mb-1">
                    Prix Minimum (FCFA) :
                  </label>
                  <input
                    type="number"
                    step="500000"
                    placeholder="Ex: 10000000"
                    value={minPrice}
                    onChange={(e) => {
                      setMinPrice(e.target.value);
                      setPricePreset('custom');
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-950 mb-1">
                    Prix Maximum (FCFA) :
                  </label>
                  <input
                    type="number"
                    step="500000"
                    placeholder="Ex: 50000000"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(e.target.value);
                      setPricePreset('custom');
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex items-center gap-1.5 self-end pb-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMinPrice('5000000');
                      setMaxPrice('20000000');
                      setPricePreset('custom');
                    }}
                    className="px-2 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-bold"
                  >
                    5M - 20M
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMinPrice('20000000');
                      setMaxPrice('50000000');
                      setPricePreset('custom');
                    }}
                    className="px-2 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-bold"
                  >
                    20M - 50M
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMinPrice('');
                      setMaxPrice('');
                      setPricePreset('all');
                    }}
                    className="px-2 py-1 text-slate-500 hover:text-slate-800 text-[10px] font-semibold underline ml-auto"
                  >
                    Effacer prix
                  </button>
                </div>
              </div>
            )}

            {/* Active Filters summary & Quick Dismiss Chips */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{filteredParcelles.length} terrain{filteredParcelles.length > 1 ? 's' : ''} correspondant{filteredParcelles.length > 1 ? 's' : ''} :</span>
                </span>

                {/* City Chip */}
                {selectedCity !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <span>📍 Ville : {selectedCity}</span>
                    <button type="button" onClick={() => setSelectedCity('all')} className="hover:text-rose-700">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {/* Neighborhood Chip */}
                {selectedNeighborhood !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                    <span>Quartier : {selectedNeighborhood}</span>
                    <button type="button" onClick={() => setSelectedNeighborhood('all')} className="hover:text-rose-700">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {/* Price Preset Chip */}
                {pricePreset !== 'all' && pricePreset !== 'custom' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <span>
                      Budget : {
                        pricePreset === 'under10m' ? '< 10 Millions' :
                        pricePreset === '10m-25m' ? '10M - 25M FCFA' :
                        pricePreset === '25m-50m' ? '25M - 50M FCFA' :
                        pricePreset === '50m-100m' ? '50M - 100M FCFA' :
                        '> 100 Millions FCFA'
                      }
                    </span>
                    <button type="button" onClick={() => setPricePreset('all')} className="hover:text-rose-700">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {/* Custom Min / Max Price Chip */}
                {(minPrice || maxPrice) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <span>
                      {minPrice && maxPrice ? `${formatFCFA(Number(minPrice))} à ${formatFCFA(Number(maxPrice))}` :
                       minPrice ? `Min ${formatFCFA(Number(minPrice))}` :
                       `Max ${formatFCFA(Number(maxPrice))}`}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => { setMinPrice(''); setMaxPrice(''); setPricePreset('all'); }} 
                      className="hover:text-rose-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {/* Document Type Chip */}
                {filterDoc !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                    <span>Doc : {getDocumentBadgeInfo(filterDoc as DocumentType).shortLabel}</span>
                    <button type="button" onClick={() => setFilterDoc('all')} className="hover:text-rose-700">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {/* Status Chip */}
                {filterStatus !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-900 border border-slate-300">
                    <span>Statut : {filterStatus}</span>
                    <button type="button" onClick={() => setFilterStatus('all')} className="hover:text-rose-700">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {/* Search Term Chip */}
                {searchTerm.trim() && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                    <span>Mot-clé : "{searchTerm}"</span>
                    <button type="button" onClick={() => setSearchTerm('')} className="hover:text-rose-700">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-bold underline flex items-center gap-1 cursor-pointer ml-auto"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Réinitialiser les filtres</span>
                </button>
              )}
            </div>
          </div>

      {/* Parcelles Table (Desktop >= md) & Cards (Mobile < md) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Réf & Visuel</th>
                <th className="py-3.5 px-4">Localisation & Lotissement</th>
                <th className="py-3.5 px-4">Cadastre (Lot/Section)</th>
                <th className="py-3.5 px-4">Document Légal</th>
                <th className="py-3.5 px-4">Surface / Dim.</th>
                <th className="py-3.5 px-4">Prix (FCFA)</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredParcelles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                        <Search className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">
                          Aucun terrain ou parcelle ne correspond à vos critères
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Essayez d'élargir la zone géographique (ville ou quartier), d'ajuster le budget ou de réinitialiser les filtres.
                        </p>
                      </div>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Réinitialiser tous les filtres</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredParcelles.map((parcel) => {
                  const docBadge = getDocumentBadgeInfo(parcel.documentType);
                  const statusBadge = getStatusBadgeInfo(parcel.status);

                  return (
                    <tr key={parcel.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Ref & Image */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={parcel.featuredImage || parcel.images[0]}
                            alt={parcel.title}
                            className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200"
                          />
                          <div>
                            <span className="font-mono font-bold text-slate-900 block">{parcel.reference}</span>
                            <span className="text-[11px] text-slate-500 line-clamp-1 max-w-[180px]">{parcel.title}</span>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{parcel.neighborhood}</span>
                        <span className="text-[11px] text-slate-500">{parcel.city} {parcel.commune && `(${parcel.commune})`}</span>
                        {parcel.lotissement && (
                          <span className="text-[10px] text-amber-700 font-medium block mt-0.5">
                            {parcel.lotissement}
                          </span>
                        )}
                      </td>

                      {/* Cadastre */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 font-mono text-[11px]">
                          <div className="font-bold text-slate-900">{parcel.lotNumber || '-'}</div>
                          <div className="text-slate-500">{parcel.section ? `Sect. ${parcel.section}` : ''} {parcel.ilotNumber ? `• ${parcel.ilotNumber}` : ''}</div>
                        </div>
                      </td>

                      {/* Document Type */}
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${docBadge.color}`}>
                          {docBadge.shortLabel}
                        </span>
                        {parcel.documentNumber && (
                          <span className="font-mono text-[10px] text-slate-600 block mt-0.5 truncate max-w-[140px]">
                            {parcel.documentNumber}
                          </span>
                        )}
                      </td>

                      {/* Surface */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{formatSurface(parcel.surface)}</span>
                        <span className="text-[10px] text-slate-500">{parcel.dimensions || '-'}</span>
                      </td>

                      {/* Price in FCFA */}
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900 font-heading text-xs">
                          {formatFCFA(parcel.price)}
                        </span>
                      </td>

                      {/* Status select */}
                      <td className="py-3 px-4">
                        <select
                          value={parcel.status}
                          onChange={(e) => handleStatusChange(parcel.id, e.target.value as PropertyStatus)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border-0 cursor-pointer ${statusBadge.color}`}
                        >
                          <option value="disponible">Disponible</option>
                          <option value="reserve">Réservé</option>
                          <option value="vendu">Vendu</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Reçu de vente action */}
                          {(() => {
                            const existingSale = sales.find((s) => s.propertyId === parcel.id || s.propertyReference === parcel.reference);
                            return (
                              <button
                                onClick={() => {
                                  if (existingSale) {
                                    dispatch(setActiveReceiptForPrint(existingSale));
                                    dispatch(openSaleReceiptModal());
                                  } else {
                                    dispatch(setSelectedPropertyForSale(parcel));
                                    dispatch(openRecordSaleModal());
                                  }
                                }}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  existingSale || parcel.status === 'vendu'
                                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                                    : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                                }`}
                                title={existingSale ? `Imprimer le Reçu de Vente (${existingSale.receiptNumber})` : 'Émettre un Reçu de Vente'}
                              >
                                <Receipt className="w-4 h-4" />
                              </button>
                            );
                          })()}

                          <button
                            onClick={() => dispatch(setSelectedPropertyId(parcel.id))}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Voir la fiche"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => dispatch(openPropertyForm({ property: parcel, type: 'parcelle' }))}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setParcelleToDelete(parcel)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Supprimer définitivement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile & Small Screens Card View (< md) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredParcelles.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">
                Aucun terrain trouvé
              </h4>
              <p className="text-xs text-slate-500">
                Ajustez vos filtres de prix ou de localisation géographique.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Réinitialiser les filtres</span>
                </button>
              )}
            </div>
          ) : (
            filteredParcelles.map((parcel) => {
              const docBadge = getDocumentBadgeInfo(parcel.documentType);
              const statusBadge = getStatusBadgeInfo(parcel.status);
              const existingSale = sales.find((s) => s.propertyId === parcel.id || s.propertyReference === parcel.reference);

              return (
                <div key={`card-${parcel.id}`} className="p-4 space-y-3 hover:bg-slate-50/60 transition-colors">
                  {/* Top Row: Thumbnail + Reference + Status Select */}
                  <div className="flex items-start gap-3">
                    <img
                      src={parcel.featuredImage || parcel.images[0]}
                      alt={parcel.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200 shadow-2xs"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono font-extrabold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {parcel.reference}
                        </span>
                        <select
                          value={parcel.status}
                          onChange={(e) => handleStatusChange(parcel.id, e.target.value as PropertyStatus)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border-0 cursor-pointer shadow-2xs ${statusBadge.color}`}
                        >
                          <option value="disponible">Disponible</option>
                          <option value="reserve">Réservé</option>
                          <option value="vendu">Vendu</option>
                        </select>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs line-clamp-1">
                        {parcel.title}
                      </h4>
                      <div className="flex items-center gap-1 text-slate-500 text-[11px] mt-0.5">
                        <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate">{parcel.neighborhood}, {parcel.city}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges & Key Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Document :</span>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${docBadge.color}`}>
                        {docBadge.shortLabel}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Cadastre :</span>
                      <span className="font-mono font-bold text-slate-800 text-[11px]">
                        Lot: {parcel.lotNumber || '-'}
                      </span>
                      {parcel.section && (
                        <span className="text-[10px] text-slate-500 block">Sect. {parcel.section}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Surface :</span>
                      <span className="font-bold text-slate-900 text-[11px]">
                        {formatSurface(parcel.surface)}
                      </span>
                      {parcel.dimensions && (
                        <span className="text-[10px] text-slate-500 block">{parcel.dimensions}</span>
                      )}
                    </div>
                  </div>

                  {/* Price & Action Row */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                        Prix Demandé
                      </span>
                      <span className="font-black text-slate-950 font-heading text-sm text-amber-600">
                        {formatFCFA(parcel.price)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Sale Receipt */}
                      <button
                        type="button"
                        onClick={() => {
                          if (existingSale) {
                            dispatch(setActiveReceiptForPrint(existingSale));
                            dispatch(openSaleReceiptModal());
                          } else {
                            dispatch(setSelectedPropertyForSale(parcel));
                            dispatch(openRecordSaleModal());
                          }
                        }}
                        className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          existingSale || parcel.status === 'vendu'
                            ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                            : 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200'
                        }`}
                        title={existingSale ? `Reçu (${existingSale.receiptNumber})` : 'Reçu de vente'}
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Reçu</span>
                      </button>

                      {/* View */}
                      <button
                        type="button"
                        onClick={() => dispatch(setSelectedPropertyId(parcel.id))}
                        className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                        title="Voir la fiche détaillée"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => dispatch(openPropertyForm({ property: parcel, type: 'parcelle' }))}
                        className="p-2 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                        title="Modifier la parcelle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => setParcelleToDelete(parcel)}
                        className="p-2 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
        </>
      )}

      {/* Confirmation Modal for Parcelle Deletion */}
      <ConfirmDeleteModal
        isOpen={!!parcelleToDelete}
        onClose={() => setParcelleToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer cette parcelle du cadastre ?"
        itemType="Parcelle Foncier"
        itemName={parcelleToDelete ? `${parcelleToDelete.reference} — ${parcelleToDelete.title}` : ''}
        itemDetails={parcelleToDelete ? [
          { label: 'Localisation', value: `${parcelleToDelete.neighborhood}, ${parcelleToDelete.city}` },
          { label: 'Document Foncier', value: `${getDocumentBadgeInfo(parcelleToDelete.documentType).label} ${parcelleToDelete.documentNumber ? `(N° ${parcelleToDelete.documentNumber})` : ''}` },
          { label: 'N° Lot / Section', value: `Lot: ${parcelleToDelete.lotNumber || 'Non spécifié'} | Section: ${parcelleToDelete.sectionNumber || '-'}` },
          { label: 'Surface & Prix', value: `${formatSurface(parcelleToDelete.surface)} • ${formatFCFA(parcelleToDelete.price)}` },
        ] : []}
        warningMessage="Attention : La suppression de cette parcelle retirera toutes les références cadastrales, dimensions et coordonnées géographiques associées de l'inventaire."
        confirmLabel="Supprimer définitivement"
      />
    </div>
  );
};
