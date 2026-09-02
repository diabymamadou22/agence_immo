import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { addExpense, deleteExpense } from '../../store/financialsSlice';
import { addToast } from '../../store/uiSlice';
import { firestoreService } from '../../services/firestoreService';
import { formatFCFA, formatDate } from '../../utils/formatters';
import { AgencyExpense, PaymentMethod } from '../../types';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { FinancialChart } from './FinancialChart';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Trash2, 
  Download, 
  Filter, 
  Calendar,
  Layers,
  Users,
  Building,
  Smartphone,
  Wallet
} from 'lucide-react';

export const AdminFinancials: React.FC = () => {
  const dispatch = useAppDispatch();
  const properties = useAppSelector((state) => state.properties.items);
  const tenants = useAppSelector((state) => state.tenants.items);
  const receipts = useAppSelector((state) => state.tenants.receipts);
  const payouts = useAppSelector((state) => state.owners.payouts);
  const expenses = useAppSelector((state) => state.financials.expenses);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<AgencyExpense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'geometre' as AgencyExpense['category'],
    amount: 50000,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Espèces' as PaymentMethod,
    receiptNumber: '',
    notes: '',
  });

  const handleConfirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    try {
      dispatch(deleteExpense(expenseToDelete.id));
      await firestoreService.deleteExpense(expenseToDelete.id);
      dispatch(addToast({ type: 'info', message: 'Dépense supprimée avec succès du grand livre.' }));
      setExpenseToDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression de la dépense:', error);
      dispatch(addToast({ type: 'error', message: 'Erreur lors de la suppression de la dépense.' }));
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate Key Financial Metrics
  // 1. Rental Management Commissions earned by Agency
  const totalRentalCommissionsEarned = payouts.reduce((acc, p) => acc + p.agencyCommissionAmount, 0);

  // 2. Sales Commissions (Estimated on properties marked as 'vendu' or standard 5%)
  const soldProperties = properties.filter((p) => p.status === 'vendu' && p.dealType === 'vente');
  const estimatedSalesCommissions = soldProperties.reduce(
    (acc, p) => acc + Math.round(p.price * (agencyConfig.defaultSaleCommissionPercent / 100)),
    0
  );

  // 3. Application / Dossier fees (simulation based on leads & tenants)
  const applicationFeesEarned = tenants.length * 25000;

  // Total Gross Agency Revenue
  const totalGrossAgencyRevenue = totalRentalCommissionsEarned + estimatedSalesCommissions + applicationFeesEarned;

  // Total Expenses
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  // Net Agency Profit
  const netAgencyProfit = totalGrossAgencyRevenue - totalExpenses;

  // Breakdown by payment channel (from rent receipts)
  const orangeMoneyTotal = receipts
    .filter((r) => r.paymentMethod === 'Orange Money')
    .reduce((acc, r) => acc + r.amount, 0);
  const bankTransferTotal = receipts
    .filter((r) => r.paymentMethod === 'Virement Bancaire')
    .reduce((acc, r) => acc + r.amount, 0);
  const cashTotal = receipts
    .filter((r) => r.paymentMethod === 'Espèces')
    .reduce((acc, r) => acc + r.amount, 0);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(addExpense(expenseForm));
    setIsAddingExpense(false);
    dispatch(
      addToast({
        type: 'success',
        message: `Dépense de ${formatFCFA(expenseForm.amount)} enregistrée avec succès !`,
      })
    );
  };

  const getCategoryLabel = (category: AgencyExpense['category']) => {
    switch (category) {
      case 'geometre':
        return 'Frais Géomètre & Bornage';
      case 'marketing':
        return 'Publicité & Réseaux Sociaux';
      case 'carburant':
        return 'Carburant & Visites Terrain';
      case 'juridique':
        return 'Actes & Droits d\'Enregistrement';
      case 'salaires':
        return 'Commissions & Salaires Agents';
      case 'bureau':
        return 'Fournitures & Loyer Agence';
      default:
        return 'Divers';
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 uppercase tracking-wider">
              Direction Financière & Comptabilité
            </span>
            <span className="text-xs text-slate-400">Rapports de Chiffre d'Affaires & Commissions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
            Comptabilité & Commissions de l'Agence
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Suivi en temps réel des commissions perçues sur les ventes de parcelles TF, des honoraires de gestion locative et du grand livre des dépenses d'exploitation.
          </p>
        </div>

        <button
          onClick={() => setIsAddingExpense(true)}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Enregistrer une Dépense</span>
        </button>
      </div>

      {/* 4 Main Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Chiffre d'Affaires Brut */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Revenus Bruts Commissions
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 font-heading">
              {formatFCFA(totalGrossAgencyRevenue)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Honoraires gestion + Ventes + Dossiers
            </p>
          </div>
        </div>

        {/* Card 2: Commissions Gestion Locative */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Commissions Locatives
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 font-heading">
              {formatFCFA(totalRentalCommissionsEarned)}
            </div>
            <p className="text-xs text-blue-600 font-semibold mt-1">
              {payouts.length} reversements traités
            </p>
          </div>
        </div>

        {/* Card 3: Total Dépenses Opérationnelles */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Dépenses Agence
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-rose-600 font-heading">
              {formatFCFA(totalExpenses)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Géomètres, publicité, visites
            </p>
          </div>
        </div>

        {/* Card 4: Bénéfice Net Agence */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Bénéfice Net Agence
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-white font-heading">
              {formatFCFA(netAgencyProfit)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Marge nette d'exploitation
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Revenues vs Expenses Visualizer (Recharts) */}
      <FinancialChart
        properties={properties}
        tenants={tenants}
        receipts={receipts}
        payouts={payouts}
        expenses={expenses}
        agencyConfig={agencyConfig}
      />

      {/* New Expense Modal/Section */}
      {isAddingExpense && (
        <form onSubmit={handleSaveExpense} className="bg-white rounded-2xl p-6 sm:p-8 border border-rose-300 shadow-md space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-lg text-slate-900 font-heading flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-rose-600" />
              <span>Saisie d'une Dépense d'Exploitation</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">Déductible du résultat comptable de l'agence</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Libellé de la Dépense *
              </label>
              <input
                type="text"
                value={expenseForm.title}
                onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                required
                placeholder="Ex: Frais géomètre bornage parcelle Kalaban"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Catégorie *
              </label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as AgencyExpense['category'] })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-bold"
              >
                <option value="geometre">Frais Géomètre & Bornage Cadastral</option>
                <option value="marketing">Publicité Facebook / WhatsApp / Affiches</option>
                <option value="carburant">Carburant & Transport Visites Terrain</option>
                <option value="juridique">Frais Juridiques & Conservation Foncière</option>
                <option value="salaires">Commissions Négociateurs & Salaires</option>
                <option value="bureau">Loyer Bureau, Électricité & Internet</option>
                <option value="divers">Divers Frais</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Montant en FCFA *
              </label>
              <input
                type="number"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Date de Paiement *
              </label>
              <input
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Mode de Paiement
              </label>
              <select
                value={expenseForm.paymentMethod}
                onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value as PaymentMethod })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-bold"
              >
                <option value="Espèces">Espèces (Caisse)</option>
                <option value="Orange Money">Orange Money</option>
                <option value="Moov Money">Moov Money</option>
                <option value="Virement Bancaire">Virement Bancaire</option>
                <option value="Chèque">Chèque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Numéro de Reçu / Pièce Justificative
              </label>
              <input
                type="text"
                value={expenseForm.receiptNumber}
                onChange={(e) => setExpenseForm({ ...expenseForm, receiptNumber: e.target.value })}
                placeholder="Ex: FACT-092 / OM-TX-88"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddingExpense(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md transition-all cursor-pointer"
            >
              Enregistrer la Dépense
            </button>
          </div>
        </form>
      )}

      {/* 2 Columns: Payment Channels & Expense Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Payment Channels Distribution */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <h3 className="font-extrabold text-base text-slate-900 font-heading">
              Flux par Canal de Paiement
            </h3>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-orange-950 block">Orange Money</span>
                <span className="text-[11px] text-orange-700">Paiements mobiles instantanés</span>
              </div>
              <span className="font-black text-sm text-orange-950 font-heading">
                {formatFCFA(orangeMoneyTotal)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-blue-950 block">Virements Bancaires</span>
                <span className="text-[11px] text-blue-700">BDM-SA, BOA, Ecobank</span>
              </div>
              <span className="font-black text-sm text-blue-950 font-heading">
                {formatFCFA(bankTransferTotal)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-950 block">Espèces / Guichet</span>
                <span className="text-[11px] text-slate-600">Reçus manuels délivrés</span>
              </div>
              <span className="font-black text-sm text-slate-950 font-heading">
                {formatFCFA(cashTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Expenses Ledger Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold text-base text-slate-900 font-heading">
                Journal des Dépenses d'Exploitation
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-semibold">{expenses.length} dépenses</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4 text-right">Montant</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {formatDate(expense.date)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {expense.title}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {getCategoryLabel(expense.category)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-rose-600 font-heading">
                      -{formatFCFA(expense.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {expense.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setExpenseToDelete(expense)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                        title="Supprimer cette dépense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Expense Deletion */}
      <ConfirmDeleteModal
        isOpen={!!expenseToDelete}
        title="Supprimer la dépense comptable"
        message="Êtes-vous sûr de vouloir supprimer définitivement cet enregistrement de dépense ? Cette action mettra à jour instantanément le solde et les bilans comptables de l'agence."
        itemName={expenseToDelete?.title}
        itemType="Dépense / Charge"
        details={
          expenseToDelete
            ? [
                { label: 'Intitulé', value: expenseToDelete.title },
                { label: 'Catégorie', value: getCategoryLabel(expenseToDelete.category) },
                { label: 'Montant décaissé', value: formatFCFA(expenseToDelete.amount) },
                { label: 'Date', value: formatDate(expenseToDelete.date) },
                { label: 'Mode de règlement', value: expenseToDelete.paymentMethod },
              ]
            : []
        }
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteExpense}
        onCancel={() => setExpenseToDelete(null)}
      />
    </div>
  );
};
