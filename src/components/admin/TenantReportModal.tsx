import React, { useRef, useState, useEffect } from 'react';
import { useAppSelector } from '../../store';
import { Tenant, RentReceipt } from '../../types';
import { formatFCFA, formatDate, AGENCY_INFO } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';
import { printElement } from '../../utils/printUtils';
import { 
  X, 
  Printer, 
  FileSpreadsheet, 
  Building2, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Receipt, 
  ShieldCheck,
  CreditCard,
  FileText,
  Clock
} from 'lucide-react';

interface TenantReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTenantId?: string | null;
}

export const TenantReportModal: React.FC<TenantReportModalProps> = ({
  isOpen,
  onClose,
  initialTenantId,
}) => {
  const tenants = useAppSelector((state) => state.tenants.items);
  const allReceipts = useAppSelector((state) => state.tenants.receipts);
  const properties = useAppSelector((state) => state.properties.items);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialTenantId && tenants.some((t) => t.id === initialTenantId)) {
      setSelectedTenantId(initialTenantId);
    } else if (tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [initialTenantId, tenants, selectedTenantId]);

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

  const currentTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];
  if (!currentTenant) return null;

  // Filter receipts for this tenant
  const tenantReceipts = allReceipts.filter((r) => 
    r.tenantId === currentTenant.id || 
    r.tenantName?.trim().toLowerCase() === currentTenant.name?.trim().toLowerCase()
  );

  const linkedProperty = properties.find((p) => p.id === currentTenant.propertyId);

  // Financial calculations
  const totalRentCollected = tenantReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);
  const isUpToDate = currentTenant.status === 'actif';

  const handlePrint = () => {
    if (printRef.current) {
      printElement(
        printRef.current,
        `Fiche_Locataire_${currentTenant.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`
      );
    } else {
      window.print();
    }
  };

  const handleExportCSV = () => {
    const filename = `fiche_locataire_${currentTenant.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
    const headers = [
      'Date Encaissement',
      'N° Quittance',
      'Période / Mois',
      'Montant Réglé (FCFA)',
      'Mode de Règlement',
      'Réf Transaction',
      'Statut'
    ];

    const rows: (string | number)[][] = tenantReceipts.map((r) => [
      r.paymentDate ? formatDate(r.paymentDate) : '',
      r.receiptNumber || '',
      r.periodMonth || '',
      r.amount || 0,
      r.paymentMethod || '',
      r.transactionRef || 'N/A',
      r.status === 'paye' ? 'Encaissé' : r.status
    ]);

    rows.push([
      'TOTAL ENCAISSÉ',
      `${tenantReceipts.length} quittance(s)`,
      '',
      totalRentCollected,
      '',
      '',
      ''
    ]);

    exportToCSV(filename, headers, rows);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 md:p-6 flex items-start sm:items-center justify-center animate-fadeIn print:p-0 print:bg-white print:static print:overflow-visible"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[94vh] sm:max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Screen only) */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm font-heading">
                Fiche Récapitulative du Locataire (Rapport PDF)
              </h3>
              <p className="text-[10px] text-slate-400">
                État complet du bail, coordonnées, historique des quittances et situation financière
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tenant Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-300 font-semibold hidden md:inline">Locataire :</span>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer max-w-[160px] sm:max-w-[220px] truncate"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    {t.name} ({t.propertyTitle.slice(0, 20)}...)
                  </option>
                ))}
              </select>
            </div>

            {/* CSV Export Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              title="Exporter le relevé des paiements du locataire en CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            {/* Print / PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer / PDF</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Fermer la fenêtre (Échap)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Fermer</span>
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div 
          ref={printRef}
          id="printable-tenant-report"
          className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 text-slate-900 bg-white font-sans text-xs sm:text-sm print:p-4 print:space-y-4"
        >
          {/* Official Agency Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 print:pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-blue-700 print:w-5 print:h-5" />
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight font-heading">
                  {agencyConfig.name || AGENCY_INFO.name}
                </h1>
              </div>
              <p className="text-xs text-slate-600 font-semibold italic">
                {agencyConfig.slogan || AGENCY_INFO.slogan}
              </p>
              <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5 pt-1">
                <span>📍 {agencyConfig.address || AGENCY_INFO.address}</span>
                <span>📞 {agencyConfig.phoneDisplay || agencyConfig.phone || AGENCY_INFO.phone}</span>
                <span>✉️ {agencyConfig.email || AGENCY_INFO.email}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Agrément Foncier & Immobilier • NIF : 085214789G • Bamako - Mali
              </div>
            </div>

            {/* Document Reference & Badge */}
            <div className="sm:text-right space-y-1.5 shrink-0">
              <div className="inline-block bg-slate-900 text-white text-[10px] font-mono font-bold px-3 py-1 rounded-lg uppercase tracking-wider">
                Fiche N° RAP-LOC-{currentTenant.id.slice(-6).toUpperCase()}
              </div>
              <div className="text-xs text-slate-500">
                Date d'édition : <strong>{formatDate(new Date().toISOString())}</strong>
              </div>
              <div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wide ${
                  isUpToDate 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {isUpToDate ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Bail Actif & En Règle</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Arriéré Constaté</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Main Title */}
          <div className="bg-slate-100 p-3 sm:p-4 rounded-xl border border-slate-200 text-center">
            <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide font-heading">
              Fiche Récapitulative du Dossier Locatif
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Synthèse contractuelle, situation d'occupation et relevé comptable des loyers
            </p>
          </div>

          {/* Two-Column Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Box 1: Tenant Information */}
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
              <div className="flex items-center gap-2 border-b border-blue-200/60 pb-2">
                <UserCheck className="w-4 h-4 text-blue-700" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-blue-950 font-heading">
                  1. Informations sur le Locataire
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 font-medium">Nom / Raison Sociale :</span>
                  <strong className="text-slate-900 text-right font-bold text-sm">{currentTenant.name}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Téléphone Principal :</span>
                  <strong className="text-slate-900 font-mono">{currentTenant.phone}</strong>
                </div>

                {currentTenant.email && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Email :</span>
                    <span className="text-slate-800">{currentTenant.email}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">N° NINA / Pièce d'Identité :</span>
                  <span className="font-mono text-slate-900 font-bold">
                    {currentTenant.ninaNumber || 'Non renseigné (Pièce consultée en agence)'}
                  </span>
                </div>

                {currentTenant.emergencyContact && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Contact d'Urgence :</span>
                    <span className="text-slate-800">{currentTenant.emergencyContact}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Box 2: Property & Lease Terms */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 font-heading">
                  2. Bien Loué & Modalités du Contrat
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 font-medium">Bien Immobilier :</span>
                  <strong className="text-slate-900 text-right font-bold max-w-[200px] truncate">
                    {currentTenant.propertyTitle}
                  </strong>
                </div>

                {linkedProperty && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Emplacement :</span>
                    <span className="text-slate-800">{linkedProperty.neighborhood}, {linkedProperty.city}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">N° Porte / Unité :</span>
                  <strong className="text-slate-900">{currentTenant.unitNumber || 'Principale'}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Période du Bail :</span>
                  <span className="text-slate-900 font-medium">
                    Du {formatDate(currentTenant.leaseStartDate)} au {formatDate(currentTenant.leaseEndDate)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Exigibilité Mensuelle :</span>
                  <span className="font-bold text-amber-700">Le {currentTenant.rentPaymentDay} de chaque mois</span>
                </div>
              </div>
            </div>
          </div>

          {/* Box 3: Financial Summary KPIs */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-white font-heading">
                  3. Bilan Financier & Engagements
                </h3>
              </div>
              <span className="text-[10px] text-slate-300 font-mono">Devise : Franc CFA (XOF)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 text-center sm:text-left">
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400">Loyer Mensuel</span>
                <p className="text-base sm:text-lg font-black text-amber-400 font-heading">
                  {formatFCFA(currentTenant.monthlyRent)}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400">Caution Déposée</span>
                <p className="text-base sm:text-lg font-black text-white font-heading">
                  {formatFCFA(currentTenant.depositAmount)}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400">Total Encaissé à Date</span>
                <p className="text-base sm:text-lg font-black text-emerald-400 font-heading">
                  {formatFCFA(totalRentCollected)}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400">Dernier Mois Encaissé</span>
                <p className="text-base sm:text-lg font-black text-blue-300 font-heading truncate">
                  {currentTenant.lastPaymentMonth || 'Aucun'}
                </p>
              </div>
            </div>
          </div>

          {/* Box 4: Ledger Table of Receipts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 font-heading">
                  4. Grand Livre des Règlements & Quittances Enregistrées ({tenantReceipts.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Conforme aux relevés comptables de l'agence
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">N° Quittance</th>
                    <th className="py-2.5 px-3">Mois / Période</th>
                    <th className="py-2.5 px-3">Mode de Paiement</th>
                    <th className="py-2.5 px-3">Réf / Reçu</th>
                    <th className="py-2.5 px-3 text-right">Montant (FCFA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {tenantReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                        Aucun paiement de loyer enregistré pour ce locataire à ce jour.
                      </td>
                    </tr>
                  ) : (
                    tenantReceipts.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3">{r.paymentDate ? formatDate(r.paymentDate) : '-'}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{r.receiptNumber}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{r.periodMonth}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold">
                            {r.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                          {r.transactionRef || '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-black text-slate-900">
                          {formatFCFA(r.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t border-slate-200">
                  <tr>
                    <td colSpan={5} className="py-2.5 px-3 text-slate-900 uppercase text-[11px]">
                      Total Cumulé des Loyers Encaissés
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-800 text-sm">
                      {formatFCFA(totalRentCollected)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Box 5: Legal Certifications & Signatures */}
          <div className="pt-2 space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Attestation d'Exécution & Régularité du Bail :</span>
              </div>
              <p>
                Le présent rapport récapitulatif certifie la conformité de l'état de compte locatif et des paiements répertoriés ci-dessus à la date d'émission, sous réserve des encaissements bancaires en cours de compensation. Document officiel délivré par l'agence {agencyConfig.name || AGENCY_INFO.name} conformément aux règles régissant les baux au Mali (OHADA).
              </p>
            </div>

            {/* Signature Blocks */}
            <div className="grid grid-cols-2 gap-8 pt-2">
              <div className="border border-slate-300 rounded-xl p-3 min-h-[90px] flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500">Pour le Locataire (Accusé de Réception) :</span>
                <div className="text-[11px] font-bold text-slate-900 pt-8">{currentTenant.name}</div>
              </div>

              <div className="border border-slate-300 rounded-xl p-3 min-h-[90px] flex flex-col justify-between text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500">Pour l'Agence {agencyConfig.name || AGENCY_INFO.name} :</span>
                <div className="space-y-0.5 pt-6">
                  <div className="text-[10px] font-mono text-emerald-700 font-bold uppercase">[ Cachet & Signature Direction ]</div>
                  <div className="text-[11px] font-bold text-slate-900">Le Responsable de Gestion Locative</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between text-[10px] text-slate-400 print:pt-2">
            <span>Mali Immo Prestige • Système de Gestion Immobilière & Foncière</span>
            <span>Rapport généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
