import React, { useState } from 'react';
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
  Printer
} from 'lucide-react';

export const AdminParcelleManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const properties = useAppSelector((state) => state.properties.items);
  const sales = useAppSelector((state) => state.sales.items);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const [activeTab, setActiveTab] = useState<'inventory' | 'receipts'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDoc, setFilterDoc] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [parcelleToDelete, setParcelleToDelete] = useState<Property | null>(null);

  const parcelles = properties.filter((p) => p.propertyType === 'parcelle');

  const filteredParcelles = parcelles.filter((parcel) => {
    if (filterDoc !== 'all' && parcel.documentType !== filterDoc) return false;
    if (filterStatus !== 'all' && parcel.status !== filterStatus) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchesTitle = parcel.title.toLowerCase().includes(q);
      const matchesRef = parcel.reference.toLowerCase().includes(q);
      const matchesLot = parcel.lotNumber?.toLowerCase().includes(q);
      const matchesTF = parcel.documentNumber?.toLowerCase().includes(q);
      const matchesNeigh = parcel.neighborhood.toLowerCase().includes(q);
      const matchesLotiss = parcel.lotissement?.toLowerCase().includes(q);
      if (!matchesTitle && !matchesRef && !matchesLot && !matchesTF && !matchesNeigh && !matchesLotiss) {
        return false;
      }
    }
    return true;
  });

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
          {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher par TF N°, Lot, Quartier, Réf..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        {/* Document Type Filter */}
        <select
          value={filterDoc}
          onChange={(e) => setFilterDoc(e.target.value)}
          className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
        >
          <option value="all">Tous les Documents Fonciers</option>
          <option value="titre_foncier">Titre Foncier (TF) uniquement</option>
          <option value="lettre_attribution">Lettre d'Attribution</option>
          <option value="concession_rurale">Concession Rurale</option>
          <option value="bail">Bail</option>
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
        >
          <option value="all">Tous les Statuts</option>
          <option value="disponible">Disponible</option>
          <option value="reserve">Réservé</option>
          <option value="vendu">Vendu</option>
        </select>
      </div>

      {/* Parcelles Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
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
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Aucune parcelle trouvée selon ces critères.
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
