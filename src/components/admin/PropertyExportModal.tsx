import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../store';
import { Property } from '../../types';
import { formatFCFA, formatDate, getPropertyTypeLabel, getDocumentBadgeInfo } from '../../utils/formatters';
import { exportPropertiesToCSV } from '../../utils/exportUtils';
import { printElement } from '../../utils/printUtils';
import { 
  X, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  Building2, 
  Filter, 
  ShieldCheck, 
  Layers, 
  CheckCircle2 
} from 'lucide-react';

interface PropertyExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PropertyExportModal: React.FC<PropertyExportModalProps> = ({ isOpen, onClose }) => {
  const properties = useAppSelector((state) => state.properties.items);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const [filterType, setFilterType] = useState<string>('all');
  const [filterDeal, setFilterDeal] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Close with ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredProperties = properties.filter((p) => {
    if (filterType !== 'all' && p.propertyType !== filterType) return false;
    if (filterDeal !== 'all' && p.dealType !== filterDeal) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    return true;
  });

  // Calculate KPIs
  const totalCount = filteredProperties.length;
  const totalSaleValue = filteredProperties
    .filter((p) => p.dealType === 'vente')
    .reduce((sum, p) => sum + (p.price || 0), 0);
  const totalRentalValue = filteredProperties
    .filter((p) => p.dealType === 'location')
    .reduce((sum, p) => sum + (p.price || 0), 0);
  const totalTFPlots = filteredProperties.filter(
    (p) => p.propertyType === 'parcelle' && p.documentType === 'titre_foncier'
  ).length;

  const handlePrint = () => {
    printElement('printable-property-report', `Grand_Livre_Biens_${agencyConfig.name.replace(/\s+/g, '_')}`);
  };

  const handleExportCSV = () => {
    const filename = `inventaire_biens_${agencyConfig.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
    exportPropertiesToCSV(filteredProperties, filename);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 md:p-6 flex items-start sm:items-center justify-center animate-fadeIn print:p-0 print:bg-white print:static print:overflow-visible"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[94vh] sm:max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm font-heading">
                Grand Livre d'Inventaire & Biens
              </h3>
              <p className="text-[10px] text-slate-400">
                Rapport officiel PDF & Export Tableur CSV / Excel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Exporter au format CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exporter CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Imprimer ou enregistrer au format PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>

            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-slate-200 hover:text-white bg-slate-800 hover:bg-rose-600 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Fermer la fenêtre (Échap)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Fermer</span>
            </button>
          </div>
        </div>

        {/* Filters for Document (Hidden when printing) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden shrink-0">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Filtrer par Catégorie</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Toutes Catégories ({properties.length})</option>
              <option value="maison">Villas & Maisons</option>
              <option value="appartement">Appartements</option>
              <option value="magasin_bureau">Bureaux & Commerces</option>
              <option value="parcelle">Parcelles TF / Terrains</option>
              <option value="entrepot">Entrepôts</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Filtrer par Type d'Opération</label>
            <select
              value={filterDeal}
              onChange={(e) => setFilterDeal(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Toutes Opérations (Ventes & Locations)</option>
              <option value="vente">Ventes Uniquement</option>
              <option value="location">Locations Uniquement</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Filtrer par Statut Commercial</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Tous Statuts (Disponible, Loué, Vendu)</option>
              <option value="disponible">Disponibles uniquement</option>
              <option value="reserve">Réservés</option>
              <option value="loue">Loués</option>
              <option value="vendu">Vendus</option>
            </select>
          </div>
        </div>

        {/* Printable Document Sheet Content */}
        <div className="p-6 sm:p-8 overflow-y-auto print:overflow-visible space-y-4 print:space-y-3 text-slate-900 bg-white print:p-2" id="printable-property-report">
          
          {/* Official Agency Header */}
          <div className="flex justify-between items-start gap-4 border-b-2 border-slate-900 pb-3 print:pb-1.5 avoid-break">
            <div className="flex items-center gap-3">
              {agencyConfig.logoUrl ? (
                <img
                  src={agencyConfig.logoUrl}
                  alt={agencyConfig.name}
                  className="w-12 h-12 print:w-9 print:h-9 object-contain rounded-lg border border-slate-200 p-0.5"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 print:w-8 print:h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-base print:text-xs shadow-2xs">
                  {agencyConfig.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-lg print:text-sm font-black font-heading text-slate-950 uppercase tracking-tight">
                  {agencyConfig.name}
                </h1>
                <p className="text-[10px] print:text-[8px] text-slate-600 font-medium">{agencyConfig.slogan}</p>
                <div className="flex flex-wrap items-center gap-x-2 text-[9px] print:text-[7.5px] text-slate-500 mt-0.5 font-mono">
                  <span>RCCM : {agencyConfig.rccm}</span>
                  <span>•</span>
                  <span>NIF : {agencyConfig.nif}</span>
                  <span>•</span>
                  <span>Tél : {agencyConfig.phoneDisplay || agencyConfig.phone}</span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block px-2.5 py-0.5 bg-slate-900 text-white rounded text-[9px] print:text-[8px] font-black uppercase tracking-wider">
                État Officiel des Actifs
              </span>
              <p className="text-[10px] print:text-[8px] text-slate-500 mt-0.5 font-medium">
                Édité le : <strong>{new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
              </p>
            </div>
          </div>

          {/* Title and Scope */}
          <div className="bg-slate-50 p-3 print:p-2 rounded-xl border border-slate-200 flex items-center justify-between gap-2 avoid-break">
            <div>
              <h2 className="text-sm print:text-xs font-extrabold text-slate-900 font-heading">
                Grand Livre d'Inventaire du Patrimoine Immobilier & Foncier
              </h2>
              <p className="text-[10px] print:text-[8px] text-slate-500">
                Recensement officiel des mandats de vente, baux de gestion et réserves foncières.
              </p>
            </div>
            <div className="text-[10px] print:text-[8.5px] font-bold text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200 shrink-0">
              {totalCount} Biens
            </div>
          </div>

          {/* Executive Accounting Summary KPI Cards */}
          <div className="grid grid-cols-4 gap-2 avoid-break">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[8.5px] font-bold uppercase text-slate-500 block">Total Biens</span>
              <span className="text-sm font-black text-slate-900 font-heading">{totalCount}</span>
            </div>

            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
              <span className="text-[8.5px] font-bold uppercase text-amber-800 block">Valeur Portefeuille Vente</span>
              <span className="text-xs font-black text-amber-950 font-heading truncate block">
                {formatFCFA(totalSaleValue)}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
              <span className="text-[8.5px] font-bold uppercase text-blue-800 block">Potentiel Locatif Mensuel</span>
              <span className="text-xs font-black text-blue-950 font-heading truncate block">
                {formatFCFA(totalRentalValue)}/m
              </span>
            </div>

            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="text-[8.5px] font-bold uppercase text-emerald-800 block">Parcelles Titre Foncier</span>
              <span className="text-sm font-black text-emerald-950 font-heading">{totalTFPlots} TF</span>
            </div>
          </div>

          {/* Detailed Data Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden text-[10px] print:text-[8px]">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-white font-bold text-[9px] print:text-[7.5px] uppercase">
                <tr>
                  <th className="py-1.5 px-2">Réf</th>
                  <th className="py-1.5 px-2">Désignation</th>
                  <th className="py-1.5 px-2">Type / Op</th>
                  <th className="py-1.5 px-2">Localisation</th>
                  <th className="py-1.5 px-2">Surface</th>
                  <th className="py-1.5 px-2">Titre / Doc</th>
                  <th className="py-1.5 px-2 text-right">Prix / Valeur</th>
                  <th className="py-1.5 px-2 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400">
                      Aucun enregistrement ne correspond aux filtres appliqués.
                    </td>
                  </tr>
                ) : (
                  filteredProperties.map((p) => {
                    const docBadge = getDocumentBadgeInfo(p.documentType);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-1 px-2 font-mono font-bold text-slate-950 whitespace-nowrap">
                          {p.reference}
                        </td>
                        <td className="py-1 px-2">
                          <span className="font-bold text-slate-900 block truncate max-w-[140px]">
                            {p.title}
                          </span>
                          {p.lotNumber && (
                            <span className="text-[8px] text-slate-500 font-mono">Lot: {p.lotNumber}</span>
                          )}
                        </td>
                        <td className="py-1 px-2 whitespace-nowrap">
                          <span className="block text-slate-800">{getPropertyTypeLabel(p.propertyType)}</span>
                          <span className={`text-[8px] font-black uppercase ${
                            p.dealType === 'vente' ? 'text-amber-700' : 'text-blue-700'
                          }`}>
                            {p.dealType === 'vente' ? 'Vente' : 'Location'}
                          </span>
                        </td>
                        <td className="py-1 px-2 whitespace-nowrap">
                          <span className="text-slate-900 font-bold block">{p.neighborhood}</span>
                          <span className="text-[8px] text-slate-500">{p.city}</span>
                        </td>
                        <td className="py-1 px-2 font-mono whitespace-nowrap">
                          {p.surface} m²
                        </td>
                        <td className="py-1 px-2 whitespace-nowrap">
                          <span className="text-[8.5px] font-bold text-slate-700 block">
                            {docBadge.shortLabel}
                          </span>
                          {p.documentNumber && (
                            <span className="font-mono text-[7.5px] text-slate-500 block truncate max-w-[70px]">
                              {p.documentNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-1 px-2 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatFCFA(p.price)}
                          {p.dealType === 'location' && <span className="text-[7.5px] text-slate-400 font-normal"> /m</span>}
                        </td>
                        <td className="py-1 px-2 text-center whitespace-nowrap">
                          <span className={`inline-block px-1 py-0.2 rounded text-[7.5px] font-black uppercase ${
                            p.status === 'disponible' ? 'bg-emerald-100 text-emerald-800' :
                            p.status === 'reserve' ? 'bg-amber-100 text-amber-800' :
                            p.status === 'loue' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-800'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Legal Signoff & Stamp Footer */}
          <div className="pt-3 border-t border-slate-200 flex justify-between items-end gap-4 text-xs text-slate-600 avoid-break print:pt-2">
            <div className="space-y-0.5 max-w-sm">
              <p className="font-bold text-slate-900 text-[10px] print:text-[8px]">Attestation de Conformité d'Inventaire</p>
              <p className="text-[9px] print:text-[7px] leading-tight text-slate-500">
                Ce document certifie l'état exhaustif du portefeuille immobilier géré par l'agence {agencyConfig.name} à la date d'émission. Document confidentiel à usage de gestion comptable et d'audit.
              </p>
            </div>

            <div className="text-center space-y-1 min-w-[150px]">
              <p className="font-bold text-slate-900 text-[10px] print:text-[8px]">Pour la Direction & Comptabilité</p>
              {agencyConfig.stampUrl ? (
                <div className="w-16 h-16 mx-auto flex items-center justify-center">
                  <img
                    src={agencyConfig.stampUrl}
                    alt="Cachet"
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-20 h-10 mx-auto border border-dashed border-slate-300 rounded flex items-center justify-center text-[8px] text-slate-400">
                  Cachet & Signature
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Bottom Actions Footer (Fixed at the bottom for easy exit) */}
        <div className="p-3 sm:p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 sticky bottom-0 z-30 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <X className="w-4 h-4" />
            <span>Fermer / Quitter</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exporter CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
