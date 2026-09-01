import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { closeNotaryModal } from '../../store/uiSlice';
import { calculateNotaryFeesMali, formatFCFA, getDocumentBadgeInfo } from '../../utils/formatters';
import { DocumentType } from '../../types';
import { X, Calculator, ShieldCheck, HelpCircle, FileText, Check } from 'lucide-react';

export const NotaryFeeModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isNotaryModalOpen);
  const [price, setPrice] = useState<number>(20000000); // 20 million FCFA default
  const [docType, setDocType] = useState<DocumentType>('titre_foncier');

  if (!isOpen) return null;

  const estimate = calculateNotaryFeesMali(price, docType);

  const predefinedPrices = [
    { label: '5 Millions', value: 5000000 },
    { label: '15 Millions', value: 15000000 },
    { label: '30 Millions', value: 30000000 },
    { label: '60 Millions', value: 60000000 },
    { label: '150 Millions', value: 150000000 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200"
        id="notary-fee-modal-content"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-t-2xl flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl font-heading text-white">
                Simulateur de Frais de Notaire & Droits Fonciers au Mali
              </h3>
              <p className="text-xs text-slate-300">
                Estimation conforme au Barème de la Chambre des Notaires et aux Droits d'Enregistrement du Mali
              </p>
            </div>
          </div>
          <button
            id="btn-close-notary-modal"
            onClick={() => dispatch(closeNotaryModal())}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Input price in FCFA */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Prix du Bien / de la Parcelle (en FCFA) :
            </label>
            <div className="relative">
              <input
                id="input-notary-price"
                type="number"
                min="500000"
                step="500000"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                className="w-full text-lg font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 pl-12 focus:ring-2 focus:ring-amber-500 focus:outline-none focus:border-amber-500"
              />
              <span className="absolute left-4 top-3.5 text-slate-400 font-bold">💰</span>
              <span className="absolute right-4 top-3.5 text-slate-500 font-semibold text-sm">FCFA</span>
            </div>

            {/* Quick Price Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {predefinedPrices.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setPrice(item.value)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                    price === item.value
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Document Type Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Statut Juridique du Document :
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setDocType('titre_foncier')}
                className={`p-3 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                  docType === 'titre_foncier'
                    ? 'border-amber-500 bg-amber-50/50 text-slate-900 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                  <span>Titre Foncier (TF)</span>
                  {docType === 'titre_foncier' && <Check className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-[11px] text-slate-500">Mutation directe, droits d'enregistrement standard ~7%.</p>
              </button>

              <button
                type="button"
                onClick={() => setDocType('lettre_attribution')}
                className={`p-3 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                  docType === 'lettre_attribution'
                    ? 'border-amber-500 bg-amber-50/50 text-slate-900 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                  <span>Lettre d'Attribution / Bail</span>
                  {docType === 'lettre_attribution' && <Check className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-[11px] text-slate-500">Acte sous seing privé / légalisation en mairie & mutation.</p>
              </button>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between">
              <span>Détail des Frais d'Acquisition Notariés</span>
              <span className="text-amber-700 font-extrabold">≈ {estimate.percentageOfPrice}% du prix</span>
            </h4>

            <div className="space-y-2 text-xs divide-y divide-slate-200">
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Droits d'Enregistrement Trésor Public (7%)</span>
                </span>
                <span className="font-semibold text-slate-900">{formatFCFA(estimate.registrationTax)}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Conservation Foncière, Timbres & Publication (1.5%)</span>
                </span>
                <span className="font-semibold text-slate-900">{formatFCFA(estimate.landRegistryFee)}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-amber-600" />
                  <span>Honoraires / Émoluments du Notaire (Dégressif)</span>
                </span>
                <span className="font-semibold text-slate-900">{formatFCFA(estimate.notaryHonoraires)}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span>TVA Légale sur Émoluments Notaire (18%)</span>
                </span>
                <span className="font-semibold text-slate-900">{formatFCFA(estimate.taxOnHonoraires)}</span>
              </div>
            </div>

            {/* Total Highlight */}
            <div className="pt-3 border-t-2 border-slate-300 flex items-center justify-between font-extrabold text-sm">
              <span className="text-slate-900">Total Frais Notaire & Taxes :</span>
              <span className="text-amber-700 text-base">{formatFCFA(estimate.totalNotaryFees)}</span>
            </div>

            <div className="bg-slate-900 text-white rounded-xl p-3.5 flex items-center justify-between font-extrabold">
              <div>
                <span className="text-xs text-amber-400 block font-bold">BUDGET TOTAL TOUT INCLUS</span>
                <span className="text-xs text-slate-300">(Prix net vendeur + Notaire)</span>
              </div>
              <span className="text-lg text-white font-heading">{formatFCFA(estimate.totalAcquisitionCost)}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-amber-50/70 p-3 rounded-lg border border-amber-200 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Note juridique :</strong> Ce calcul est une estimation indicative basée sur le décret tarifaire des notaires du Mali et le Code Général des Impôts. Notre agence vous met en relation directe avec notre cabinet notarié partenaire à Bamako pour l'examen des titres et la délivrance de la quittance définitive.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 bg-slate-50 rounded-b-2xl border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={() => dispatch(closeNotaryModal())}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Fermer le simulateur
          </button>
        </div>
      </div>
    </div>
  );
};
