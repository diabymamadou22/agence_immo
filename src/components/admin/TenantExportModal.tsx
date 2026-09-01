import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center animate-fadeIn print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base font-heading">
                Grand Livre de Gestion Locative & Rapprochement Comptable
              </h3>
              <p className="text-[11px] text-slate-400">
                Génération de rapport comptable des loyers, baux et quittances (PDF & CSV Excel)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportTenantsCSV}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Exporter les locataires en CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV Locataires</span>
            </button>

            <button
              onClick={handleExportReceiptsCSV}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Exporter le journal des quittances en CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV Quittances</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Imprimer ou enregistrer au format PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
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
        <div className="p-6 sm:p-8 overflow-y-auto print:overflow-visible space-y-6 text-slate-900 bg-white" id="printable-tenant-report">
          
          {/* Official Agency Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-slate-900 pb-5">
            <div className="flex items-center gap-4">
              {agencyConfig.logoUrl ? (
                <img
                  src={agencyConfig.logoUrl}
                  alt={agencyConfig.name}
                  className="w-16 h-16 object-contain rounded-xl border border-slate-200 p-1"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-xs">
                  {agencyConfig.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-xl font-black font-heading text-slate-950 uppercase tracking-tight">
                  {agencyConfig.name}
                </h1>
                <p className="text-xs text-slate-600 font-medium">{agencyConfig.slogan}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500 mt-1 font-mono">
                  <span>RCCM : {agencyConfig.rccm}</span>
                  <span>•</span>
                  <span>NIF : {agencyConfig.nif}</span>
                  <span>•</span>
                  <span>Tél : {agencyConfig.phoneDisplay || agencyConfig.phone}</span>
                </div>
              </div>
            </div>

            <div className="text-right sm:self-end">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-wider">
                État des Encaissements Locatifs
              </span>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Édité le : <strong>{new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
              </p>
            </div>
          </div>

          {/* Title & Scope */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 font-heading">
                Rapport Comptable & Recouvrement des Loyers
              </h2>
              <p className="text-xs text-slate-500">
                Suivi financier des baux d'habitation et commerciaux sous mandat de gérance.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              {activeTenantsCount} Baux répertoriés
            </div>
          </div>

          {/* Executive Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Loyer Mensuel Global</span>
              <span className="text-sm sm:text-base font-black text-slate-950 font-heading truncate block">
                {formatFCFA(totalMonthlyRent)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold uppercase text-emerald-800 block">Total Quittances Encaissées</span>
              <span className="text-sm sm:text-base font-black text-emerald-950 font-heading truncate block">
                {formatFCFA(totalReceiptsCollected)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] font-bold uppercase text-blue-800 block">Cautions Séquestrées</span>
              <span className="text-sm sm:text-base font-black text-blue-950 font-heading truncate block">
                {formatFCFA(totalDeposits)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] font-bold uppercase text-amber-800 block">Taux de Recouvrement</span>
              <span className="text-lg font-black text-amber-950 font-heading">{recoveryRate}%</span>
              <span className="text-[10px] text-amber-700 block">
                {lateTenantsCount > 0 ? `${lateTenantsCount} retard(s)` : 'Tous à jour'}
              </span>
            </div>
          </div>

          {/* Section 1: Detailed Tenants & Leases Table */}
          {(activeTab === 'both' || activeTab === 'tenants') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 font-heading flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Registre des Baux & État de Solvabilité</span>
                </h3>
                <span className="text-xs text-slate-500">{filteredTenants.length} enregistrements</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white font-bold text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Locataire & Contact</th>
                      <th className="py-2.5 px-3">Bien Loué / Unité</th>
                      <th className="py-2.5 px-3">Échéance</th>
                      <th className="py-2.5 px-3 text-right">Loyer Mensuel</th>
                      <th className="py-2.5 px-3 text-right">Caution</th>
                      <th className="py-2.5 px-3">Dernier Mois Payé</th>
                      <th className="py-2.5 px-3 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {filteredTenants.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400">
                          Aucun locataire ne correspond aux filtres.
                        </td>
                      </tr>
                    ) : (
                      filteredTenants.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3">
                            <span className="font-bold text-slate-950 block">{t.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">Tél : {t.phone}</span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-bold text-slate-900 block truncate max-w-[180px]">{t.propertyTitle}</span>
                            <span className="text-[10px] text-slate-500">Unité : {t.unitNumber || 'Principale'}</span>
                          </td>
                          <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                            Le {t.rentPaymentDay || 5} du mois
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-950 whitespace-nowrap">
                            {formatFCFA(t.monthlyRent)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                            {formatFCFA(t.depositAmount)}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="text-slate-800 text-[11px]">
                              {t.lastPaymentMonth || 'Non renseigné'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase ${
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
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 font-heading flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Journal des Quittances de Loyer Émises (Historique)</span>
                </h3>
                <span className="text-xs text-slate-500">{receipts.length} quittances</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-white font-bold text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">N° Quittance</th>
                      <th className="py-2.5 px-3">Date Paiement</th>
                      <th className="py-2.5 px-3">Locataire</th>
                      <th className="py-2.5 px-3">Période Loyer</th>
                      <th className="py-2.5 px-3">Mode Règlement</th>
                      <th className="py-2.5 px-3 text-right">Montant Encaissé</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {receipts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          Aucune quittance émise.
                        </td>
                      </tr>
                    ) : (
                      receipts.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold text-slate-950 whitespace-nowrap">
                            {r.receiptNumber}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-slate-600">
                            {formatDate(r.paymentDate)}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900">
                            {r.tenantName}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-slate-800 font-medium">
                            {r.periodMonth}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-slate-600 text-[11px]">
                            {r.paymentMethod} {r.transactionRef ? `(${r.transactionRef})` : ''}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
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
          <div className="pt-8 border-t border-slate-200 flex justify-between items-end gap-6 text-xs text-slate-600">
            <div className="space-y-1 max-w-sm">
              <p className="font-bold text-slate-900">Attestation de Gestion Locative</p>
              <p className="text-[10px] leading-relaxed text-slate-500">
                Certifié sincère et conforme aux registres de caisse et relevés bancaires de l'agence {agencyConfig.name}. Document valant état des lieux financier pour les propriétaires et la comptabilité générale.
              </p>
            </div>

            <div className="text-center space-y-3 min-w-[200px]">
              <p className="font-bold text-slate-900 text-xs">Le Responsable Gestion Locative & Comptabilité</p>
              {agencyConfig.stampUrl ? (
                <div className="w-24 h-24 mx-auto flex items-center justify-center">
                  <img
                    src={agencyConfig.stampUrl}
                    alt="Cachet"
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-24 h-16 mx-auto border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                  Cachet & Signature
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
