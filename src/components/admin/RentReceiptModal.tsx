import React, { useRef, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { closeReceiptModal, addToast } from '../../store/uiSlice';
import { formatFCFA, formatDate } from '../../utils/formatters';
import { printElement } from '../../utils/printUtils';
import { sendRentReceiptWhatsApp } from '../../utils/whatsappUtils';
import { downloadElementAsPdf } from '../../utils/pdfExport';
import { X, Printer, Building2, ShieldCheck, CheckCircle2, MessageCircle, Download, Loader2 } from 'lucide-react';

export const RentReceiptModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isReceiptModalOpen);
  const activeReceipt = useAppSelector((state) => state.tenants.activeReceiptForPrint);
  const agencyConfig = useAppSelector((state) => state.agency.config);
  const tenants = useAppSelector((state) => state.tenants.items);
  const matchedTenant = tenants.find((t) => t.id === activeReceipt?.tenantId);

  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Close with ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch(closeReceiptModal());
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
    dispatch(closeReceiptModal());
  };

  const handlePrint = () => {
    if (printRef.current) {
      printElement(printRef.current, `Quittance_Loyer_${activeReceipt.receiptNumber}`);
    } else {
      printElement('printable-rent-receipt', `Quittance_Loyer_${activeReceipt.receiptNumber}`);
    }
  };

  const handleWhatsAppShare = () => {
    sendRentReceiptWhatsApp(activeReceipt, agencyConfig, matchedTenant?.phone);
    dispatch(addToast({
      type: 'success',
      message: 'Discussion WhatsApp ouverte avec la quittance pré-remplie.'
    }));
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const fileName = `Quittance_Loyer_${activeReceipt.receiptNumber}_${activeReceipt.tenantName.replace(/\s+/g, '_')}`;
      const success = await downloadElementAsPdf(printRef.current || 'printable-rent-receipt', fileName);
      if (success) {
        dispatch(addToast({
          type: 'success',
          message: 'Téléchargement de la quittance PDF réussi !'
        }));
      } else {
        // Fallback to print if canvas fails
        handlePrint();
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Helper to convert small amounts to French words
  const getAmountInWords = (amt: number): string => {
    if (amt === 150000) return "Cent cinquante mille Francs CFA";
    if (amt === 250000) return "Deux cent cinquante mille Francs CFA";
    if (amt === 350000) return "Trois cent cinquante mille Francs CFA";
    if (amt === 500000) return "Cinq cent mille Francs CFA";
    if (amt === 750000) return "Sept cent cinquante mille Francs CFA";
    if (amt === 1000000) return "Un million de Francs CFA";
    return `${formatFCFA(amt)}`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 md:p-6 flex items-start sm:items-center justify-center animate-fadeIn print:p-0 print:bg-white"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[94vh] sm:max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto print:max-h-none print:shadow-none print:border-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Screen Controls Header */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="font-extrabold text-xs font-heading truncate max-w-[200px] sm:max-w-none">
              Quittance de Loyer N° {activeReceipt.receiptNumber}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="px-2.5 sm:px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Envoyer la quittance officielle par WhatsApp au locataire"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden md:inline">WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-2.5 sm:px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Télécharger le fichier PDF directement"
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
              className="px-2.5 sm:px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Imprimer sur papier"
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

        {/* Printable Document Body (A4 Style Paper) */}
        <div 
          ref={printRef} 
          id="printable-rent-receipt" 
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-5 bg-white text-slate-900 font-sans print:p-3 print:space-y-2.5 text-xs sm:text-sm single-page-a4"
        >
          {/* Agency Letterhead */}
          <div className="flex items-start justify-between gap-4 pb-3 border-b-2 border-slate-900 print:pb-1.5">
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
                    {agencyConfig.slogan || 'Agence Immobilière & Gestion Déléguée'}
                  </p>
                </div>
              </div>

              <div className="text-[10px] text-slate-600 space-y-0.5 pt-1 font-medium print:text-[8.5px] print:leading-tight">
                <p>{agencyConfig.address} • Bamako, République du Mali</p>
                <p>Tél : {agencyConfig.phoneDisplay} • Email : {agencyConfig.email}</p>
                <p className="text-[9px] text-slate-500 font-mono print:text-[8px]">
                  NIF : {agencyConfig.nif} • RCCM : {agencyConfig.rccm}
                </p>
              </div>
            </div>

            {/* Document Title & Reference */}
            <div className="text-right space-y-0.5 shrink-0">
              <span className={`inline-block px-2.5 py-0.5 text-white rounded text-[11px] font-black uppercase tracking-wider print:text-[9.5px] ${
                activeReceipt.paymentType === 'partiel' || (activeReceipt.remainingBalance && activeReceipt.remainingBalance > 0)
                  ? 'bg-amber-600'
                  : 'bg-slate-900'
              }`}>
                {activeReceipt.paymentType === 'partiel' || (activeReceipt.remainingBalance && activeReceipt.remainingBalance > 0)
                  ? 'QUITTANCE D\'ACOMPTE (PARTIEL)'
                  : 'QUITTANCE DE LOYER'}
              </span>
              <p className="font-mono font-bold text-xs text-slate-900 print:text-[10px]">
                N° : {activeReceipt.receiptNumber}
              </p>
              <p className="text-[10px] text-slate-500 print:text-[8.5px]">
                Date d'émission : {formatDate(activeReceipt.paymentDate)}
              </p>
            </div>
          </div>

          {/* Tenant Information Card */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs print:p-2 print:text-[9.5px]">
            <div className="space-y-0.5">
              <span className="text-slate-500 font-bold uppercase text-[9px] block print:text-[8px]">Locataire / Preneur :</span>
              <p className="font-extrabold text-xs text-slate-900 print:text-[10.5px]">{activeReceipt.tenantName}</p>
              <p className="text-slate-600 text-[10px] print:text-[8.5px]">Bamako, Mali</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-slate-500 font-bold uppercase text-[9px] block print:text-[8px]">Bien Donné à Bail :</span>
              <p className="font-bold text-xs text-slate-900 print:text-[10.5px]">{activeReceipt.propertyTitle}</p>
              <p className="text-slate-600 text-[10px] print:text-[8.5px]">Affectation : Habitation / Commercial</p>
            </div>
          </div>

          {/* Statement of Payment */}
          <div className="space-y-2 text-xs leading-relaxed text-slate-800 print:space-y-1.5 print:text-[9.5px] print:leading-snug">
            <p>
              L'agence <strong>{agencyConfig.name}</strong>, agissant en qualité de gestionnaire mandataire du bien susmentionné, reconnaît avoir reçu de <strong>{activeReceipt.tenantName}</strong> la somme de :
            </p>

            {/* Amount Box */}
            <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-2 shadow-xs print:p-2">
              <div>
                <span className="text-[9px] uppercase font-bold text-amber-400 block print:text-[8px]">
                  {activeReceipt.paymentType === 'partiel' ? 'Acompte Partiel Encaissé :' : 'Montant Total Reçu :'}
                </span>
                <span className="text-lg sm:text-xl font-black font-heading text-white print:text-sm">{formatFCFA(activeReceipt.amount)}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block print:text-[8px]">En toutes lettres :</span>
                <span className="font-bold text-amber-300 text-xs print:text-[9.5px]">{getAmountInWords(activeReceipt.amount)}</span>
              </div>
            </div>

            {activeReceipt.paymentType === 'partiel' || (activeReceipt.remainingBalance && activeReceipt.remainingBalance > 0) ? (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 flex items-center justify-between print:p-1.5">
                <div>
                  <span className="text-[10px] font-bold uppercase block print:text-[8px]">Nature du Versement :</span>
                  <span className="text-xs font-black print:text-[9px]">Acompte Partiel sur Loyer ({activeReceipt.periodMonth})</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-rose-600 uppercase font-bold block print:text-[8px]">Reliquat Restant Dû :</span>
                  <span className="text-sm font-black text-rose-700 font-heading print:text-xs">
                    {formatFCFA(activeReceipt.remainingBalance || 0)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] print:text-[9px]">
                Ce montant correspond au règlement intégral du loyer pour le terme de : <strong className="text-slate-900 bg-amber-100 px-1.5 py-0.5 rounded">{activeReceipt.periodMonth}</strong>.
              </p>
            )}
          </div>

          {/* Breakdown Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs print:text-[9px]">
            <table className="w-full text-left">
              <thead className="bg-slate-100 font-bold text-slate-900 text-[10px] print:text-[8.5px]">
                <tr>
                  <th className="p-2 print:p-1.5">Désignation</th>
                  <th className="p-2 print:p-1.5">Mode de Paiement</th>
                  <th className="p-2 print:p-1.5 text-right">Montant (FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeReceipt.totalDue && activeReceipt.totalDue > activeReceipt.amount && (
                  <tr>
                    <td className="p-2 text-slate-600 print:p-1.5">Loyer total contractuel exigible ({activeReceipt.periodMonth})</td>
                    <td className="p-2 text-slate-500 font-mono print:p-1.5">Échéance</td>
                    <td className="p-2 text-right font-bold text-slate-700 print:p-1.5">{formatFCFA(activeReceipt.totalDue)}</td>
                  </tr>
                )}
                <tr>
                  <td className="p-2 font-medium print:p-1.5">
                    {activeReceipt.paymentType === 'partiel' ? `Acompte versé (${activeReceipt.periodMonth})` : `Loyer mensuel principal (${activeReceipt.periodMonth})`}
                  </td>
                  <td className="p-2 font-mono capitalize print:p-1.5">
                    {activeReceipt.paymentMethod.replace('_', ' ')} {activeReceipt.transactionRef && `(${activeReceipt.transactionRef})`}
                  </td>
                  <td className="p-2 text-right font-extrabold text-slate-900 print:p-1.5">{formatFCFA(activeReceipt.amount)}</td>
                </tr>
                {activeReceipt.remainingBalance && activeReceipt.remainingBalance > 0 ? (
                  <tr className="bg-amber-50/50">
                    <td className="p-2 font-bold text-rose-700 print:p-1.5">Reliquat restant à solder (Dû par le preneur)</td>
                    <td className="p-2 text-amber-800 font-medium text-[10px] print:p-1.5">En instance</td>
                    <td className="p-2 text-right font-black text-rose-600 print:p-1.5">{formatFCFA(activeReceipt.remainingBalance)}</td>
                  </tr>
                ) : null}
                <tr>
                  <td className="p-2 text-slate-500 print:p-1.5">Charges communes & gestion</td>
                  <td className="p-2 text-slate-500 print:p-1.5">Incluses</td>
                  <td className="p-2 text-right font-medium text-slate-500 print:p-1.5">0 FCFA</td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="p-2 text-right uppercase text-[9px] print:p-1.5 print:text-[8px]">Net Réglé ce jour :</td>
                  <td className="p-2 text-right font-black text-xs text-emerald-700 print:p-1.5 print:text-[10px]">{formatFCFA(activeReceipt.amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Legal Notice */}
          <p className="text-[9px] text-slate-500 leading-snug italic print:text-[7.5px]">
            {activeReceipt.paymentType === 'partiel' || (activeReceipt.remainingBalance && activeReceipt.remainingBalance > 0)
              ? `* Ce document atteste uniquement de l'encaissement de l'acompte susmentionné. Le preneur demeure débiteur du reliquat de ${formatFCFA(activeReceipt.remainingBalance || 0)} jusqu'à parfait règlement sans novation du bail initial.`
              : '* Cette quittance annule tous les reçus provisoires antérieurs pour la même période et n\'emporte pas novation du contrat de bail initial conformément aux usages immobiliers au Mali.'}
          </p>

          {/* Signatures & Stamp */}
          <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs print:pt-2 print:text-[9.5px]">
            <div>
              <p className="font-bold text-slate-700 text-[10px] print:text-[8.5px]">Le Locataire :</p>
              <p className="text-[9px] text-slate-400 mt-0.5 print:text-[7.5px]">Pour acquit</p>
              <div className="h-8 mt-1 border-b border-dashed border-slate-300 max-w-[150px]"></div>
            </div>

            <div className="text-right">
              <p className="font-bold text-slate-900 text-[10px] print:text-[8.5px]">Pour l'Agence {agencyConfig.name} :</p>
              <p className="text-[9px] text-slate-500 mt-0.5 print:text-[7.5px]">Direction Générale & Gérance</p>
              
              {/* Simulated Stamp */}
              <div className="inline-block mt-1 p-1.5 rounded-lg border-2 border-slate-900 bg-slate-50 text-[9px] font-mono text-center rotate-[-2deg] shadow-2xs print:p-1">
                <span className="font-black text-slate-900 block uppercase print:text-[7.5px]">{agencyConfig.name}</span>
                <span className="text-emerald-700 font-bold block print:text-[7px]">★ ACQUITTÉ & ENCAISSÉ ★</span>
                <span className="text-[8px] text-slate-500 block print:text-[6.5px]">BAMAKO (MALI)</span>
              </div>
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
              title="Envoyer au locataire par WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Envoyer WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Télécharger le fichier PDF"
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

