import React, { useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { addToast } from '../../store/uiSlice';
import { resetToMockData } from '../../store/propertiesSlice';
import { resetAgencyConfig } from '../../store/agencySlice';
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldCheck, 
  HardDrive, 
  FileJson, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export const AdminBackupManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const state = useAppSelector((state) => state);

  // Export Full Database as JSON
  const handleExportJSON = () => {
    const backupData = {
      app: 'Mali Immo Prestige SaaS Multi-Agency',
      exportDate: new Date().toISOString(),
      version: '2.0.0',
      data: {
        agency: state.agency,
        properties: state.properties,
        tenants: state.tenants,
        owners: state.owners,
        contracts: state.contracts,
        leads: state.leads,
        financials: state.financials,
      },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sauvegarde_mali_immo_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    dispatch(
      addToast({
        type: 'success',
        message: 'Sauvegarde complète téléchargée avec succès (Format JSON) !',
      })
    );
  };

  // Import JSON file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.data) {
          if (json.data.properties?.items) {
            localStorage.setItem('mali_immo_properties', JSON.stringify(json.data.properties.items));
          }
          if (json.data.agency?.config) {
            localStorage.setItem('mali_immo_agency_config', JSON.stringify(json.data.agency.config));
          }
          if (json.data.tenants?.items) {
            localStorage.setItem('mali_immo_tenants', JSON.stringify(json.data.tenants.items));
          }
          if (json.data.owners?.items) {
            localStorage.setItem('mali_immo_owners', JSON.stringify(json.data.owners.items));
          }
          if (json.data.contracts?.items) {
            localStorage.setItem('mali_immo_contracts', JSON.stringify(json.data.contracts.items));
          }
          if (json.data.financials?.expenses) {
            localStorage.setItem('mali_immo_expenses', JSON.stringify(json.data.financials.expenses));
          }

          dispatch(
            addToast({
              type: 'success',
              message: 'Données importées avec succès ! Rechargement de l\'application...',
            })
          );
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (err) {
        dispatch(
          addToast({
            type: 'error',
            message: 'Erreur lors de la lecture du fichier de sauvegarde JSON.',
          })
        );
      }
    };
    reader.readAsText(file);
  };

  const handleResetAllData = () => {
    if (
      window.confirm(
        'Êtes-vous certain de vouloir réinitialiser toutes les données aux valeurs de démonstration ?'
      )
    ) {
      localStorage.clear();
      dispatch(resetToMockData());
      dispatch(resetAgencyConfig());
      dispatch(
        addToast({
          type: 'info',
          message: 'Données réinitialisées aux valeurs usine avec succès.',
        })
      );
      setTimeout(() => window.location.reload(), 800);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 uppercase tracking-wider">
              Sauvegardes & Données Locales
            </span>
            <span className="text-xs text-slate-400">Export Sécurisé & Migration de Base</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
            Sauvegarde & Restauration du Système
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Exportez l'intégralité des biens, baux, propriétaires, quittances et paramètres d'agence en un clic pour créer des sauvegardes régulières ou migrer les données chez un nouveau client.
          </p>
        </div>
      </div>

      {/* Main Grid: Backup / Restore / Reset */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Export JSON */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 font-heading">
              Exporter la Base Complète
            </h3>
            <p className="text-xs text-slate-500">
              Génère un fichier JSON sécurisé contenant la totalité de vos données (propriétés, baux, transactions, propriétaires).
            </p>
          </div>

          <button
            onClick={handleExportJSON}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger la Sauvegarde (.JSON)</span>
          </button>
        </div>

        {/* Card 2: Restore JSON */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 font-heading">
              Restaurer une Sauvegarde
            </h3>
            <p className="text-xs text-slate-500">
              Importez un fichier JSON de sauvegarde précédent pour restaurer instantanément toutes vos archives.
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Sélectionner un Fichier JSON</span>
          </button>
        </div>

        {/* Card 3: Factory Reset / Demo Seeder */}
        <div className="bg-white rounded-2xl p-6 border border-rose-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 font-heading">
              Remise à Zéro / Démo Usine
            </h3>
            <p className="text-xs text-slate-500">
              Efface les données locales et recharge le jeu de données démo complet pour présenter l'application à une nouvelle agence.
            </p>
          </div>

          <button
            onClick={handleResetAllData}
            className="w-full py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs border border-rose-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Recharger Données Démo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
