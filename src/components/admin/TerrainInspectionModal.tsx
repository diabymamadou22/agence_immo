import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { addToast } from '../../store/uiSlice';
import { firestoreService } from '../../services/firestoreService';
import { TerrainInspectionRecord, Property } from '../../types';
import { formatDate, formatFCFA, AGENCY_INFO } from '../../utils/formatters';
import { compressImageWithStats } from '../../utils/imageUtils';
import { printElement } from '../../utils/printUtils';
import {
  X,
  Camera,
  MapPin,
  Zap,
  Droplets,
  Calendar,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Share2,
  Trash2,
  Plus,
  Compass,
  Building2,
  Eye,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

interface TerrainInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPropertyId?: string;
}

export const TerrainInspectionModal: React.FC<TerrainInspectionModalProps> = ({
  isOpen,
  onClose,
  preselectedPropertyId,
}) => {
  const dispatch = useAppDispatch();
  const properties = useAppSelector((state) => state.properties.items);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [inspections, setInspections] = useState<TerrainInspectionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInspectionForView, setSelectedInspectionForView] = useState<TerrainInspectionRecord | null>(null);

  // Form states
  const [propertyId, setPropertyId] = useState<string>('');
  const [customPropertyTitle, setCustomPropertyTitle] = useState('');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [agentName, setAgentName] = useState(agencyConfig.managerName || 'Mamadou Diaby');
  const [agentPhone, setAgentPhone] = useState(agencyConfig.phone || '+223 76 00 00 00');
  const [clientPresentName, setClientPresentName] = useState('');
  const [clientRole, setClientRole] = useState<'locataire_entrant' | 'locataire_sortant' | 'proprietaire' | 'gardien' | 'autre'>('locataire_entrant');

  // Meter states
  const [waterMeterIndex, setWaterMeterIndex] = useState<string>('');
  const [isWaterFunctional, setIsWaterFunctional] = useState(true);
  const [waterMeterStatus, setWaterMeterStatus] = useState<string>('Normal - Aucun écoulement anormal');

  const [electricityMeterIndex, setElectricityMeterIndex] = useState<string>('');
  const [electricityMeterType, setElectricityMeterType] = useState<'isago_prepaye' | 'postpaye'>('isago_prepaye');
  const [isElectricityFunctional, setIsElectricityFunctional] = useState(true);
  const [electricityMeterStatus, setElectricityMeterStatus] = useState<string>('Normal - Disjoncteur armé');

  // General state
  const [generalState, setGeneralState] = useState<'excellent' | 'bon' | 'moyen' | 'a_renover'>('bon');
  const [observations, setObservations] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  // GPS
  const [gpsCoordinates, setGpsCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Signatures
  const [signedByAgent, setSignedByAgent] = useState(true);
  const [signedByClient, setSignedByClient] = useState(true);

  const printAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load inspections from Firestore or localStorage fallback
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const cloudData = await firestoreService.fetchInspections();
        if (cloudData && cloudData.length > 0) {
          setInspections(cloudData);
        } else {
          // Fallback to local storage
          const saved = localStorage.getItem('mip_terrain_inspections');
          if (saved) {
            try {
              setInspections(JSON.parse(saved));
            } catch (e) {
              console.error(e);
            }
          }
        }
      } catch (err) {
        console.warn('Error loading inspections:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    if (preselectedPropertyId) {
      setPropertyId(preselectedPropertyId);
    } else if (properties.length > 0 && !propertyId) {
      setPropertyId(properties[0].id);
    }
  }, [isOpen, preselectedPropertyId, properties]);

  if (!isOpen) return null;

  const handleCaptureGPS = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoordinates({
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
          });
          setIsLocating(false);
          dispatch(addToast({
            type: 'success',
            message: `Coordonnées GPS capturées : ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          }));
        },
        (err) => {
          console.warn('GPS location error:', err);
          // Fallback to Bamako reference
          setGpsCoordinates({
            latitude: 12.6392,
            longitude: -8.0029,
          });
          setIsLocating(false);
          dispatch(addToast({
            type: 'info',
            message: 'Position GPS approximée sur Bamako (autorisez la géolocalisation pour précision exacte).',
          }));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setIsLocating(false);
      setGpsCoordinates({ latitude: 12.6392, longitude: -8.0029 });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    try {
      const newPhotos: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await compressImageWithStats(file, 1200, 1200, 0.8);
        newPhotos.push(res.dataUrl);
      }
      setPhotos((prev) => [...prev, ...newPhotos]);
      dispatch(addToast({
        type: 'success',
        message: `${newPhotos.length} photo(s) compressée(s) et ajoutée(s) au relevé.`,
      }));
    } catch (err) {
      console.error(err);
      dispatch(addToast({
        type: 'error',
        message: 'Erreur lors de la compression des photos.',
      }));
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveInspection = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedProp = properties.find((p) => p.id === propertyId);
    const resolvedTitle = selectedProp ? `${selectedProp.title} (${selectedProp.reference})` : (customPropertyTitle.trim() || 'Bien immobilier sans référence');

    const newRecord: TerrainInspectionRecord = {
      id: `insp-${Date.now()}`,
      propertyId: propertyId || 'prop-custom',
      propertyTitle: resolvedTitle,
      inspectionDate,
      agentName: agentName.trim(),
      agentPhone: agentPhone.trim(),
      waterMeterIndex: waterMeterIndex !== '' ? Number(waterMeterIndex) : undefined,
      electricityMeterIndex: electricityMeterIndex !== '' ? Number(electricityMeterIndex) : undefined,
      isWaterMeterFunctional: isWaterFunctional,
      isElectricityFunctional: isElectricityFunctional,
      generalState,
      observations: observations.trim() + (waterMeterStatus ? `\n[SOMAGEP] : ${waterMeterStatus}` : '') + (electricityMeterStatus ? `\n[EDM-SA ${electricityMeterType === 'isago_prepaye' ? 'ISAGO' : 'Post-payé'}] : ${electricityMeterStatus}` : ''),
      photos,
      gpsCoordinates: gpsCoordinates || undefined,
      clientPresentName: clientPresentName.trim() ? `${clientPresentName.trim()} (${clientRole.replace('_', ' ')})` : undefined,
      signedByAgent,
      signedByClient,
      createdAt: new Date().toISOString(),
    };

    try {
      const updatedList = [newRecord, ...inspections];
      setInspections(updatedList);
      localStorage.setItem('mip_terrain_inspections', JSON.stringify(updatedList));
      await firestoreService.saveInspection(newRecord);

      dispatch(addToast({
        type: 'success',
        message: 'Fiche de relevé terrain enregistrée avec succès !',
      }));

      // Switch to history or preview
      setSelectedInspectionForView(newRecord);
      setActiveTab('history');
    } catch (err) {
      console.error(err);
      dispatch(addToast({
        type: 'error',
        message: 'Erreur lors de l\'enregistrement de la fiche.',
      }));
    }
  };

  const handleDeleteInspection = async (id: string) => {
    if (!confirm('Supprimer définitivement ce relevé de terrain ?')) return;
    try {
      const filtered = inspections.filter((i) => i.id !== id);
      setInspections(filtered);
      localStorage.setItem('mip_terrain_inspections', JSON.stringify(filtered));
      await firestoreService.deleteInspection(id);
      if (selectedInspectionForView?.id === id) {
        setSelectedInspectionForView(null);
      }
      dispatch(addToast({
        type: 'info',
        message: 'Relevé supprimé.',
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = (record: TerrainInspectionRecord) => {
    setSelectedInspectionForView(record);
    setTimeout(() => {
      if (printAreaRef.current) {
        printElement(printAreaRef.current, `Relevé_Terrain_${record.inspectionDate}`);
      }
    }, 150);
  };

  const handleShareWhatsApp = (record: TerrainInspectionRecord) => {
    const text = `*📋 PROCÈS-VERBAL D'ÉTAT DES LIEUX & RELEVÉ COMPTEURS*\n` +
      `*Agence :* ${agencyConfig.name || 'Mali Immo Prestige'}\n` +
      `*Bien :* ${record.propertyTitle || 'Non spécifié'}\n` +
      `*Date du relevé :* ${formatDate(record.inspectionDate)}\n` +
      `*Agent mandaté :* ${record.agentName} (${record.agentPhone})\n` +
      `${record.clientPresentName ? `*Présence :* ${record.clientPresentName}\n` : ''}` +
      `--------------------------------\n` +
      `⚡ *COMPTEUR ÉLECTRICITÉ (EDM-SA) :*\n` +
      `• Index : ${record.electricityMeterIndex ?? 'N/A'} kWh\n` +
      `• Fonctionnel : ${record.isElectricityFunctional ? 'OUI ✅' : 'NON / ANOMALIE ⚠️'}\n\n` +
      `💧 *COMPTEUR EAU (SOMAGEP-SA) :*\n` +
      `• Index : ${record.waterMeterIndex ?? 'N/A'} m³\n` +
      `• Fonctionnel : ${record.isWaterMeterFunctional ? 'OUI ✅' : 'NON / ANOMALIE ⚠️'}\n\n` +
      `🏛️ *ÉTAT GÉNÉRAL :* ${record.generalState.toUpperCase()}\n` +
      `${record.gpsCoordinates ? `📍 *GPS :* https://maps.google.com/?q=${record.gpsCoordinates.latitude},${record.gpsCoordinates.longitude}\n` : ''}` +
      `--------------------------------\n` +
      `📝 *Observations :* ${record.observations || 'Aucune anomalie signalée'}\n` +
      `_Certifié conforme par Mali Immo Prestige._`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 md:p-6 flex items-center justify-center animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shadow-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg font-heading">
                  Mode Terrain : État des Lieux & Compteurs
                </h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Mobile / Chantier
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Relevé contradictoire des compteurs EDM-SA / SOMAGEP et prise de photos avec géolocalisation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 p-3 bg-slate-100 border-b border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab('form'); setSelectedInspectionForView(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'form'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Relevé Terrain</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Historique des Visites ({inspections.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          
          {activeTab === 'form' ? (
            <form onSubmit={handleSaveInspection} className="space-y-6">
              
              {/* Step 1: Propriété & Date */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-2">
                  <Building2 className="w-4 h-4 text-amber-500" />
                  <span>1. Identification du Bien & Date de la Visite</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Sélectionner un Bien du Catalogue</label>
                    <select
                      value={propertyId}
                      onChange={(e) => setPropertyId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="">-- Autre bien / Saisie manuelle --</option>
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.reference} - {p.title} ({p.neighborhood}, {p.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  {!propertyId && (
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Désignation / Adresse Manuelle *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Villa Kalaban Coura ACI ou Parcelle N° 124"
                        value={customPropertyTitle}
                        onChange={(e) => setCustomPropertyTitle(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Date du Relevé / Visite *</label>
                    <input
                      type="date"
                      required
                      value={inspectionDate}
                      onChange={(e) => setInspectionDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Agent Mandaté Agence *</label>
                    <input
                      type="text"
                      required
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Téléphone Agent *</label>
                    <input
                      type="text"
                      required
                      value={agentPhone}
                      onChange={(e) => setAgentPhone(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Personne Présente / Témoin</label>
                    <input
                      type="text"
                      placeholder="Nom complet du locataire/gardien"
                      value={clientPresentName}
                      onChange={(e) => setClientPresentName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Compteurs EDM-SA & SOMAGEP (Spécificité Malienne) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* EDM-SA */}
                <div className="bg-amber-50/70 p-4 sm:p-5 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-extrabold text-xs uppercase tracking-wider text-amber-950">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <span>Électricité (EDM-SA)</span>
                    </div>
                    <select
                      value={electricityMeterType}
                      onChange={(e) => setElectricityMeterType(e.target.value as any)}
                      className="text-[11px] font-bold bg-white border border-amber-300 rounded-lg px-2 py-1"
                    >
                      <option value="isago_prepaye">Compteur ISAGO (Prépayé)</option>
                      <option value="postpaye">Compteur Post-payé (Facture)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Index Actuel Compteur (kWh)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ex: 14852"
                      value={electricityMeterIndex}
                      onChange={(e) => setElectricityMeterIndex(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono font-bold bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                      <input
                        type="checkbox"
                        checked={isElectricityFunctional}
                        onChange={(e) => setIsElectricityFunctional(e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded"
                      />
                      <span>Alimentation & Compteur Fonctionnels</span>
                    </label>
                  </div>

                  <input
                    type="text"
                    placeholder="Remarques compteur EDM (Ex: Scellé intact, disjoncteur 30A...)"
                    value={electricityMeterStatus}
                    onChange={(e) => setElectricityMeterStatus(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white/90 border border-amber-300 rounded-xl"
                  />
                </div>

                {/* SOMAGEP-SA */}
                <div className="bg-blue-50/70 p-4 sm:p-5 rounded-2xl border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-extrabold text-xs uppercase tracking-wider text-blue-950">
                      <Droplets className="w-4 h-4 text-blue-600" />
                      <span>Eau Potable (SOMAGEP-SA)</span>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Réseau Urbain
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Index Actuel Compteur (m³)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ex: 00482"
                      value={waterMeterIndex}
                      onChange={(e) => setWaterMeterIndex(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono font-bold bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                      <input
                        type="checkbox"
                        checked={isWaterFunctional}
                        onChange={(e) => setIsWaterFunctional(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span>Arrivée d'eau active & vanne étanche</span>
                    </label>
                  </div>

                  <input
                    type="text"
                    placeholder="Remarques SOMAGEP (Ex: Robinet d'arrêt testé, pression normale...)"
                    value={waterMeterStatus}
                    onChange={(e) => setWaterMeterStatus(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white/90 border border-blue-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Step 3: État des lieux & GPS */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>3. État des Lieux Global & Localisation GPS</span>
                  </div>

                  {/* GPS Grab Button */}
                  <button
                    type="button"
                    onClick={handleCaptureGPS}
                    disabled={isLocating}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Capture GPS...' : 'Capturer GPS Site'}</span>
                  </button>
                </div>

                {gpsCoordinates && (
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs flex items-center justify-between">
                    <span className="font-mono text-emerald-950">
                      <strong>GPS Fixé :</strong> Lat {gpsCoordinates.latitude}°, Long {gpsCoordinates.longitude}°
                    </span>
                    <a
                      href={`https://maps.google.com/?q=${gpsCoordinates.latitude},${gpsCoordinates.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 underline font-bold"
                    >
                      Voir sur Maps
                    </a>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    État Général du Bien au Moment de la Visite
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'excellent', label: 'Excellent État', color: 'border-emerald-400 bg-emerald-50 text-emerald-900' },
                      { id: 'bon', label: 'Bon État', color: 'border-blue-400 bg-blue-50 text-blue-900' },
                      { id: 'moyen', label: 'État Moyen', color: 'border-amber-400 bg-amber-50 text-amber-900' },
                      { id: 'a_renover', label: 'À Rénover', color: 'border-rose-400 bg-rose-50 text-rose-900' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setGeneralState(st.id as any)}
                        className={`p-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer text-center ${
                          generalState === st.id
                            ? `${st.color} ring-2 ring-slate-900 shadow-xs`
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Observations Détaillées (Plomberie, Peinture, Serrurerie, Clôture...)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Notez ici les réserves, défauts constatés, clés remises ou travaux à la charge du bailleur/locataire..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  ></textarea>
                </div>
              </div>

              {/* Step 4: Photos de Terrain avec Compression WebP */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>4. Photos Immédiates du Chantier / Compteurs ({photos.length})</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isCompressing ? 'Compression...' : 'Prendre / Ajouter Photo'}</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                {photos.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">
                      Touchez ici pour prendre des photos des compteurs et de l'état des lieux
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Compression WebP automatique pour économiser les données mobiles au Mali
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {photos.map((p, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square">
                        <img src={p} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1.5 right-1.5 p-1 bg-rose-600 text-white rounded-lg opacity-90 hover:opacity-100 shadow-sm transition-all"
                          title="Supprimer photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Enregistrer le Relevé Terrain</span>
                </button>
              </div>

            </form>
          ) : (
            /* History & Preview Tab */
            <div className="space-y-6">
              {inspections.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-extrabold text-slate-800">Aucun relevé de terrain pour l'instant</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Utilisez l'onglet « Nouveau Relevé » pour enregistrer un état des lieux contradictoire avec relevé de compteurs.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left List */}
                  <div className="lg:col-span-1 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Fiches Disponibles ({inspections.length})
                    </span>
                    <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
                      {inspections.map((rec) => {
                        const isSelected = selectedInspectionForView?.id === rec.id;
                        return (
                          <div
                            key={rec.id}
                            onClick={() => setSelectedInspectionForView(rec)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-50 border-amber-400 shadow-xs'
                                : 'bg-white border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-slate-900 truncate">
                                {rec.propertyTitle || 'Bien immobilier'}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">
                                {formatDate(rec.inspectionDate)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-600">
                              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                EDM: {rec.electricityMeterIndex ?? '-'} kWh
                              </span>
                              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                SOM: {rec.waterMeterIndex ?? '-'} m³
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Preview */}
                  <div className="lg:col-span-2">
                    {selectedInspectionForView ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200">
                          <span className="text-xs font-black text-slate-900">
                            Aperçu & Impression Officielle
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handlePrint(selectedInspectionForView)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Imprimer PV</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleShareWhatsApp(selectedInspectionForView)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Partager WhatsApp</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteInspection(selectedInspectionForView.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Supprimer la fiche"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Printable Area */}
                        <div
                          ref={printAreaRef}
                          className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-300 shadow-sm space-y-6 text-slate-900"
                          id="terrain-pv-print-area"
                        >
                          {/* PV Header */}
                          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                            <div>
                              <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 font-heading">
                                {agencyConfig.name || 'Mali Immo Prestige'}
                              </h2>
                              <p className="text-xs text-slate-600">
                                {agencyConfig.address || 'Bamako, Mali'} • Tél: {agencyConfig.phone}
                              </p>
                              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-widest mt-1">
                                PROCÈS-VERBAL CONTRADICTOIRE D'ÉTAT DES LIEUX ET RELEVÉ DE COMPTEURS
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold bg-slate-900 text-white px-2.5 py-1 rounded-md">
                                N° {selectedInspectionForView.id.toUpperCase()}
                              </span>
                              <p className="text-[11px] text-slate-500 mt-1">
                                Date : {formatDate(selectedInspectionForView.inspectionDate)}
                              </p>
                            </div>
                          </div>

                          {/* Property & Agent Details */}
                          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                            <div>
                              <span className="text-slate-400 block font-bold text-[10px] uppercase">Bien Immobilier</span>
                              <p className="font-extrabold text-slate-900 mt-0.5">
                                {selectedInspectionForView.propertyTitle}
                              </p>
                              {selectedInspectionForView.gpsCoordinates && (
                                <p className="font-mono text-[10px] text-emerald-800 mt-0.5">
                                  GPS: {selectedInspectionForView.gpsCoordinates.latitude}°, {selectedInspectionForView.gpsCoordinates.longitude}°
                                </p>
                              )}
                            </div>
                            <div>
                              <span className="text-slate-400 block font-bold text-[10px] uppercase">Agent Visiteur & Témoin</span>
                              <p className="font-bold text-slate-900 mt-0.5">
                                Agent: {selectedInspectionForView.agentName} ({selectedInspectionForView.agentPhone})
                              </p>
                              {selectedInspectionForView.clientPresentName && (
                                <p className="text-slate-700 mt-0.5">
                                  Présent: {selectedInspectionForView.clientPresentName}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Table of Meters */}
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                              Relevé Officiel des Compteurs à la Date du Jour
                            </h4>
                            <table className="w-full text-xs border border-slate-300 rounded-lg overflow-hidden">
                              <thead className="bg-slate-900 text-white font-bold">
                                <tr>
                                  <th className="p-2 text-left">Service Public</th>
                                  <th className="p-2 text-left">Index Relevé</th>
                                  <th className="p-2 text-left">Fonctionnement</th>
                                  <th className="p-2 text-left">Observations Relevées</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                <tr>
                                  <td className="p-2 font-bold text-amber-900">Électricité (EDM-SA)</td>
                                  <td className="p-2 font-mono font-black text-sm">
                                    {selectedInspectionForView.electricityMeterIndex !== undefined ? `${selectedInspectionForView.electricityMeterIndex} kWh` : 'Non relevé'}
                                  </td>
                                  <td className="p-2 font-semibold">
                                    {selectedInspectionForView.isElectricityFunctional ? 'Conforme / Actif' : 'Anomalie / Déclenché'}
                                  </td>
                                  <td className="p-2 text-slate-600">Compteur ISAGO / Réseau EDM-SA Bamako</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-bold text-blue-900">Eau Potable (SOMAGEP-SA)</td>
                                  <td className="p-2 font-mono font-black text-sm">
                                    {selectedInspectionForView.waterMeterIndex !== undefined ? `${selectedInspectionForView.waterMeterIndex} m³` : 'Non relevé'}
                                  </td>
                                  <td className="p-2 font-semibold">
                                    {selectedInspectionForView.isWaterMeterFunctional ? 'Conforme / Actif' : 'Coupure / Fuite'}
                                  </td>
                                  <td className="p-2 text-slate-600">Réseau d'adduction d'eau urbaine</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* State & Observations */}
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">État Général Constaté :</span>
                              <span className="font-black px-2 py-0.5 rounded bg-slate-200 text-slate-900 uppercase">
                                {selectedInspectionForView.generalState.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                              <span className="font-bold text-slate-700 block mb-1">Constatations & Réserves :</span>
                              <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                                {selectedInspectionForView.observations || 'Aucune anomalie ou dégradation particulière constatée lors de la visite.'}
                              </p>
                            </div>
                          </div>

                          {/* Photos if any */}
                          {selectedInspectionForView.photos && selectedInspectionForView.photos.length > 0 && (
                            <div>
                              <span className="text-xs font-bold block mb-2">Clichés Photographiques Enregistrés ({selectedInspectionForView.photos.length}) :</span>
                              <div className="grid grid-cols-3 gap-2">
                                {selectedInspectionForView.photos.slice(0, 3).map((ph, idx) => (
                                  <img key={idx} src={ph} alt={`Preuve ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Signatures */}
                          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-300 text-xs">
                            <div className="text-center">
                              <p className="font-bold text-slate-800">L'Agent Représentant de l'Agence</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Signature et cachet</p>
                              <div className="h-16 mt-2 border-b border-dashed border-slate-400 flex items-center justify-center italic text-slate-500 font-mono text-[11px]">
                                [Certifié conforme MIP]
                              </div>
                              <p className="mt-1 font-bold">{selectedInspectionForView.agentName}</p>
                            </div>

                            <div className="text-center">
                              <p className="font-bold text-slate-800">Le Locataire / Visiteur / Témoin</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Signature précédée de la mention « Bon pour accord »</p>
                              <div className="h-16 mt-2 border-b border-dashed border-slate-400 flex items-center justify-center italic text-slate-500 font-mono text-[11px]">
                                [Présence attestée]
                              </div>
                              <p className="mt-1 font-bold">{selectedInspectionForView.clientPresentName || 'Le Témoin / Occupant'}</p>
                            </div>
                          </div>

                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                        <Eye className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-600">
                          Sélectionnez un relevé à gauche pour afficher le procès-verbal ou l'imprimer.
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
