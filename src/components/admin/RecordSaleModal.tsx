import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { closeRecordSaleModal, openSaleReceiptModal, addToast } from '../../store/uiSlice';
import { addSaleReceipt, setActiveReceiptForPrint } from '../../store/salesSlice';
import { updatePropertyStatus } from '../../store/propertiesSlice';
import { firestoreService } from '../../services/firestoreService';
import { Property, PaymentMethod, SaleOperationType } from '../../types';
import { formatFCFA, getDocumentBadgeInfo } from '../../utils/formatters';
import { 
  X, 
  Receipt, 
  Printer, 
  Building2, 
  Layers, 
  User, 
  DollarSign, 
  Calendar, 
  ShieldCheck, 
  FileText, 
  CreditCard,
  MapPin,
  Check
} from 'lucide-react';

const PAYMENT_METHODS: PaymentMethod[] = [
  'Virement Bancaire',
  'Chèque',
  'Espèces',
  'Orange Money',
  'Wave',
  'Moov Money',
];

export const RecordSaleModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isRecordSaleModalOpen);
  const properties = useAppSelector((state) => state.properties.items);
  const selectedPropFromState = useAppSelector((state) => state.sales.selectedPropertyForSale);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  // Filter properties available or sold
  const saleProperties = properties.filter(
    (p) => p.dealType === 'vente' || p.propertyType === 'parcelle'
  );

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [operationType, setOperationType] = useState<SaleOperationType>('vente_totale');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Client Info (Full Buyer Information)
  const [buyerName, setBuyerName] = useState<string>('');
  const [buyerPhone, setBuyerPhone] = useState<string>('');
  const [buyerNinaOrId, setBuyerNinaOrId] = useState<string>('');
  const [buyerAddress, setBuyerAddress] = useState<string>('');
  const [buyerEmail, setBuyerEmail] = useState<string>('');
  const [buyerProfession, setBuyerProfession] = useState<string>('');
  const [buyerNationality, setBuyerNationality] = useState<string>('Malienne');

  // Financials
  const [totalAgreedPrice, setTotalAgreedPrice] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Virement Bancaire');
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [notaryOffice, setNotaryOffice] = useState<string>('Étude Notariale Me Aminata Cissé, Notaire à Bamako');
  const [issuedBy, setIssuedBy] = useState<string>('Direction Commerciale');
  const [notes, setNotes] = useState<string>('');
  const [updatePropStatus, setUpdatePropStatus] = useState<boolean>(true);

  // Sync selected property from state or dropdown
  useEffect(() => {
    if (selectedPropFromState) {
      setSelectedPropertyId(selectedPropFromState.id);
      setTotalAgreedPrice(selectedPropFromState.price || 0);
      setAmountPaid(selectedPropFromState.price || 0);
    } else if (saleProperties.length > 0 && !selectedPropertyId) {
      const first = saleProperties[0];
      setSelectedPropertyId(first.id);
      setTotalAgreedPrice(first.price || 0);
      setAmountPaid(first.price || 0);
    }
  }, [selectedPropFromState, isOpen]);

  const currentProperty = properties.find((p) => p.id === selectedPropertyId);

  // Update prices when property selection changes
  const handlePropertyChange = (propId: string) => {
    setSelectedPropertyId(propId);
    const prop = properties.find((p) => p.id === propId);
    if (prop) {
      setTotalAgreedPrice(prop.price || 0);
      setAmountPaid(prop.price || 0);
    }
  };

  // Adjust paid amount if operation type changes
  const handleOperationTypeChange = (type: SaleOperationType) => {
    setOperationType(type);
    if (type === 'vente_totale') {
      setAmountPaid(totalAgreedPrice);
    } else if (type === 'acompte' && amountPaid === totalAgreedPrice) {
      setAmountPaid(Math.round(totalAgreedPrice * 0.3)); // 30% default advance
    }
  };

  // Close with ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch(closeRecordSaleModal());
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  const remainingBalance = Math.max(0, totalAgreedPrice - amountPaid);

  const handleSubmit = async (andPrint: boolean) => {
    if (!buyerName.trim()) {
      dispatch(addToast({ type: 'warning', message: 'Veuillez saisir le nom et prénoms de l\'acquéreur.' }));
      return;
    }
    if (!buyerPhone.trim()) {
      dispatch(addToast({ type: 'warning', message: 'Veuillez renseigner le téléphone de contact du client.' }));
      return;
    }
    if (amountPaid <= 0) {
      dispatch(addToast({ type: 'warning', message: 'Le montant versé doit être supérieur à zéro.' }));
      return;
    }

    const prop = currentProperty;

    const newSaleData = {
      saleDate,
      operationType,
      propertyId: prop?.id || `prop-${Date.now()}`,
      propertyReference: prop?.reference || `REF-${Date.now()}`,
      propertyTitle: prop?.title || 'Bien Immobilier / Foncier',
      propertyType: prop?.propertyType || 'parcelle',
      city: prop?.city || 'Bamako',
      commune: prop?.commune || 'Commune V',
      neighborhood: prop?.neighborhood || 'Bamako',
      address: prop?.address || prop?.landmark || '',
      surface: prop?.surface || 300,
      dimensions: prop?.dimensions || '',
      lotissement: prop?.lotissement || '',
      section: prop?.section || '',
      lotNumber: prop?.lotNumber || '',
      ilotNumber: prop?.ilotNumber || '',
      doorNumber: prop?.address?.includes('Porte') ? prop.address : '',
      buildingFloor: '',
      documentType: prop?.documentType || 'titre_foncier',
      documentNumber: prop?.documentNumber || '',
      
      // Client Details
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      buyerNinaOrId: buyerNinaOrId.trim() || 'NINA Non communiqué',
      buyerAddress: buyerAddress.trim() || 'Bamako, Mali',
      buyerEmail: buyerEmail.trim(),
      buyerProfession: buyerProfession.trim() || 'Particulier',
      buyerNationality: buyerNationality.trim() || 'Malienne',
      
      sellerName: agencyConfig.name,
      sellerPhone: agencyConfig.phoneDisplay,
      
      totalAgreedPrice,
      amountPaid,
      remainingBalance,
      paymentMethod,
      transactionReference: transactionReference.trim() || undefined,
      notaryOffice: notaryOffice.trim() || undefined,
      issuedBy: issuedBy.trim() || 'Service Commercial',
      status: 'valide' as const,
      notes: notes.trim() || undefined,
      clauses: [
        'Le présent reçu atteste de la réception effective du paiement mentionné pour l\'acquisition du bien immobilier.',
        'La délivrance de la quittance engage les parties dans les termes du compromis ou de l\'acte authentique de vente.',
        'Les formalités de mutation et de transfert du Titre Foncier sont effectuées sous le contrôle du Notaire instrumentaire.'
      ],
    };

    const saleId = `sale-rec-${Date.now()}`;
    const year = new Date().getFullYear();
    const receiptNum = `RECU-VTE-${year}-${Math.floor(100 + Math.random() * 900)}`;
    const fullSaleData: any = {
      ...newSaleData,
      id: saleId,
      receiptNumber: receiptNum,
      createdAt: new Date().toISOString(),
    };

    // Add to Redux state (syncMiddleware will also ensure cloud sync)
    dispatch(addSaleReceipt(fullSaleData));

    // Update Property status to 'vendu' or 'reserve'
    if (updatePropStatus && prop) {
      const newStatus = operationType === 'vente_totale' || remainingBalance === 0 ? 'vendu' : 'reserve';
      dispatch(updatePropertyStatus({ id: prop.id, status: newStatus }));
      
      // Update in Firestore
      if (firestoreService.isLive()) {
        firestoreService.saveProperty({
          ...prop,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Save receipt to Firestore if live
    if (firestoreService.isLive()) {
      firestoreService.saveSaleReceipt(fullSaleData);
    }

    dispatch(addToast({
      type: 'success',
      message: `Reçu de vente émis pour ${buyerName} avec succès.`,
    }));

    dispatch(closeRecordSaleModal());

    if (andPrint) {
      dispatch(openSaleReceiptModal());
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 flex items-start sm:items-center justify-center animate-fadeIn"
      onClick={() => dispatch(closeRecordSaleModal())}
    >
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[94vh] sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg font-heading text-white">
                Émettre un Reçu de Vente Immobilière
              </h3>
              <p className="text-xs text-slate-400">
                Génération de quittance officielle pour vente de Parcelle ou Appartement
              </p>
            </div>
          </div>

          <button
            onClick={() => dispatch(closeRecordSaleModal())}
            className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-rose-600 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Fermer la fenêtre (Échap)"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Fermer</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* 1. Property / Parcel Selection */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>Sélectionner le Bien Vendu (Parcelle / Appartement)</span>
              </label>
              {currentProperty && (
                <span className="text-[11px] font-mono font-bold text-slate-500">
                  {currentProperty.reference}
                </span>
              )}
            </div>

            <select
              value={selectedPropertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 text-slate-900 font-bold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {saleProperties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.propertyType === 'parcelle' ? '📍 [PARCELLE]' : '🏢 [APPART/BÂTI]'} {p.title} - {formatFCFA(p.price)} ({p.neighborhood}, {p.city})
                </option>
              ))}
            </select>

            {currentProperty && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] text-slate-600">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Type</span>
                  <span className="font-black text-slate-900 capitalize">{currentProperty.propertyType}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Superficie</span>
                  <span className="font-black text-slate-900">{currentProperty.surface} m²</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Document</span>
                  <span className="font-bold text-amber-800 truncate block">{currentProperty.documentNumber || currentProperty.documentType}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Prix Catalogue</span>
                  <span className="font-black text-slate-900">{formatFCFA(currentProperty.price)}</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Full Buyer / Client Information */}
          <div className="space-y-4 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/70">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-700" />
                <span>Informations Complètes du Client Acquéreur</span>
              </span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                Figurera sur le reçu imprimé
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Nom et Prénoms du Client *</label>
                <input
                  type="text"
                  placeholder="Ex: M. Oumar Traoré / Mme Fatou Diarra"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Numéro de Téléphone *</label>
                <input
                  type="tel"
                  placeholder="Ex: +223 76 00 11 22"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">N° NINA / CNIB / Passeport</label>
                <input
                  type="text"
                  placeholder="Ex: 1 85 11 650 081 44M (NINA)"
                  value={buyerNinaOrId}
                  onChange={(e) => setBuyerNinaOrId(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Adresse de Résidence</label>
                <input
                  type="text"
                  placeholder="Ex: Hamdallaye ACI 2000, Bamako"
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Email de Contact</label>
                <input
                  type="email"
                  placeholder="Ex: client@gmail.com"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Profession</label>
                  <input
                    type="text"
                    placeholder="Ex: Ingénieur, Cadre"
                    value={buyerProfession}
                    onChange={(e) => setBuyerProfession(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Nationalité</label>
                  <input
                    type="text"
                    placeholder="Ex: Malienne"
                    value={buyerNationality}
                    onChange={(e) => setBuyerNationality(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Transaction & Financials */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Conditions Financières & Règlement</span>
            </span>

            {/* Operation Type Radios */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { id: 'vente_totale', label: 'Vente Totale' },
                { id: 'acompte', label: 'Acompte' },
                { id: 'solde', label: 'Solde Final' },
                { id: 'versement_echelonne', label: 'Échelonné' },
              ].map((op) => (
                <button
                  type="button"
                  key={op.id}
                  onClick={() => handleOperationTypeChange(op.id as SaleOperationType)}
                  className={`py-2 px-3 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                    operationType === op.id
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Prix Total Convenu (FCFA) *</label>
                <input
                  type="number"
                  value={totalAgreedPrice || ''}
                  onChange={(e) => setTotalAgreedPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 font-black text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-emerald-800">Montant Versé ce Jour (FCFA) *</label>
                <input
                  type="number"
                  value={amountPaid || ''}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-emerald-400 text-emerald-950 font-black text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">Solde Restant Dû (FCFA)</label>
                <div className="w-full px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 text-slate-900 font-black text-sm font-mono flex items-center">
                  {formatFCFA(remainingBalance)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Mode de Paiement</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Réf. Chèque / Transaction</label>
                <input
                  type="text"
                  placeholder="Ex: VIR-BDM-98762"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Date du Règlement</label>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 4. Notary & Legal details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Étude Notariale (Optionnel)</label>
              <input
                type="text"
                value={notaryOffice}
                onChange={(e) => setNotaryOffice(e.target.value)}
                placeholder="Ex: Étude Me Mamadou Diaby, Notaire à Bamako"
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Gestionnaire / Agent Émetteur</label>
              <input
                type="text"
                value={issuedBy}
                onChange={(e) => setIssuedBy(e.target.value)}
                placeholder="Ex: Direction Commerciale Mali Immo"
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Auto status update checkbox */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-3">
            <input
              type="checkbox"
              id="updateStatusCheck"
              checked={updatePropStatus}
              onChange={(e) => setUpdatePropStatus(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="updateStatusCheck" className="text-xs text-amber-950 font-bold cursor-pointer">
              Marquer automatiquement le bien comme <strong>{remainingBalance === 0 ? '« Vendu »' : '« Réservé »'}</strong> dans le catalogue
            </label>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => dispatch(closeRecordSaleModal())}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            Annuler
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Enregistrer
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Enregistrer & Imprimer le Reçu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
