import React, { useRef, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { closePayoutPrintModal, addToast } from '../../store/uiSlice';
import { formatFCFA, formatDate } from '../../utils/formatters';
import { printElement } from '../../utils/printUtils';
import { sendOwnerPayoutWhatsApp } from '../../utils/whatsappUtils';
import { downloadElementAsPdf } from '../../utils/pdfExport';
import { 
  X, 
  Printer, 
  Building2, 
  DollarSign, 
  Receipt, 
  CheckCircle2,
  MessageCircle,
  Download,
  Loader2
} from 'lucide-react';

export const PayoutPrintModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isPayoutPrintModalOpen);
  const payout = useAppSelector((state) => state.ui.selectedPayoutForPrint);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Close with ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch(closePayoutPrintModal());
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, dispatch]);

  if (!isOpen || !payout) return null;

  const handleClose = () => {
    dispatch(closePayoutPrintModal());
  };

  const handlePrint = () => {
    if (printRef.current) {
      printElement(printRef.current, `Bordereau_Reversement_${payout.payoutNumber}`);
    } else {
      window.print();
    }
  };

  const handleWhatsAppShare = () => {
    sendOwnerPayoutWhatsApp(payout, agencyConfig);
    dispatch(addToast({
      type: 'success',
      message: 'Discussion WhatsApp ouverte avec l\'avis de reversement pré-rempli.'
    }));
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const fileName = `Bordereau_Reversement_${payout.payoutNumber}_${payout.ownerName.replace(/\s+/g, '_')}`;
      const success = await downloadElementAsPdf(printRef.current || 'printable-payout', fileName);
      if (success) {
        dispatch(addToast({
          type: 'success',
          message: 'Bordereau PDF téléchargé avec succès !'
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
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-start sm:items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn print:p-0 print:bg-white"
      onClick={handleClose}
    >
      <div 
        className="bg-white w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh] my-auto print:max-h-none print:shadow-none print:border-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Screen Header */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400 shrink-0" />
            <h3 className="font-extrabold text-xs sm:text-sm font-heading truncate max-w-[220px] sm:max-w-none">
              Bordereau de Reversement ({payout.payoutNumber})
            </h3>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              title="Notifier le propriétaire par WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden md:inline">WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-black text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              title="Télécharger le bordereau en PDF"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{isDownloadingPdf ? 'Génération...' : 'PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimer</span>
            </button>

            <button
              onClick={handleClose}
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
              title="Fermer la fenêtre (Échap)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Fermer</span>
            </button>
          </div>
        </div>

        {/* Printable Statement */}
        <div 
          ref={printRef} 
          id="printable-payout"
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-5 text-slate-900 bg-white font-sans text-xs sm:text-sm print:p-3 print:space-y-2.5 single-page-a4"
        >
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between gap-4 print:pb-1.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600 print:w-4 print:h-4" />
                <h1 className="text-lg sm:text-xl font-black text-slate-900 uppercase font-heading tracking-tight print:text-sm">
                  {agencyConfig.name}
                </h1>
              </div>
              <p className="text-[10px] font-semibold text-slate-600 italic print:text-[8px]">
                {agencyConfig.slogan}
              </p>
              <p className="text-[9.5px] text-slate-500 font-mono print:text-[8px]">
                RCCM : {agencyConfig.rccm} • NIF : {agencyConfig.nif}
              </p>
              <p className="text-[9.5px] text-slate-500 print:text-[8px]">
                {agencyConfig.address} • Tel: {agencyConfig.phoneDisplay}
              </p>
            </div>

            <div className="text-right space-y-0.5 shrink-0 border border-slate-300 p-2 rounded-lg bg-slate-50 print:p-1.5">
              <span className="text-[9px] font-black uppercase text-slate-500 block print:text-[7.5px]">BORDEREAU OFFICIEL</span>
              <span className="text-xs font-mono font-black text-slate-900 print:text-[10px]">{payout.payoutNumber}</span>
              <span className="text-[9px] text-slate-500 block print:text-[7.5px]">Date : {formatDate(payout.payoutDate)}</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg print:py-1">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 font-heading print:text-[11px]">
              BORDEREAU DE REVERSEMENT MENSUEL DES LOYERS
            </h2>
            <span className="text-[10px] text-slate-700 font-bold print:text-[8.5px]">
              Période concernée : {payout.periodMonth}
            </span>
          </div>

          {/* Beneficiary */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-0.5 print:p-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 print:text-[8px]">
              BÉNÉFICIAIRE / PROPRIÉTAIRE DU PARC IMMOBILIER :
            </span>
            <p className="text-xs sm:text-sm font-black text-slate-900 print:text-[11px]">{payout.ownerName}</p>
            <p className="text-[10px] text-slate-600 print:text-[8.5px]">
              Mode de règlement : <strong className="text-slate-800">{payout.paymentMethod}</strong> (Réf : {payout.transactionReference || 'Direct'})
            </p>
          </div>

          {/* Financial Breakdown Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs print:text-[9px]">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-white font-extrabold uppercase text-[10px] print:text-[8.5px]">
                <tr>
                  <th className="py-2 px-3 print:py-1.5 print:px-2">Désignation des Opérations</th>
                  <th className="py-2 px-3 text-right print:py-1.5 print:px-2">Montant (FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="py-2 px-3 text-slate-800 font-bold print:py-1.5 print:px-2">
                    Total Loyers Bruts Encaissés ({payout.periodMonth})
                  </td>
                  <td className="py-2 px-3 text-right font-black text-slate-900 text-xs sm:text-sm print:py-1.5 print:px-2 print:text-[10.5px]">
                    {formatFCFA(payout.grossRentCollected)}
                  </td>
                </tr>

                <tr className="bg-amber-50/40 text-amber-900">
                  <td className="py-2 px-3 print:py-1.5 print:px-2">
                    Déduction Commission de Gestion Agence ({payout.agencyCommissionPercent}%)
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-amber-700 print:py-1.5 print:px-2">
                    -{formatFCFA(payout.agencyCommissionAmount)}
                  </td>
                </tr>

                {payout.maintenanceDeductions > 0 && (
                  <tr className="bg-rose-50/40 text-rose-900">
                    <td className="py-2 px-3 print:py-1.5 print:px-2">
                      Déduction Travaux & Entretien Conservatoire
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-rose-700 print:py-1.5 print:px-2">
                      -{formatFCFA(payout.maintenanceDeductions)}
                    </td>
                  </tr>
                )}

                <tr className="bg-slate-900 text-white font-bold text-xs print:text-[10px]">
                  <td className="py-2.5 px-3 uppercase tracking-wider print:py-1.5 print:px-2">
                    NET REVERSÉ AU PROPRIÉTAIRE (FCFA)
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-amber-400 text-sm font-heading print:py-1.5 print:px-2 print:text-xs">
                    {formatFCFA(payout.netPaidToOwner)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures & Stamp */}
          <div className="pt-4 grid grid-cols-2 gap-6 border-t-2 border-slate-200 items-end print:pt-2">
            <div className="text-center space-y-6 print:space-y-4">
              <p className="text-[10px] font-bold uppercase text-slate-700 print:text-[8.5px]">Pour Acquit le Bénéficiaire</p>
              <div className="border-t border-slate-400 pt-1 text-[9px] text-slate-500 print:text-[7.5px]">(Signature et Date)</div>
            </div>

            {/* Stamp */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-1.5 text-center rotate-[-2deg] print:w-20 print:h-20">
                <span className="text-[6.5px] font-black text-slate-900 uppercase leading-tight font-heading print:text-[5.5px]">
                  {agencyConfig.name}
                </span>
                <div className="w-4 h-0.5 bg-amber-500 my-0.5" />
                <span className="text-[6.5px] font-black text-emerald-700 uppercase tracking-wider print:text-[5.5px]">
                  PAYÉ & CERTIFIÉ
                </span>
                <span className="text-[5.5px] font-mono text-slate-400 mt-0.5 print:text-[5px]">
                  BAMAKO (MALI)
                </span>
              </div>
              <span className="text-[9px] font-bold text-slate-600 mt-0.5 print:text-[7.5px]">La Direction Financière</span>
            </div>
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
              title="Notifier le propriétaire sur WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Avis WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Télécharger le bordereau en PDF"
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
