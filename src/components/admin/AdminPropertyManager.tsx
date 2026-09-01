import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { openPropertyForm, addToast } from '../../store/uiSlice';
import { deleteProperty, updatePropertyStatus, setSelectedPropertyId } from '../../store/propertiesSlice';
import { firestoreService } from '../../services/firestoreService';
import { Property, PropertyStatus, PropertyType, DealType } from '../../types';
import { 
  formatFCFA, 
  formatSurface, 
  getDocumentBadgeInfo, 
  getStatusBadgeInfo, 
  getPropertyTypeLabel 
} from '../../utils/formatters';
import { exportPropertiesToCSV } from '../../utils/exportUtils';
import { PropertyExportModal } from './PropertyExportModal';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Filter, 
  CheckCircle2, 
  Maximize2,
  MapPin,
  FileSpreadsheet,
  Printer
} from 'lucide-react';

export const AdminPropertyManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const properties = useAppSelector((state) => state.properties.items);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDeal, setFilterDeal] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

  const filteredProperties = properties.filter((p) => {
    if (filterType !== 'all' && p.propertyType !== filterType) return false;
    if (filterDeal !== 'all' && p.dealType !== filterDeal) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchesTitle = p.title.toLowerCase().includes(q);
      const matchesRef = p.reference.toLowerCase().includes(q);
      const matchesNeigh = p.neighborhood.toLowerCase().includes(q);
      const matchesCity = p.city.toLowerCase().includes(q);
      if (!matchesTitle && !matchesRef && !matchesNeigh && !matchesCity) {
        return false;
      }
    }
    return true;
  });

  const handleConfirmDelete = async () => {
    if (!propertyToDelete) return;
    const { id, reference, title } = propertyToDelete;
    try {
      dispatch(deleteProperty(id));
      await firestoreService.deleteProperty(id);
      dispatch(addToast({
        type: 'info',
        message: `Bien "${reference} - ${title}" supprimé avec succès du catalogue.`,
      }));
    } catch (err) {
      console.error('Error deleting property:', err);
      dispatch(addToast({
        type: 'error',
        message: `Erreur lors de la suppression de ${reference}.`,
      }));
    }
  };

  const handleExportCSV = () => {
    const filename = `catalogue_biens_${agencyConfig.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
    exportPropertiesToCSV(filteredProperties, filename);
    dispatch(addToast({
      type: 'success',
      message: `${filteredProperties.length} biens exportés au format CSV (Excel) avec succès.`,
    }));
  };

  const handleStatusChange = (id: string, status: PropertyStatus) => {
    dispatch(updatePropertyStatus({ id, status }));
    dispatch(addToast({
      type: 'success',
      message: `Statut mis à jour : ${status.toUpperCase()}`,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-extrabold text-slate-900 font-heading">
              Gestion de Toutes les Propriétés & Bâtis
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-900 text-white">
              {filteredProperties.length} Biens
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Catalogue général : Villas, maisons duplex, appartements meublés, commerces et entrepôts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Télécharger le fichier CSV pour Excel / Comptabilité"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          {/* Grand Livre PDF */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Générer l'état des actifs et imprimer en PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Grand Livre PDF</span>
          </button>

          {/* Add Property */}
          <button
            onClick={() => dispatch(openPropertyForm({ type: 'general' }))}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Ajouter une Propriété</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher par titre, référence, quartier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
        >
          <option value="all">Toutes Catégories</option>
          <option value="maison">Villas & Maisons</option>
          <option value="appartement">Appartements</option>
          <option value="magasin_bureau">Bureaux & Commerces</option>
          <option value="parcelle">Parcelles / Terrains</option>
          <option value="entrepot">Entrepôts</option>
        </select>

        <select
          value={filterDeal}
          onChange={(e) => setFilterDeal(e.target.value)}
          className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
        >
          <option value="all">Toutes Opérations</option>
          <option value="vente">Ventes</option>
          <option value="location">Locations</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
        >
          <option value="all">Tous Statuts</option>
          <option value="disponible">Disponible</option>
          <option value="reserve">Réservé</option>
          <option value="loue">Loué</option>
          <option value="vendu">Vendu</option>
        </select>
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Bien & Référence</th>
                <th className="py-3.5 px-4">Type / Opération</th>
                <th className="py-3.5 px-4">Localisation Bamako</th>
                <th className="py-3.5 px-4">Surface / Pièces</th>
                <th className="py-3.5 px-4">Document Légal</th>
                <th className="py-3.5 px-4">Prix en FCFA</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Aucun bien correspondant à votre recherche.
                  </td>
                </tr>
              ) : (
                filteredProperties.map((prop) => {
                  const docBadge = getDocumentBadgeInfo(prop.documentType);
                  const statusBadge = getStatusBadgeInfo(prop.status);

                  return (
                    <tr key={prop.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Image & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prop.featuredImage || prop.images[0]}
                            alt={prop.title}
                            className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200"
                          />
                          <div>
                            <span className="font-mono font-bold text-slate-900 block">{prop.reference}</span>
                            <span className="text-[11px] text-slate-500 line-clamp-1 max-w-[200px]">{prop.title}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category / Deal */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{getPropertyTypeLabel(prop.propertyType)}</span>
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${
                          prop.dealType === 'vente' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {prop.dealType === 'vente' ? 'Vente' : 'Location'}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{prop.neighborhood}</span>
                        <span className="text-[11px] text-slate-500">{prop.city}</span>
                      </td>

                      {/* Specs */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{formatSurface(prop.surface)}</span>
                        <span className="text-[10px] text-slate-500">
                          {prop.bedrooms ? `${prop.bedrooms} ch.` : ''} {prop.bathrooms ? `• ${prop.bathrooms} sdb` : ''}
                        </span>
                      </td>

                      {/* Document */}
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${docBadge.color}`}>
                          {docBadge.shortLabel}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900 font-heading text-xs">
                          {formatFCFA(prop.price)}
                        </span>
                        {prop.dealType === 'location' && (
                          <span className="text-[10px] text-slate-500 block">/ mois</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <select
                          value={prop.status}
                          onChange={(e) => handleStatusChange(prop.id, e.target.value as PropertyStatus)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border-0 cursor-pointer ${statusBadge.color}`}
                        >
                          <option value="disponible">Disponible</option>
                          <option value="reserve">Réservé</option>
                          <option value="loue">Loué</option>
                          <option value="vendu">Vendu</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => dispatch(setSelectedPropertyId(prop.id))}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Voir la fiche"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => dispatch(openPropertyForm({ property: prop, type: 'general' }))}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPropertyToDelete(prop)}
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

      {/* Confirmation Modal for Property Deletion */}
      <ConfirmDeleteModal
        isOpen={!!propertyToDelete}
        onClose={() => setPropertyToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer définitivement ce bien ?"
        itemType={propertyToDelete?.propertyType === 'parcelle' ? 'Parcelle / Foncier' : 'Bien Bâti / Immobilier'}
        itemName={propertyToDelete ? `${propertyToDelete.reference} — ${propertyToDelete.title}` : ''}
        itemDetails={propertyToDelete ? [
          { label: 'Localisation', value: `${propertyToDelete.neighborhood}, ${propertyToDelete.city}` },
          { label: 'Opération & Prix', value: `${propertyToDelete.dealType === 'vente' ? 'Vente' : 'Location'} : ${formatFCFA(propertyToDelete.price)}` },
          { label: 'Surface', value: `${propertyToDelete.surface} m²` },
          { label: 'Titre de propriété', value: getDocumentBadgeInfo(propertyToDelete.documentType).label },
        ] : []}
        warningMessage="Cette action est irréversible. Le bien sera définitivement retiré du catalogue en ligne, des fiches de visite et de la base de données de l'agence."
        confirmLabel="Supprimer définitivement"
      />

      {/* Grand Livre d'Inventaire & Comptabilité PDF Export Modal */}
      <PropertyExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};
