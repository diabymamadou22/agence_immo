import React, { useState, useMemo, useEffect } from 'react';
import { Tenant, RentReceipt, PaymentMethod } from '../../types';
import { useAppSelector, useAppDispatch } from '../../store';
import { openPaymentModal, openReceiptModal, addToast } from '../../store/uiSlice';
import { setActiveReceiptForPrint } from '../../store/tenantsSlice';
import { formatFCFA, formatDate, getTenantLateStatus } from '../../utils/formatters';
import { sendRentReceiptWhatsApp } from '../../utils/whatsappUtils';
import { exportReceiptsToCSV } from '../../utils/exportUtils';
import { RentStatusPastille } from './RentStatusPastille';
import {
  X,
  History,
  Receipt,
  Search,
  Filter,
  Printer,
  MessageCircle,
  Download,
  Calendar,
  Building,
  Phone,
  DollarSign,
  CreditCard,
  PlusCircle,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

interface TenantReceiptsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
}

export const TenantReceiptsHistoryModal: React.FC<TenantReceiptsHistoryModalProps> = ({
  isOpen,
  onClose,
  tenant,
}) => {
  const dispatch = useAppDispatch();
  const allReceipts = useAppSelector((state) => state.tenants.receipts);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset filters when tenant changes
  useEffect(() => {
    setSearchQuery('');
    setSelectedMethod('all');
    setSortOrder('desc');
  }, [tenant?.id]);

  // Extract all receipts associated with this tenant
  const tenantReceipts = useMemo(() => {
    if (!tenant) return [];
    
    // Check both global receipts store matching tenantId or tenantName, and tenant.receipts
    const fromGlobal = allReceipts.filter(
      (r) => r.tenantId === tenant.id || 
             (r.tenantName && r.tenantName.trim().toLowerCase() === tenant.name.trim().toLowerCase())
    );
    
    const fromTenantObj = tenant.receipts || [];
    
    // Deduplicate by ID or receiptNumber
    const map = new Map<string, RentReceipt>();
    [...fromGlobal, ...fromTenantObj].forEach((r) => {
      const key = r.id || r.receiptNumber;
      if (!map.has(key)) {
        map.set(key, r);
      }
    });

    return Array.from(map.values());
  }, [tenant, allReceipts]);

  // Filtered and sorted receipts
  const filteredReceipts = useMemo(() => {
    return tenantReceipts
      .filter((r) => {
        // Method filter
        if (selectedMethod !== 'all' && r.paymentMethod !== selectedMethod) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNumber = r.receiptNumber.toLowerCase().includes(q);
          const matchPeriod = (r.periodMonth || '').toLowerCase().includes(q);
          const matchMethod = (r.paymentMethod || '').toLowerCase().includes(q);
          const matchRef = (r.transactionRef || '').toLowerCase().includes(q);
          const matchNotes = (r.notes || '').toLowerCase().includes(q);
          return matchNumber || matchPeriod || matchMethod || matchRef || matchNotes;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.paymentDate).getTime() || 0;
        const timeB = new Date(b.paymentDate).getTime() || 0;
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [tenantReceipts, selectedMethod, searchQuery, sortOrder]);

  // Computed summary metrics
  const totalPaid = useMemo(() => {
    return tenantReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [tenantReceipts]);

  const latestReceipt = useMemo(() => {
    if (tenantReceipts.length === 0) return null;
    return [...tenantReceipts].sort((a, b) => {
      const timeA = new Date(a.paymentDate).getTime() || 0;
      const timeB = new Date(b.paymentDate).getTime() || 0;
      return timeB - timeA;
    })[0];
  }, [tenantReceipts]);

  if (!isOpen || !tenant) return null;

  const lateStatus = getTenantLateStatus(tenant);

  const handlePrint = (receipt: RentReceipt) => {
    dispatch(setActiveReceiptForPrint(receipt));
    dispatch(openReceiptModal());
  };

  const handleWhatsApp = (receipt: RentReceipt) => {
    sendRentReceiptWhatsApp(receipt, agencyConfig, tenant.phone);
    dispatch(
      addToast({
        type: 'success',
        message: `Quittance N° ${receipt.receiptNumber} partagée via WhatsApp pour ${tenant.name}`,
      })
    );
  };

  const handleExportCSV = () => {
    if (tenantReceipts.length === 0) {
      dispatch(
        addToast({
          type: 'warning',
          message: 'Aucune quittance à exporter pour ce locataire.',
        })
      );
      return;
    }
    const cleanTenantName = tenant.name.toLowerCase().replace(/\s+/g, '_');
    const filename = `historique_quittances_${cleanTenantName}_${new Date().toISOString().slice(0, 10)}`;
    exportReceiptsToCSV(tenantReceipts, filename);
    dispatch(
      addToast({
        type: 'success',
        message: `Historique de ${tenantReceipts.length} quittance(s) exporté en CSV (Excel).`,
      })
    );
  };

  const handlePayNow = () => {
    onClose();
    dispatch(openPaymentModal(tenant.id));
  };

  const getMethodBadge = (method: PaymentMethod | string) => {
    switch (method) {
      case 'Orange Money':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Wave':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      case 'Moov Money':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'Virement Bancaire':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Espèces':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Chèque':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-400 shadow-inner">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300 bg-purple-400/10 px-2.5 py-0.5 rounded-full border border-purple-400/20">
                  Historique des Règlements
                </span>
                <span className="text-xs text-slate-400">• Journal des Quittances</span>
              </div>
              <h3 className="font-extrabold text-base sm:text-xl text-white font-heading mt-0.5">
                {tenant.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fermer la vue historique (Échap)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary & Financial KPIs Banner */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-5 shrink-0">
          {/* Tenant and Property Context */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200/80">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <RentStatusPastille tenant={tenant} size="md" showBadge={true} />
              
              <div className="flex items-center gap-1.5 text-slate-700">
                <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-extrabold text-slate-900">{tenant.propertyTitle}</span>
                <span className="text-slate-400">• Unité {tenant.unitNumber || 'Principale'}</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-500 font-mono">
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{tenant.phone}</span>
              </div>

              {tenant.ninaNumber && (
                <span className="px-2 py-0.5 bg-slate-200/80 text-slate-700 text-[11px] font-mono rounded">
                  NINA: {tenant.ninaNumber}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Exporter l'historique de ce locataire en fichier CSV (Excel)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Exporter CSV</span>
              </button>

              <button
                type="button"
                onClick={handlePayNow}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Enregistrer un nouveau paiement pour ce locataire"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Encaisser un Loyer</span>
              </button>
            </div>
          </div>

          {/* KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Card 1: Total Encaissé */}
            <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                Total des Versements
              </span>
              <div className="font-extrabold text-base sm:text-lg text-emerald-700 font-heading">
                {formatFCFA(totalPaid)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Cumul de {tenantReceipts.length} quittance{tenantReceipts.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Card 2: Loyer Mensuel & Échéance */}
            <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                Loyer Mensuel
              </span>
              <div className="font-extrabold text-base sm:text-lg text-slate-900 font-heading">
                {formatFCFA(tenant.monthlyRent)}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Échéance : le {tenant.rentPaymentDay || 5} du mois
              </span>
            </div>

            {/* Card 3: Dernier Règlement */}
            <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                Dernier Paiement
              </span>
              <div className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                {latestReceipt ? formatDate(latestReceipt.paymentDate) : 'Aucun versement'}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                {latestReceipt ? `Mois : ${latestReceipt.periodMonth}` : 'Nouveau bail'}
              </span>
            </div>

            {/* Card 4: Caution / Dépôt */}
            <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                Caution Séquestrée
              </span>
              <div className="font-extrabold text-base sm:text-lg text-blue-700 font-heading">
                {formatFCFA(tenant.depositAmount || 0)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Dépôt de garantie initial
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters, Sort */}
        <div className="p-3.5 sm:p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher quittance, mois, réf..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter by Payment Method */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Tous les modes ({tenantReceipts.length})</option>
                <option value="Orange Money">Orange Money</option>
                <option value="Wave">Wave</option>
                <option value="Moov Money">Moov Money</option>
                <option value="Virement Bancaire">Virement Bancaire</option>
                <option value="Espèces">Espèces</option>
                <option value="Chèque">Chèque</option>
              </select>
            </div>
          </div>

          {/* Sort Order Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>{sortOrder === 'desc' ? 'Plus récents en premier' : 'Plus anciens en premier'}</span>
            </button>
            <span className="text-slate-400 text-xs font-mono">
              {filteredReceipts.length} / {tenantReceipts.length}
            </span>
          </div>
        </div>

        {/* Scrollable Receipts List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredReceipts.length === 0 ? (
            <div className="py-14 text-center text-slate-400">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
              <h4 className="font-extrabold text-sm text-slate-700">
                {tenantReceipts.length === 0
                  ? 'Aucun reçu de paiement enregistré'
                  : 'Aucune quittance ne correspond à vos filtres'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {tenantReceipts.length === 0
                  ? 'Ce locataire n\'a pas encore de quittances émises dans le système. Enregistrez son premier loyer pour amorcer son historique.'
                  : 'Essayez de réinitialiser la recherche ou le filtre de mode de paiement.'}
              </p>

              {tenantReceipts.length === 0 ? (
                <button
                  type="button"
                  onClick={handlePayNow}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Encaisser le premier loyer</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedMethod('all');
                  }}
                  className="mt-3 text-xs font-bold text-purple-600 hover:underline cursor-pointer"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">N° Quittance</th>
                      <th className="py-3 px-4">Mois / Période</th>
                      <th className="py-3 px-4">Date Règlement</th>
                      <th className="py-3 px-4">Montant Versé</th>
                      <th className="py-3 px-4">Mode de Paiement</th>
                      <th className="py-3 px-4">Réf. / Transaction</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredReceipts.map((receipt) => {
                      const isPartial = receipt.paymentType === 'partiel' || (receipt.remainingBalance && receipt.remainingBalance > 0);

                      return (
                        <tr key={receipt.id} className="hover:bg-purple-50/40 transition-colors">
                          {/* Receipt Number */}
                          <td className="py-3 px-4">
                            <span className="font-mono font-extrabold text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                              {receipt.receiptNumber}
                            </span>
                          </td>

                          {/* Period */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">
                              {receipt.periodMonth}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate max-w-[150px] block">
                              {receipt.propertyTitle}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 text-slate-600">
                            {formatDate(receipt.paymentDate)}
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-sm text-slate-900 font-heading block">
                              {formatFCFA(receipt.amount)}
                            </span>
                            {isPartial && receipt.remainingBalance && (
                              <span className="text-[10px] text-rose-600 font-bold block">
                                Reste : {formatFCFA(receipt.remainingBalance)}
                              </span>
                            )}
                          </td>

                          {/* Payment Method */}
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${getMethodBadge(receipt.paymentMethod)}`}>
                              {receipt.paymentMethod}
                            </span>
                          </td>

                          {/* Transaction Reference */}
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {receipt.transactionRef ? (
                              <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                {receipt.transactionRef}
                              </span>
                            ) : (
                              <span className="text-slate-300 italic">-</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            {isPartial ? (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold rounded-full text-[10px]">
                                Partiel
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded-full text-[10px]">
                                Soldé
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Print / View */}
                              <button
                                type="button"
                                onClick={() => handlePrint(receipt)}
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                title="Imprimer ou afficher la quittance officielle"
                              >
                                <Printer className="w-3.5 h-3.5 text-blue-600" />
                                <span>Imprimer</span>
                              </button>

                              {/* WhatsApp Share */}
                              <button
                                type="button"
                                onClick={() => handleWhatsApp(receipt)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                                title="Envoyer la quittance par WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards (< md) */}
              <div className="md:hidden space-y-3">
                {filteredReceipts.map((receipt) => {
                  const isPartial = receipt.paymentType === 'partiel' || (receipt.remainingBalance && receipt.remainingBalance > 0);

                  return (
                    <div 
                      key={`mob-${receipt.id}`} 
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {receipt.receiptNumber}
                          </span>
                          <h5 className="font-bold text-sm text-slate-900 mt-1">
                            Période : {receipt.periodMonth}
                          </h5>
                          <span className="text-[11px] text-slate-500">
                            Réglé le {formatDate(receipt.paymentDate)}
                          </span>
                        </div>

                        <div className="text-right">
                          <div className="font-extrabold text-sm text-slate-900 font-heading">
                            {formatFCFA(receipt.amount)}
                          </div>
                          <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold border ${getMethodBadge(receipt.paymentMethod)}`}>
                            {receipt.paymentMethod}
                          </span>
                        </div>
                      </div>

                      {receipt.transactionRef && (
                        <div className="text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200/80">
                          Réf : {receipt.transactionRef}
                        </div>
                      )}

                      {isPartial && receipt.remainingBalance && (
                        <div className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200">
                          Reliquat restant dû : {formatFCFA(receipt.remainingBalance)}
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleWhatsApp(receipt)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePrint(receipt)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimer</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs">
          <div className="text-slate-600 text-center sm:text-left">
            Total affiché : <strong className="text-slate-900 font-extrabold">{formatFCFA(filteredReceipts.reduce((sum, r) => sum + r.amount, 0))}</strong> sur {filteredReceipts.length} quittance{filteredReceipts.length > 1 ? 's' : ''}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handlePayNow}
              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Encaisser un loyer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
