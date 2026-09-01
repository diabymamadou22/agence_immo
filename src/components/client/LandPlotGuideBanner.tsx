import React from 'react';
import { useAppDispatch } from '../../store';
import { openNotaryModal } from '../../store/uiSlice';
import { ShieldCheck, FileCheck, CheckCircle2, AlertTriangle, Calculator, Building, Landmark } from 'lucide-react';

export const LandPlotGuideBanner: React.FC = () => {
  const dispatch = useAppDispatch();

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-xl overflow-hidden relative">
      {/* Decorative background watermark */}
      <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-x-12 translate-y-12">
        <Landmark className="w-96 h-96 text-white" />
      </div>

      <div className="relative z-10 max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 uppercase tracking-wider">
            Guide Sécurité Foncière Mali
          </span>
          <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            Zéro Risque de Double Attribution
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Comment Acheter une Parcelle en Toute Sérénité à Bamako ?
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
            Au Mali, l'acquisition foncière exige une vigilance absolue. Mali Immo Prestige effectue toutes les vérifications préliminaires avant la mise en vente de chaque terrain.
          </p>
        </div>

        {/* 3 Steps in Mali */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl p-4 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h4 className="font-bold text-sm text-white">Vérification au Cadastre</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Contrôle du numéro de Titre Foncier (TF), de la section et du plan de lotissement visé par l'Institut Géographique du Mali (IGM).
            </p>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl p-4 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h4 className="font-bold text-sm text-white">Bornage Géomètre Agréé</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Visite sur le terrain avec un géomètre expert pour certifier les dimensions exactes (ex: 15x20m) et les bornes physiques.
            </p>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl p-4 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h4 className="font-bold text-sm text-white">Signature chez le Notaire</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Paiement sous séquestre notarié et mutation officielle du TF à votre nom à la Conservation Foncière de Bamako ou de Kati.
            </p>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-700/80">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Tous nos biens vendus sous TF sont garantis libres de toute hypothèque bancaire.</span>
          </div>

          <button
            type="button"
            onClick={() => dispatch(openNotaryModal())}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>Calculer les Frais de Mutation Notariée</span>
          </button>
        </div>
      </div>
    </div>
  );
};
