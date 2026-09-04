import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  addTenant, 
  deleteTenant, 
  deleteReceipt,
  setActiveReceiptForPrint 
} from '../../store/tenantsSlice';
import { 
  openReceiptModal, 
  openPaymentModal, 
  addToast 
} from '../../store/uiSlice';
import { firestoreService } from '../../services/firestoreService';
import { Tenant, RentReceipt, PaymentMethod } from '../../types';
import { formatFCFA, formatDate, AGENCY_INFO, getTenantLateStatus } from '../../utils/formatters';
import { exportTenantsToCSV, exportReceiptsToCSV, exportImpayesLocatifsCSV } from '../../utils/exportUtils';
import { sendRentReminderWhatsApp } from '../../utils/whatsappUtils';
import { RentStatusPastille } from './RentStatusPastille';
import { RentReminderModal } from './RentReminderModal';
import { BatchRentReminderModal } from './BatchRentReminderModal';
import { TenantReceiptsHistoryModal } from './TenantReceiptsHistoryModal';
import { TenantExportModal } from './TenantExportModal';
import { TenantReportModal } from './TenantReportModal';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { 
  Users, 
  Plus, 
  Receipt, 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  BellRing,
  History,
  Clock, 
  Printer, 
  Trash2, 
  FileText,
  DollarSign,
  Building,
  UserCheck,
  FileSpreadsheet,
  MessageCircle,
  Search,
  Filter
} from 'lucide-react';

export const AdminTenantManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const tenants = useAppSelector((state) => state.tenants.items);
  const receipts = useAppSelector((state) => state.tenants.receipts);
  const properties = useAppSelector((state) => state.properties.items);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const rentalProperties = properties.filter((p) => p.dealType === 'location');

  // Form State to add tenant
  const [isAddingTenant, setIsAddingTenant] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedTenantForReport, setSelectedTenantForReport] = useState<string | null>(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isBatchReminderModalOpen, setIsBatchReminderModalOpen] = useState(false);
  const [selectedReminderTenant, setSelectedReminderTenant] = useState<Tenant | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistoryTenant, setSelectedHistoryTenant] = useState<Tenant | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [receiptToDelete, setReceiptToDelete] = useState<RentReceipt | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+223 ');
  const [email, setEmail] = useState('');
  const [ninaNumber, setNinaNumber] = useState('');
  const [propertyId, setPropertyId] = useState(rentalProperties[0]?.id || '');
  const [unitNumber, setUnitNumber] = useState('');
  const [monthlyRent, setMonthlyRent] = useState<number>(250000);
  const [depositAmount, setDepositAmount] = useState<number>(500000);
  const [leaseStartDate, setLeaseStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [leaseEndDate, setLeaseEndDate] = useState('');
  const [rentPaymentDay, setRentPaymentDay] = useState(5);

  // Filter & Search State for Overdue Rent Monitoring
  const [statusFilter, setStatusFilter] = useState<'all' | 'up_to_date' | 'late_over_5'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate status and pastilles for all tenants
  const tenantsWithLateInfo = tenants.map((t) => ({
    tenant: t,
    lateStatus: getTenantLateStatus(t),
  }));

  const over5DaysCount = tenantsWithLateInfo.filter((item) => item.lateStatus.isOver5Days).length;
  const upToDateCount = tenantsWithLateInfo.filter((item) => !item.lateStatus.isLate).length;

  const filteredTenantsWithInfo = tenantsWithLateInfo.filter(({ tenant, lateStatus }) => {
    if (statusFilter === 'late_over_5' && !lateStatus.isOver5Days) return false;
    if (statusFilter === 'up_to_date' && lateStatus.isLate) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = tenant.name.toLowerCase().includes(q);
      const matchProp = tenant.propertyTitle.toLowerCase().includes(q);
      const matchPhone = tenant.phone.toLowerCase().includes(q);
      const matchUnit = (tenant.unitNumber || '').toLowerCase().includes(q);
      return matchName || matchProp || matchPhone || matchUnit;
    }
    return true;
  });

  const handleAddTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !propertyId) {
      dispatch(addToast({
        type: 'warning',
        message: 'Veuillez renseigner le nom, téléphone et choisir le bien loué.',
      }));
      return;
    }

    const selectedProp = properties.find((p) => p.id === propertyId);

    const newTenantData = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      ninaNumber: ninaNumber.trim() || undefined,
      propertyId: propertyId,
      propertyTitle: selectedProp?.title || 'Bien loué',
      unitNumber: unitNumber.trim() || 'Principal',
      monthlyRent: Number(monthlyRent) || 100000,
      depositAmount: Number(depositAmount) || 200000,
      advanceMonths: 1,
      rentPaymentDay: Number(rentPaymentDay) || 5,
      leaseStartDate: leaseStartDate,
      leaseEndDate: leaseEndDate || '2025-12-31',
      status: 'actif' as const,
      lastPaymentMonth: 'En attente',
    };

    const newTenantId = `ten-${Date.now()}`;
    const fullTenant: any = {
      ...newTenantData,
      id: newTenantId,
      receipts: [],
    };

    dispatch(addTenant(fullTenant));
    await firestoreService.saveTenant(fullTenant);
    dispatch(addToast({
      type: 'success',
      message: `Locataire ${name} ajouté avec succès au contrat de location.`,
    }));

    // Reset Form
    setName('');
    setPhone('+223 ');
    setEmail('');
    setNinaNumber('');
    setIsAddingTenant(false);
  };

  const handlePrintReceipt = (receipt: any) => {
    dispatch(setActiveReceiptForPrint(receipt));
    dispatch(openReceiptModal());
  };

  const handleConfirmDeleteTenant = async () => {
    if (!tenantToDelete) return;
    const { id, name: tenantName } = tenantToDelete;
    try {
      dispatch(deleteTenant(id));
      await firestoreService.deleteTenant(id);
      dispatch(addToast({
        type: 'info',
        message: `Dossier du locataire ${tenantName} supprimé avec succès.`,
      }));
    } catch (err) {
      console.error('Error deleting tenant:', err);
      dispatch(addToast({
        type: 'error',
        message: `Erreur lors de la suppression du locataire ${tenantName}.`,
      }));
    }
  };

  const handleConfirmDeleteReceipt = async () => {
    if (!receiptToDelete) return;
    const { id, receiptNumber } = receiptToDelete;
    try {
      dispatch(deleteReceipt(id));
      await firestoreService.deleteReceipt(id);
      dispatch(addToast({
        type: 'info',
        message: `Quittance ${receiptNumber} supprimée avec succès.`,
      }));
    } catch (err) {
      console.error('Error deleting receipt:', err);
      dispatch(addToast({
        type: 'error',
        message: `Erreur lors de la suppression de la quittance ${receiptNumber}.`,
      }));
    }
  };

  const handleExportTenantsCSV = () => {
    const filename = `baux_locataires_${agencyConfig.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
    exportTenantsToCSV(tenants, filename);
    dispatch(addToast({
      type: 'success',
      message: `${tenants.length} baux locataires exportés en CSV (Excel).`,
    }));
  };

  const handleExportReceiptsCSV = () => {
    const filename = `journal_quittances_${agencyConfig.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
    exportReceiptsToCSV(receipts, filename);
    dispatch(addToast({
      type: 'success',
      message: `${receipts.length} quittances de loyer exportées en CSV (Excel).`,
    }));
  };

  const handleExportImpayesCSV = () => {
    const filename = `etat_nominatif_impayes_arrieres_${agencyConfig.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
    exportImpayesLocatifsCSV(tenants, filename);
    dispatch(addToast({
      type: 'success',
      message: 'Registre officiel des impayés et retards locatifs exporté en CSV (Excel) !',
    }));
  };

  const handleOpenTenantReport = (tenantId?: string) => {
    if (tenants.length === 0) {
      dispatch(addToast({
        type: 'warning',
        message: 'Aucun locataire disponible pour générer un rapport.',
      }));
      return;
    }
    setSelectedTenantForReport(tenantId || tenants[0].id);
    setIsReportModalOpen(true);
  };

  const handleOpenHistory = (tenant: Tenant) => {
    setSelectedHistoryTenant(tenant);
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-extrabold text-slate-900 font-heading">
              Gestion Locative & Quittances de Loyer
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white">
              {tenants.length} Baux Actifs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Suivi des baux d'habitation et commerciaux au Mali, encaissement Orange Money/Banque et émission de quittances certifiées.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Campagne de Rappels Groupés WhatsApp */}
          <button
            type="button"
            onClick={() => setIsBatchReminderModalOpen(true)}
            className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Lancer une campagne de relance groupée par WhatsApp pour l'échéance du 5 et les impayés"
          >
            <BellRing className="w-4 h-4" />
            <span>Rappels Groupés (WhatsApp)</span>
          </button>

          {/* Registre des Impayés et Retards CSV */}
          <button
            type="button"
            onClick={handleExportImpayesCSV}
            className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Exporter le registre des impayés et retards locatifs en CSV pour mise en demeure"
          >
            <FileSpreadsheet className="w-4 h-4 text-rose-600" />
            <span>État Impayés (CSV)</span>
          </button>

          {/* Générer Rapport Locataire PDF */}
          <button
            type="button"
            onClick={() => handleOpenTenantReport()}
            className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Générer une fiche récapitulative au format PDF pour un locataire sélectionné"
          >
            <FileText className="w-4 h-4" />
            <span>Générer rapport</span>
          </button>

          {/* CSV Export Locataires */}
          <button
            type="button"
            onClick={handleExportTenantsCSV}
            className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Exporter les locataires en format CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>CSV Baux</span>
          </button>

          {/* CSV Export Quittances */}
          <button
            type="button"
            onClick={handleExportReceiptsCSV}
            className="px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Exporter le journal des quittances en format CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>CSV Quittances</span>
          </button>

          {/* État Comptable PDF */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Générer l'état comptable des loyers et imprimer en PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>État Comptable PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddingTenant(!isAddingTenant)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isAddingTenant ? 'Fermer le formulaire' : 'Nouveau Locataire / Bail'}</span>
          </button>
        </div>
      </div>

      {/* New Tenant Creation Form */}
      {isAddingTenant && (
        <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-base font-heading flex items-center gap-2 text-white">
              <UserCheck className="w-5 h-5 text-amber-400" />
              <span>Enregistrement d'un Nouveau Contrat de Bail au Mali</span>
            </h3>
            <span className="text-xs text-slate-400">Conforme Droit OHADA / Code des Obligations</span>
          </div>

          <form onSubmit={handleAddTenantSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tenant Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">Nom du Locataire / Société *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : M. Bakary Coulibaly"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">Téléphone (Mali) *</label>
                <input
                  type="tel"
                  required
                  placeholder="+223 70 00 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                />
              </div>

              {/* NINA Mali */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">Numéro NINA (Optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex : 1 85 02 740 011 44X"
                  value={ninaNumber}
                  onChange={(e) => setNinaNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Property Select */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">Bien Immobilier Loué *</label>
                <select
                  value={propertyId}
                  onChange={(e) => {
                    setPropertyId(e.target.value);
                    const chosen = properties.find((p) => p.id === e.target.value);
                    if (chosen && chosen.price) setMonthlyRent(chosen.price);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {rentalProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.reference} - {p.title.slice(0, 35)} ({p.neighborhood})
                    </option>
                  ))}
                </select>
              </div>

              {/* Monthly Rent in FCFA */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">Loyer Mensuel (FCFA) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={monthlyRent === 0 ? '' : monthlyRent}
                  placeholder="Ex : 150000"
                  onChange={(e) => {
                    const val = e.target.value;
                    setMonthlyRent(val === '' ? 0 : parseFloat(val) || 0);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-amber-400 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Caution in FCFA */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">Caution versée (FCFA)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={depositAmount === 0 ? '' : depositAmount}
                  placeholder="Ex : 300000"
                  onChange={(e) => {
                    const val = e.target.value;
                    setDepositAmount(val === '' ? 0 : parseFloat(val) || 0);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">Date de Début du Bail</label>
                <input
                  type="date"
                  value={leaseStartDate}
                  onChange={(e) => setLeaseStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">Date d'Échéance du Bail</label>
                <input
                  type="date"
                  value={leaseEndDate}
                  onChange={(e) => setLeaseEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">Jour d'échéance mensuelle</label>
                <select
                  value={rentPaymentDay}
                  onChange={(e) => setRentPaymentDay(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value={1}>Le 1er du mois</option>
                  <option value={5}>Le 5 du mois (Recommandé)</option>
                  <option value={10}>Le 10 du mois</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddingTenant(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Enregistrer le Locataire
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Alert Notification Banner for Rent Overdue > 5 days */}
      {over5DaysCount > 0 && (
        <div className="bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-amber-500/10 border border-rose-300 p-4 sm:p-5 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <AlertTriangle className="w-6 h-6 relative z-10 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[11px] uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                  Alerte Recouvrement Loyer
                </span>
                <span className="text-xs text-slate-500 font-semibold">• Dépassement &gt; 5 jours</span>
              </div>
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900 mt-0.5">
                {over5DaysCount} locataire{over5DaysCount > 1 ? 's ont' : ' a'} un retard de loyer supérieur à 5 jours
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Le délai de tolérance (5 jours) est dépassé. Des pastilles rouges signalent les contrats prioritaires pour relance WhatsApp et mise en demeure.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            {statusFilter !== 'late_over_5' ? (
              <button
                type="button"
                onClick={() => setStatusFilter('late_over_5')}
                className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span>Filtrer les {over5DaysCount} retard{over5DaysCount > 1 ? 's' : ''} &gt; 5j</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                Afficher tous les locataires
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tenants Table & Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header: Title + KPIs */}
        <div className="p-4 sm:p-5 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 font-heading">
                Liste des Locataires Actifs & État des Loyers
              </h3>
              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[11px] font-bold rounded-full">
                {tenants.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualisation instantanée des délais de paiement grâce au système de pastilles de couleur.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              Loyer mensuel global : <strong className="text-slate-900 font-extrabold">{formatFCFA(tenants.reduce((a, b) => a + b.monthlyRent, 0))}</strong>
            </span>
          </div>
        </div>

        {/* Toolbar: Status Filter Pills with Pastilles + Search Input */}
        <div className="p-3.5 sm:p-4 bg-white border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Filter: Tous */}
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>Tous les baux</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                statusFilter === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
              }`}>
                {tenants.length}
              </span>
            </button>

            {/* Filter: À Jour */}
            <button
              type="button"
              onClick={() => setStatusFilter('up_to_date')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'up_to_date'
                  ? 'bg-emerald-700 text-white shadow-2xs ring-2 ring-emerald-400'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span>À jour</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                statusFilter === 'up_to_date' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-200 text-emerald-900'
              }`}>
                {upToDateCount}
              </span>
            </button>

            {/* Filter: Retard > 5 jours */}
            <button
              type="button"
              onClick={() => setStatusFilter('late_over_5')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                statusFilter === 'late_over_5'
                  ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-300'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200'
              }`}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
              </span>
              <span className="font-extrabold">Retard &gt; 5 jours</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                statusFilter === 'late_over_5' ? 'bg-rose-800 text-rose-100' : 'bg-rose-200 text-rose-900'
              }`}>
                {over5DaysCount}
              </span>
            </button>
          </div>

          {/* Search Field */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrer par nom, bien, tél..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
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
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Locataire & Contact</th>
                <th className="py-3.5 px-4">Bien Loué / Unité</th>
                <th className="py-3.5 px-4">Loyer Mensuel</th>
                <th className="py-3.5 px-4">Caution</th>
                <th className="py-3.5 px-4">Dernier Paiement</th>
                <th className="py-3.5 px-4">Alerte & Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTenantsWithInfo.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm">Aucun locataire ne correspond aux filtres sélectionnés.</p>
                    {statusFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setStatusFilter('all')}
                        className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        Réinitialiser le filtre
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTenantsWithInfo.map(({ tenant, lateStatus }) => (
                  <tr 
                    key={tenant.id} 
                    className={`transition-colors ${
                      lateStatus.isCritical
                        ? 'bg-rose-50/70 hover:bg-rose-100/60 border-l-4 border-rose-700'
                        : lateStatus.isOver5Days
                        ? 'bg-rose-50/40 hover:bg-rose-50/80 border-l-4 border-rose-500'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Tenant details with visual pastille */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {/* Visual Color Pastille */}
                        <div className="shrink-0 pt-0.5">
                          <RentStatusPastille tenant={tenant} size="md" showBadge={false} />
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 text-sm block">{tenant.name}</span>
                          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                            <span>📞 {tenant.phone}</span>
                            {tenant.ninaNumber && <span>• NINA : {tenant.ninaNumber}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Property */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block max-w-[200px] truncate">{tenant.propertyTitle}</span>
                      <span className="text-[11px] text-slate-500">Unité : {tenant.unitNumber || 'Principale'}</span>
                    </td>

                    {/* Rent */}
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-slate-900 font-heading text-xs">
                        {formatFCFA(tenant.monthlyRent)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">le {tenant.rentPaymentDay} du mois</span>
                    </td>

                    {/* Deposit */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700">
                        {formatFCFA(tenant.depositAmount)}
                      </span>
                    </td>

                    {/* Last Payment Month */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleOpenHistory(tenant)}
                        className="group flex items-center gap-1.5 text-left cursor-pointer"
                        title={`Consulter l'historique complet des quittances de ${tenant.name}`}
                      >
                        <span className="font-bold text-slate-800 bg-slate-100 group-hover:bg-purple-100 group-hover:text-purple-900 transition-colors px-2 py-0.5 rounded flex items-center gap-1 border border-transparent group-hover:border-purple-200">
                          <History className="w-3 h-3 text-slate-400 group-hover:text-purple-600" />
                          {tenant.lastPaymentMonth || 'Non renseigné'}
                        </span>
                      </button>
                    </td>

                    {/* Status & Pastille Badge */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <RentStatusPastille tenant={tenant} size="sm" showBadge={true} />
                        {lateStatus.isLate && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReminderTenant(tenant);
                              setIsReminderModalOpen(true);
                            }}
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${
                              lateStatus.isOver5Days 
                                ? 'text-rose-600 hover:bg-rose-100 hover:text-rose-800' 
                                : 'text-amber-600 hover:bg-amber-100 hover:text-amber-800'
                            }`}
                            title={`Ouvrir le rappel de loyer pour ${tenant.name}`}
                          >
                            <BellRing className={`w-3.5 h-3.5 ${lateStatus.isOver5Days ? 'animate-bounce' : ''}`} />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Rappel de loyer (Boîte de dialogue de génération automatique) */}
                        {lateStatus.isLate && (
                          <button
                            id={`btn-rappel-${tenant.id}`}
                            type="button"
                            onClick={() => {
                              setSelectedReminderTenant(tenant);
                              setIsReminderModalOpen(true);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
                              lateStatus.isOver5Days
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs animate-subtle-pulse'
                                : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                            }`}
                            title={`Générer automatiquement un message de rappel pour ${tenant.name} (${lateStatus.label})`}
                          >
                            <BellRing className={`w-3.5 h-3.5 shrink-0 ${lateStatus.isOver5Days ? 'animate-bounce' : ''}`} />
                            <span>Rappel</span>
                          </button>
                        )}

                        {/* Historique des anciens reçus de paiement */}
                        <button
                          id={`btn-history-${tenant.id}`}
                          type="button"
                          onClick={() => handleOpenHistory(tenant)}
                          className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          title={`Ouvrir l'historique détaillé des anciens reçus de paiement de ${tenant.name}`}
                        >
                          <History className="w-3.5 h-3.5 text-purple-600" />
                          <span>Historique</span>
                        </button>

                        {/* Generate Tenant Summary Report PDF */}
                        <button
                          id={`btn-report-${tenant.id}`}
                          type="button"
                          onClick={() => handleOpenTenantReport(tenant.id)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          title="Générer la fiche récapitulative au format PDF pour ce locataire"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Rapport</span>
                        </button>

                        {/* Record Payment */}
                        <button
                          id={`btn-pay-${tenant.id}`}
                          type="button"
                          onClick={() => dispatch(openPaymentModal(tenant.id))}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                          title="Encaisser un loyer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Encaisser</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTenantToDelete(tenant)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Supprimer définitivement le contrat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile & Small Screens Card View (< md) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredTenantsWithInfo.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold">Aucun locataire trouvé.</p>
              <p className="text-xs text-slate-400 mt-1">Modifiez vos critères de recherche ou de filtre.</p>
            </div>
          ) : (
            filteredTenantsWithInfo.map(({ tenant, lateStatus }) => (
              <div 
                key={`card-tenant-${tenant.id}`} 
                className={`p-4 space-y-3 transition-colors ${
                  lateStatus.isCritical
                    ? 'bg-rose-50/70 border-l-4 border-rose-700'
                    : lateStatus.isOver5Days
                    ? 'bg-rose-50/40 border-l-4 border-rose-500'
                    : 'hover:bg-slate-50/60'
                }`}
              >
                {/* Header: Name with pastille + Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="pt-1">
                      <RentStatusPastille tenant={tenant} size="md" showBadge={false} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        {tenant.name}
                      </h4>
                      <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5 font-medium">
                        <Building className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="font-bold text-slate-700">{tenant.propertyTitle}</span>
                        <span className="text-slate-400">• Unité {tenant.unitNumber || 'Principale'}</span>
                      </div>
                    </div>
                  </div>

                  <RentStatusPastille tenant={tenant} size="sm" showBadge={true} />
                </div>

                {/* Overdue alert banner on mobile if > 5 days */}
                {lateStatus.isOver5Days && (
                  <div className="p-2.5 rounded-xl bg-rose-100/70 border border-rose-200 text-rose-950 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Retard de {lateStatus.daysLate} jours (&gt; 5j)</span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-rose-700 bg-white px-2 py-0.5 rounded shadow-2xs">
                      Relance urgente
                    </span>
                  </div>
                )}

                {/* Contact details */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                  <a
                    href={`tel:${tenant.phone}`}
                    className="flex items-center gap-1 text-blue-600 font-bold hover:underline"
                  >
                    <Phone className="w-3 h-3 text-blue-500" />
                    <span>{tenant.phone}</span>
                  </a>
                  {tenant.email && (
                    <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-[150px]">{tenant.email}</span>
                    </div>
                  )}
                  {tenant.ninaNumber && (
                    <span className="text-slate-500 font-mono text-[11px]">
                      NINA: <strong className="text-slate-700">{tenant.ninaNumber}</strong>
                    </span>
                  )}
                </div>

                {/* Financial Summary Grid */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Loyer Mensuel</span>
                    <span className="font-extrabold text-xs text-slate-900 font-heading block mt-0.5">
                      {formatFCFA(tenant.monthlyRent)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">le {tenant.rentPaymentDay}/mois</span>
                  </div>

                  <div className="border-x border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Caution</span>
                    <span className="font-bold text-xs text-slate-700 block mt-0.5">
                      {formatFCFA(tenant.depositAmount)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Dernier Mois</span>
                    <span className="font-bold text-xs text-slate-800 block mt-0.5 truncate px-1">
                      {tenant.lastPaymentMonth || 'Aucun'}
                    </span>
                  </div>
                </div>

                {/* Mobile Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  {/* Rappel de loyer avec boîte de dialogue */}
                  {lateStatus.isLate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReminderTenant(tenant);
                        setIsReminderModalOpen(true);
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer ${
                        lateStatus.isOver5Days
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-amber-600 hover:bg-amber-500 text-white'
                      }`}
                    >
                      <BellRing className="w-4 h-4" />
                      <span>Générer un Rappel de Loyer ({lateStatus.badgeText})</span>
                    </button>
                  )}

                  {/* View History */}
                  <button
                    type="button"
                    onClick={() => handleOpenHistory(tenant)}
                    className="flex-1 py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-purple-600" />
                    <span>Historique</span>
                  </button>

                  {/* Generate Report */}
                  <button
                    type="button"
                    onClick={() => handleOpenTenantReport(tenant.id)}
                    className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Rapport</span>
                  </button>

                  {/* Record Payment */}
                  <button
                    type="button"
                    onClick={() => dispatch(openPaymentModal(tenant.id))}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Encaisser</span>
                  </button>

                  {/* Delete Tenant */}
                  <button
                    type="button"
                    onClick={() => setTenantToDelete(tenant)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer shrink-0"
                    title="Supprimer le contrat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Visual Legend for Pastilles */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Légende des Pastilles d'Alerte Loyer :</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs"></span>
              <span className="font-medium text-slate-700">À Jour (0j)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-2xs"></span>
              <span className="font-medium text-slate-700">Retard 1 à 5 jours (Délai de grâce)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
              </span>
              <span className="font-extrabold text-rose-700">Retard &gt; 5 jours (Alerte relance)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-700 shadow-2xs ring-1 ring-rose-900"></span>
              <span className="font-black text-rose-950">Retard critique (+15j)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Receipts History Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-500" />
            <h3 className="font-extrabold text-base text-slate-900 font-heading">
              Historique des Quittances de Loyer Émises (Mali)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {receipts.length} quittances générées
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {receipts.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-900">{rec.receiptNumber}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Payé ({rec.paymentMethod})
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 truncate">{rec.tenantName}</h4>
                <p className="text-[11px] text-slate-500 truncate">{rec.propertyTitle}</p>
                <div className="pt-1 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Période : <strong>{rec.periodMonth}</strong></span>
                  <span className="font-extrabold text-slate-900">{formatFCFA(rec.amount)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400">{formatDate(rec.paymentDate)}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePrintReceipt(rec)}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimer</span>
                  </button>
                  <button
                    onClick={() => setReceiptToDelete(rec)}
                    className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                    title="Supprimer la quittance"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal for Tenant Deletion */}
      <ConfirmDeleteModal
        isOpen={!!tenantToDelete}
        onClose={() => setTenantToDelete(null)}
        onConfirm={handleConfirmDeleteTenant}
        title="Supprimer définitivement ce locataire ?"
        itemType="Bail / Locataire"
        itemName={tenantToDelete?.name}
        itemDetails={tenantToDelete ? [
          { label: 'Bien loué', value: tenantToDelete.propertyTitle },
          { label: 'Téléphone', value: tenantToDelete.phone },
          { label: 'Loyer mensuel', value: formatFCFA(tenantToDelete.monthlyRent) },
          { label: 'Caution déposée', value: formatFCFA(tenantToDelete.depositAmount) },
        ] : []}
        warningMessage="Attention : La résiliation ou suppression définitive de ce dossier effacera l'historique d'échéances et de suivi locatif pour ce bien."
        confirmLabel="Supprimer le locataire"
      />

      {/* Confirmation Modal for Receipt Deletion */}
      <ConfirmDeleteModal
        isOpen={!!receiptToDelete}
        onClose={() => setReceiptToDelete(null)}
        onConfirm={handleConfirmDeleteReceipt}
        title="Supprimer cette quittance de loyer ?"
        itemType="Quittance de Loyer"
        itemName={receiptToDelete ? `Quittance N° ${receiptToDelete.receiptNumber}` : ''}
        itemDetails={receiptToDelete ? [
          { label: 'Locataire', value: receiptToDelete.tenantName },
          { label: 'Bien concerné', value: receiptToDelete.propertyTitle },
          { label: 'Période réglée', value: receiptToDelete.periodMonth },
          { label: 'Montant encaissé', value: `${formatFCFA(receiptToDelete.amount)} (${receiptToDelete.paymentMethod})` },
        ] : []}
        warningMessage="Attention : Cette suppression annulera la trace d'encaissement correspondante dans le journal comptable de l'agence."
        confirmLabel="Supprimer la quittance"
      />

      {/* Grand Livre de Gestion Locative PDF Modal */}
      <TenantExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Fiche Récapitulative Individuelle du Locataire (Rapport PDF) */}
      <TenantReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        initialTenantId={selectedTenantForReport}
      />

      {/* Boîte de dialogue de Rappel de Loyer et Relance Automatique */}
      <RentReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => {
          setIsReminderModalOpen(false);
          setSelectedReminderTenant(null);
        }}
        tenant={selectedReminderTenant}
      />

      {/* Campagne de Relance Groupée des Loyers (Échéance du 5 & Retards) */}
      <BatchRentReminderModal
        isOpen={isBatchReminderModalOpen}
        onClose={() => setIsBatchReminderModalOpen(false)}
        tenants={tenants}
      />

      {/* Vue Détaillée de l'Historique des Anciens Reçus de Paiement */}
      <TenantReceiptsHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedHistoryTenant(null);
        }}
        tenant={selectedHistoryTenant}
      />
    </div>
  );
};
