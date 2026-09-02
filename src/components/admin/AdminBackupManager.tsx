import React, { useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { addToast, openCloudSyncModal } from '../../store/uiSlice';
import { resetToMockData } from '../../store/propertiesSlice';
import { resetAgencyConfig } from '../../store/agencySlice';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { firestoreService } from '../../services/firestoreService';
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
  AlertTriangle,
  Cloud,
  CloudLightning,
  CloudOff,
  UploadCloud,
  Smartphone,
  Laptop,
  Settings
} from 'lucide-react';

export const AdminBackupManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isPushingCloud, setIsPushingCloud] = useState(false);

  const state = useAppSelector((state) => state);
  const isCloudLive = firestoreService.isLive();

  const handlePushAllDataToCloud = async () => {
    setIsPushingCloud(true);
    try {
      const res = await firestoreService.pushAllLocalDataToCloud({
        properties: state.properties.items,
        tenants: state.tenants.items,
        receipts: state.tenants.receipts,
        owners: state.owners.items,
        payouts: state.owners.payouts,
        contracts: state.contracts.items,
        expenses: state.financials.expenses,
        leads: state.leads.items,
        agencyConfig: state.agency.config,
      });

      if (res.success) {
        dispatch(
          addToast({
            type: 'success',
            message: `Synchronisation réussie ! ${res.count} documents enregistrés sur le Cloud Firestore.`,
          })
        );
      } else {
        dispatch(
          addToast({
            type: 'error',
            message: res.message,
          })
        );
      }
    } catch (err: any) {
      dispatch(
        addToast({
          type: 'error',
          message: err?.message || 'Erreur lors de la synchronisation cloud.',
        })
      );
    } finally {
      setIsPushingCloud(false);
    }
  };

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
    setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    localStorage.clear();
    dispatch(resetToMockData());
    dispatch(resetAgencyConfig());
    dispatch(
      addToast({
        type: 'info',
        message: 'Données réinitialisées aux valeurs usine avec succès.',
      })
    );
    setShowResetConfirm(false);
    setTimeout(() => window.location.reload(), 800);
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

      {/* CLOUD MULTI-DEVICE SYNC CARD */}
      <div className={`rounded-3xl p-6 sm:p-7 border shadow-lg transition-all ${
        isCloudLive 
          ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/40' 
          : 'bg-gradient-to-br from-blue-950/50 via-slate-900 to-slate-900 border-blue-500/40'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-md ${
                isCloudLive ? 'bg-emerald-500 text-slate-950' : 'bg-blue-600 text-white'
              }`}>
                {isCloudLive ? <CloudLightning className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-white font-heading">
                    Synchronisation Cloud Multi-Appareils (Firestore)
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isCloudLive 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {isCloudLive ? 'Connecté & Temps Réel' : 'En Attente de Configuration'}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Permet la synchronisation automatique des parcelles, loyers et contrats entre le PC et le téléphone sur Vercel.
                </p>
              </div>
            </div>

            {/* Sync status pills */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                <Laptop className="w-4 h-4 text-blue-400" />
                <span>PC & Tablettes</span>
              </div>
              <span className="text-slate-500 font-bold">⇄</span>
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Téléphones Mobiles</span>
              </div>
              <span className="text-slate-500 font-bold">⇄</span>
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                <Cloud className="w-4 h-4 text-amber-400" />
                <span>Firebase Cloud</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => dispatch(openCloudSyncModal())}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Settings className="w-4 h-4 text-blue-400" />
              <span>Paramètres Cloud & Guide</span>
            </button>

            <button
              onClick={handlePushAllDataToCloud}
              disabled={isPushingCloud}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className={`w-4 h-4 ${isPushingCloud ? 'animate-bounce' : ''}`} />
              <span>{isPushingCloud ? 'Transfert en cours...' : 'Pousser vers le Cloud'}</span>
            </button>
          </div>
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

      {/* Confirmation Modal for Resetting to Demo Data */}
      <ConfirmDeleteModal
        isOpen={showResetConfirm}
        title="Réinitialisation aux données de démonstration"
        message="Êtes-vous certain de vouloir réinitialiser l'ensemble des données aux valeurs de démonstration ? Toutes les modifications locales seront remplacées par le catalogue initial."
        itemName="Base de données locale complète"
        itemType="Réinitialisation Usine"
        details={[
          { label: 'Biens immobiliers', value: 'Restaurer le catalogue initial de Bamako' },
          { label: 'Baux et locataires', value: 'Restaurer les quittances d’exemple' },
          { label: 'Paramètres d’agence', value: 'Restaurer Mali Immo Prestige par défaut' },
        ]}
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
