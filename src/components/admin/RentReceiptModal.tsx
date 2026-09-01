import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { closeReceiptModal } from '../../store/uiSlice';
import { formatFCFA, formatDate, AGENCY_INFO } from '../../utils/formatters';
import { printElement } from '../../utils/printUtils';
import { X, Printer, Download, CheckCircle2, ShieldCheck, Building2, Landmark } from 'lucide-react';

export const RentReceiptModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isReceiptModalOpen);
  const activeReceipt = useAppSelector((state) => state.tenants.activeReceiptForPrint);

  if (!isOpen || !activeReceipt) return null;

  const handlePrint = () => {
    printElement('printable-rent-receipt', `Quittance_Loyer_${activeReceipt.receiptNumber}`);
  };

  // Helper to convert small amounts to French words
  const getAmountInWords = (amt: number): string => {
    // Standard friendly conversion
    if (amt === 150000) return "Cent cinquante mille Francs CFA";
    if (amt === 250000) return "Deux cent cinquante mille Francs CFA";
    if (amt === 350000) return "Trois cent cinquante mille Francs CFA";
    if (amt === 500000) return "Cinq cent mille Francs CFA";
    if (amt === 750000) return "Sept cent cinquante mille Francs CFA";
    if (amt === 1000000) return "Un million de Francs CFA";
    return `${formatFCFA(amt)}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-4 flex items-center justify-center animate-fadeIn print:p-0 print:bg-white">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col print:shadow-none print:border-none print:rounded-none"
        id="printable-rent-receipt"
      >
        {/* Screen Controls Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="font-extrabold text-xs font-heading">
              Quittance de Loyer N° {activeReceipt.receiptNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer / Exporter PDF</span>
            </button>

            <button
              onClick={() => dispatch(closeReceiptModal())}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body (A4 Style Paper) */}
        <div className="p-8 sm:p-12 space-y-8 bg-white text-slate-900 font-sans print:p-6 print:space-y-6">
          {/* Agency Letterhead */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-black text-base shadow-sm">
                  M
                </div>
                <div>
                  <h1 className="font-black text-xl text-slate-950 font-heading tracking-tight uppercase">
                    {AGENCY_INFO.name}
                  </h1>
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                    {AGENCY_INFO.tagline}
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 space-y-0.5 pt-2">
                <p>{AGENCY_INFO.address}</p>
                <p>Bamako, République du Mali</p>
                <p>Tél : {AGENCY_INFO.phoneDisplay} • Email : {AGENCY_INFO.email}</p>
                <p className="text-[10px] text-slate-400 font-mono">NIF : 085214079M • RCCM : MA.BKO.2021.B.4120</p>
              </div>
            </div>

            {/* Document Title & Reference */}
            <div className="text-left sm:text-right space-y-1">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-wider">
                QUITTANCE DE LOYER
              </span>
              <p className="font-mono font-bold text-xs text-slate-900 pt-1">
                N° : {activeReceipt.receiptNumber}
              </p>
              <p className="text-[11px] text-slate-500">
                Date d'émission : {formatDate(activeReceipt.paymentDate)}
              </p>
            </div>
          </div>

          {/* Tenant Information Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px] block">Locataire / Preneur :</span>
              <p className="font-extrabold text-sm text-slate-900">{activeReceipt.tenantName}</p>
              <p className="text-slate-600">Bamako, Mali</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px] block">Bien Donné à Bail :</span>
              <p className="font-bold text-slate-900">{activeReceipt.propertyTitle}</p>
              <p className="text-slate-600">Affectation : Habitation / Commercial</p>
            </div>
          </div>

          {/* Statement of Payment */}
          <div className="space-y-3 text-xs leading-relaxed text-slate-800">
            <p>
              L'agence <strong>{AGENCY_INFO.name}</strong>, agissant en qualité de gestionnaire mandataire du bien susmentionné, reconnaît avoir reçu de <strong>{activeReceipt.tenantName}</strong> la somme de :
            </p>

            {/* Amount Box */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 block">Montant Total Reçu :</span>
                <span className="text-2xl font-black font-heading text-white">{formatFCFA(activeReceipt.amount)}</span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 block">En toutes lettres :</span>
                <span className="font-bold text-amber-300 text-xs">{getAmountInWords(activeReceipt.amount)}</span>
              </div>
            </div>

            <p>
              Ce montant correspond au règlement intégral du loyer pour le terme de : <strong className="text-slate-900 bg-amber-100 px-2 py-0.5 rounded">{activeReceipt.periodMonth}</strong>.
            </p>
          </div>

          {/* Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 font-bold text-slate-900 text-[11px]">
                <tr>
                  <th className="p-3">Désignation</th>
                  <th className="p-3">Mode de Paiement</th>
                  <th className="p-3 text-right">Montant (FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-medium">Loyer mensuel principal ({activeReceipt.periodMonth})</td>
                  <td className="p-3 font-mono capitalize">
                    {activeReceipt.paymentMethod.replace('_', ' ')} {activeReceipt.transactionRef && `(${activeReceipt.transactionRef})`}
                  </td>
                  <td className="p-3 text-right font-extrabold text-slate-900">{formatFCFA(activeReceipt.amount)}</td>
                </tr>
                <tr>
                  <td className="p-3 text-slate-500">Charges communes & gestion</td>
                  <td className="p-3 text-slate-500">Incluses</td>
                  <td className="p-3 text-right font-medium text-slate-500">0 FCFA</td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="p-3 text-right uppercase text-[10px]">Net Réglé :</td>
                  <td className="p-3 text-right font-black text-sm text-slate-950">{formatFCFA(activeReceipt.amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Legal Notice */}
          <p className="text-[10px] text-slate-500 leading-normal italic">
            * Cette quittance annule tous les reçus provisoires antérieurs pour la même période et n'emporte pas novation du contrat de bail initial conformément aux usages immobiliers au Mali.
          </p>

          {/* Signatures & Stamp */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
            <div>
              <p className="font-bold text-slate-700">Le Locataire :</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Pour acquit</p>
              <div className="h-16 mt-2 border-b border-dashed border-slate-300"></div>
            </div>

            <div className="text-right">
              <p className="font-bold text-slate-900">Pour l'Agence {AGENCY_INFO.name} :</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Direction Générale & Gérance</p>
              
              {/* Simulated Stamp */}
              <div className="inline-block mt-2 p-2.5 rounded-xl border-2 border-slate-900 bg-slate-50 text-[10px] font-mono text-center rotate-[-3deg] shadow-xs">
                <span className="font-black text-slate-900 block">MALI IMMO PRESTIGE</span>
                <span className="text-emerald-700 font-bold block">★ ACQUITTÉ & ENCAISSÉ ★</span>
                <span className="text-[9px] text-slate-500 block">ACI 2000 BAMAKO</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
