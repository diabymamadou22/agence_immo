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
import { formatFCFA, formatDate, AGENCY_INFO } from '../../utils/formatters';
import { exportTenantsToCSV, exportReceiptsToCSV } from '../../utils/exportUtils';
import { TenantExportModal } from './TenantExportModal';
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
  Clock, 
  Printer, 
  Trash2, 
  FileText,
  DollarSign,
  Building,
  UserCheck,
  FileSpreadsheet
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

    dispatch(addTenant(newTenantData));
    await firestoreService.saveTenant({
      ...newTenantData,
      id: `tenant-${Date.now()}`,
      receipts: [],
    });
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
          {/* CSV Export Locataires */}
          <button
            onClick={handleExportTenantsCSV}
            className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Exporter les locataires en format CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>CSV Baux</span>
          </button>

          {/* CSV Export Quittances */}
          <button
            onClick={handleExportReceiptsCSV}
            className="px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Exporter le journal des quittances en format CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>CSV Quittances</span>
          </button>

          {/* État Comptable PDF */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Générer l'état comptable des loyers et imprimer en PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>État Comptable PDF</span>
          </button>

          <button
            onClick={() => setIsAddingTenant(!isAddingTenant)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
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

      {/* Tenants Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 font-heading">
            Liste des Locataires Actifs & État des Loyers
          </h3>
          <span className="text-xs text-slate-500">
            Total Loyer Mensuel : <strong className="text-slate-900">{formatFCFA(tenants.reduce((a, b) => a + b.monthlyRent, 0))}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Locataire & Contact</th>
                <th className="py-3.5 px-4">Bien Loué / Unité</th>
                <th className="py-3.5 px-4">Loyer Mensuel</th>
                <th className="py-3.5 px-4">Caution</th>
                <th className="py-3.5 px-4">Dernier Paiement</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Aucun locataire enregistré.
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Tenant details */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 text-sm block">{tenant.name}</span>
                        <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                          <span>📞 {tenant.phone}</span>
                          {tenant.ninaNumber && <span>• NINA : {tenant.ninaNumber}</span>}
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
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {tenant.lastPaymentMonth || 'Non renseigné'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        tenant.status === 'actif'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800 font-black'
                      }`}>
                        {tenant.status === 'actif' ? 'À Jour' : 'En Retard'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Record Payment */}
                        <button
                          id={`btn-pay-${tenant.id}`}
                          onClick={() => dispatch(openPaymentModal(tenant.id))}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                          title="Encaisser un loyer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Encaisser</span>
                        </button>

                        <button
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
    </div>
  );
};
