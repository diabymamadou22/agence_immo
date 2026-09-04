import React, { useRef, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { closeSaleInstallmentReceiptModal, addToast } from '../../store/uiSlice';
import { 
  formatFCFA, 
  formatDate, 
  formatAmountInFrenchWords,
  formatSurface,
  getDocumentBadgeInfo,
  getPropertyTypeLabel
} from '../../utils/formatters';
import { printElement } from '../../utils/printUtils';
import { sendSaleInstallmentWhatsApp } from '../../utils/whatsappUtils';
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
  Layers, 
  MessageCircle, 
  Download, 
  Loader2,
  Coins,
  History,
  TrendingDown
} from 'lucide-react';

export const SaleInstallmentReceiptModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isSaleInstallmentReceiptModalOpen);
  const activeData = useAppSelector((state) => state.sales.activeInstallmentForPrint);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch(closeSaleInstallmentReceiptModal());
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, dispatch]);

  if (!isOpen || !activeData || !activeData.sale || !activeData.installment) return null;

  const { sale, installment } = activeData;
  const isFullyPaid = installment.remainingBalanceAfter <= 0;
  const docBadge = getDocumentBadgeInfo(sale.documentType);
  const isParcelle = sale.propertyType === 'parcelle';

  const handleClose = () => {
    dispatch(closeSaleInstallmentReceiptModal());
  };

  const handlePrint = () => {
    const title = `Quittance_Tranche_${installment.receiptNumber}_${sale.buyerName.replace(/\s+/g, '_')}`;
    if (printRef.current) {
      printElement(printRef.current, title);
    } else {
      printElement('printable-installment-receipt', title);
    }
  };

  const handleWhatsAppShare = () => {
    sendSaleInstallmentWhatsApp(sale, installment, agencyConfig);
    dispatch(addToast({
      type: 'success',
      message: 'Discussion WhatsApp ouverte avec la quittance de tranche pré-remplie.'
    }));
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const fileName = `Quittance_Tranche_${installment.receiptNumber}_${sale.buyerName.replace(/\s+/g, '_')}`;
      const success = await downloadElementAsPdf(printRef.current || 'printable-installment-receipt', fileName);
      if (success) {
        dispatch(addToast({
          type: 'success',
          message: 'Téléchargement de la quittance PDF réussi !'
        }));
      } else {
        handlePrint();
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 md:p-6 flex items-start sm:items-center justify-center animate-fadeIn print:p-0 print:bg-white"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[94vh] sm:max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto print:max-h-none print:shadow-none print:border-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Screen Controls Header */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                <span>Quittance de Versement Partiel (Tranche)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono">
                  {installment.receiptNumber}
                </span>
              </h2>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Reçu d'acompte & fractionnement de paiement officiel avec décompte du solde restant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="px-2.5 sm:px-3 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-xs"
              title="Partager directement par WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden md:inline">WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-2.5 sm:px-3 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-xs"
              title="Télécharger en PDF"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden md:inline">PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 sm:px-4 py-2 rounded-xl text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center gap-1.5 text-xs font-black cursor-pointer shadow-sm"
              title="Imprimer au format A4"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>

            <button
              onClick={handleClose}
              className="px-2.5 sm:px-3 py-2 rounded-xl text-slate-200 hover:text-white bg-slate-800 hover:bg-rose-600 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
              title="Fermer"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Fermer</span>
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div 
          ref={printRef} 
          id="printable-installment-receipt" 
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-3.5 bg-white text-slate-900 font-sans print:p-2.5 print:space-y-2 text-xs sm:text-sm relative single-page-a4"
        >
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] select-none print:hidden">
            <span className="text-6xl font-black uppercase transform -rotate-45 tracking-widest text-slate-900">
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

            {/* Reference Block */}
            <div className="text-right space-y-0.5 shrink-0">
              <div className="inline-block px-2.5 py-0.5 bg-amber-500 text-slate-950 rounded text-[11px] font-black uppercase tracking-wider shadow-xs print:text-[9.5px]">
                QUITTANCE DE TRANCHE
              </div>
              <div className="font-mono font-black text-xs text-slate-900 print:text-[10px]">
                N° : {installment.receiptNumber}
              </div>
              <p className="text-[9.5px] text-slate-600 font-medium print:text-[8px]">
                Dossier Vente : <strong className="font-mono text-slate-900">{sale.receiptNumber}</strong>
              </p>
              <p className="text-[9.5px] text-slate-600 font-medium print:text-[8px]">
                Date : <strong>{formatDate(installment.paymentDate)}</strong>
              </p>
            </div>
          </div>

          {/* Acquéreur (Buyer Information) */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1 relative z-10 print:p-2">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1 print:text-[9px]">
                <User className="w-3 h-3 text-amber-700" />
                Bénéficiaire du Versement (Acquéreur)
              </span>
              <span className="text-[9px] font-bold text-amber-800 bg-amber-200/60 px-1.5 py-0.5 rounded-full print:text-[8px]">
                Client Acheteur
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs print:text-[9.5px]">
              <div>
                <span className="text-[9px] text-slate-500 font-bold uppercase block print:text-[8px]">Nom & Prénoms :</span>
                <span className="font-black text-xs text-slate-950 font-heading print:text-[10.5px]">{sale.buyerName}</span>
                <p className="text-[10px] text-slate-600 font-mono mt-0.5">Tél : {sale.buyerPhone}</p>
              </div>

              <div>
                <span className="text-[9px] text-slate-500 font-bold uppercase block print:text-[8px]">N° Pièce / NINA :</span>
                <span className="font-bold text-slate-950 font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200 inline-block text-[9.5px] print:text-[8.5px]">
                  {sale.buyerNinaOrId || 'En cours de régularisation'}
                </span>
                <p className="text-[10px] text-slate-600 mt-0.5">{sale.buyerAddress || 'Bamako, Mali'}</p>
              </div>
            </div>
          </div>

          {/* Property Designation */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 relative z-10 print:p-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1 print:text-[9px]">
                {isParcelle ? <Layers className="w-3 h-3 text-amber-600" /> : <Building2 className="w-3 h-3 text-blue-600" />}
                Désignation du Bien Immobilier Vendu
              </span>
              <span className="font-mono font-bold text-[9px] text-slate-600 print:text-[8.5px]">
                Réf : {sale.propertyReference}
              </span>
            </div>

            <div className="flex items-start justify-between gap-2 text-xs print:text-[9.5px]">
              <div>
                <p className="font-extrabold text-slate-950 font-heading">{sale.propertyTitle}</p>
                <p className="text-[10px] text-slate-600 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-slate-400" />
                  <span>{sale.address || `${sale.neighborhood}, ${sale.city}`}</span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[9px] text-slate-500 font-bold block">Superficie</span>
                <span className="font-black text-slate-900">{formatSurface(sale.surface)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200 text-[9.5px] font-mono text-slate-700">
              <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {docBadge.label} {sale.documentNumber ? `(${sale.documentNumber})` : ''}
              </span>
              {sale.lotNumber && (
                <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  Lot : {sale.lotNumber}
                </span>
              )}
              {sale.section && (
                <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  Sect : {sale.section}
                </span>
              )}
              {sale.ilotNumber && (
                <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  Îlot : {sale.ilotNumber}
                </span>
              )}
            </div>
          </div>

          {/* Detailed Financial Breakdown */}
          <div className="border border-slate-900 rounded-xl overflow-hidden relative z-10 shadow-2xs">
            <div className="bg-slate-900 text-white px-3 py-1 font-black text-[10px] uppercase tracking-wider flex items-center justify-between print:py-0.5 print:text-[9px]">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                Décompte du Versement & Situation du Solde
              </span>
              <span className="text-amber-400 font-mono">Francs CFA (XOF)</span>
            </div>

            <div className="p-3 space-y-2.5 bg-white text-xs print:p-2 print:space-y-1.5">
              <div className="grid grid-cols-4 gap-2">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <span className="text-[8.5px] text-slate-500 uppercase font-bold block print:text-[7.5px]">Prix Convenu</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 font-heading block pt-0.5 print:text-[10px]">
                    {formatFCFA(sale.totalAgreedPrice)}
                  </span>
                </div>

                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <span className="text-[8.5px] text-slate-500 uppercase font-bold block print:text-[7.5px]">Solde Antérieur</span>
                  <span className="text-xs sm:text-sm font-black text-slate-700 font-heading block pt-0.5 print:text-[10px]">
                    {formatFCFA(installment.previousBalance)}
                  </span>
                </div>

                <div className="p-2 bg-amber-50 rounded-lg border-2 border-amber-500 text-center shadow-2xs">
                  <span className="text-[8.5px] text-amber-900 uppercase font-black block print:text-[7.5px]">Montant Versé</span>
                  <span className="text-xs sm:text-sm font-black text-amber-950 font-heading block pt-0.5 print:text-[11px]">
                    {formatFCFA(installment.amount)}
                  </span>
                </div>

                <div className={`p-2 rounded-lg border text-center ${isFullyPaid ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-200'}`}>
                  <span className={`text-[8.5px] uppercase font-bold block print:text-[7.5px] ${isFullyPaid ? 'text-emerald-700' : 'text-rose-700'}`}>
                    Solde Restant Dû
                  </span>
                  <span className={`text-xs sm:text-sm font-black font-heading block pt-0.5 print:text-[10px] ${isFullyPaid ? 'text-emerald-800' : 'text-rose-800'}`}>
                    {formatFCFA(installment.remainingBalanceAfter)}
                  </span>
                </div>
              </div>

              {/* Amount in French Words */}
              <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200 space-y-0.5 print:p-1.5">
                <span className="text-[8.5px] text-amber-800 uppercase font-bold block print:text-[7.5px]">
                  Montant de la présente tranche en toutes lettres :
                </span>
                <p className="font-black text-slate-950 italic text-[11px] print:text-[9.5px]">
                  « {formatAmountInFrenchWords(installment.amount)} »
                </p>
              </div>

              {/* Method & Reference */}
              <div className="grid grid-cols-2 gap-2 text-[10px] print:text-[8.5px]">
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-medium">Mode de paiement :</span>
                  <span className="font-black text-slate-900">{installment.paymentMethod}</span>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-medium">Réf. Transaction :</span>
                  <span className="font-mono font-bold text-slate-900 truncate">{installment.transactionReference || 'Espèces / Encaissé direct'}</span>
                </div>
              </div>

              {isFullyPaid && (
                <div className="p-2 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-center text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>VENTE INTÉGRALEMENT SOLDÉE • TOUS LES PAIEMENTS SONT ACQUITTÉS</span>
                </div>
              )}
            </div>
          </div>

          {/* Historical Installments Audit Trail */}
          {sale.installments && sale.installments.length > 0 && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 relative z-10 print:p-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="text-[9.5px] font-black uppercase text-slate-800 flex items-center gap-1">
                  <History className="w-3 h-3 text-amber-600" />
                  Historique Exhaustif des Versements (Traçabilité)
                </span>
                <span className="text-[9px] font-mono text-slate-500">
                  {sale.installments.length} versement(s) au dossier
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[9px] font-mono print:text-[8px]">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200 text-left">
                      <th className="py-0.5 font-bold">N°</th>
                      <th className="py-0.5 font-bold">Date</th>
                      <th className="py-0.5 font-bold">Montant</th>
                      <th className="py-0.5 font-bold">Mode</th>
                      <th className="py-0.5 font-bold text-right">Reste après</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60">
                    {sale.installments.map((inst, idx) => (
                      <tr 
                        key={inst.id || idx}
                        className={inst.id === installment.id ? 'bg-amber-100/60 font-bold text-slate-950' : 'text-slate-700'}
                      >
                        <td className="py-0.5">Tranche {inst.installmentNumber || idx + 1}</td>
                        <td className="py-0.5">{formatDate(inst.paymentDate)}</td>
                        <td className="py-0.5 font-bold">{formatFCFA(inst.amount)}</td>
                        <td className="py-0.5">{inst.paymentMethod}</td>
                        <td className="py-0.5 text-right font-bold">
                          {inst.remainingBalanceAfter === 0 ? 'SOLDÉ (0 F)' : formatFCFA(inst.remainingBalanceAfter)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Legal Clauses */}
          <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-[8.5px] text-slate-600 space-y-0.5 relative z-10 print:text-[8px]">
            <span className="font-bold text-slate-900 uppercase block">Mentions Légales & Validité :</span>
            <p>
              La présente quittance de versement certifie la réception irrévocable de la somme de <strong>{formatFCFA(installment.amount)}</strong> au compte de l'acquéreur. 
              {installment.remainingBalanceAfter > 0 ? (
                <span> Le solde résiduel de <strong>{formatFCFA(installment.remainingBalanceAfter)}</strong> reste exigible selon les stipulations et échéances convenues.</span>
              ) : (
                <span> Ce règlement soldant la totalité du prix convenu, l'agence procède aux formalités de mutation et de délivrance définitive du titre.</span>
              )}
            </p>
          </div>

          {/* Signatures & Seal */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t-2 border-slate-900 relative z-10 text-xs print:pt-1.5 print:text-[9.5px]">
            <div className="space-y-4 print:space-y-3">
              <div>
                <span className="font-black text-slate-950 uppercase text-[10px] block print:text-[8.5px]">L'Acquéreur (Client Acheteur)</span>
                <p className="text-[8.5px] text-slate-500 font-medium print:text-[7.5px]">Mention « Lu et approuvé »</p>
              </div>
              <div className="pt-4 border-b border-dashed border-slate-400 max-w-[170px]"></div>
              <p className="font-bold text-slate-900 text-[10px] print:text-[8.5px]">{sale.buyerName}</p>
            </div>

            <div className="space-y-1.5 text-right">
              <div>
                <span className="font-black text-slate-950 uppercase text-[10px] block print:text-[8.5px]">Pour l'Agence {agencyConfig.name}</span>
                <p className="text-[8.5px] text-slate-500 font-medium print:text-[7.5px]">La Caisse & Cachet Officiel</p>
              </div>

              <div className="inline-block p-1.5 border-2 border-dashed border-amber-600/80 rounded-xl bg-amber-50/30 text-center max-w-[180px] print:p-1">
                <p className="font-black text-[9px] text-slate-900 uppercase print:text-[8px]">{agencyConfig.name}</p>
                <p className="text-[8px] text-amber-800 font-bold uppercase print:text-[7px]">Cachet de Règlement Agréé</p>
                <p className="text-[7.5px] text-slate-500 font-mono">Bamako, {formatDate(installment.paymentDate)}</p>
              </div>

              <p className="font-bold text-slate-900 text-[9.5px] print:text-[8px]">{installment.issuedBy || 'La Caisse Centrale'}</p>
            </div>
          </div>

          {/* Footer Barcode info */}
          <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-400 font-mono print:text-[7px]">
            <span>Quittance délivrée par {agencyConfig.name} • Système Sécurisé Mali Immo</span>
            <span>Réf : {installment.id} • Certifié</span>
          </div>
        </div>

        {/* Bottom Actions Footer */}
        <div className="p-3 sm:p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 sticky bottom-0 z-30 print:hidden">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <X className="w-4 h-4" />
            <span>Fermer</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Envoyer WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{isDownloadingPdf ? 'Création...' : 'Télécharger PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer Quittance</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SaleInstallmentReceiptModal;
