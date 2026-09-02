import React, { useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { closeContractPrintModal } from '../../store/uiSlice';
import { formatFCFA, formatDate } from '../../utils/formatters';
import { printElement } from '../../utils/printUtils';
import { 
  X, 
  Printer, 
  Building2, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  Download,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

export const ContractPrintModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isContractPrintModalOpen);
  const contract = useAppSelector((state) => state.ui.selectedContractForPrint);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const printRef = useRef<HTMLDivElement>(null);

  // Close with ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch(closeContractPrintModal());
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, dispatch]);

  if (!isOpen || !contract) return null;

  const handleClose = () => {
    dispatch(closeContractPrintModal());
  };

  const handlePrint = () => {
    if (printRef.current) {
      printElement(printRef.current, `Acte_${contract.reference}_${contract.contractType}`);
    } else {
      window.print();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-start sm:items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn print:p-0 print:bg-white"
      onClick={handleClose}
    >
      <div 
        className="bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh] my-auto print:max-h-none print:shadow-none print:border-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Screen only */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400 shrink-0" />
            <h3 className="font-extrabold text-xs sm:text-sm font-heading truncate max-w-[220px] sm:max-w-none">
              Impression de l'Acte ({contract.reference})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 sm:px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimer / PDF</span>
              <span className="sm:hidden">Imprimer</span>
            </button>
            <button
              onClick={handleClose}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Fermer la fenêtre (Échap)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Fermer</span>
            </button>
          </div>
        </div>

        {/* Contract Preview - Printable Sheet */}
        <div 
          ref={printRef} 
          id="printable-contract"
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 text-slate-900 bg-white font-sans text-xs sm:text-sm print:p-3 print:space-y-2"
        >
          {/* Agency Official Header */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between gap-4 print:pb-1.5 avoid-break">
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
              <span className="text-[9px] font-black uppercase text-slate-500 block print:text-[7.5px]">RÉFÉRENCE OFFICIELLE</span>
              <span className="text-xs font-mono font-black text-slate-900 print:text-[10px]">{contract.reference}</span>
              <span className="text-[9px] text-slate-500 block print:text-[7.5px]">Fait à Bamako, le {formatDate(new Date().toISOString().split('T')[0])}</span>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center py-2.5 bg-slate-100 rounded-lg border border-slate-200 avoid-break print:py-1.5">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 font-heading print:text-[11px]">
              {contract.title}
            </h2>
            <span className="text-[10px] text-slate-600 font-medium print:text-[8.5px]">
              Conforme aux dispositions du Code Civil et Droit Foncier de la République du Mali
            </span>
          </div>

          {/* Parties Identification */}
          <div className="space-y-2 avoid-break">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 print:text-[9px]">
              ENTRE LES SOUSSIGNÉS :
            </h3>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs print:p-2 print:text-[9px]">
              <div className="space-y-0.5">
                <span className="font-extrabold uppercase text-slate-700 block text-[9px] print:text-[8px]">
                  D'UNE PART, LE BAILLEUR / MANDANT :
                </span>
                <p className="font-bold text-slate-900 text-xs print:text-[10px]">{contract.partyAName}</p>
                <p className="text-slate-600 text-[10px] print:text-[8.5px]">Tél : {contract.partyAPhone}</p>
                <p className="text-slate-500 italic text-[9.5px] print:text-[8px]">Représenté par {agencyConfig.name}</p>
              </div>

              <div className="space-y-0.5">
                <span className="font-extrabold uppercase text-slate-700 block text-[9px] print:text-[8px]">
                  D'AUTRE PART, LE PRENEUR / ACQUÉREUR :
                </span>
                <p className="font-bold text-slate-900 text-xs print:text-[10px]">{contract.partyBName}</p>
                <p className="text-slate-600 text-[10px] print:text-[8.5px]">Tél : {contract.partyBPhone}</p>
                <p className="text-slate-500 italic text-[9.5px] print:text-[8px]">Ci-après dénommé "Le Preneur"</p>
              </div>
            </div>
          </div>

          {/* Property Object */}
          <div className="space-y-1 avoid-break">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 print:text-[9px]">
              ARTICLE 1 : DÉSIGNATION DU BIEN
            </h3>
            <p className="text-[11px] text-slate-700 leading-snug print:text-[9px]">
              Le Bailleur concède par les présentes au Preneur, qui accepte, la jouissance du bien immobilier désigné ci-après : 
              <strong className="text-slate-900"> {contract.propertyTitle}</strong>.
            </p>
          </div>

          {/* Financial Conditions */}
          <div className="space-y-1 avoid-break">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 print:text-[9px]">
              ARTICLE 2 : CONDITIONS FINANCIÈRES & MODALITÉS
            </h3>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1 text-xs print:p-1.5 print:text-[9px]">
              <div className="flex justify-between">
                <span>Montant Principal / Loyer Convenu :</span>
                <strong className="text-xs sm:text-sm text-slate-900 print:text-[10.5px]">{formatFCFA(contract.amountFCFA)}</strong>
              </div>
              {contract.depositFCFA && contract.depositFCFA > 0 && (
                <div className="flex justify-between">
                  <span>Dépôt de Garantie (Caution) :</span>
                  <strong className="text-xs sm:text-sm text-slate-900 print:text-[10.5px]">{formatFCFA(contract.depositFCFA)}</strong>
                </div>
              )}
              <div className="flex justify-between">
                <span>Date de prise d'effet :</span>
                <strong>{formatDate(contract.startDate)}</strong>
              </div>
              {contract.endDate && (
                <div className="flex justify-between">
                  <span>Date d'échéance :</span>
                  <strong>{formatDate(contract.endDate)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Clauses */}
          <div className="space-y-1 avoid-break">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 print:text-[9px]">
              ARTICLE 3 : CLAUSES ET ENGAGEMENTS PARTICULIERS
            </h3>
            <ul className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-700 leading-snug print:text-[9px] print:leading-tight">
              {contract.clauses.map((clause, idx) => (
                <li key={idx} className="pl-1">
                  {clause}
                </li>
              ))}
            </ul>
          </div>

          {/* Signatures & Agency Stamp Block */}
          <div className="pt-4 grid grid-cols-3 gap-4 border-t-2 border-slate-200 items-end avoid-break print:pt-2">
            <div className="text-center space-y-6 print:space-y-4">
              <p className="text-[9.5px] font-bold uppercase text-slate-700 print:text-[8px]">Signature du Bailleur / Vendeur</p>
              <div className="border-t border-slate-400 pt-1 text-[8.5px] text-slate-500 print:text-[7px]">(« Lu et approuvé »)</div>
            </div>

            {/* Official Agency Stamp Simulation */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-1.5 text-center rotate-[-3deg] print:w-20 print:h-20">
                <span className="text-[6.5px] font-black text-slate-900 uppercase leading-tight font-heading print:text-[5.5px]">
                  {agencyConfig.name}
                </span>
                <span className="text-[5px] font-mono text-slate-600 uppercase my-0.5">
                  RCCM : {agencyConfig.rccm}
                </span>
                <div className="w-5 h-0.5 bg-amber-500 my-0.5" />
                <span className="text-[6px] font-black text-emerald-700 uppercase tracking-wider print:text-[5px]">
                  SCEAU OFFICIEL
                </span>
                <span className="text-[5px] font-mono text-slate-400 mt-0.5">
                  BAMAKO - MALI
                </span>
              </div>
              <span className="text-[9px] font-bold text-slate-600 mt-0.5 print:text-[7.5px]">Visa Direction Agence</span>
            </div>

            <div className="text-center space-y-6 print:space-y-4">
              <p className="text-[9.5px] font-bold uppercase text-slate-700 print:text-[8px]">Signature du Preneur / Acquéreur</p>
              <div className="border-t border-slate-400 pt-1 text-[8.5px] text-slate-500 print:text-[7px]">(« Lu et approuvé »)</div>
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

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer l'Acte</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
