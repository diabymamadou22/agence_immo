import React, { useState } from 'react';
import { formatFCFA, calculateNotaryFeesMali, formatSurface } from '../../utils/formatters';
import { printElement } from '../../utils/printUtils';
import { DocumentType } from '../../types';
import { 
  Calculator, 
  ShieldCheck, 
  FileText, 
  Landmark, 
  Info, 
  CheckCircle2, 
  Percent, 
  DollarSign, 
  Scale,
  Printer
} from 'lucide-react';

export const AdminNotaryFeeView: React.FC = () => {
  const [priceInput, setPriceInput] = useState<number>(25000000);
  const [docType, setDocType] = useState<DocumentType>('titre_foncier');
  const [surfaceInput, setSurfaceInput] = useState<number>(300);

  const fees = calculateNotaryFeesMali(priceInput, docType);

  const handlePrint = () => {
    printElement('notary-fee-simulator-content', 'Bareme_Frais_Notarie_Mali');
  };

  return (
    <div className="space-y-8" id="notary-fee-simulator-content">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 uppercase tracking-wider">
              Référentiel Juridique & Fiscal
            </span>
            <span className="text-xs text-slate-400">République du Mali • Code Domanial et Foncier</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
            Barème des Frais de Mutation Notariée au Mali
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Simulateur officiel basé sur les droits d'enregistrement DGI, les taxes de Conservation Foncière et le tarif légal des Notaires du Mali.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl border border-slate-700 shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 print:hidden no-print"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>Imprimer la Grille</span>
        </button>
      </div>

      {/* 2-Column: Live Interactive Simulator & Legal Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Simulator Form (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Calculator className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-base text-slate-900 font-heading">
              Calculateur de Frais Personnalisé
            </h3>
          </div>

          <div className="space-y-4">
            {/* Price Input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Prix d'Achat du Bien (FCFA) :
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={priceInput === 0 ? '' : priceInput}
                placeholder="Montant FCFA"
                onChange={(e) => setPriceInput(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <div className="flex gap-2 pt-1">
                {[15000000, 25000000, 45000000, 80000000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPriceInput(preset)}
                    className="px-2 py-1 bg-slate-100 hover:bg-amber-100 text-[10px] font-bold rounded-lg text-slate-700 cursor-pointer"
                  >
                    {preset / 1000000}M
                  </button>
                ))}
              </div>
            </div>

            {/* Document Type */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Type de Statut Juridique Foncier :
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="titre_foncier">Titre Foncier (TF) - Mutation Directe Notariée</option>
                <option value="lettre_attribution">Lettre d'Attribution - Frais de purge / TF</option>
                <option value="concession_rurale">Concession Rurale - Transformation</option>
                <option value="bail">Bail Emphytéotique</option>
                <option value="permis_occuper">Permis d'Occuper</option>
              </select>
            </div>

            {/* Surface */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Superficie Estimée (m²) :
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={surfaceInput === 0 ? '' : surfaceInput}
                placeholder="Superficie en m²"
                onChange={(e) => setSurfaceInput(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Result Summary Box */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Total Frais Notaire & Taxes :</span>
              <span className="font-extrabold text-amber-400 text-base">
                {formatFCFA(fees.totalNotaryFees)}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Droits d'enregistrement DGI (7%) :</span>
                <span className="font-mono">{formatFCFA(fees.registrationTax)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Conservation Foncière (1.5%) :</span>
                <span className="font-mono">{formatFCFA(fees.landRegistryFee)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Honoraires Notaire dégressifs :</span>
                <span className="font-mono">{formatFCFA(fees.notaryHonoraires)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Débours, géomètre & timbres :</span>
                <span className="font-mono">{formatFCFA(fees.deboursAndStamps)}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-500 text-slate-950 rounded-xl font-bold flex items-center justify-between">
              <span className="text-xs uppercase">Budget Global d'Acquisition :</span>
              <span className="font-black text-sm">{formatFCFA(fees.totalAcquisitionCost)}</span>
            </div>
          </div>
        </div>

        {/* Right Legal Explanation & Comparison (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Titre Foncier vs Autres Documents Mali */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-base text-slate-900 font-heading">
                Comparatif des Titres Fonciers au Mali
              </h3>
            </div>

            <div className="space-y-3">
              {/* Titre Foncier */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Titre Foncier (TF) • Propriété Définitive & Inattaquable
                  </h4>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                    Sécurité 100%
                  </span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Le Titre Foncier confère la pleine propriété légale garantie par l'État Malien. Il permet d'obtenir un crédit bancaire (hypothèque) et garantit la transmission successorale sans contestation possible.
                </p>
              </div>

              {/* Lettre d'Attribution */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                    Lettre d'Attribution / Permis d'Occuper • Droit d'Usage
                  </h4>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                    Transitoire
                  </span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Délivré par les Mairies ou Préfets. Ne constitue pas un titre de propriété inattaquable. Nécessite une procédure de purge et de création de TF pour sécuriser définitivement l'investissement.
                </p>
              </div>

              {/* Concession Rurale */}
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Concession Rurale • Terrains Agricoles & Fermes
                  </h4>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-200 text-blue-900">
                    Mise en valeur obligatoire
                  </span>
                </div>
                <p className="text-xs text-blue-900 leading-relaxed">
                  Attribué pour l'agro-pastoral (ex: Baguinéda, Sanankoroba). Devient transformable en TF après constatation officielle de mise en valeur (clôture, puits, cultures).
                </p>
              </div>
            </div>
          </div>

          {/* Notary Degressive Scale in Mali */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-slate-800" />
              <h3 className="font-extrabold text-base text-slate-900 font-heading">
                Barème Dégressif des Émoluments de Notaire au Mali
              </h3>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 font-bold text-slate-800">
                  <tr>
                    <th className="p-2.5 rounded-l-lg">Tranche de Prix (FCFA)</th>
                    <th className="p-2.5">Taux Notarial Applicable</th>
                    <th className="p-2.5 rounded-r-lg">Application</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-2.5 font-medium">De 0 à 5 000 000 FCFA</td>
                    <td className="p-2.5 font-bold text-amber-700">4.0 %</td>
                    <td className="p-2.5">Tranche de base</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">De 5 000 001 à 20 000 000 FCFA</td>
                    <td className="p-2.5 font-bold text-amber-700">2.5 %</td>
                    <td className="p-2.5">Parcelles courantes</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">De 20 000 001 à 50 000 000 FCFA</td>
                    <td className="p-2.5 font-bold text-amber-700">1.5 %</td>
                    <td className="p-2.5">Parcelles résidentielles TF</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Au-delà de 50 000 000 FCFA</td>
                    <td className="p-2.5 font-bold text-amber-700">1.0 %</td>
                    <td className="p-2.5">Villas de luxe & Immeubles ACI 2000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
