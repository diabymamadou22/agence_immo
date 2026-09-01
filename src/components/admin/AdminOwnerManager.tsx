import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { addOwner, updateOwner, deleteOwner, addPayout } from '../../store/ownersSlice';
import { openPayoutPrintModal, addToast } from '../../store/uiSlice';
import { formatFCFA, formatDate } from '../../utils/formatters';
import { Owner, OwnerPayout, PaymentMethod } from '../../types';
import { 
  Users, 
  Plus, 
  Building, 
  DollarSign, 
  Printer, 
  Send, 
  Phone, 
  Mail, 
  CreditCard, 
  Trash2, 
  Edit, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Receipt
} from 'lucide-react';

export const AdminOwnerManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const owners = useAppSelector((state) => state.owners.items);
  const payouts = useAppSelector((state) => state.owners.payouts);
  const properties = useAppSelector((state) => state.properties.items);
  const tenants = useAppSelector((state) => state.tenants.items);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const [activeSubTab, setActiveSubTab] = useState<'owners' | 'payouts'>('owners');
  const [isAddingOwner, setIsAddingOwner] = useState(false);
  const [isAddingPayout, setIsAddingPayout] = useState(false);

  // New Owner Form State
  const [ownerForm, setOwnerForm] = useState({
    name: '',
    phone: '',
    email: '',
    ninaNumber: '',
    address: 'Bamako, Mali',
    bankName: 'BDM-SA',
    accountNumber: '',
    mobileMoneyNumber: '',
    managementCommissionRate: 10,
    saleCommissionRate: 5,
    propertiesCount: 1,
    status: 'actif' as 'actif' | 'inactif',
    notes: '',
  });

  // New Payout Form State
  const [payoutForm, setPayoutForm] = useState({
    ownerId: owners[0]?.id || '',
    periodMonth: 'Août 2024',
    grossRentCollected: 600000,
    agencyCommissionPercent: 10,
    maintenanceDeductions: 0,
    paymentMethod: 'Virement Bancaire' as PaymentMethod,
    transactionReference: 'VIR-BDM-REV-001',
    status: 'paye' as 'paye' | 'en_attente',
    notes: '',
  });

  // Calculate metrics
  const totalRentsManaged = tenants.reduce((acc, t) => acc + (t.monthlyRent || 0), 0);
  const totalAgencyMonthlyCommissions = Math.round(totalRentsManaged * 0.1);
  const totalPayoutsPaid = payouts.reduce((acc, p) => acc + p.netPaidToOwner, 0);

  const handleSaveOwner = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(addOwner(ownerForm));
    setIsAddingOwner(false);
    dispatch(
      addToast({
        type: 'success',
        message: `Propriétaire ${ownerForm.name} ajouté avec succès !`,
      })
    );
  };

  const handleSavePayout = (e: React.FormEvent) => {
    e.preventDefault();
    const owner = owners.find((o) => o.id === payoutForm.ownerId);
    const commAmount = Math.round((payoutForm.grossRentCollected * payoutForm.agencyCommissionPercent) / 100);
    const netAmount = payoutForm.grossRentCollected - commAmount - payoutForm.maintenanceDeductions;

    dispatch(
      addPayout({
        ownerId: payoutForm.ownerId,
        ownerName: owner?.name || 'Propriétaire',
        periodMonth: payoutForm.periodMonth,
        grossRentCollected: payoutForm.grossRentCollected,
        agencyCommissionPercent: payoutForm.agencyCommissionPercent,
        agencyCommissionAmount: commAmount,
        maintenanceDeductions: payoutForm.maintenanceDeductions,
        netPaidToOwner: netAmount,
        payoutDate: new Date().toISOString().split('T')[0],
        paymentMethod: payoutForm.paymentMethod,
        transactionReference: payoutForm.transactionReference,
        status: payoutForm.status,
        notes: payoutForm.notes,
      })
    );

    setIsAddingPayout(false);
    dispatch(
      addToast({
        type: 'success',
        message: `Reversement de ${formatFCFA(netAmount)} enregistré pour ${owner?.name} !`,
      })
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 uppercase tracking-wider">
              Gestion des Mandants & Bailleurs
            </span>
            <span className="text-xs text-slate-400">Relevés de Compte & Reversements Loyers</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
            Propriétaires & Reversement des Loyers
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Suivi des comptes propriétaires, prélèvement automatique des commissions d'agence (8% à 10%) et émission des bordereaux de reversement mensuels conformes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAddingPayout(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <DollarSign className="w-4 h-4" />
            <span>Nouveau Reversement</span>
          </button>
          <button
            onClick={() => setIsAddingOwner(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Ajouter Propriétaire</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Propriétaires & Bailleurs Actifs
          </span>
          <div className="text-2xl font-black text-slate-900 font-heading">
            {owners.length} Bailleurs Enregistrés
          </div>
          <p className="text-xs text-emerald-600 font-semibold">
            {properties.length} biens gérés en portefeuille
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Commissions Agence Estimées / Mois
          </span>
          <div className="text-2xl font-black text-amber-600 font-heading">
            {formatFCFA(totalAgencyMonthlyCommissions)}
          </div>
          <p className="text-xs text-slate-500">
            Sur un volume de {formatFCFA(totalRentsManaged)} de loyers bruts
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Reversements Effectués
          </span>
          <div className="text-2xl font-black text-slate-900 font-heading">
            {formatFCFA(totalPayoutsPaid)}
          </div>
          <p className="text-xs text-blue-600 font-semibold">
            {payouts.length} bordereaux émis et certifiés
          </p>
        </div>
      </div>

      {/* New Payout Form Modal/Section */}
      {isAddingPayout && (
        <form onSubmit={handleSavePayout} className="bg-white rounded-2xl p-6 sm:p-8 border border-amber-300 shadow-md space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-lg text-slate-900 font-heading flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              <span>Établir un Bordereau de Reversement des Loyers</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">Calcul automatique de la commission agence</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Bailleur / Propriétaire *
              </label>
              <select
                value={payoutForm.ownerId}
                onChange={(e) => setPayoutForm({ ...payoutForm, ownerId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-bold"
              >
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Mois d'Encaissement *
              </label>
              <input
                type="text"
                value={payoutForm.periodMonth}
                onChange={(e) => setPayoutForm({ ...payoutForm, periodMonth: e.target.value })}
                placeholder="Ex: Août 2024"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Loyer Brut Encaissé (FCFA) *
              </label>
              <input
                type="number"
                value={payoutForm.grossRentCollected}
                onChange={(e) => setPayoutForm({ ...payoutForm, grossRentCollected: parseFloat(e.target.value) || 0 })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Taux Commission Agence (%)
              </label>
              <input
                type="number"
                value={payoutForm.agencyCommissionPercent}
                onChange={(e) => setPayoutForm({ ...payoutForm, agencyCommissionPercent: parseFloat(e.target.value) || 0 })}
                min={1}
                max={25}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Déductions Travaux / Entretien (FCFA)
              </label>
              <input
                type="number"
                value={payoutForm.maintenanceDeductions}
                onChange={(e) => setPayoutForm({ ...payoutForm, maintenanceDeductions: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Mode de Règlement
              </label>
              <select
                value={payoutForm.paymentMethod}
                onChange={(e) => setPayoutForm({ ...payoutForm, paymentMethod: e.target.value as PaymentMethod })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-bold"
              >
                <option value="Virement Bancaire">Virement Bancaire (BDM, BOA, Ecobank)</option>
                <option value="Orange Money">Orange Money</option>
                <option value="Moov Money">Moov Money</option>
                <option value="Chèque">Chèque Bancaire</option>
                <option value="Espèces">Espèces au Guichet</option>
              </select>
            </div>
          </div>

          {/* Real-time Calculation Summary Box */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs space-y-1">
              <div>Loyer Brut : <span className="font-bold">{formatFCFA(payoutForm.grossRentCollected)}</span></div>
              <div>Commission Agence ({payoutForm.agencyCommissionPercent}%) : <span className="font-bold text-amber-400">-{formatFCFA((payoutForm.grossRentCollected * payoutForm.agencyCommissionPercent) / 100)}</span></div>
              {payoutForm.maintenanceDeductions > 0 && (
                <div>Travaux : <span className="font-bold text-rose-400">-{formatFCFA(payoutForm.maintenanceDeductions)}</span></div>
              )}
            </div>

            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                Net Payable au Bailleur
              </span>
              <span className="text-2xl font-black text-emerald-400 font-heading">
                {formatFCFA(
                  payoutForm.grossRentCollected -
                    (payoutForm.grossRentCollected * payoutForm.agencyCommissionPercent) / 100 -
                    payoutForm.maintenanceDeductions
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddingPayout(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
            >
              Valider le Reversement
            </button>
          </div>
        </form>
      )}

      {/* New Owner Form Modal/Section */}
      {isAddingOwner && (
        <form onSubmit={handleSaveOwner} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-300 shadow-md space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-lg text-slate-900 font-heading flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Création d'une Fiche Propriétaire / Mandant</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">Informations bancaires pour les virements</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Nom Complet du Propriétaire *
              </label>
              <input
                type="text"
                value={ownerForm.name}
                onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })}
                required
                placeholder="Ex: El Hadj Oumar Diallo"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Numéro de Téléphone *
              </label>
              <input
                type="text"
                value={ownerForm.phone}
                onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
                required
                placeholder="+223 76 ..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Numéro NINA (Identification Nationale)
              </label>
              <input
                type="text"
                value={ownerForm.ninaNumber}
                onChange={(e) => setOwnerForm({ ...ownerForm, ninaNumber: e.target.value })}
                placeholder="1 87 04 750 ..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Banque de Domiciliation
              </label>
              <input
                type="text"
                value={ownerForm.bankName}
                onChange={(e) => setOwnerForm({ ...ownerForm, bankName: e.target.value })}
                placeholder="BDM-SA, BOA, Ecobank..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Numéro de Compte / RIB
              </label>
              <input
                type="text"
                value={ownerForm.accountNumber}
                onChange={(e) => setOwnerForm({ ...ownerForm, accountNumber: e.target.value })}
                placeholder="RIB Bancaire pour reversements"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Numéro Orange Money / Moov Money
              </label>
              <input
                type="text"
                value={ownerForm.mobileMoneyNumber}
                onChange={(e) => setOwnerForm({ ...ownerForm, mobileMoneyNumber: e.target.value })}
                placeholder="+223 76 ..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddingOwner(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md transition-all cursor-pointer"
            >
              Enregistrer le Propriétaire
            </button>
          </div>
        </form>
      )}

      {/* Sub-Tabs: Bailleurs vs Bordereaux de Reversements */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('owners')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeSubTab === 'owners'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Fiches Propriétaires ({owners.length})
        </button>

        <button
          onClick={() => setActiveSubTab('payouts')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeSubTab === 'payouts'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Bordereaux de Reversement des Loyers ({payouts.length})
        </button>
      </div>

      {/* View 1: Owners Cards */}
      {activeSubTab === 'owners' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {owners.map((owner) => (
            <div
              key={owner.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 font-bold flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{owner.name}</h4>
                      <span className="text-[11px] text-slate-500 font-mono">{owner.phone}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Actif
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs text-slate-700">
                  {owner.bankName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Banque :</span>
                      <span className="font-bold">{owner.bankName}</span>
                    </div>
                  )}
                  {owner.accountNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Compte :</span>
                      <span className="font-mono text-[11px]">{owner.accountNumber}</span>
                    </div>
                  )}
                  {owner.mobileMoneyNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Mobile :</span>
                      <span className="font-bold text-amber-700">{owner.mobileMoneyNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Taux Commission :</span>
                    <span className="font-black text-slate-900">{owner.managementCommissionRate}% loyer</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic">
                  "{owner.notes || 'Propriétaire sous mandat de gestion'}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setPayoutForm((prev) => ({
                      ...prev,
                      ownerId: owner.id,
                      agencyCommissionPercent: owner.managementCommissionRate,
                    }));
                    setIsAddingPayout(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer flex items-center gap-1"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Effectuer Reversement</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(`Supprimer la fiche de ${owner.name} ?`)) {
                      dispatch(deleteOwner(owner.id));
                      dispatch(addToast({ type: 'info', message: 'Propriétaire supprimé.' }));
                    }
                  }}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View 2: Payouts Ledger (Reversements des loyers) */}
      {activeSubTab === 'payouts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Bordereau N°</th>
                  <th className="py-3 px-4">Propriétaire</th>
                  <th className="py-3 px-4">Période</th>
                  <th className="py-3 px-4 text-right">Loyer Brut</th>
                  <th className="py-3 px-4 text-right">Com. Agence</th>
                  <th className="py-3 px-4 text-right">Net Reversé</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {payout.payoutNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {payout.ownerName}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">
                      {payout.periodMonth}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-700">
                      {formatFCFA(payout.grossRentCollected)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-600">
                      -{formatFCFA(payout.agencyCommissionAmount)} ({payout.agencyCommissionPercent}%)
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700 font-heading">
                      {formatFCFA(payout.netPaidToOwner)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {payout.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => dispatch(openPayoutPrintModal(payout))}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Printer className="w-3 h-3 text-amber-400" />
                        <span>Imprimer Bordereau</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
