import React, { useRef } from 'react';
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

  if (!isOpen || !contract) return null;

  const handlePrint = () => {
    if (printRef.current) {
      printElement(printRef.current, `Acte_${contract.reference}_${contract.contractType}`);
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Header - Screen only */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm sm:text-base font-heading">
              Aperçu & Impression de l'Acte Juridique ({contract.reference})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer / Exporter PDF</span>
            </button>
            <button
              onClick={() => dispatch(closeContractPrintModal())}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Contract Body */}
        <div ref={printRef} className="p-8 sm:p-12 overflow-y-auto space-y-8 text-slate-900 bg-white font-sans text-xs sm:text-sm">
          {/* Agency Official Header */}
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
              <span className="text-[10px] font-black uppercase text-slate-500 block">RÉFÉRENCE OFFICIELLE</span>
              <span className="text-sm font-mono font-black text-slate-900">{contract.reference}</span>
              <span className="text-[10px] text-slate-500 block">Fait à Bamako, le {formatDate(new Date().toISOString().split('T')[0])}</span>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center py-4 bg-slate-100 rounded-xl border border-slate-200">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 font-heading">
              {contract.title}
            </h2>
            <span className="text-xs text-slate-600 font-medium">
              Conforme aux dispositions du Code Civil et Droit Foncier de la République du Mali
            </span>
          </div>

          {/* Parties Identification */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              ENTRE LES SOUSSIGNÉS :
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="space-y-1">
                <span className="font-extrabold uppercase text-slate-700 block">
                  D'UNE PART, LE BAILLEUR / MANDANT :
                </span>
                <p className="font-bold text-slate-900 text-sm">{contract.partyAName}</p>
                <p className="text-slate-600">Téléphone : {contract.partyAPhone}</p>
                <p className="text-slate-500 italic">Représenté légalement par l'agence {agencyConfig.name}</p>
              </div>

              <div className="space-y-1">
                <span className="font-extrabold uppercase text-slate-700 block">
                  D'AUTRE PART, LE PRENEUR / ACQUÉREUR :
                </span>
                <p className="font-bold text-slate-900 text-sm">{contract.partyBName}</p>
                <p className="text-slate-600">Téléphone : {contract.partyBPhone}</p>
                <p className="text-slate-500 italic">Ci-après dénommé "Le Preneur"</p>
              </div>
            </div>
          </div>

          {/* Property Object */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              ARTICLE 1 : DÉSIGNATION DU BIEN
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Le Bailleur concède par les présentes au Preneur, qui accepte, la jouissance du bien immobilier désigné ci-après : 
              <strong className="text-slate-900"> {contract.propertyTitle}</strong>.
            </p>
          </div>

          {/* Financial Conditions */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              ARTICLE 2 : CONDITIONS FINANCIÈRES & LOYER
            </h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Montant Principal / Loyer Convenu :</span>
                <strong className="text-sm text-slate-900">{formatFCFA(contract.amountFCFA)}</strong>
              </div>
              {contract.depositFCFA && contract.depositFCFA > 0 && (
                <div className="flex justify-between">
                  <span>Dépôt de Garantie (Caution) :</span>
                  <strong className="text-sm text-slate-900">{formatFCFA(contract.depositFCFA)}</strong>
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
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              ARTICLE 3 : CLAUSES ET ENGAGEMENTS PARTICULIERS
            </h3>
            <ul className="list-decimal list-inside space-y-1.5 text-xs text-slate-700 leading-relaxed">
              {contract.clauses.map((clause, idx) => (
                <li key={idx} className="pl-1">
                  {clause}
                </li>
              ))}
            </ul>
          </div>

          {/* Signatures & Agency Stamp Block */}
          <div className="pt-8 grid grid-cols-3 gap-6 border-t-2 border-slate-200 items-end">
            <div className="text-center space-y-16">
              <p className="text-xs font-bold uppercase text-slate-700">Signature du Bailleur / Vendeur</p>
              <div className="border-t border-slate-400 pt-2 text-[10px] text-slate-500">(Précédé de "Lu et approuvé")</div>
            </div>

            {/* Official Agency Stamp Simulation */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-36 h-36 rounded-full border-4 border-dashed border-slate-800 flex flex-col items-center justify-center p-2 text-center rotate-[-4deg]">
                <span className="text-[8px] font-black text-slate-900 uppercase leading-tight font-heading">
                  {agencyConfig.name}
                </span>
                <span className="text-[6px] font-mono text-slate-600 uppercase my-0.5">
                  RCCM : {agencyConfig.rccm}
                </span>
                <div className="w-8 h-0.5 bg-amber-500 my-0.5" />
                <span className="text-[7px] font-black text-emerald-700 uppercase tracking-wider">
                  SCEAU OFFICIEL
                </span>
                <span className="text-[6px] font-mono text-slate-400 mt-0.5">
                  BAMAKO - MALI
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-600 mt-1">Visa Direction Agence</span>
            </div>

            <div className="text-center space-y-16">
              <p className="text-xs font-bold uppercase text-slate-700">Signature du Preneur / Acquéreur</p>
              <div className="border-t border-slate-400 pt-2 text-[10px] text-slate-500">(Précédé de "Lu et approuvé")</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
