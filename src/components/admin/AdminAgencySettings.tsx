import React, { useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { updateAgencyConfig, resetAgencyConfig } from '../../store/agencySlice';
import { addToast } from '../../store/uiSlice';
import { compressImageFile } from '../../utils/imageUtils';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { cleanPhoneNumberForTel, cleanWhatsAppNumber, formatMaliPhoneDisplay } from '../../utils/formatters';
import { 
  Building2, 
  Sparkles, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  CreditCard, 
  Smartphone, 
  Percent, 
  Stamp, 
  Save, 
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Upload,
  Image as ImageIcon,
  Trash2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Globe,
  SlidersHorizontal,
  Briefcase,
  Tag,
  Key,
  Check,
  FileCheck
} from 'lucide-react';

export const AdminAgencySettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const agencyConfig = useAppSelector((state) => state.agency.config);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({ ...agencyConfig });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'contact' | 'financial' | 'branding' | 'security'>('general');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Password management state
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Keep local state in sync when redux config changes
  React.useEffect(() => {
    setFormData({ ...agencyConfig });
  }, [agencyConfig]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value,
      };
      if (name === 'phoneDisplay') {
        updated.phone = value;
      } else if (name === 'phone') {
        updated.phoneDisplay = value;
      }
      return updated;
    });
  };

  const handleSyncPhoneToWhatsApp = () => {
    const sourcePhone = formData.phoneDisplay || formData.phone || '';
    const formattedWa = cleanWhatsAppNumber(sourcePhone);
    setFormData((prev) => ({
      ...prev,
      whatsappNumber: formattedWa,
    }));
    dispatch(
      addToast({
        type: 'info',
        message: `Numéro WhatsApp mis à jour avec le code pays Mali (+223) : ${formattedWa}`,
      })
    );
  };

  const handleToggleSpecialty = (item: 'vente' | 'location' | 'gestion') => {
    const current = formData.specialties || ['vente', 'location', 'gestion'];
    let updated: ('vente' | 'location' | 'gestion')[];
    if (current.includes(item)) {
      if (current.length === 1) {
        dispatch(
          addToast({
            type: 'warning',
            message: 'Votre agence doit conserver au moins une spécialité active.',
          })
        );
        return;
      }
      updated = current.filter((s) => s !== item);
    } else {
      updated = [...current, item];
    }
    setFormData((prev) => ({
      ...prev,
      specialties: updated,
    }));
  };

  const handleSelectPrimarySpecialty = (specialty: 'vente' | 'location' | 'gestion' | 'toutes') => {
    setFormData((prev) => ({
      ...prev,
      primarySpecialty: specialty,
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);
      const base64 = await compressImageFile(file, 600, 600, 0.9);
      setFormData((prev) => ({
        ...prev,
        logoUrl: base64,
      }));
      dispatch(
        addToast({
          type: 'success',
          message: 'Logo importé et optimisé avec succès ! Cliquez sur Enregistrer pour valider.',
        })
      );
    } catch (err: any) {
      dispatch(
        addToast({
          type: 'error',
          message: err.message || 'Erreur lors de l\'import du logo.',
        })
      );
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logoUrl: '',
    }));
    dispatch(
      addToast({
        type: 'info',
        message: 'Logo retiré. Cliquez sur Enregistrer pour confirmer.',
      })
    );
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    const actualCurrent = formData.adminPassword || '00223';
    if (currentPasswordInput.trim() !== actualCurrent) {
      setPasswordError('L\'ancien mot de passe saisi est incorrect.');
      return;
    }

    if (!newPasswordInput.trim()) {
      setPasswordError('Le nouveau mot de passe ne peut pas être vide.');
      return;
    }

    if (newPasswordInput.length < 3) {
      setPasswordError('Le mot de passe doit comporter au moins 3 caractères ou chiffres.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordError('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }

    // Update form data and dispatch
    const updated = {
      ...formData,
      adminPassword: newPasswordInput.trim(),
    };
    setFormData(updated);
    dispatch(updateAgencyConfig(updated));

    // Reset password fields
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setPasswordError(null);

    dispatch(
      addToast({
        type: 'success',
        message: 'Mot de passe du Back-Office mis à jour avec succès ! Utilisez désormais ce nouveau mot de passe.',
      })
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const sourcePhone = (formData.phoneDisplay || formData.phone || '').trim();
    const unifiedPhone = sourcePhone || '+223 90 07 03 21';
    const finalData = {
      ...formData,
      phone: unifiedPhone,
      phoneDisplay: unifiedPhone,
      whatsappNumber: cleanWhatsAppNumber(formData.whatsappNumber || unifiedPhone),
    };
    setFormData(finalData);
    dispatch(updateAgencyConfig(finalData));
    dispatch(
      addToast({
        type: 'success',
        message: 'Vos paramètres d\'agence et numéros de téléphone ont été enregistrés avec succès !',
      })
    );
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmResetSettings = () => {
    dispatch(resetAgencyConfig());
    setFormData({ ...agencyConfig });
    setShowResetConfirm(false);
    dispatch(
      addToast({
        type: 'info',
        message: 'Paramètres d’agence réinitialisés aux valeurs d’origine avec succès.',
      })
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 uppercase tracking-wider">
              Paramètres Officiels
            </span>
            <span className="text-xs text-slate-400">Configuration Personnalisée de Votre Agence</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
            Profil & Identité de l'Agence Immobilière
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Configurez vous-même l'ensemble des informations de votre agence : logo, raisons sociales, RCCM, NIF, numéros de téléphone et WhatsApp commercial, coordonnées bancaires et cachet légal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Réinitialiser</span>
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer</span>
          </button>
        </div>
      </div>

      {/* Live Active Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center overflow-hidden shrink-0">
            {formData.logoUrl ? (
              <img
                src={formData.logoUrl}
                alt={formData.name}
                className="w-full h-full object-contain p-1"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Building2 className="w-8 h-8 text-amber-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-lg text-slate-900 font-heading">
                {formData.name || 'Nom de votre agence'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase">
                Profil Actif
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {formData.slogan || 'Votre slogan immobilier'} • {formData.city || 'Mali'}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-600 font-medium">
              <span className="flex items-center gap-1 font-mono text-slate-700">
                <Phone className="w-3 h-3 text-amber-500" />
                {formData.phoneDisplay || formData.phone || 'Non renseigné'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-700">RCCM : {formData.rccm || 'Non renseigné'}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-700">NIF : {formData.nif || 'Non renseigné'}</span>
            </div>

            {/* Specialties Badges Preview */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-amber-500" />
                Spécialités :
              </span>
              {(formData.specialties || ['vente', 'location', 'gestion']).map((s) => (
                <span
                  key={s}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide border ${
                    s === 'vente'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : s === 'location'
                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}
                >
                  {s === 'vente' ? 'Vente' : s === 'location' ? 'Location' : 'Gestion'}
                </span>
              ))}
              <span className="text-[10px] font-bold text-slate-500 ml-1">
                (Principale : {formData.primarySpecialty === 'vente' ? 'Vente' : formData.primarySpecialty === 'location' ? 'Location' : formData.primarySpecialty === 'gestion' ? 'Gestion' : 'Toutes'})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
            <span>Modifier les données</span>
          </button>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Form Tabs */}
        <div className="flex items-center border-b border-slate-200 px-6 pt-4 gap-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-3 text-xs font-extrabold tracking-wide uppercase flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
              activeTab === 'general'
                ? 'border-amber-500 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Identité & Juridique</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`pb-3 text-xs font-extrabold tracking-wide uppercase flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
              activeTab === 'contact'
                ? 'border-amber-500 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Coordonnées & WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('financial')}
            className={`pb-3 text-xs font-extrabold tracking-wide uppercase flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
              activeTab === 'financial'
                ? 'border-amber-500 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Banque, Mobile Money & Commissions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`pb-3 text-xs font-extrabold tracking-wide uppercase flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
              activeTab === 'branding'
                ? 'border-amber-500 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Stamp className="w-4 h-4" />
            <span>Cachet Officiel & Sceau</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`pb-3 text-xs font-extrabold tracking-wide uppercase flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
              activeTab === 'security'
                ? 'border-amber-500 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-500" />
            <span>Sécurité & Mot de Passe</span>
          </button>
        </div>

        {/* Tab 1: General & Legal */}
        {activeTab === 'general' && (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Agency Logo Uploader from Device */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative group">
                {formData.logoUrl ? (
                  <>
                    <img
                      src={formData.logoUrl}
                      alt="Logo de l'Agence"
                      className="w-full h-full object-contain p-1"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Retirer</span>
                    </button>
                  </>
                ) : (
                  <div className="text-center p-2 text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto mb-1 text-slate-400" />
                    <span className="text-[10px] font-bold">Pas de logo</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <h4 className="font-extrabold text-sm text-slate-900 font-heading flex items-center justify-center sm:justify-start gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  <span>Logo Officiel de l'Agence</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Importez le logo de votre agence depuis votre ordinateur ou téléphone (PNG, JPG, SVG). Il sera affiché dans l'en-tête du site et sur tous les documents officiels.
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isUploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isUploadingLogo ? 'Optimisation...' : 'Importer mon Logo depuis l\'appareil'}</span>
                  </button>
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer le logo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                  Nom de l'Agence Immobilière *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Mali Immo Prestige"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                  Slogan de l'Agence
                </label>
                <input
                  type="text"
                  name="slogan"
                  value={formData.slogan}
                  onChange={handleChange}
                  placeholder="Ex: L'Excellence Foncière & Immobilière au Mali"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                  Numéro RCCM (Registre du Commerce) *
                </label>
                <input
                  type="text"
                  name="rccm"
                  value={formData.rccm}
                  onChange={handleChange}
                  placeholder="Ex: MA-BKO-2022-B-12890"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                  Numéro NIF (Identification Fiscale DGI) *
                </label>
                <input
                  type="text"
                  name="nif"
                  value={formData.nif}
                  onChange={handleChange}
                  placeholder="Ex: 0852147983X"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                  Ville Principale
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Ex: Bamako"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                  Devise de Facturation
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-bold"
                >
                  <option value="FCFA">FCFA (Franc CFA BCEAO / XOF)</option>
                  <option value="EUR">EUR (€ Euro)</option>
                  <option value="USD">USD ($ Dollar US)</option>
                </select>
              </div>
            </div>

            {/* Spécialités & Cœur de Métier de l'Agence */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/5 via-slate-50 to-amber-500/10 border-2 border-amber-500/30 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                      <Briefcase className="w-4 h-4" />
                    </span>
                    <h4 className="font-extrabold text-slate-900 font-heading text-sm sm:text-base">
                      Spécialité & Cœur de Métier de l'Agence
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 uppercase tracking-wide">
                      Affiché sur l'Accueil Client
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Définissez la spécialité de votre agence (Vente, Location, Gestion). Cette indication valorise votre expertise auprès des clients et investisseurs sur la page d'accueil.
                  </p>
                </div>
              </div>

              {/* Spécialité Principale */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2.5">
                  Spécialité Principale Affichée *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { id: 'toutes', label: 'Vente, Location & Gestion', desc: 'Agence polyvalente intégrale', icon: Sparkles },
                    { id: 'vente', label: 'Spécialiste Vente & Foncier', desc: 'Parcelles TF & Villas', icon: Tag },
                    { id: 'location', label: 'Spécialiste Location', desc: 'Baux Habitation & Pro', icon: Key },
                    { id: 'gestion', label: 'Spécialiste Gestion Locative', desc: 'Recouvrement & Quittances', icon: FileCheck },
                  ].map((item) => {
                    const isSelected = (formData.primarySpecialty || 'toutes') === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectPrimarySpecialty(item.id as any)}
                        className={`p-3.5 rounded-xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/15 shadow-xs ring-2 ring-amber-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-600 font-bold' : 'text-slate-400'}`} />
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </div>
                        <div className="font-extrabold text-xs text-slate-900 font-heading">{item.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Activités proposées (Checkboxes) */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                  Activités Immobilières Autorisées (Cochez pour activer)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'vente' as const, label: 'Vente Immobilière & Foncière', badge: 'Vente', desc: 'Parcelles Titre Foncier, terrains agricoles & villas' },
                    { id: 'location' as const, label: 'Location Résidentielle & Pro', badge: 'Location', desc: 'Mise en location, baux d’habitation & baux commerciaux' },
                    { id: 'gestion' as const, label: 'Gestion Locative Sécurisée', badge: 'Gestion', desc: 'Suivi des loyers, quittances officielles & reversements' },
                  ].map((srv) => {
                    const isChecked = (formData.specialties || ['vente', 'location', 'gestion']).includes(srv.id);
                    return (
                      <div
                        key={srv.id}
                        onClick={() => handleToggleSpecialty(srv.id)}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none flex items-start gap-3 ${
                          isChecked
                            ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-1 rounded accent-amber-500 cursor-pointer pointer-events-none"
                        />
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-xs font-heading block">{srv.label}</span>
                          <p className={`text-[11px] ${isChecked ? 'text-slate-300' : 'text-slate-500'}`}>
                            {srv.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Description personnalisée de la spécialité */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Détail de la Spécialité (Texte explicatif affiché sur la page d'accueil)
                </label>
                <input
                  type="text"
                  name="specialtyDetails"
                  value={formData.specialtyDetails || ''}
                  onChange={handleChange}
                  placeholder="Ex: Spécialiste de la vente de parcelles avec Titre Foncier inattaquable et de la gestion locative à Bamako."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Texte d'Accroche / Description Complémentaire de l'Agence
              </label>
              <textarea
                name="tagline"
                rows={3}
                value={formData.tagline}
                onChange={handleChange}
                placeholder="Ex: Spécialiste de la vente de parcelles avec Titre Foncier, gestion locative de villas et promotion immobilière."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Contacts & WhatsApp */}
        {activeTab === 'contact' && (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Information Banner */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 mt-0.5">
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-700 space-y-1">
                <h5 className="font-extrabold text-slate-900 font-heading">
                  Numéros de Contact Officiels de l'Agence
                </h5>
                <p>
                  Chaque agence immobilière dispose de ses propres numéros de téléphone et WhatsApp. Tous les boutons d'appel, d'envoi WhatsApp sur les fiches de parcelles, la carte interactive, les formulaires de visite et le bas de page utiliseront immédiatement ces coordonnées.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
                  <span>Numéro de Téléphone d'Appel (Direct & Fiches) *</span>
                  <span className="text-[10px] text-amber-600 font-bold lowercase">Configuré pour tout le site</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="phoneDisplay"
                    value={formData.phoneDisplay || ''}
                    onChange={handleChange}
                    placeholder="Ex: 90070321 ou +223 90 07 03 21"
                    className="w-full pl-4 pr-24 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-bold"
                  />
                  {(formData.phoneDisplay || formData.phone) && (
                    <a
                      href={`tel:${cleanPhoneNumberForTel(formData.phoneDisplay || formData.phone)}`}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                      title="Tester l'appel immédiat"
                    >
                      <span>Appeler</span>
                      <Phone className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500">
                  <span>
                    Lien d'appel : <strong className="font-mono text-slate-800">{cleanPhoneNumberForTel(formData.phoneDisplay || formData.phone)}</strong>
                  </span>
                  <span>
                    Affichage : <strong className="text-slate-800">{formatMaliPhoneDisplay(formData.phoneDisplay || formData.phone)}</strong>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Exemple : <strong className="font-mono text-slate-700">90070321</strong> ou <strong className="font-mono text-slate-700">+223 90 07 03 21</strong>.
                  Ce numéro est instantanément utilisé sur l'en-tête (Header), le pied de page (Footer), et tous les boutons "Appeler l'Agence".
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
                  <span>Numéro WhatsApp de l'Agence *</span>
                  <button
                    type="button"
                    onClick={handleSyncPhoneToWhatsApp}
                    className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                  >
                    Copier depuis le tél d'appel
                  </button>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="whatsappNumber"
                    value={formData.whatsappNumber || ''}
                    onChange={handleChange}
                    placeholder="Ex: 22390070321 ou 90070321"
                    className="w-full pl-4 pr-20 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-slate-900 text-sm font-bold"
                  />
                  {(formData.whatsappNumber || formData.phoneDisplay) && (
                    <a
                      href={`https://wa.me/${cleanWhatsAppNumber(formData.whatsappNumber || formData.phoneDisplay)}?text=${encodeURIComponent(`Test de contact WhatsApp pour l'agence ${formData.name}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                      title="Tester l'ouverture de WhatsApp"
                    >
                      <span>WhatsApp</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                <div className="mt-1.5 text-[11px] text-slate-500">
                  Lien WhatsApp généré : <strong className="font-mono text-slate-800">https://wa.me/{cleanWhatsAppNumber(formData.whatsappNumber || formData.phoneDisplay)}</strong>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Reçoit automatiquement les messages WhatsApp pré-remplis pour chaque bien immobilier ou parcelle foncière.
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                  Email de Contact
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Ex: contact@mali-immoprestige.ml"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                  Horaires d'Ouverture de l'Agence
                </label>
                <input
                  type="text"
                  name="workingHours"
                  value={formData.workingHours}
                  onChange={handleChange}
                  placeholder="Ex: Lun - Sam: 08h00 - 18h30"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Adresse Géographique du Siège *
              </label>
              <textarea
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                placeholder="Ex: Hamdallaye ACI 2000, Rue 318, Face Immeuble BNDA, Bamako, Mali"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Banking & Mobile Money */}
        {activeTab === 'financial' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Coordonnées Bancaires de l'Agence</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nom de la Banque</label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    placeholder="Ex: BDM-SA, BOA Mali, Ecobank"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">RIB / Numéro de Compte</label>
                  <input
                    type="text"
                    name="bankRib"
                    value={formData.bankRib}
                    onChange={handleChange}
                    placeholder="Ex: ML016 01201 02541289001 45"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Intitulé du Compte</label>
                  <input
                    type="text"
                    name="bankAccountName"
                    value={formData.bankAccountName}
                    onChange={handleChange}
                    placeholder="Ex: MALI IMMO PRESTIGE SARL"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Codes Marchands Mobile Money (Mali)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Orange Money (Code Marchand / N°)</label>
                  <input
                    type="text"
                    name="orangeMoneyMerchant"
                    value={formData.orangeMoneyMerchant}
                    onChange={handleChange}
                    placeholder="Ex: OM-76001122"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Moov Money (Code Marchand)</label>
                  <input
                    type="text"
                    name="moovMoneyMerchant"
                    value={formData.moovMoneyMerchant}
                    onChange={handleChange}
                    placeholder="Ex: MOOV-66998877"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Wave Mali (Code)</label>
                  <input
                    type="text"
                    name="waveMerchant"
                    value={formData.waveMerchant}
                    onChange={handleChange}
                    placeholder="Ex: WAVE-BKO-001"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-600" />
                <span>Barème des Commissions Agence par Défaut</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Commission Gestion Locative (%)</label>
                  <input
                    type="number"
                    name="defaultRentalCommissionPercent"
                    value={formData.defaultRentalCommissionPercent}
                    onChange={handleChange}
                    min={1}
                    max={25}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Appliquée lors du reversement mensuel aux propriétaires.</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Commission Vente / Négociation (%)</label>
                  <input
                    type="number"
                    name="defaultSaleCommissionPercent"
                    value={formData.defaultSaleCommissionPercent}
                    onChange={handleChange}
                    min={1}
                    max={15}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Appliquée sur le montant de la cession de parcelle ou villa.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Official Stamp & Branding */}
        {activeTab === 'branding' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Texte du Cachet & Sceau Officiel de l'Agence
              </label>
              <input
                type="text"
                name="officialStampText"
                value={formData.officialStampText}
                onChange={handleChange}
                placeholder="Ex: MALI IMMO PRESTIGE SARL • DIRECTION GÉNÉRALE • VISA & SCEAU OFFICIEL"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 text-sm"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Ce texte apparaîtra dans le cercle du tampon d'authentification sur les quittances de loyer et contrats imprimables.
              </p>
            </div>

            {/* Live Visual Stamp Preview */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="font-black text-sm text-slate-900 font-heading">
                  Aperçu du Sceau d'Authenticité
                </h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Généré en temps réel pour l'impression des baux, mandats et quittances certifiées.
                </p>
              </div>

              <div className="w-44 h-44 rounded-full border-4 border-dashed border-slate-800 flex flex-col items-center justify-center p-3 text-center bg-white shadow-xs rotate-[-6deg] select-none">
                <Building2 className="w-6 h-6 text-amber-500 mb-1" />
                <span className="text-[9px] font-black text-slate-900 uppercase leading-tight font-heading">
                  {formData.name}
                </span>
                <span className="text-[7px] font-mono text-slate-600 uppercase my-0.5">
                  RCCM : {formData.rccm}
                </span>
                <div className="w-12 h-0.5 bg-amber-500 my-0.5" />
                <span className="text-[7px] font-black text-emerald-700 uppercase tracking-widest">
                  VISA CONFORME
                </span>
                <span className="text-[6px] font-mono text-slate-400 mt-0.5">
                  BAMAKO (MALI)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Security & Admin Password */}
        {activeTab === 'security' && (
          <div className="p-6 sm:p-8 space-y-8">
            {/* Status Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Protection Active
                  </div>
                  <h4 className="text-base font-black font-heading text-white">
                    Verrouillage & Sécurité du Back-Office
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xl">
                    L'accès au panneau de gestion administrateur (biens, baux, locataires, comptabilité et paramètres) est protégé par mot de passe.
                  </p>
                </div>
              </div>

              <div className="bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700 text-center shrink-0 w-full md:w-auto">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Statut Clé d'Accès</span>
                <span className="text-sm font-mono font-black text-amber-400 tracking-wider">
                  •••••••• (Masqué)
                </span>
              </div>
            </div>

            {/* Password Change Form */}
            <div className="max-w-xl bg-slate-50 p-6 sm:p-7 rounded-2xl border border-slate-200 space-y-5">
              <div className="flex items-center gap-2 text-slate-900 font-heading font-black text-base border-b border-slate-200 pb-3">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <span>Modifier le Mot de Passe d'Administration</span>
              </div>

              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    1. Mot de Passe Actuel
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswordText ? 'text' : 'password'}
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      placeholder="Entrez le mot de passe actuel..."
                      className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordText(!showPasswordText)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    2. Nouveau Mot de Passe ou Code PIN
                  </label>
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Entrez le nouveau mot de passe souhaité..."
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Exemple : un code à 4-6 chiffres ou un mot de passe sécurisé de votre choix.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    3. Confirmer le Nouveau Mot de Passe
                  </label>
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Retapez le nouveau mot de passe..."
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handlePasswordChangeSubmit}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Mettre à Jour le Mot de Passe</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Practical Security Guidelines */}
            <div className="p-5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2 text-xs text-amber-950">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Conseils de Sécurité pour les Agences Immobilières</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900/90 pl-1">
                <li>Votre mot de passe est strictement confidentiel et protège vos données financières et cadastrales.</li>
                <li>Pensez à renouveler régulièrement votre code d'accès administrateur.</li>
                <li>Lorsque vous quittez votre poste ou votre bureau, cliquez sur le bouton <strong>"Verrouiller"</strong> situé en haut à droite pour sécuriser le Back-Office.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Réinitialiser aux valeurs d'origine</span>
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer les Modifications</span>
          </button>
        </div>
      </form>

      {/* Confirmation Modal for Resetting Agency Settings */}
      <ConfirmDeleteModal
        isOpen={showResetConfirm}
        title="Réinitialiser les paramètres d'agence"
        message="Êtes-vous certain de vouloir réinitialiser toutes les coordonnées, barèmes de commissions et informations de marque aux valeurs d'origine ?"
        itemName="Configuration Globale d'Agence"
        itemType="Réinitialisation des Paramètres"
        details={[
          { label: 'Nom d’agence par défaut', value: 'Mali Immo Prestige' },
          { label: 'Frais d’agence', value: 'Commission vente 5%, Commission location 1 mois' },
          { label: 'Téléphone & Email', value: 'Réinitialiser aux coordonnées de contact initiales' },
        ]}
        onConfirm={handleConfirmResetSettings}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
