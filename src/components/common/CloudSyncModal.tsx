import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { closeCloudSyncModal, addToast } from '../../store/uiSlice';
import { 
  getDefaultConfig, 
  saveCustomFirebaseConfig, 
  clearCustomFirebaseConfig, 
  testFirebaseConnection, 
  FirebaseConfigOptions,
  getActiveFirebaseConfig,
} from '../../services/firebase';
import { firestoreService } from '../../services/firestoreService';
import { 
  Cloud, 
  CloudOff, 
  CloudLightning, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  UploadCloud, 
  Settings, 
  Copy, 
  Key, 
  ExternalLink, 
  X, 
  Smartphone, 
  Laptop, 
  ShieldCheck,
  Code
} from 'lucide-react';

export const CloudSyncModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isCloudSyncModalOpen);

  // Redux data for cloud push
  const properties = useAppSelector((state) => state.properties.items);
  const tenants = useAppSelector((state) => state.tenants.items);
  const receipts = useAppSelector((state) => state.tenants.receipts);
  const sales = useAppSelector((state) => state.sales.items);
  const owners = useAppSelector((state) => state.owners.items);
  const payouts = useAppSelector((state) => state.owners.payouts);
  const contracts = useAppSelector((state) => state.contracts.items);
  const expenses = useAppSelector((state) => state.financials.expenses);
  const leads = useAppSelector((state) => state.leads.items);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const [config, setConfig] = useState<FirebaseConfigOptions>(getDefaultConfig());
  const [jsonInput, setJsonInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; count: number; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'config' | 'guide'>('status');

  useEffect(() => {
    if (isOpen) {
      setConfig(getActiveFirebaseConfig());
      setTestResult(null);
      setPushResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testFirebaseConnection();
      setTestResult(res);
      if (res.success) {
        dispatch(addToast({
          type: 'success',
          message: 'Connexion au Cloud Firestore réussie ! Synchronisation active.',
        }));
      } else {
        dispatch(addToast({
          type: 'warning',
          message: res.message,
        }));
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Erreur inattendue de connexion.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePushAllData = async () => {
    setIsPushing(true);
    setPushResult(null);
    try {
      const res = await firestoreService.pushAllLocalDataToCloud({
        properties,
        tenants,
        receipts,
        sales,
        owners,
        payouts,
        contracts,
        expenses,
        leads,
        agencyConfig,
      });
      setPushResult(res);
      if (res.success) {
        dispatch(addToast({
          type: 'success',
          message: `${res.count} enregistrements ont été sauvegardés sur le Cloud Firestore !`,
        }));
      } else {
        dispatch(addToast({
          type: 'error',
          message: res.message,
        }));
      }
    } catch (err: any) {
      setPushResult({
        success: false,
        count: 0,
        message: err?.message || 'Échec du transfert vers le Cloud.',
      });
    } finally {
      setIsPushing(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.projectId.trim() || !config.apiKey.trim()) {
      dispatch(addToast({
        type: 'warning',
        message: 'Le Project ID et la Clé API Firebase sont obligatoires.',
      }));
      return;
    }

    const saved = saveCustomFirebaseConfig({
      apiKey: config.apiKey.trim(),
      projectId: config.projectId.trim(),
      authDomain: config.authDomain?.trim() || `${config.projectId.trim()}.firebaseapp.com`,
      storageBucket: config.storageBucket?.trim() || `${config.projectId.trim()}.appspot.com`,
      messagingSenderId: config.messagingSenderId?.trim() || '',
      appId: config.appId?.trim() || '',
    });

    if (saved) {
      dispatch(addToast({
        type: 'success',
        message: 'Configuration Cloud enregistrée ! Test de connexion en cours...',
      }));
      handleTest();
    } else {
      dispatch(addToast({
        type: 'error',
        message: 'Impossible d\'initialiser Firebase avec ces paramètres.',
      }));
    }
  };

  const handleParseJson = () => {
    if (!jsonInput.trim()) return;
    try {
      // Clean string if user copied `const firebaseConfig = { ... }`
      let clean = jsonInput.trim();
      if (clean.includes('{') && clean.includes('}')) {
        clean = clean.substring(clean.indexOf('{'), clean.lastIndexOf('}') + 1);
      }
      
      // Replace unquoted keys to make it valid JSON if needed
      clean = clean.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ');
      clean = clean.replace(/'/g, '"');
      // remove trailing commas
      clean = clean.replace(/,\s*}/g, '}');

      const parsed = JSON.parse(clean);
      if (parsed.projectId || parsed.apiKey) {
        setConfig({
          apiKey: parsed.apiKey || config.apiKey,
          projectId: parsed.projectId || config.projectId,
          authDomain: parsed.authDomain || (parsed.projectId ? `${parsed.projectId}.firebaseapp.com` : config.authDomain),
          storageBucket: parsed.storageBucket || (parsed.projectId ? `${parsed.projectId}.appspot.com` : config.storageBucket),
          messagingSenderId: parsed.messagingSenderId || config.messagingSenderId,
          appId: parsed.appId || config.appId,
        });
        dispatch(addToast({
          type: 'success',
          message: 'Configuration JSON importée avec succès dans les champs.',
        }));
      } else {
        throw new Error('Champs apiKey ou projectId non trouvés');
      }
    } catch (e: any) {
      dispatch(addToast({
        type: 'error',
        message: 'Format JSON/Objet invalide. Veuillez vérifier le texte collé.',
      }));
    }
  };

  const handleResetConfig = () => {
    if (window.confirm('Voulez-vous réinitialiser la configuration Cloud Firebase personnalisée ?')) {
      clearCustomFirebaseConfig();
      setConfig(getDefaultConfig());
      setTestResult(null);
      dispatch(addToast({
        type: 'info',
        message: 'Configuration réinitialisée aux variables d\'environnement par défaut.',
      }));
    }
  };

  const isConfiguredLive = firestoreService.isLive();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden"
        id="cloud-sync-modal"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-blue-900/50">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-md ${
              isConfiguredLive ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
            }`}>
              {isConfiguredLive ? <CloudLightning className="w-6 h-6" /> : <CloudOff className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg font-heading text-white">
                  Synchronisation Multi-Appareils
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isConfiguredLive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {isConfiguredLive ? 'Cloud Actif' : 'Mode Local'}
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Partagez et synchronisez toutes vos données en temps réel entre PC, Téléphones et Tablettes.
              </p>
            </div>
          </div>

          <button
            onClick={() => dispatch(closeCloudSyncModal())}
            className="text-slate-400 hover:text-white p-2 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-3 px-3 text-xs font-black border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'status'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>État & Synchronisation</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`pb-3 px-3 text-xs font-black border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configuration Firebase</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-3 text-xs font-black border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            <span>Guide Déploiement Vercel</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* TAB 1: STATUS & CLOUD ACTIONS */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* Multi-Device Sync Card */}
              <div className={`p-5 rounded-2xl border ${
                isConfiguredLive
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-amber-50/70 border-amber-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isConfiguredLive ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {isConfiguredLive ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1">
                    <h4 className={`text-sm font-extrabold ${
                      isConfiguredLive ? 'text-emerald-950' : 'text-amber-950'
                    }`}>
                      {isConfiguredLive 
                        ? `Synchronisation Cloud Active (Projet : ${config.projectId})`
                        : 'Mode Local (Les données restent sur cet appareil)'}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {isConfiguredLive 
                        ? 'Toutes les modifications créées ou modifiées sur cet appareil sont répercutées en temps réel sur tous les autres appareils connectés au même projet Firebase.'
                        : 'Vos données actuelles sont enregistrées dans le navigateur de cet appareil. Pour qu\'elles apparaissent sur votre téléphone ou un autre ordinateur, configurez Firebase ci-dessous.'}
                    </p>
                  </div>
                </div>

                {/* Device sync preview */}
                <div className="mt-4 pt-4 border-t border-slate-200/80 flex items-center justify-center gap-8 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Laptop className="w-4 h-4 text-blue-600" />
                    <span>PC / Bureau</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Temps Réel</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Mobile / Vercel</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting}
                  className="py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 text-blue-600 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Test de connexion...' : 'Tester la Connexion Cloud'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePushAllData}
                  disabled={isPushing}
                  className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className={`w-4 h-4 ${isPushing ? 'animate-bounce' : ''}`} />
                  <span>{isPushing ? 'Envoi vers le Cloud...' : 'Pousser toutes les données vers le Cloud'}</span>
                </button>
              </div>

              {/* Test Result Box */}
              {testResult && (
                <div className={`p-4 rounded-xl text-xs font-bold flex items-start gap-2.5 border animate-fadeIn ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}>
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                  <div className="leading-relaxed">{testResult.message}</div>
                </div>
              )}

              {/* Push Result Box */}
              {pushResult && (
                <div className={`p-4 rounded-xl text-xs font-bold flex items-start gap-2.5 border animate-fadeIn ${
                  pushResult.success
                    ? 'bg-blue-50 text-blue-900 border-blue-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}>
                  {pushResult.success ? <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                  <div className="leading-relaxed">{pushResult.message}</div>
                </div>
              )}

              {/* Data Summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Données prêtes pour la synchronisation multi-appareils :
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Biens & Parcelles</span>
                    <strong className="text-slate-900 font-extrabold text-sm">{properties.length}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Locataires</span>
                    <strong className="text-slate-900 font-extrabold text-sm">{tenants.length}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Bailleurs</span>
                    <strong className="text-slate-900 font-extrabold text-sm">{owners.length}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Quittances</span>
                    <strong className="text-slate-900 font-extrabold text-sm">{receipts.length}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONFIGURATION FIREBASE */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* Quick JSON / Object Importer */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-blue-600" />
                    Coller la configuration Firebase (JSON ou Snippet)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Optionnel / Rapide</span>
                </div>
                <textarea
                  rows={3}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='Collez ici : { apiKey: "AIzaSy...", projectId: "mon-projet-firebase", ... }'
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleParseJson}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Remplir automatiquement les champs ci-dessous
                </button>
              </div>

              {/* Detailed Form */}
              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-700">
                      Firebase Project ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex : mali-immo-prestige"
                      value={config.projectId}
                      onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-700">
                      Firebase API Key *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex : AIzaSyB..."
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Auth Domain
                    </label>
                    <input
                      type="text"
                      placeholder="Ex : mon-projet.firebaseapp.com"
                      value={config.authDomain || ''}
                      onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Storage Bucket
                    </label>
                    <input
                      type="text"
                      placeholder="Ex : mon-projet.appspot.com"
                      value={config.storageBucket || ''}
                      onChange={(e) => setConfig({ ...config, storageBucket: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Messaging Sender ID
                    </label>
                    <input
                      type="text"
                      placeholder="Ex : 123456789012"
                      value={config.messagingSenderId || ''}
                      onChange={(e) => setConfig({ ...config, messagingSenderId: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      App ID
                    </label>
                    <input
                      type="text"
                      placeholder="Ex : 1:123456:web:abcd123"
                      value={config.appId || ''}
                      onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResetConfig}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                  >
                    Effacer / Réinitialiser
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Enregistrer & Activer la Synchronisation</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: GUIDE DEPLOIEMENT VERCEL */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <h4 className="font-extrabold text-blue-950 text-sm mb-1 flex items-center gap-2">
                  <CloudLightning className="w-4 h-4 text-blue-600" />
                  Pourquoi les données ne sont pas synchronisées sur 2 appareils différents ?
                </h4>
                <p className="text-blue-900 text-xs">
                  Sur Vercel, une application React front-end stocke par défaut ses données dans la mémoire locale (<strong>localStorage</strong>) du navigateur. Le téléphone et le PC ont deux mémoires totalement séparées. Pour qu'une parcelle ou quittance saisie sur PC apparaisse sur le téléphone, il faut connecter <strong>Firebase Firestore</strong>.
                </p>
              </div>

              <div className="space-y-3">
                <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Option 1 : Configuration instantanée dans l'application (Recommandé - Sans re-déployer)
                </h5>
                <ol className="list-decimal pl-5 space-y-2 text-slate-600">
                  <li>Ouvrez l'onglet <strong>"Configuration Firebase"</strong> ci-dessus sur votre PC.</li>
                  <li>Renseignez votre <strong>Project ID</strong> et <strong>API Key</strong> Firebase puis cliquez sur <strong>Enregistrer</strong>.</li>
                  <li>Cliquez sur <strong>"Pousser toutes les données vers le Cloud"</strong>.</li>
                  <li>Ouvrez l'application sur votre téléphone (sur <code>https://agenceimmo.vercel.app/</code>), ouvrez cette même fenêtre et entrez les mêmes clés. <strong>Toutes vos données apparaîtront instantanément !</strong></li>
                </ol>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-200">
                <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Option 2 : Configuration automatique dans Vercel (Variables d'environnement)
                </h5>
                <ol className="list-decimal pl-5 space-y-2 text-slate-600">
                  <li>Allez sur votre dashboard Vercel : <a href="https://vercel.com/diabymamadou3344-6322s-projects/agence_immo" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline inline-flex items-center gap-1">Projet Vercel <ExternalLink className="w-3 h-3" /></a></li>
                  <li>Cliquez sur <strong>Settings &gt; Environment Variables</strong>.</li>
                  <li>Ajoutez les variables suivantes :
                    <ul className="list-disc pl-5 mt-1 font-mono text-[11px] text-slate-800 space-y-0.5">
                      <li><code>VITE_FIREBASE_API_KEY</code> = votre clé API</li>
                      <li><code>VITE_FIREBASE_PROJECT_ID</code> = votre ID de projet</li>
                      <li><code>VITE_FIREBASE_AUTH_DOMAIN</code> = votre auth domain</li>
                    </ul>
                  </li>
                  <li>Cliquez sur <strong>Deployments &gt; Redeploy</strong>. Tous les visiteurs et appareils seront automatiquement connectés au Cloud sans rien configurer manuellement !</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
