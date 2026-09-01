import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { closeOwnerDepositModal, addToast } from '../../store/uiSlice';
import { addLead } from '../../store/leadsSlice';
import { formatFCFA } from '../../utils/formatters';
import { ImageUploadGallery } from '../common/ImageUploadGallery';
import { 
  X, 
  Building2, 
  MapPin, 
  FileCheck, 
  Phone, 
  User, 
  DollarSign, 
  Send, 
  CheckCircle2, 
  ShieldCheck,
  Camera
} from 'lucide-react';

export const OwnerDepositModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isOwnerDepositModalOpen);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const [formData, setFormData] = useState({
    ownerName: '',
    ownerPhone: '',
    dealType: 'vente', // 'vente' | 'gestion'
    propertyType: 'parcelle', // 'parcelle' | 'maison' | 'immeuble' | 'commercial'
    city: 'Bamako',
    neighborhood: 'Kalaban Coura',
    surface: 300,
    documentType: 'Titre Foncier',
    desiredPrice: 15000000,
    notes: '',
  });

  const [photos, setPhotos] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create lead in store
    dispatch(
      addLead({
        clientName: formData.ownerName,
        clientPhone: formData.ownerPhone,
        leadType: 'depot_bien',
        propertyTitle: `Mise en ${formData.dealType === 'vente' ? 'Vente' : 'Gestion'} : ${formData.propertyType.toUpperCase()} à ${formData.neighborhood}`,
        message: `Dépôt Propriétaire : ${formData.propertyType} (${formData.surface} m²), Document: ${formData.documentType}, Prix souhaité: ${formatFCFA(formData.desiredPrice)}. Photos jointes: ${photos.length}. Notes: ${formData.notes}`,
      })
    );

    dispatch(closeOwnerDepositModal());
    dispatch(
      addToast({
        type: 'success',
        message: 'Votre proposition a été transmise à notre équipe avec vos photos ! Nous vous recontactons sous 24h.',
      })
    );

    // Open WhatsApp
    const message = `Bonjour ${agencyConfig.name}, je souhaite vous confier mon bien :\n- Type : ${formData.propertyType}\n- Opération : ${formData.dealType === 'vente' ? 'Vente' : 'Gestion Locative'}\n- Localisation : ${formData.neighborhood} (${formData.city})\n- Superficie : ${formData.surface} m²\n- Document : ${formData.documentType}\n- Prix souhaité : ${formatFCFA(formData.desiredPrice)}\n- Photos : ${photos.length} photo(s) prête(s)\n- Nom : ${formData.ownerName}\n- Tel : ${formData.ownerPhone}`;
    window.open(`https://wa.me/${agencyConfig.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-fadeIn">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg font-heading">
                Confier un Bien ou Vendre une Parcelle
              </h3>
              <p className="text-xs text-slate-400">Estimation gratuite & diffusion immédiate</p>
            </div>
          </div>

          <button
            onClick={() => dispatch(closeOwnerDepositModal())}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Type d'Opération *
              </label>
              <select
                value={formData.dealType}
                onChange={(e) => setFormData({ ...formData, dealType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 text-sm"
              >
                <option value="vente">Vente de Parcelle / Maison</option>
                <option value="gestion">Mise en Gestion Locative</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Type de Bien *
              </label>
              <select
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 text-sm"
              >
                <option value="parcelle">Parcelle / Terrain Nu</option>
                <option value="maison">Villa / Maison Individuelle</option>
                <option value="immeuble">Immeuble / Appartements</option>
                <option value="commercial">Magasin / Bureau</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Votre Nom Complet *
              </label>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="Ex: M. Souleymane Keita"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Téléphone WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={formData.ownerPhone}
                onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                placeholder="+223 76 ..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Quartier / Zone *
              </label>
              <input
                type="text"
                required
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                placeholder="Ex: Kalaban Coura, Kati, ACI 2000"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Superficie Approximative (m²)
              </label>
              <input
                type="number"
                value={formData.surface}
                onChange={(e) => setFormData({ ...formData, surface: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Document Juridique Détenu *
              </label>
              <select
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 text-sm"
              >
                <option value="Titre Foncier">Titre Foncier (TF)</option>
                <option value="Bail Emphytéotique">Bail Emphytéotique</option>
                <option value="Permis d'Occuper">Permis d'Occuper</option>
                <option value="Lettre d'Attribution">Lettre d'Attribution</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Prix Souhaité (FCFA)
              </label>
              <input
                type="number"
                value={formData.desiredPrice}
                onChange={(e) => setFormData({ ...formData, desiredPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 text-sm"
              />
            </div>
          </div>

          {/* Photos Upload from Device */}
          <div className="pt-2">
            <ImageUploadGallery
              images={photos}
              onChange={setPhotos}
              maxImages={10}
              label="Photos du Bien (Optionnel - Vos images)"
              helperText="Prenez des photos avec votre smartphone ou importez depuis votre galerie."
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
              Détails complémentaires / Accès
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Précisez les accès goudronnés, poteaux EDM/SOMAGEP à proximité..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-900 text-sm"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => dispatch(closeOwnerDepositModal())}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Soumettre à l'Agence</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
