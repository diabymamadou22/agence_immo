import React, { useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { closePayoutPrintModal } from '../../store/uiSlice';
import { formatFCFA, formatDate } from '../../utils/formatters';
import { 
  X, 
  Printer, 
  Building2, 
  DollarSign, 
  Receipt, 
  CheckCircle2 
} from 'lucide-react';

export const PayoutPrintModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isPayoutPrintModalOpen);
  const payout = useAppSelector((state) => state.ui.selectedPayoutForPrint);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  if (!isOpen || !payout) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Screen Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm sm:text-base font-heading">
              Bordereau de Reversement des Loyers ({payout.payoutNumber})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer Bordereau</span>
            </button>
            <button
              onClick={() => dispatch(closePayoutPrintModal())}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Statement */}
        <div className="p-8 sm:p-12 overflow-y-auto space-y-8 text-slate-900 bg-white font-sans text-xs sm:text-sm">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-amber-600" />
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase font-heading tracking-tight">
                  {agencyConfig.name}
                </h1>
              </div>
              <p className="text-xs font-semibold text-slate-600 italic">
                {agencyConfig.slogan}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                RCCM : {agencyConfig.rccm} • NIF : {agencyConfig.nif}
              </p>
              <p className="text-[11px] text-slate-500">
                {agencyConfig.address} • Tel: {agencyConfig.phoneDisplay}
              </p>
            </div>

            <div className="text-right space-y-1 self-end sm:self-center border border-slate-300 p-3 rounded-xl bg-slate-50">
              <span className="text-[10px] font-black uppercase text-slate-500 block">BORDEREAU OFFICIEL</span>
              <span className="text-sm font-mono font-black text-slate-900">{payout.payoutNumber}</span>
              <span className="text-[10px] text-slate-500 block">Date : {formatDate(payout.payoutDate)}</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 font-heading">
              BORDEREAU DE REVERSEMENT MENSUEL DES LOYERS
            </h2>
            <span className="text-xs text-slate-700 font-bold">
              Période concernée : {payout.periodMonth}
            </span>
          </div>

          {/* Beneficiary */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              BÉNÉFICIAIRE / PROPRIÉTAIRE DU PARC IMMOBILIER :
            </span>
            <p className="text-base font-black text-slate-900">{payout.ownerName}</p>
            <p className="text-xs text-slate-600">
              Mode de règlement : <strong className="text-slate-800">{payout.paymentMethod}</strong> (Réf : {payout.transactionReference || 'Direct'})
            </p>
          </div>

          {/* Financial Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-extrabold uppercase">
                <tr>
                  <th className="py-3 px-4">Désignation des Opérations</th>
                  <th className="py-3 px-4 text-right">Montant (FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="py-3.5 px-4 text-slate-800 font-bold">
                    Total Loyers Bruts Encaissés ({payout.periodMonth})
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                    {formatFCFA(payout.grossRentCollected)}
                  </td>
                </tr>

                <tr className="bg-amber-50/40 text-amber-900">
                  <td className="py-3.5 px-4">
                    Déduction Commission de Gestion Agence ({payout.agencyCommissionPercent}%)
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-amber-700">
                    -{formatFCFA(payout.agencyCommissionAmount)}
                  </td>
                </tr>

                {payout.maintenanceDeductions > 0 && (
                  <tr className="bg-rose-50/40 text-rose-900">
                    <td className="py-3.5 px-4">
                      Déduction Travaux & Entretien Conservatoire
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-700">
                      -{formatFCFA(payout.maintenanceDeductions)}
                    </td>
                  </tr>
                )}

                <tr className="bg-slate-900 text-white font-bold text-sm">
                  <td className="py-4 px-4 uppercase tracking-wider">
                    NET REVERSÉ AU PROPRIÉTAIRE (FCFA)
                  </td>
                  <td className="py-4 px-4 text-right font-black text-amber-400 text-base font-heading">
                    {formatFCFA(payout.netPaidToOwner)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures & Stamp */}
          <div className="pt-8 grid grid-cols-2 gap-8 border-t-2 border-slate-200 items-end">
            <div className="text-center space-y-16">
              <p className="text-xs font-bold uppercase text-slate-700">Pour Acquit le Bénéficiaire</p>
              <div className="border-t border-slate-400 pt-2 text-[10px] text-slate-500">(Signature et Date)</div>
            </div>

            {/* Stamp */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-32 h-32 rounded-full border-4 border-dashed border-slate-800 flex flex-col items-center justify-center p-2 text-center rotate-[-3deg]">
                <span className="text-[7px] font-black text-slate-900 uppercase leading-tight font-heading">
                  {agencyConfig.name}
                </span>
                <div className="w-6 h-0.5 bg-amber-500 my-0.5" />
                <span className="text-[7px] font-black text-emerald-700 uppercase tracking-wider">
                  PAYÉ & CERTIFIÉ
                </span>
                <span className="text-[6px] font-mono text-slate-400 mt-0.5">
                  BAMAKO (MALI)
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-600 mt-1">La Direction Financière</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
