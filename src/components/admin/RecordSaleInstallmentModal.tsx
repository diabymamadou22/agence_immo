import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  closeRecordSaleInstallmentModal, 
  openSaleInstallmentReceiptModal, 
  openSaleReceiptModal,
  addToast 
} from '../../store/uiSlice';
import { recordSaleInstallment, setActiveInstallmentForPrint, setActiveReceiptForPrint } from '../../store/salesSlice';
import { updatePropertyStatus } from '../../store/propertiesSlice';
import { firestoreService } from '../../services/firestoreService';
import { SaleReceipt, PaymentMethod } from '../../types';
import { formatFCFA, formatDate, formatAmountInFrenchWords } from '../../utils/formatters';
import { 
  X, 
  Coins, 
  Printer, 
  Building2, 
  Layers, 
  User, 
  Calendar, 
  ShieldCheck, 
  FileText, 
  CreditCard,
  MapPin,
  CheckCircle,
  AlertCircle,
  TrendingDown,
  Percent,
  Check
} from 'lucide-react';

const PAYMENT_METHODS: PaymentMethod[] = [
  'Orange Money',
  'Wave',
  'Moov Money',
  'Virement Bancaire',
  'Chèque',
  'Espèces',
];

export const RecordSaleInstallmentModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isRecordSaleInstallmentModalOpen);
  const selectedSaleFromState = useAppSelector((state) => state.ui.selectedSaleForInstallment);
  const allSales = useAppSelector((state) => state.sales.items);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  // Sales eligible for installment (having remaining balance > 0)
  const salesWithBalance = allSales.filter((s) => {
    const rem = Number(s.remainingBalance ?? (Number(s.totalAgreedPrice || 0) - Number(s.amountPaid || 0)));
    return rem > 0 && s.status !== 'annule';
  });

  const [selectedSaleId, setSelectedSaleId] = useState<string>('');
  const [installmentAmount, setInstallmentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Orange Money');
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [issuedBy, setIssuedBy] = useState<string>('Service Comptabilité & Foncier');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Current selected sale
  const activeSale: SaleReceipt | undefined = allSales.find((s) => s.id === selectedSaleId) || selectedSaleFromState || undefined;

  // Initialize or update selection when modal opens
  useEffect(() => {
    if (isOpen) {
      if (selectedSaleFromState && selectedSaleFromState.id) {
        setSelectedSaleId(selectedSaleFromState.id);
        const suggested = selectedSaleFromState.remainingBalance > 0 ? selectedSaleFromState.remainingBalance : 0;
        setInstallmentAmount(suggested);
      } else if (salesWithBalance.length > 0) {
        const first = salesWithBalance[0];
        setSelectedSaleId(first.id);
        setInstallmentAmount(first.remainingBalance);
      } else {
        setSelectedSaleId('');
        setInstallmentAmount(0);
      }
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('Orange Money');
      setTransactionReference('');
      setIssuedBy(agencyConfig?.name ? `${agencyConfig.name} - Caisse` : 'Service Caisse & Recouvrement');
      setNotes('');
    }
  }, [isOpen, selectedSaleFromState, salesWithBalance.length]);

  if (!isOpen) return null;

  const currentRemaining = activeSale 
    ? (Number(activeSale.remainingBalance) ?? Math.max(0, Number(activeSale.totalAgreedPrice || 0) - Number(activeSale.amountPaid || 0))) 
    : 0;
  const currentTotal = activeSale ? Number(activeSale.totalAgreedPrice) || 0 : 0;
  const currentPaid = activeSale ? Number(activeSale.amountPaid) || 0 : 0;
  const currentPaidPercentage = currentTotal > 0 ? Math.round((currentPaid / currentTotal) * 100) : 0;

  const validAmount = Math.min(Math.max(0, Number(installmentAmount) || 0), currentRemaining);
  const remainingAfterPayment = Math.max(0, currentRemaining - validAmount);
  const newTotalPaid = currentPaid + validAmount;
  const newPaidPercentage = currentTotal > 0 ? Math.round((newTotalPaid / currentTotal) * 100) : 0;
  const willBeFullyPaid = remainingAfterPayment === 0 && validAmount > 0;

  // Quick percentage presets based on remaining balance
  const setPresetAmount = (percentage: number) => {
    if (!currentRemaining) return;
    if (percentage === 100) {
      setInstallmentAmount(currentRemaining);
    } else {
      const calculated = Math.round((currentRemaining * percentage) / 100);
      setInstallmentAmount(calculated);
    }
  };

  const handleSaleChange = (id: string) => {
    setSelectedSaleId(id);
    const sale = allSales.find((s) => s.id === id);
    if (sale) {
      setInstallmentAmount(sale.remainingBalance);
    }
  };

  const handleClose = () => {
    dispatch(closeRecordSaleInstallmentModal());
  };

  const handleSubmit = async (andPrint: 'installment' | 'full' | 'none' = 'none') => {
    if (!activeSale) {
      alert('Veuillez sélectionner un dossier de vente valide.');
      return;
    }

    if (validAmount <= 0) {
      alert('Veuillez saisir un montant de versement supérieur à 0 FCFA.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Dispatch Redux action
      dispatch(
        recordSaleInstallment({
          saleId: activeSale.id,
          amount: validAmount,
          paymentDate,
          paymentMethod,
          transactionReference: transactionReference.trim() || undefined,
          issuedBy: issuedBy.trim() || 'Service Commercial',
          notes: notes.trim() || `Versement partiel tranche de ${formatFCFA(validAmount)}`,
        })
      );

      // 2. Prepare the updated sale object for Firestore
      const nextAmountPaid = currentPaid + validAmount;
      const nextRemaining = remainingAfterPayment;
      const trancheCount = (activeSale.installments?.length || 0) + 1;
      const trancheReceiptNum = `TRANCHE-${String(trancheCount).padStart(2, '0')}-${activeSale.receiptNumber}`;

      const newTrancheObj = {
        id: `inst-${Date.now()}`,
        installmentNumber: trancheCount,
        receiptNumber: trancheReceiptNum,
        paymentDate,
        amount: validAmount,
        paymentMethod,
        transactionReference: transactionReference.trim() || undefined,
        previousBalance: currentRemaining,
        remainingBalanceAfter: nextRemaining,
        issuedBy: issuedBy.trim() || 'Service Commercial',
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      const updatedSale: SaleReceipt = {
        ...activeSale,
        amountPaid: nextAmountPaid,
        remainingBalance: nextRemaining,
        operationType: nextRemaining === 0 ? 'solde' : 'versement_echelonne',
        installments: [...(activeSale.installments || []), newTrancheObj],
      };

      // 3. Save to Firestore
      await firestoreService.saveSaleReceipt(updatedSale);

      // 4. If fully paid and property is reserved, update property to 'vendu'
      if (willBeFullyPaid && activeSale.propertyId) {
        dispatch(updatePropertyStatus({ id: activeSale.propertyId, status: 'vendu' }));
        try {
          await firestoreService.updatePropertyStatus(activeSale.propertyId, 'vendu');
        } catch (err) {
          console.warn('Property status update fallback:', err);
        }
      }

      dispatch(
        addToast({
          type: 'success',
          message: willBeFullyPaid 
            ? `Vente intégralement SOLDÉE ! Versement de ${formatFCFA(validAmount)} enregistré.`
            : `Tranche de ${formatFCFA(validAmount)} enregistrée avec succès. Solde restant : ${formatFCFA(nextRemaining)}.`,
        })
      );

      // 5. Trigger print view if requested
      if (andPrint === 'installment') {
        dispatch(setActiveInstallmentForPrint({ sale: updatedSale, installment: newTrancheObj }));
        dispatch(openSaleInstallmentReceiptModal());
      } else if (andPrint === 'full') {
        dispatch(setActiveReceiptForPrint(updatedSale));
        dispatch(openSaleReceiptModal());
      }

      dispatch(closeRecordSaleInstallmentModal());
    } catch (error) {
      console.error('Error recording sale installment:', error);
      dispatch(
        addToast({
          type: 'error',
          message: 'Erreur lors de l\'enregistrement du versement.',
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <Coins className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Encaisser un Versement Partiel / Tranche</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  Reliquat Vente
                </span>
              </h2>
              <p className="text-xs text-amber-100/90 font-medium">
                Enregistrement de paiement partiel ou règlement final du solde restant dû
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Sale Dossier Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase text-slate-700 tracking-wider">
              Dossier de Vente / Bien Concerné <span className="text-rose-500">*</span>
            </label>
            {salesWithBalance.length === 0 && !activeSale ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs">Aucune vente avec solde restant dû trouvée.</p>
                  <p className="text-[11px] text-amber-800 pt-0.5">
                    Toutes les ventes enregistrées sont déjà intégralement payées ou aucun acte de vente avec facilités de paiement n'a été créé.
                  </p>
                </div>
              </div>
            ) : (
              <select
                value={selectedSaleId}
                onChange={(e) => handleSaleChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all text-xs sm:text-sm shadow-2xs"
              >
                {salesWithBalance.map((sale) => (
                  <option key={sale.id} value={sale.id}>
                    {sale.receiptNumber} — {sale.buyerName} — {sale.propertyTitle} (Reste : {formatFCFA(sale.remainingBalance)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Active Sale Overview Card */}
          {activeSale && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 relative overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-2.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    {activeSale.propertyType === 'parcelle' ? (
                      <Layers className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Building2 className="w-4 h-4 text-blue-600" />
                    )}
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      {activeSale.propertyTitle}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{activeSale.neighborhood}, {activeSale.city}</span>
                    {activeSale.lotNumber && <span>• Lot : {activeSale.lotNumber}</span>}
                    {activeSale.documentNumber && <span>• {activeSale.documentNumber}</span>}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-500 block">Acte N°</span>
                  <span className="font-mono font-bold text-xs text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                    {activeSale.receiptNumber}
                  </span>
                </div>
              </div>

              {/* Buyer Info */}
              <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-black flex items-center justify-center text-xs">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">{activeSale.buyerName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{activeSale.buyerPhone}</span>
                  </div>
                </div>
                {activeSale.buyerNinaOrId && (
                  <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {activeSale.buyerNinaOrId}
                  </span>
                )}
              </div>

              {/* Financial Progress Tracker */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Prix Convenu</span>
                    <span className="font-black text-slate-900 text-xs sm:text-sm">
                      {formatFCFA(currentTotal)}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="text-[9px] uppercase font-bold text-emerald-700 block">Déjà Versé</span>
                    <span className="font-black text-emerald-800 text-xs sm:text-sm">
                      {formatFCFA(currentPaid)}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                    <span className="text-[9px] uppercase font-bold text-rose-700 block">Solde Restant Dû</span>
                    <span className="font-black text-rose-800 text-xs sm:text-sm">
                      {formatFCFA(currentRemaining)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-600">
                    <span>Avancement des paiements</span>
                    <span>{currentPaidPercentage}% payé</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-300" 
                      style={{ width: `${currentPaidPercentage}%` }} 
                    />
                    {validAmount > 0 && (
                      <div 
                        className="bg-amber-400 h-full transition-all duration-300 animate-pulse" 
                        style={{ width: `${Math.min(100 - currentPaidPercentage, (validAmount / currentTotal) * 100)}%` }} 
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Amount & Preset Shortcuts */}
          <div className="space-y-2 p-4 rounded-xl bg-amber-50/50 border border-amber-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-amber-950 tracking-wider flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-700" />
                Montant de cette Tranche / Versement (FCFA) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                Max : {formatFCFA(currentRemaining)}
              </span>
            </div>

            {/* Quick buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPresetAmount(25)}
                className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-100 text-amber-950 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Percent className="w-3 h-3 text-amber-600" />
                <span>25% du solde</span>
              </button>
              <button
                type="button"
                onClick={() => setPresetAmount(50)}
                className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-100 text-amber-950 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Percent className="w-3 h-3 text-amber-600" />
                <span>50% du solde</span>
              </button>
              <button
                type="button"
                onClick={() => setPresetAmount(100)}
                className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
              >
                <Check className="w-3 h-3 text-white" />
                <span>Payer Tout le Solde (100%)</span>
              </button>
            </div>

            {/* Number Input */}
            <div className="relative pt-1">
              <input
                type="number"
                min={0}
                max={currentRemaining}
                step={50000}
                value={installmentAmount || ''}
                onChange={(e) => setInstallmentAmount(Number(e.target.value))}
                placeholder="Ex: 5000000"
                className="w-full px-3 py-2.5 rounded-xl border border-amber-300 bg-white font-mono font-black text-slate-950 text-base sm:text-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all shadow-2xs pr-16"
              />
              <span className="absolute right-3 top-3.5 text-xs font-black text-amber-700 font-mono pointer-events-none">
                FCFA
              </span>
            </div>

            {/* In Words */}
            {validAmount > 0 && (
              <p className="text-[11px] text-amber-900 italic bg-amber-100/70 p-2 rounded-lg border border-amber-200">
                « {formatAmountInFrenchWords(validAmount)} »
              </p>
            )}

            {/* Real-time simulation of impact */}
            <div className="pt-2 border-t border-amber-200/80">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-600 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                  Nouveau solde restant après ce paiement :
                </span>
                <span className={`font-black text-xs sm:text-sm font-mono ${remainingAfterPayment === 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {formatFCFA(remainingAfterPayment)}
                </span>
              </div>

              {willBeFullyPaid ? (
                <div className="mt-2 p-2 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Félicitations ! Ce versement solde INTÉGRALEMENT la vente (Statut : VENDU).</span>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 mt-1">
                  Nouveau taux d'acquittement : <strong>{newPaidPercentage}%</strong> du prix total convenu.
                </p>
              )}
            </div>
          </div>

          {/* Payment Method, Date, Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase">
                Mode de Paiement <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase">
                Date du Versement <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
              >
              </input>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase">
                Référence Transaction / N° Chèque / TxID
              </label>
              <input
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="Ex: OM-BKO-994102 ou CHQ-BMS-0044"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase">
                Agent Encaisseur / Caissier
              </label>
              <input
                type="text"
                value={issuedBy}
                onChange={(e) => setIssuedBy(e.target.value)}
                placeholder="Ex: Caisse Centrale Mali Immo"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
              />
            </div>
          </div>

          {/* Observations / Notes */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 uppercase">
              Observations / Précisions Contractuelles
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: 2ème tranche convenue lors du compromis, versée par virement."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
            />
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting || validAmount <= 0 || !activeSale}
              onClick={() => handleSubmit('none')}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Enregistrer Uniquement</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting || validAmount <= 0 || !activeSale}
              onClick={() => handleSubmit('installment')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-black transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Enregistrer & Imprimer Quittance</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RecordSaleInstallmentModal;
