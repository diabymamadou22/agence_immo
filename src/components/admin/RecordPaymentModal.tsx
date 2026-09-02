import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { closePaymentModal, openReceiptModal, addToast } from '../../store/uiSlice';
import { recordRentPayment, setActiveReceiptForPrint } from '../../store/tenantsSlice';
import { PaymentMethod } from '../../types';
import { formatFCFA } from '../../utils/formatters';
import { X, Receipt, DollarSign, Smartphone, Landmark, Banknote, Calendar, CheckCircle2 } from 'lucide-react';

export const RecordPaymentModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isPaymentModalOpen);
  const selectedTenantId = useAppSelector((state) => state.ui.paymentTenantId);
  const tenants = useAppSelector((state) => state.tenants.items);

  const tenant = tenants.find((t) => t.id === selectedTenantId);

  const [amount, setAmount] = useState<number>(tenant?.monthlyRent || 250000);
  const [periodMonth, setPeriodMonth] = useState('Août 2024');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('orange_money');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('Loyer réglé sans réserve.');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      dispatch(addToast({
        type: 'warning',
        message: 'Veuillez saisir un montant de loyer valide.',
      }));
      return;
    }

    const payload = {
      tenantId: tenant.id,
      tenantName: tenant.name,
      propertyId: tenant.propertyId,
      propertyTitle: tenant.propertyTitle,
      amount: Number(amount),
      periodMonth,
      paymentMethod,
      transactionRef: transactionRef.trim() || undefined,
      notes,
    };

    dispatch(recordRentPayment(payload));

    dispatch(addToast({
      type: 'success',
      message: `Paiement de ${formatFCFA(amount)} enregistré pour ${tenant.name}.`,
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
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex items-center justify-between border-b border-emerald-800 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base font-heading">
                Encaisser un Loyer & Générer Quittance
              </h3>
              <p className="text-xs text-emerald-200">
                Locataire : {tenant.name}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Tenant & Property Overview */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Bien loué :</span>
              <strong className="text-slate-900">{tenant.propertyTitle}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Téléphone locataire :</span>
              <span className="font-mono font-bold text-slate-800">{tenant.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Loyer contractuel :</span>
              <strong className="text-emerald-700 font-bold">{formatFCFA(tenant.monthlyRent)}</strong>
            </div>
          </div>

          {/* Amount Paid in FCFA */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Montant Encaissé (FCFA) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="any"
              value={amount === 0 ? '' : amount}
              placeholder="Montant FCFA"
              onChange={(e) => {
                const val = e.target.value;
                setAmount(val === '' ? 0 : parseFloat(val) || 0);
              }}
              className="w-full px-3 py-2.5 text-base font-extrabold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

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
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('orange_money')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'orange_money'
                    ? 'bg-orange-50 border-orange-500 text-orange-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-4 h-4 text-orange-600" />
                <span>Orange Money</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('moov_money')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'moov_money'
                    ? 'bg-blue-50 border-blue-500 text-blue-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>Moov Money</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('virement')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'virement'
                    ? 'bg-purple-50 border-purple-500 text-purple-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Landmark className="w-4 h-4 text-purple-600" />
                <span>Virement Bancaire</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('especes')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'especes'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Espèces / Guichet</span>
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
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => dispatch(closePaymentModal())}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Valider & Générer Quittance</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
