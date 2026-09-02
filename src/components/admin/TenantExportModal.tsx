import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../store';
import { Tenant, RentReceipt } from '../../types';
import { formatFCFA, formatDate } from '../../utils/formatters';
import { exportTenantsToCSV, exportReceiptsToCSV } from '../../utils/exportUtils';
import { printElement } from '../../utils/printUtils';
import { 
  X, 
  Printer, 
  FileSpreadsheet, 
  Users, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  ShieldCheck, 
  Calendar 
} from 'lucide-react';

interface TenantExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TenantExportModal: React.FC<TenantExportModalProps> = ({ isOpen, onClose }) => {
  const tenants = useAppSelector((state) => state.tenants.items);
  const receipts = useAppSelector((state) => state.tenants.receipts);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const [activeTab, setActiveTab] = useState<'tenants' | 'receipts' | 'both'>('both');
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

  const filteredTenants = tenants.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  // Calculate Accounting KPIs
  const totalMonthlyRent = filteredTenants.reduce((sum, t) => sum + (t.monthlyRent || 0), 0);
  const totalDeposits = filteredTenants.reduce((sum, t) => sum + (t.depositAmount || 0), 0);
  const totalReceiptsCollected = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);
  const lateTenantsCount = filteredTenants.filter((t) => t.status === 'retard').length;
  const activeTenantsCount = filteredTenants.length;

  const recoveryRate = activeTenantsCount > 0 
    ? Math.round(((activeTenantsCount - lateTenantsCount) / activeTenantsCount) * 100) 
    : 100;

  const handlePrint = () => {
    printElement('printable-tenant-report', `Grand_Livre_Gestion_Locative_${agencyConfig.name.replace(/\s+/g, '_')}`);
  };

  const handleExportTenantsCSV = () => {
    const filename = `registre_baux_locataires_${agencyConfig.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
    exportTenantsToCSV(filteredTenants, filename);
  };

  const handleExportReceiptsCSV = () => {
    const filename = `journal_quittances_loyers_${agencyConfig.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
    exportReceiptsToCSV(receipts, filename);
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
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm font-heading">
                Grand Livre de Gestion Locative
              </h3>
              <p className="text-[10px] text-slate-400">
                Rapport officiel PDF & Exports CSV Excel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportTenantsCSV}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Exporter les locataires en CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV Locataires</span>
            </button>

            <button
              onClick={handleExportReceiptsCSV}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Exporter le journal des quittances en CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV Quittances</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Imprimer ou enregistrer au format PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>

            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-slate-200 hover:text-white bg-slate-800 hover:bg-rose-600 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Fermer la fenêtre (Échap)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Fermer</span>
            </button>
          </div>
        </div>

        {/* View Options Bar (Hidden when printing) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Sections à inclure :</span>
            <div className="inline-flex rounded-xl bg-slate-200 p-1">
              <button
                onClick={() => setActiveTab('both')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'both' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Rapport Complet
              </button>
              <button
                onClick={() => setActiveTab('tenants')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'tenants' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Baux & Locataires
              </button>
              <button
                onClick={() => setActiveTab('receipts')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'receipts' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Journal Quittances
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Filtre Statut :</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Tous ({tenants.length})</option>
              <option value="actif">À Jour Uniquement</option>
              <option value="retard">En Retard de Paiement</option>
            </select>
          </div>
        </div>

        {/* Printable Document Sheet Content */}
        <div className="p-6 sm:p-8 overflow-y-auto print:overflow-visible space-y-4 print:space-y-3 text-slate-900 bg-white print:p-2" id="printable-tenant-report">
          
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
                État des Encaissements Locatifs
              </span>
              <p className="text-[10px] print:text-[8px] text-slate-500 mt-0.5 font-medium">
                Édité le : <strong>{new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
              </p>
            </div>
          </div>

          {/* Title & Scope */}
          <div className="bg-slate-50 p-3 print:p-2 rounded-xl border border-slate-200 flex items-center justify-between gap-2 avoid-break">
            <div>
              <h2 className="text-sm print:text-xs font-extrabold text-slate-900 font-heading">
                Rapport Comptable & Recouvrement des Loyers
              </h2>
              <p className="text-[10px] print:text-[8px] text-slate-500">
                Suivi financier des baux d'habitation et commerciaux sous mandat de gérance.
              </p>
            </div>
            <div className="text-[10px] print:text-[8.5px] font-bold text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200 shrink-0">
              {activeTenantsCount} Baux
            </div>
          </div>

          {/* Executive Summary KPIs */}
          <div className="grid grid-cols-4 gap-2 avoid-break">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[8.5px] font-bold uppercase text-slate-500 block">Loyer Mensuel Global</span>
              <span className="text-xs font-black text-slate-950 font-heading truncate block">
                {formatFCFA(totalMonthlyRent)}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="text-[8.5px] font-bold uppercase text-emerald-800 block">Quittances Encaissées</span>
              <span className="text-xs font-black text-emerald-950 font-heading truncate block">
                {formatFCFA(totalReceiptsCollected)}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
              <span className="text-[8.5px] font-bold uppercase text-blue-800 block">Cautions Séquestrées</span>
              <span className="text-xs font-black text-blue-950 font-heading truncate block">
                {formatFCFA(totalDeposits)}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
              <span className="text-[8.5px] font-bold uppercase text-amber-800 block">Taux Recouvrement</span>
              <span className="text-sm font-black text-amber-950 font-heading">{recoveryRate}%</span>
              <span className="text-[8px] text-amber-700 block">
                {lateTenantsCount > 0 ? `${lateTenantsCount} retard(s)` : 'À jour'}
              </span>
            </div>
          </div>

          {/* Section 1: Detailed Tenants & Leases Table */}
          {(activeTab === 'both' || activeTab === 'tenants') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between avoid-break">
                <h3 className="font-extrabold text-xs print:text-[10px] text-slate-900 font-heading flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600 print:hidden" />
                  <span>Registre des Baux & Solvabilité</span>
                </h3>
                <span className="text-[10px] print:text-[8px] text-slate-500">{filteredTenants.length} baux</span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden text-[10px] print:text-[8px]">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-white font-bold text-[9px] print:text-[7.5px] uppercase">
                    <tr>
                      <th className="py-1.5 px-2">Locataire</th>
                      <th className="py-1.5 px-2">Bien / Unité</th>
                      <th className="py-1.5 px-2">Échéance</th>
                      <th className="py-1.5 px-2 text-right">Loyer Mensuel</th>
                      <th className="py-1.5 px-2 text-right">Caution</th>
                      <th className="py-1.5 px-2">Dernier Mois</th>
                      <th className="py-1.5 px-2 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {filteredTenants.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-slate-400">
                          Aucun locataire ne correspond aux filtres.
                        </td>
                      </tr>
                    ) : (
                      filteredTenants.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="py-1 px-2">
                            <span className="font-bold text-slate-950 block">{t.name}</span>
                            <span className="text-[8px] text-slate-500 font-mono">{t.phone}</span>
                          </td>
                          <td className="py-1 px-2">
                            <span className="font-bold text-slate-900 block truncate max-w-[140px]">{t.propertyTitle}</span>
                            <span className="text-[8px] text-slate-500">Unité : {t.unitNumber || 'Principale'}</span>
                          </td>
                          <td className="py-1 px-2 text-slate-700 whitespace-nowrap">
                            Le {t.rentPaymentDay || 5}/m
                          </td>
                          <td className="py-1 px-2 text-right font-mono font-bold text-slate-950 whitespace-nowrap">
                            {formatFCFA(t.monthlyRent)}
                          </td>
                          <td className="py-1 px-2 text-right font-mono text-slate-700 whitespace-nowrap">
                            {formatFCFA(t.depositAmount)}
                          </td>
                          <td className="py-1 px-2 whitespace-nowrap">
                            <span className="text-slate-800 text-[9px] print:text-[8px]">
                              {t.lastPaymentMonth || 'Non renseigné'}
                            </span>
                          </td>
                          <td className="py-1 px-2 text-center whitespace-nowrap">
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${
                              t.status === 'actif' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {t.status === 'actif' ? 'À Jour' : 'En Retard'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 2: Receipts Accounting Journal */}
          {(activeTab === 'both' || activeTab === 'receipts') && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between avoid-break">
                <h3 className="font-extrabold text-xs print:text-[10px] text-slate-900 font-heading flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-emerald-600 print:hidden" />
                  <span>Journal des Quittances de Loyer Émises</span>
                </h3>
                <span className="text-[10px] print:text-[8px] text-slate-500">{receipts.length} quittances</span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden text-[10px] print:text-[8px]">
                <table className="w-full text-left">
                  <thead className="bg-slate-800 text-white font-bold text-[9px] print:text-[7.5px] uppercase">
                    <tr>
                      <th className="py-1.5 px-2">N° Quittance</th>
                      <th className="py-1.5 px-2">Date</th>
                      <th className="py-1.5 px-2">Locataire</th>
                      <th className="py-1.5 px-2">Période</th>
                      <th className="py-1.5 px-2">Règlement</th>
                      <th className="py-1.5 px-2 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {receipts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-400">
                          Aucune quittance émise.
                        </td>
                      </tr>
                    ) : (
                      receipts.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="py-1 px-2 font-mono font-bold text-slate-950 whitespace-nowrap">
                            {r.receiptNumber}
                          </td>
                          <td className="py-1 px-2 whitespace-nowrap text-slate-600">
                            {formatDate(r.paymentDate)}
                          </td>
                          <td className="py-1 px-2 font-bold text-slate-900 truncate max-w-[120px]">
                            {r.tenantName}
                          </td>
                          <td className="py-1 px-2 whitespace-nowrap text-slate-800 font-medium">
                            {r.periodMonth}
                          </td>
                          <td className="py-1 px-2 whitespace-nowrap text-slate-600 text-[9px] print:text-[7.5px]">
                            {r.paymentMethod} {r.transactionRef ? `(${r.transactionRef})` : ''}
                          </td>
                          <td className="py-1 px-2 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                            {formatFCFA(r.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Legal Signoff & Stamp Footer */}
          <div className="pt-3 border-t border-slate-200 flex justify-between items-end gap-4 text-xs text-slate-600 avoid-break print:pt-2">
            <div className="space-y-0.5 max-w-sm">
              <p className="font-bold text-slate-900 text-[10px] print:text-[8px]">Attestation de Gestion Locative</p>
              <p className="text-[9px] print:text-[7px] leading-tight text-slate-500">
                Certifié sincère et conforme aux registres de caisse et relevés bancaires de l'agence {agencyConfig.name}. Document valant état des lieux financier pour les propriétaires et la comptabilité générale.
              </p>
            </div>

            <div className="text-center space-y-1 min-w-[150px]">
              <p className="font-bold text-slate-900 text-[10px] print:text-[8px]">Gestion Locative & Comptabilité</p>
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
              onClick={handleExportTenantsCSV}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>CSV Locataires</span>
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
