import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { closePaymentModal, openReceiptModal, addToast } from '../../store/uiSlice';
import { recordRentPayment } from '../../store/tenantsSlice';
import { PaymentMethod, RentPaymentType } from '../../types';
import { formatFCFA } from '../../utils/formatters';
import { 
  X, 
  Receipt, 
  DollarSign, 
  Smartphone, 
  Landmark, 
  Banknote, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  PieChart, 
  Split 
} from 'lucide-react';

export const RecordPaymentModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isPaymentModalOpen);
  const selectedTenantId = useAppSelector((state) => state.ui.paymentTenantId);
  const tenants = useAppSelector((state) => state.tenants.items);

  const tenant = tenants.find((t) => t.id === selectedTenantId);

  // Payment Mode: 'total' or 'partiel'
  const [paymentType, setPaymentType] = useState<RentPaymentType>('total');
  const [totalDue, setTotalDue] = useState<number>(tenant?.monthlyRent || 250000);
  const [amount, setAmount] = useState<number>(tenant?.monthlyRent || 250000);
  const [periodMonth, setPeriodMonth] = useState('Août 2024');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Orange Money');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('Loyer réglé sans réserve.');

  // Sync state when modal opens or tenant changes
  useEffect(() => {
    if (tenant && isOpen) {
      const initialDue = tenant.monthlyRent || 250000;
      setTotalDue(initialDue);
      setAmount(initialDue);
      setPaymentType('total');
      setNotes(`Règlement intégral du terme de ${periodMonth}.`);
    }
  }, [tenant?.id, isOpen]);

  // Handle mode toggle
  const handleModeChange = (type: RentPaymentType) => {
    setPaymentType(type);
    if (type === 'total') {
      setAmount(totalDue);
      setNotes(`Règlement intégral du loyer - ${periodMonth}.`);
    } else {
      // Default to 50% partial payment if not already partial
      const half = Math.round(totalDue / 2);
      setAmount(half);
      const remaining = Math.max(0, totalDue - half);
      setNotes(`Acompte partiel de loyer. Reliquat restant dû : ${formatFCFA(remaining)}.`);
    }
  };

  // Close with ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch(closePaymentModal());
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, dispatch]);

  if (!isOpen || !tenant) return null;

  const remainingBalance = Math.max(0, totalDue - amount);
  const isPartial = paymentType === 'partiel' || (remainingBalance > 0 && amount < totalDue);

  const handleApplyPreset = (percent: number) => {
    const calculated = Math.round((totalDue * percent) / 100);
    setAmount(calculated);
    const remaining = Math.max(0, totalDue - calculated);
    setNotes(`Acompte partiel (${percent}%). Reliquat restant : ${formatFCFA(remaining)}.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      dispatch(addToast({
        type: 'warning',
        message: 'Veuillez saisir un montant de loyer supérieur à 0.',
      }));
      return;
    }

    if (amount > totalDue && paymentType === 'partiel') {
      dispatch(addToast({
        type: 'warning',
        message: 'Le montant d\'un paiement partiel ne peut pas dépasser le loyer exigible.',
      }));
      return;
    }

    const payload = {
      tenantId: tenant.id,
      tenantName: tenant.name,
      propertyId: tenant.propertyId,
      propertyTitle: tenant.propertyTitle,
      amount: Number(amount),
      totalDue: Number(totalDue),
      remainingBalance: Number(remainingBalance),
      paymentType: isPartial ? ('partiel' as const) : ('total' as const),
      periodMonth,
      paymentMethod,
      transactionRef: transactionRef.trim() || undefined,
      notes: notes.trim(),
    };

    dispatch(recordRentPayment(payload));

    dispatch(addToast({
      type: 'success',
      message: isPartial 
        ? `Acompte partiel de ${formatFCFA(amount)} enregistré pour ${tenant.name} (Reliquat : ${formatFCFA(remainingBalance)}).`
        : `Paiement intégral de ${formatFCFA(amount)} enregistré pour ${tenant.name}.`,
    }));

    dispatch(closePaymentModal());
    dispatch(openReceiptModal());
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 flex items-start sm:items-center justify-center animate-fadeIn"
      onClick={() => dispatch(closePaymentModal())}
    >
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] sm:max-h-[90vh] flex flex-col"
        id="record-payment-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white flex items-center justify-between border-b border-emerald-800 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base font-heading">
                Encaisser un Loyer & Générer Quittance
              </h3>
              <p className="text-xs text-emerald-300 font-medium">
                Locataire : <span className="text-white font-bold">{tenant.name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => dispatch(closePaymentModal())}
            className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 hover:bg-rose-600 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Fermer la fenêtre (Échap)"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Fermer</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Tenant & Property Overview */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Bien loué :</span>
              <strong className="text-slate-900 text-right truncate max-w-[240px]">{tenant.propertyTitle}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Téléphone locataire :</span>
              <span className="font-mono font-bold text-slate-800">{tenant.phone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Loyer mensuel contractuel :</span>
              <strong className="text-emerald-700 font-bold font-heading">{formatFCFA(tenant.monthlyRent)}</strong>
            </div>
            {tenant.pendingBalance && tenant.pendingBalance > 0 ? (
              <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-amber-700">
                <span className="font-medium">Reliquat antérieur impayé :</span>
                <strong className="font-bold">{formatFCFA(tenant.pendingBalance)}</strong>
              </div>
            ) : null}
          </div>

          {/* PAYMENT MODE SELECTOR: TOTAL VS PARTIEL */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Mode de Règlement *
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                id="btn-payment-mode-total"
                onClick={() => handleModeChange('total')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentType === 'total'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Paiement Total (100%)</span>
              </button>

              <button
                type="button"
                id="btn-payment-mode-partiel"
                onClick={() => handleModeChange('partiel')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentType === 'partiel'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Split className="w-4 h-4" />
                <span>Paiement Partiel (Acompte)</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC AMOUNTS SECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Total Exigible */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Loyer Total Exigible (FCFA) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={totalDue === 0 ? '' : totalDue}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setTotalDue(val);
                  if (paymentType === 'total') setAmount(val);
                }}
                className="w-full px-3 py-2.5 text-sm font-extrabold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Amount Paid */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                {paymentType === 'partiel' ? 'Montant Encaissé (Acompte FCFA) *' : 'Montant Encaissé (FCFA) *'}
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={amount === 0 ? '' : amount}
                placeholder="Montant versé"
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setAmount(val);
                  if (val < totalDue) {
                    setPaymentType('partiel');
                  }
                }}
                className={`w-full px-3 py-2.5 text-base font-black rounded-xl border focus:ring-2 focus:outline-none transition-all ${
                  paymentType === 'partiel'
                    ? 'bg-amber-50 border-amber-400 text-amber-950 focus:ring-amber-500'
                    : 'bg-emerald-50/70 border-emerald-400 text-emerald-950 focus:ring-emerald-500'
                }`}
              />
            </div>
          </div>

          {/* PARTIAL PAYMENT PRESETS & RELIQUAT CARD */}
          {paymentType === 'partiel' && (
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Raccourcis Acompte :</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(25)}
                    className="px-2 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(50)}
                    className="px-2 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                  >
                    50% (Moitié)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(75)}
                    className="px-2 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                  >
                    75%
                  </button>
                </div>
              </div>

              {/* Remaining Balance Summary */}
              <div className="p-2.5 bg-white rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Reliquat Restant Dû :
                  </span>
                  <span className="text-base font-extrabold text-rose-600 font-heading">
                    {formatFCFA(remainingBalance)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-black uppercase">
                    Paiement Partiel
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {Math.round((amount / (totalDue || 1)) * 100)}% encaissé
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-amber-800 leading-snug">
                ℹ️ La quittance indiquera clairement qu'il s'agit d'un <strong>acompte de {formatFCFA(amount)}</strong> avec un <strong>reliquat restant exigible de {formatFCFA(remainingBalance)}</strong>.
              </p>
            </div>
          )}

          {/* Period Month */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Mois / Période de Loyer *
            </label>
            <input
              type="text"
              required
              placeholder="Ex : Août 2024, Septembre 2024..."
              value={periodMonth}
              onChange={(e) => setPeriodMonth(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Mode de Règlement (Mali) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('Orange Money')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'Orange Money'
                    ? 'bg-orange-50 border-orange-500 text-orange-950 shadow-xs ring-1 ring-orange-400'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-4 h-4 text-orange-600 shrink-0" />
                <span className="truncate">Orange Money</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Moov Money')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'Moov Money'
                    ? 'bg-blue-50 border-blue-500 text-blue-950 shadow-xs ring-1 ring-blue-400'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">Moov Money</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Wave')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'Wave'
                    ? 'bg-sky-50 border-sky-500 text-sky-950 shadow-xs ring-1 ring-sky-400'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="truncate">Wave Mali</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Espèces')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'Espèces'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs ring-1 ring-emerald-400'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Espèces / Guichet</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Virement Bancaire')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'Virement Bancaire'
                    ? 'bg-purple-50 border-purple-500 text-purple-950 shadow-xs ring-1 ring-purple-400'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Landmark className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="truncate">Virement Bancaire</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Chèque')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'Chèque'
                    ? 'bg-slate-200 border-slate-600 text-slate-950 shadow-xs ring-1 ring-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-4 h-4 text-slate-700 shrink-0" />
                <span className="truncate">Chèque</span>
              </button>
            </div>
          </div>

          {/* Reference OM / Cheque */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              N° de Transaction / Réf Reçu Orange Money / N° Chèque
            </label>
            <input
              type="text"
              placeholder="Ex : OM-2408-98442 ou CI-BDM-0081"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Mention sur la Quittance
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => dispatch(closePaymentModal())}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              className={`px-5 py-2.5 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                isPartial
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isPartial ? 'Valider Acompte Partiel & Quittance' : 'Valider Paiement Intégral & Quittance'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

