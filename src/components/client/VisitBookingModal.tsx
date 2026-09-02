import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { closeVisitModal, addToast } from '../../store/uiSlice';
import { addLead } from '../../store/leadsSlice';
import { firestoreService } from '../../services/firestoreService';
import { formatFCFA, getDocumentBadgeInfo, cleanPhoneNumberForTel, cleanWhatsAppNumber } from '../../utils/formatters';
import { X, Calendar, Clock, Phone, User, Mail, MessageSquare, MessageCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const VisitBookingModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isVisitModalOpen);
  const propertyId = useAppSelector((state) => state.ui.visitPropertyId);
  const properties = useAppSelector((state) => state.properties.items);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const agencyPhoneDisplay = agencyConfig.phoneDisplay || agencyConfig.phone || '+223 76 00 11 22';
  const agencyCallTel = cleanPhoneNumberForTel(agencyConfig.phone || agencyConfig.phoneDisplay);
  const agencyWhatsAppNumber = cleanWhatsAppNumber(agencyConfig.whatsappNumber);

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('+223 ');
  const [clientEmail, setClientEmail] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('10:00');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const property = properties.find((p) => p.id === propertyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      dispatch(addToast({
        type: 'warning',
        message: 'Veuillez renseigner votre nom et votre numéro de téléphone au Mali.',
      }));
      return;
    }

    setIsSubmitting(true);

    const leadData = {
      propertyId: property?.id || '',
      propertyTitle: property?.title || 'Bien immobilier général',
      propertyRef: property?.reference || 'REF-GEN',
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim() || undefined,
      leadType: 'demande_visite' as const,
      message: message.trim() || `Demande de visite pour le bien ${property?.reference || ''} le ${visitDate} à ${visitTime}`,
      visitDate: visitDate || undefined,
      visitTime: visitTime || undefined,
    };

    try {
      dispatch(addLead(leadData));
      await firestoreService.saveLead({
        ...leadData,
        id: `lead-${Date.now()}`,
        status: 'nouveau',
        createdAt: new Date().toISOString(),
      });

      setIsSuccess(true);
      dispatch(addToast({
        type: 'success',
        message: 'Votre demande de visite a bien été enregistrée ! Un conseiller vous contactera sous peu.',
      }));

      setTimeout(() => {
        setIsSuccess(false);
        dispatch(closeVisitModal());
      }, 2000);
    } catch (err) {
      console.error(err);
      dispatch(addToast({
        type: 'error',
        message: 'Une erreur est survenue lors de l\'enregistrement.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
        id="visit-booking-modal"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base font-heading">
                Planifier une Visite sur le Terrain
              </h3>
              <p className="text-xs text-slate-300">
                Accompagnement gratuit par un agent de Mali Immo Prestige
              </p>
            </div>
          </div>

          <button
            onClick={() => dispatch(closeVisitModal())}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-lg font-heading">
              Demande Envoyée avec Succès !
            </h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Nous avons bien reçu votre demande pour le bien <strong>{property?.reference}</strong>. Notre agent responsable de la zone vous contactera au <strong>{clientPhone}</strong> pour confirmer le rendez-vous.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {/* Property Summary Strip */}
            {property && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex gap-3 items-center">
                <img
                  src={property.featuredImage || property.images[0]}
                  alt={property.title}
                  className="w-14 h-14 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-amber-700 font-bold block">
                    {property.reference} • {getDocumentBadgeInfo(property.documentType).shortLabel}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 truncate">
                    {property.title}
                  </h4>
                  <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                    {formatFCFA(property.price)}
                  </p>
                </div>
              </div>
            )}

            {/* Client Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Nom & Prénom *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ex : Ousmane Diallo"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Client Phone with Mali prefix */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Numéro de Téléphone (WhatsApp) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="+223 76 00 00 00"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Date & Time selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Date souhaitée
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full pl-9 pr-2 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Heure souhaitée
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className="w-full pl-9 pr-2 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="09:00">09h00 Matin</option>
                    <option value="10:00">10h00 Matin</option>
                    <option value="11:30">11h30</option>
                    <option value="15:00">15h00 Après-midi</option>
                    <option value="16:30">16h30</option>
                    <option value="17:30">17h30 Fin de journée</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Message / Details */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Message / Remarques (Optionnel)
              </label>
              <textarea
                rows={2}
                placeholder="Ex : Je viendrai accompagné de mon géomètre ou de mon entrepreneur..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              ></textarea>
            </div>

            {/* Direct Helpline Banner */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <span className="text-amber-900 font-medium text-[11px]">
                Besoin d'une confirmation immédiate avec {agencyConfig.name} ?
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${agencyCallTel}`}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  <span>Appeler ({agencyPhoneDisplay})</span>
                </a>
                <a
                  href={`https://wa.me/${agencyWhatsAppNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => dispatch(closeVisitModal())}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Calendar className="w-4 h-4" />
                <span>{isSubmitting ? 'Enregistrement...' : 'Confirmer la Demande'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
