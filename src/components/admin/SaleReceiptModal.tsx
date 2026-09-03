import React, { useRef, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { closeSaleReceiptModal, addToast } from '../../store/uiSlice';
import { 
  formatFCFA, 
  formatDate, 
  formatAmountInFrenchWords,
  formatSurface,
  getDocumentBadgeInfo,
  getSaleOperationLabel,
  getPropertyTypeLabel
} from '../../utils/formatters';
import { printElement } from '../../utils/printUtils';
import { sendSaleReceiptWhatsApp } from '../../utils/whatsappUtils';
import { downloadElementAsPdf } from '../../utils/pdfExport';
import { 
  X, 
  Printer, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  MapPin, 
  User, 
  FileText, 
  Receipt, 
  Layers, 
  Calendar, 
  DollarSign, 
  QrCode,
  Phone,
  Mail,
  BadgeCheck,
  LogOut,
  MessageCircle,
  Download,
  Loader2
} from 'lucide-react';

export const SaleReceiptModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isSaleReceiptModalOpen);
  const activeReceipt = useAppSelector((state) => state.sales.activeReceiptForPrint);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Close with ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch(closeSaleReceiptModal());
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, dispatch]);

  if (!isOpen || !activeReceipt) return null;

  const handleClose = () => {
    dispatch(closeSaleReceiptModal());
  };

  const handlePrint = () => {
    const title = `Recu_Vente_${activeReceipt.receiptNumber}_${activeReceipt.buyerName.replace(/\s+/g, '_')}`;
    if (printRef.current) {
      printElement(printRef.current, title);
    } else {
      printElement('printable-sale-receipt', title);
    }
  };

  const handleWhatsAppShare = () => {
    sendSaleReceiptWhatsApp(activeReceipt, agencyConfig);
    dispatch(addToast({
      type: 'success',
      message: 'Discussion WhatsApp ouverte avec le reçu de vente pré-rempli.'
    }));
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const fileName = `Recu_Vente_${activeReceipt.receiptNumber}_${activeReceipt.buyerName.replace(/\s+/g, '_')}`;
      const success = await downloadElementAsPdf(printRef.current || 'printable-sale-receipt', fileName);
      if (success) {
        dispatch(addToast({
          type: 'success',
          message: 'Téléchargement du reçu de vente PDF réussi !'
        }));
      } else {
        handlePrint();
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const opLabel = getSaleOperationLabel(activeReceipt.operationType);
  const docBadge = getDocumentBadgeInfo(activeReceipt.documentType);
  const isParcelle = activeReceipt.propertyType === 'parcelle';

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 md:p-6 flex items-start sm:items-center justify-center animate-fadeIn print:p-0 print:bg-white"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[94vh] sm:max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto print:max-h-none print:shadow-none print:border-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Screen Controls Header */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span className="font-extrabold text-xs font-heading truncate max-w-[220px] sm:max-w-none">
              Reçu Officiel de Vente • N° {activeReceipt.receiptNumber}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="px-2.5 sm:px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Envoyer le reçu de vente par WhatsApp à l'acquéreur"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden md:inline">WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-2.5 sm:px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Télécharger le reçu au format PDF"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{isDownloadingPdf ? 'Création...' : 'Télécharger PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-2.5 sm:px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Imprimer le document"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimer</span>
            </button>

            <button
              onClick={handleClose}
              className="px-2.5 sm:px-3 py-2 rounded-xl text-slate-200 hover:text-white bg-slate-800 hover:bg-rose-600 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
              title="Fermer la fenêtre (Échap)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Fermer</span>
            </button>
          </div>
        </div>

        {/* Printable Document Body (A4 Style Certificate & Official Deed Receipt) */}
        <div 
          ref={printRef} 
          id="printable-sale-receipt" 
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 bg-white text-slate-900 font-sans print:p-2.5 print:space-y-2 text-xs sm:text-sm relative single-page-a4"
        >
          {/* Subtle Watermark for Official Print */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] select-none print:hidden">
            <span className="text-7xl font-black uppercase transform -rotate-45 tracking-widest text-slate-900">
              MALI IMMO PRESTIGE
            </span>
          </div>

          {/* Agency Letterhead */}
          <div className="flex items-start justify-between gap-4 pb-2.5 border-b-2 border-slate-900 relative z-10 print:pb-1.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {agencyConfig.logoUrl ? (
                  <img
                    src={agencyConfig.logoUrl}
                    alt={agencyConfig.name}
                    className="w-10 h-10 object-contain rounded-lg border border-slate-200 p-0.5 print:w-8 print:h-8"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-slate-950 text-amber-400 flex items-center justify-center font-black text-sm shadow-xs print:w-7 print:h-7 print:text-xs">
                    {agencyConfig.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="font-black text-lg text-slate-950 font-heading tracking-tight uppercase print:text-sm">
                    {agencyConfig.name}
                  </h1>
                  <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wider print:text-[8px]">
                    {agencyConfig.slogan || 'Cabinet Foncier, Transactions Immobilières & Gestion Déléguée'}
                  </p>
                </div>
              </div>

              <div className="text-[10px] text-slate-600 space-y-0.5 pt-0.5 font-medium print:text-[8.5px] print:leading-tight">
                <p>{agencyConfig.address} • Bamako, République du Mali</p>
                <p className="flex items-center gap-1.5">
                  <span>Tél : <strong>{agencyConfig.phoneDisplay}</strong></span>
                  <span>•</span>
                  <span>Email : <strong>{agencyConfig.email}</strong></span>
                  <span>•</span>
                  <span className="font-mono text-slate-500">NIF : {agencyConfig.nif} • RCCM : {agencyConfig.rccm}</span>
                </p>
              </div>
            </div>

            {/* Document Header & Reference Block */}
            <div className="text-right space-y-0.5 shrink-0">
              <div className="inline-block px-2.5 py-0.5 bg-slate-950 text-amber-400 rounded text-[11px] font-black uppercase tracking-wider shadow-xs print:text-[9.5px]">
                REÇU DE VENTE IMMOBILIÈRE
              </div>
              <div className="font-mono font-black text-xs text-slate-900 print:text-[10px]">
                N° : {activeReceipt.receiptNumber}
              </div>
              <p className="text-[10px] text-slate-600 font-medium print:text-[8.5px]">
                Date : <strong>{formatDate(activeReceipt.saleDate)}</strong>
              </p>
              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border ${opLabel.color} print:text-[8px]`}>
                {opLabel.label}
              </span>
            </div>
          </div>

          {/* Client & Acquéreur Identity Section (FULL CLIENT INFO) */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5 relative z-10 print:p-2 print:space-y-1">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1 print:text-[9px]">
                <User className="w-3 h-3 text-amber-700" />
                Informations Complètes de l'Acquéreur (Client Acheteur)
              </span>
              <span className="text-[9px] font-bold text-amber-800 bg-amber-200/60 px-1.5 py-0.5 rounded-full print:text-[8px]">
                Bénéficiaire de l'Acte
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs print:text-[9.5px]">
              <div className="space-y-0.5">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase block print:text-[8px]">Nom & Prénoms :</span>
                  <span className="font-black text-xs text-slate-950 font-heading print:text-[10.5px]">{activeReceipt.buyerName}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase block print:text-[8px]">Téléphone :</span>
                  <span className="font-bold text-slate-900 font-mono">{activeReceipt.buyerPhone}</span>
                </div>
                {activeReceipt.buyerEmail && (
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase block print:text-[8px]">Email :</span>
                    <span className="text-slate-800">{activeReceipt.buyerEmail}</span>
                  </div>
                )}
              </div>

              <div className="space-y-0.5">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase block print:text-[8px]">N° Pièce / NINA :</span>
                  <span className="font-bold text-slate-950 font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200 inline-block text-[9.5px] print:text-[8.5px]">
                    {activeReceipt.buyerNinaOrId || 'En cours de transmission'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase block print:text-[8px]">Adresse :</span>
                  <span className="text-slate-900 font-medium">{activeReceipt.buyerAddress || 'Bamako, Mali'}</span>
                </div>
                {(activeReceipt.buyerProfession || activeReceipt.buyerNationality) && (
                  <div className="flex items-center gap-2 text-[9.5px] text-slate-600 print:text-[8.5px]">
                    {activeReceipt.buyerProfession && <span>Prof : <strong>{activeReceipt.buyerProfession}</strong></span>}
                    {activeReceipt.buyerNationality && <span>Nat : <strong>{activeReceipt.buyerNationality}</strong></span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Property Designation & Cadastral Details (Parcelles / Appartements) */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 relative z-10 print:p-2 print:space-y-1">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1 print:text-[9px]">
                {isParcelle ? <Layers className="w-3 h-3 text-amber-600" /> : <Building2 className="w-3 h-3 text-blue-600" />}
                Désignation & Situation Juridique du Bien Vendu
              </span>
              <span className="font-mono font-bold text-[9px] text-slate-600 print:text-[8.5px]">
                Réf : {activeReceipt.propertyReference}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs print:text-[9.5px]">
              <div className="col-span-2 space-y-0.5">
                <span className="text-[9px] text-slate-500 font-bold uppercase block print:text-[8px]">Désignation :</span>
                <p className="font-extrabold text-slate-950 text-xs font-heading print:text-[10.5px]">{activeReceipt.propertyTitle}</p>
                <p className="text-[10px] text-slate-600 flex items-center gap-1 print:text-[8.5px]">
                  <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                  <span>{activeReceipt.address || `${activeReceipt.neighborhood}, ${activeReceipt.city}`}</span>
                </p>
              </div>

              <div className="space-y-0.5 bg-white p-1.5 rounded-lg border border-slate-200 text-[10px] print:text-[8.5px]">
                <span className="text-[8.5px] text-slate-500 font-bold uppercase block print:text-[7.5px]">Superficie :</span>
                <div className="font-black text-slate-900">{formatSurface(activeReceipt.surface)}</div>
                {activeReceipt.dimensions && (
                  <span className="text-[8.5px] text-slate-500 block">Dim : {activeReceipt.dimensions}</span>
                )}
              </div>
            </div>

            {/* Land & Cadastral Specifics (Lot, Section, Îlot, TF) */}
            <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-200 text-[9.5px] font-mono print:text-[8.5px]">
              <div className="bg-white p-1.5 rounded border border-slate-200">
                <span className="text-[8px] text-slate-400 font-sans uppercase font-bold block print:text-[7px]">Titre</span>
                <span className="font-bold text-slate-900 truncate block">{docBadge.label}</span>
                {activeReceipt.documentNumber && (
                  <span className="text-[8px] text-amber-800 font-bold block truncate">{activeReceipt.documentNumber}</span>
                )}
              </div>

              {isParcelle ? (
                <>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[8px] text-slate-400 font-sans uppercase font-bold block print:text-[7px]">N° Lot</span>
                    <span className="font-bold text-slate-900 truncate block">{activeReceipt.lotNumber || '-'}</span>
                  </div>

                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[8px] text-slate-400 font-sans uppercase font-bold block print:text-[7px]">Sect / Îlot</span>
                    <span className="font-bold text-slate-900 truncate block">
                      {activeReceipt.section ? `S.${activeReceipt.section}` : '-'} {activeReceipt.ilotNumber ? `• ${activeReceipt.ilotNumber}` : ''}
                    </span>
                  </div>

                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[8px] text-slate-400 font-sans uppercase font-bold block print:text-[7px]">Lotissement</span>
                    <span className="font-bold text-slate-900 truncate block">{activeReceipt.lotissement || 'Communal'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[8px] text-slate-400 font-sans uppercase font-bold block print:text-[7px]">Type Bâti</span>
                    <span className="font-bold text-slate-900 truncate block">{getPropertyTypeLabel(activeReceipt.propertyType)}</span>
                  </div>

                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[8px] text-slate-400 font-sans uppercase font-bold block print:text-[7px]">Porte</span>
                    <span className="font-bold text-slate-900 truncate block">{activeReceipt.doorNumber || activeReceipt.lotNumber || '-'}</span>
                  </div>

                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[8px] text-slate-400 font-sans uppercase font-bold block print:text-[7px]">Étage/Immeuble</span>
                    <span className="font-bold text-slate-900 truncate block">{activeReceipt.buildingFloor || 'Principal'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Financial Settlement & Accounting Breakdown (MONTANTS EN LETTRES ET EN CHIFFRES) */}
          <div className="border border-slate-900 rounded-xl overflow-hidden relative z-10 shadow-2xs">
            <div className="bg-slate-900 text-white px-3 py-1 font-black text-[10px] uppercase tracking-wider flex items-center justify-between print:py-0.5 print:text-[9px]">
              <span>Décompte Financier & Règlement Encaissé</span>
              <span className="text-amber-400 font-mono">Francs CFA (XOF)</span>
            </div>

            <div className="p-3 space-y-2 bg-white text-xs print:p-2 print:space-y-1.5">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 print:p-1.5">
                  <span className="text-[8.5px] text-slate-500 uppercase font-bold block print:text-[7.5px]">Prix Convenu :</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 font-heading block pt-0.5 print:text-[11px]">
                    {formatFCFA(activeReceipt.totalAgreedPrice)}
                  </span>
                </div>

                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 print:p-1.5">
                  <span className="text-[8.5px] text-emerald-700 uppercase font-bold block print:text-[7.5px]">Montant Versé :</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-800 font-heading block pt-0.5 print:text-[11px]">
                    {formatFCFA(activeReceipt.amountPaid)}
                  </span>
                </div>

                <div className={`p-2 rounded-lg border print:p-1.5 ${activeReceipt.remainingBalance > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[8.5px] uppercase font-bold block print:text-[7.5px] ${activeReceipt.remainingBalance > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                    Solde Restant :
                  </span>
                  <span className={`text-xs sm:text-sm font-black font-heading block pt-0.5 print:text-[11px] ${activeReceipt.remainingBalance > 0 ? 'text-rose-800' : 'text-slate-900'}`}>
                    {formatFCFA(activeReceipt.remainingBalance)}
                  </span>
                </div>
              </div>

              {/* Amount in Words */}
              <div className="p-2 rounded-lg bg-slate-100/90 border border-slate-200 space-y-0.5 print:p-1.5">
                <span className="text-[8.5px] text-slate-500 uppercase font-bold block print:text-[7.5px]">Montant Réceptionné en Toutes Lettres :</span>
                <p className="font-extrabold text-slate-950 italic text-[11px] print:text-[9.5px]">
                  « {formatAmountInFrenchWords(activeReceipt.amountPaid)} »
                </p>
              </div>

              {/* Payment Method & Transaction Reference */}
              <div className="grid grid-cols-2 gap-2 text-[10px] print:text-[8.5px]">
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-medium">Mode :</span>
                  <span className="font-black text-slate-900">{activeReceipt.paymentMethod}</span>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-medium">Réf. Trans. :</span>
                  <span className="font-mono font-bold text-slate-900 truncate">{activeReceipt.transactionReference || 'N/A'}</span>
                </div>
              </div>

              {activeReceipt.notaryOffice && (
                <div className="p-1.5 rounded bg-amber-50/70 border border-amber-200 text-[9.5px] text-amber-900 flex items-center justify-between print:text-[8px]">
                  <span className="font-bold">Étude Notariale :</span>
                  <span className="font-semibold">{activeReceipt.notaryOffice}</span>
                </div>
              )}
            </div>
          </div>

          {/* Legal Clauses & Notes */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[9px] text-slate-600 space-y-0.5 relative z-10 leading-snug print:p-1.5 print:text-[8px] print:leading-tight">
            <span className="font-bold text-slate-900 uppercase block">Mentions Légales :</span>
            <ul className="list-disc pl-3.5 space-y-0.5">
              {activeReceipt.clauses && activeReceipt.clauses.length > 0 ? (
                activeReceipt.clauses.slice(0, 3).map((clause, idx) => (
                  <li key={idx}>{clause}</li>
                ))
              ) : (
                <>
                  <li>Le présent reçu délivré par l'agence certifie la réception effective de la somme mentionnée ci-dessus.</li>
                  <li>Le transfert de propriété définitif reste subordonné à la rédaction de l'acte authentique de mutation par devant Notaire.</li>
                  <li>Toutes les mentions cadastrales et documents fonciers originaux sont vérifiés et réguliers.</li>
                </>
              )}
            </ul>
            {activeReceipt.notes && (
              <p className="pt-0.5 text-slate-700 italic border-t border-slate-200 mt-0.5">
                <strong>Obs. :</strong> {activeReceipt.notes}
              </p>
            )}
          </div>

          {/* Signatures & Official Seal Block */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t-2 border-slate-900 relative z-10 text-xs print:pt-1.5 print:text-[9.5px]">
            {/* Buyer Signature */}
            <div className="space-y-4 print:space-y-3">
              <div>
                <span className="font-black text-slate-950 uppercase text-[10px] block print:text-[8.5px]">L'Acquéreur (Client Acheteur)</span>
                <p className="text-[8.5px] text-slate-500 font-medium print:text-[7.5px]">Mention manuscrite « Lu et approuvé »</p>
              </div>
              <div className="pt-4 border-b border-dashed border-slate-400 max-w-[170px]"></div>
              <p className="font-bold text-slate-900 text-[10px] print:text-[8.5px]">{activeReceipt.buyerName}</p>
            </div>

            {/* Agency Stamp & Direction Signature */}
            <div className="space-y-1.5 text-right">
              <div>
                <span className="font-black text-slate-950 uppercase text-[10px] block print:text-[8.5px]">Pour l'Agence {agencyConfig.name}</span>
                <p className="text-[8.5px] text-slate-500 font-medium print:text-[7.5px]">La Direction & Cachet Officiel</p>
              </div>

              {/* Cachet & Stamp Graphic */}
              <div className="inline-block p-2 border-2 border-dashed border-amber-600/80 rounded-xl bg-amber-50/30 text-center max-w-[180px] print:p-1">
                <p className="font-black text-[9px] text-slate-900 uppercase print:text-[8px]">{agencyConfig.name}</p>
                <p className="text-[8px] text-amber-800 font-bold uppercase print:text-[7px]">{agencyConfig.officialStampText || 'Cachet Officiel & Quittance'}</p>
                <p className="text-[7.5px] text-slate-500 font-mono">Bamako, {formatDate(activeReceipt.saleDate)}</p>
              </div>

              <p className="font-bold text-slate-900 text-[9.5px] print:text-[8px]">{activeReceipt.issuedBy || 'Le Gestionnaire Agréé'}</p>
            </div>
          </div>

          {/* Footer Barcode / Verification info */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-400 font-mono print:pt-1 print:text-[7px]">
            <span>Certificat délivré par {agencyConfig.name} • Système Sécurisé Mali Immo</span>
            <span>Réf : {activeReceipt.id} • Validé</span>
          </div>
        </div>

        {/* Bottom Actions Footer (Fixed at the bottom for easy exit) */}
        <div className="p-3 sm:p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 sticky bottom-0 z-30 print:hidden">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <X className="w-4 h-4" />
            <span>Fermer / Quitter</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Envoyer à l'acquéreur par WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Envoyer WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Télécharger le document au format PDF"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isDownloadingPdf ? 'Création...' : 'Télécharger PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
