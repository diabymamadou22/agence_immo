import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { closeMortgageModal } from '../../store/uiSlice';
import { formatFCFA } from '../../utils/formatters';
import { 
  X, 
  Calculator, 
  Landmark, 
  HelpCircle, 
  CheckCircle2, 
  Percent, 
  Calendar, 
  Wallet,
  DollarSign
} from 'lucide-react';

export const MortgageCalculatorModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isMortgageModalOpen);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  // Default values for loan simulator in Mali (UEMOA Zone)
  const [propertyPrice, setPropertyPrice] = useState<number>(35000000);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(7.5);
  const [loanDurationYears, setLoanDurationYears] = useState<number>(15);

  if (!isOpen) return null;

  // Calculation Logic
  const downPaymentAmount = Math.round((propertyPrice * downPaymentPercent) / 100);
  const principal = propertyPrice - downPaymentAmount;
  const monthlyInterestRate = interestRate / 100 / 12;
  const numberOfPayments = loanDurationYears * 12;

  // Monthly payment formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
  const monthlyPayment =
    monthlyInterestRate > 0
      ? Math.round(
          (principal *
            (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments))) /
            (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)
        )
      : Math.round(principal / numberOfPayments);

  const totalRepayment = monthlyPayment * numberOfPayments;
  const totalInterestPaid = totalRepayment - principal;
  const minRequiredMonthlySalary = Math.round(monthlyPayment / 0.33); // 33% debt ratio in Mali banks

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-fadeIn">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg font-heading">
                Simulateur de Prêt Immobilier Bancaire
              </h3>
              <p className="text-xs text-slate-400">Normes bancaires UEMOA (BDM-SA, BOA Mali, Ecobank)</p>
            </div>
          </div>

          <button
            onClick={() => dispatch(closeMortgageModal())}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form & Calculation */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Prix du Bien (FCFA)
              </label>
              <input
                type="number"
                value={propertyPrice}
                onChange={(e) => setPropertyPrice(parseFloat(e.target.value) || 0)}
                step={500000}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Apport Personnel ({downPaymentPercent}% = {formatFCFA(downPaymentAmount)})
              </label>
              <input
                type="range"
                min={10}
                max={50}
                step={5}
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Durée du Crédit ({loanDurationYears} Ans)
              </label>
              <select
                value={loanDurationYears}
                onChange={(e) => setLoanDurationYears(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 text-sm"
              >
                <option value={5}>5 ans (60 mensualités)</option>
                <option value={10}>10 ans (120 mensualités)</option>
                <option value={15}>15 ans (180 mensualités) - Recommandé</option>
                <option value={20}>20 ans (240 mensualités)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Taux d'Intérêt Annuel Fixe (%)
              </label>
              <input
                type="number"
                step="0.25"
                min={4}
                max={15}
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 text-sm"
              />
            </div>
          </div>

          {/* Result Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
            <div className="text-center space-y-1">
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
                Mensualité Estimée à Rembourser
              </span>
              <div className="text-3xl sm:text-4xl font-black font-heading text-white">
                {formatFCFA(monthlyPayment)} <span className="text-sm font-normal text-slate-300">/ mois</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400 block">Montant Emprunté :</span>
                <span className="font-bold text-white">{formatFCFA(principal)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Coût Total Intérêts :</span>
                <span className="font-bold text-amber-400">{formatFCFA(totalInterestPaid)}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 block">Revenu Minimum Net Requis :</span>
                <span className="font-bold text-emerald-400">{formatFCFA(minRequiredMonthlySalary)}/mois</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-950">
            <Landmark className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <p>
              L'agence <strong>{agencyConfig.name}</strong> monte votre dossier de demande de crédit immobilier auprès de nos banques partenaires au Mali (BDM-SA, BIM, BOA, Ecobank) dès signature du compromis de vente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
