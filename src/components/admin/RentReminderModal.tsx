import React, { useState, useEffect } from 'react';
import { Tenant } from '../../types';
import { useAppSelector, useAppDispatch } from '../../store';
import { addToast } from '../../store/uiSlice';
import { formatFCFA, formatDate, getTenantLateStatus } from '../../utils/formatters';
import { cleanPhoneNumberForWhatsApp } from '../../utils/whatsappUtils';
import { RentStatusPastille } from './RentStatusPastille';
import {
  X,
  BellRing,
  MessageCircle,
  Copy,
  Check,
  Smartphone,
  Mail,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Send,
  Building,
  DollarSign,
  FileText
} from 'lucide-react';

interface RentReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
}

type ReminderTone = 'courtois' | 'ferme' | 'mise_en_demeure';

export const RentReminderModal: React.FC<RentReminderModalProps> = ({
  isOpen,
  onClose,
  tenant,
}) => {
  const dispatch = useAppDispatch();
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const [tone, setTone] = useState<ReminderTone>('ferme');
  const [paymentOption, setPaymentOption] = useState<'all' | 'orange_wave' | 'virement' | 'agence'>('all');
  const [deadline, setDeadline] = useState<string>('sous 48 heures');
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Initialize or re-adapt when tenant opens
  useEffect(() => {
    if (!tenant) return;

    const lateStatus = getTenantLateStatus(tenant);
    // Automatically select the appropriate tone based on overdue days
    if (lateStatus.isCritical) {
      setTone('mise_en_demeure');
      setDeadline('sous 8 jours francs');
    } else if (lateStatus.isOver5Days) {
      setTone('ferme');
      setDeadline('sous 48 heures');
    } else {
      setTone('courtois');
      setDeadline('dès que possible');
    }

    const totalDue = (tenant.monthlyRent || 0) + (tenant.pendingBalance || 0);
    setCustomAmount(totalDue);
  }, [tenant]);

  // Generate message based on selected tone, deadline and agency config
  const buildReminderText = (
    selectedTone: ReminderTone,
    selectedDeadline: string,
    amountToPay: number
  ): string => {
    if (!tenant) return '';

    const lateStatus = getTenantLateStatus(tenant);
    const agencyName = agencyConfig.name || 'Mali Immo Prestige';
    const phoneContact = agencyConfig.phoneDisplay || '+223 76 00 11 22';
    const agencyAddr = agencyConfig.address || 'Hamdallaye ACI 2000, Bamako';

    const header = `🏢 *${agencyName.toUpperCase()}* - GESTION LOCATIVE\n📍 ${agencyAddr}\n📞 Contact Gestion : ${phoneContact}\n━━━━━━━━━━━━━━━━━━━━\n`;

    let body = '';

    if (selectedTone === 'courtois') {
      body = `Bonjour M./Mme *${tenant.name}*,\n\n` +
        `Nous espérons que vous allez bien.\n\n` +
        `Sauf erreur de notre part, nous n'avons pas encore reçu votre règlement de loyer pour votre logement :\n` +
        `🏠 *Bien :* ${tenant.propertyTitle} (Unité : ${tenant.unitNumber || 'Principale'})\n` +
        `🗓️ *Échéance habituelle :* le ${tenant.rentPaymentDay || 5} du mois\n` +
        `💰 *Montant attendu :* ${formatFCFA(amountToPay)}\n\n` +
        `Nous vous remercions de bien vouloir régulariser ce paiement *${selectedDeadline}*.\n\n` +
        `📌 *Modes de versement acceptés :*\n` +
        `- Orange Money / Wave au : *${phoneContact}*\n` +
        `- Virement bancaire / Dépôt (BDM-SA, BMS)\n` +
        `- Règlement direct à notre agence (${agencyAddr})\n\n` +
        `Si votre paiement a déjà été effectué aujourd'hui, merci de nous transmettre votre justificatif.\n\n` +
        `Bien cordialement,\n_Le Service Recouvrement - ${agencyName}_`;
    } else if (selectedTone === 'ferme') {
      body = `Bonjour M./Mme *${tenant.name}*,\n\n` +
        `*OBJET : RELANCE ET RAPPEL D'IMPAYÉ DE LOYER*\n\n` +
        `Nous constatons à ce jour un retard de *${lateStatus.daysLate} jours* pour le loyer de votre bien :\n` +
        `🏠 *Bien loué :* ${tenant.propertyTitle} (Porte : ${tenant.unitNumber || 'Principale'})\n` +
        `📅 *Échéance contractuelle dépassée :* le ${tenant.rentPaymentDay || 5} du mois\n` +
        `💰 *Solde débiteur à régulariser :* ${formatFCFA(amountToPay)}\n\n` +
        `Le délai de tolérance contractuel (5 jours) étant désormais échu, nous vous demandons d'effectuer votre versement impérativement *${selectedDeadline}* afin d'éviter la facturation de pénalités de retard.\n\n` +
        `💳 *Moyens de paiement immédiats :*\n` +
        `• Orange Money / Wave : *${phoneContact}*\n` +
        `• Virement ou versement direct en agence\n\n` +
        `Merci de nous faire parvenir le reçu de transaction dès l'opération validée.\n\n` +
        `Comptant sur votre diligence,\n_La Direction - ${agencyName}_`;
    } else {
      // Mise en demeure / Contentieux
      body = `*LETTRE DE MISE EN DEMEURE POUR DÉFAUT DE PAIEMENT*\n\n` +
        `À l'attention de M./Mme *${tenant.name}*,\n` +
        `Locataire du bien situé à : ${tenant.propertyTitle} (Unité ${tenant.unitNumber || 'Principale'})\n\n` +
        `Madame, Monsieur,\n\n` +
        `Malgré nos précédentes relances, nous constatons un retard persistant de *${lateStatus.daysLate} jours* dans le règlement de vos loyers.\n\n` +
        `📊 *État de compte débiteur :*\n` +
        `- Loyer mensuel : ${formatFCFA(tenant.monthlyRent)}\n` +
        `- Arriérés / Reliquat : ${formatFCFA(amountToPay)}\n` +
        `👉 *TOTAL EXIGIBLE IMMÉDIATEMENT : ${formatFCFA(amountToPay)}*\n\n` +
        `Par la présente, nous vous mettons formellement en demeure de solder cette somme *${selectedDeadline}* auprès de notre agence.\n\n` +
        `À défaut de paiement intégral ou d'accord écrit dans ce délai, nous serons dans l'obligation d'engager les poursuites prévues par le Code civil malien et les clauses résolutoires de votre bail (recouvrement par voie d'huissier, résiliation de bail et demande d'expulsion).\n\n` +
        `📞 Contact direct Direction : *${phoneContact}*\n` +
        `📍 Agence : ${agencyAddr}\n\n` +
        `Sous toutes réserves de droit,\n_La Direction Générale - ${agencyName}_`;
    }

    return `${header}${body}`;
  };

  // Rebuild message whenever tone, deadline or customAmount changes
  useEffect(() => {
    if (tenant) {
      const msg = buildReminderText(tone, deadline, customAmount);
      setGeneratedMessage(msg);
    }
  }, [tenant, tone, deadline, customAmount]);

  if (!isOpen || !tenant) return null;

  const lateStatus = getTenantLateStatus(tenant);
  const cleanPhone = cleanPhoneNumberForWhatsApp(tenant.phone);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(generatedMessage);
      setCopied(true);
      dispatch(
        addToast({
          type: 'success',
          message: 'Message de rappel copié dans le presse-papiers !',
        })
      );
      setTimeout(() => setCopied(false), 2500);
    } catch {
      dispatch(
        addToast({
          type: 'error',
          message: 'Impossible de copier automatiquement. Veuillez sélectionner le texte.',
        })
      );
    }
  };

  const handleSendWhatsApp = () => {
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(generatedMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(generatedMessage)}`;

    window.open(url, '_blank');
    dispatch(
      addToast({
        type: 'success',
        message: `Discussion WhatsApp ouverte pour ${tenant.name}`,
      })
    );
    onClose();
  };

  const handleSendSMS = () => {
    const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(generatedMessage)}`;
    window.location.href = smsUrl;
  };

  const handleSendMail = () => {
    if (!tenant.email) return;
    const subject = encodeURIComponent(
      `Rappel de loyer - ${tenant.propertyTitle} - ${agencyConfig.name}`
    );
    const mailtoUrl = `mailto:${tenant.email}?subject=${subject}&body=${encodeURIComponent(
      generatedMessage
    )}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  Générateur de Rappel
                </span>
                <span className="text-xs text-slate-400">• Notification Client</span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-white font-heading">
                Rappel de Loyer : {tenant.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fermer la boîte de dialogue"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tenant Summary Banner */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <RentStatusPastille tenant={tenant} size="md" showBadge={true} />
            <div className="flex items-center gap-1.5 text-slate-600">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-bold text-slate-800">{tenant.propertyTitle}</span>
              <span className="text-slate-400">• Unité {tenant.unitNumber || '1'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-slate-700 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-2xs">
            <span>📞 {tenant.phone}</span>
            <span className="text-slate-300">|</span>
            <span className="font-bold text-slate-900 font-heading">{formatFCFA(customAmount)}</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Degré d'urgence & Tonalité du Message :
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Option 1: Courtois */}
              <button
                type="button"
                onClick={() => setTone('courtois')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  tone === 'courtois'
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-300'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span className="font-extrabold text-xs">1. Courtois</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  1er rappel amical. Échéance standard et coordonnées de paiement.
                </p>
              </button>

              {/* Option 2: Ferme */}
              <button
                type="button"
                onClick={() => setTone('ferme')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  tone === 'ferme'
                    ? 'border-rose-500 bg-rose-50/80 text-rose-950 ring-2 ring-rose-300'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span className="font-extrabold text-xs">2. Ferme (&gt; 5 jours)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Constat de dépassement de grâce. Délai strict de 48h requis.
                </p>
              </button>

              {/* Option 3: Mise en demeure */}
              <button
                type="button"
                onClick={() => setTone('mise_en_demeure')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  tone === 'mise_en_demeure'
                    ? 'border-rose-700 bg-rose-100/90 text-rose-950 ring-2 ring-rose-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert className="w-4 h-4 text-rose-700" />
                  <span className="font-extrabold text-xs">3. Mise en demeure</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Contentieux sévère. Mention des clauses résolutoires et huissier.
                </p>
              </button>
            </div>
          </div>

          {/* Configuration Parameters: Deadline and Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Délai de régularisation exigé :
              </label>
              <select
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="sous 24 heures">Sous 24 heures (Immédiat)</option>
                <option value="sous 48 heures">Sous 48 heures</option>
                <option value="avant la fin de semaine">Avant la fin de semaine</option>
                <option value="sous 8 jours francs">Sous 8 jours francs (Légal)</option>
                <option value="dès que possible">Dès que possible</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Montant total réclamé (FCFA) :
              </label>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(Number(e.target.value))}
                step="5000"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Generated Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Message prêt à envoyer (Modifiable directement) :</span>
              </label>
              <button
                type="button"
                onClick={() => setGeneratedMessage(buildReminderText(tone, deadline, customAmount))}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                title="Régénérer le modèle par défaut"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Réinitialiser</span>
              </button>
            </div>

            <textarea
              rows={8}
              value={generatedMessage}
              onChange={(e) => setGeneratedMessage(e.target.value)}
              className="w-full p-3.5 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono leading-relaxed border border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner resize-y"
              placeholder="Texte de relance généré..."
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 px-1">
              <span>Conseil : Les astérisques (*texte*) appliquent le gras dans WhatsApp.</span>
              <span>{generatedMessage.length} caractères</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopyMessage}
              className="flex-1 sm:flex-none px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Copier le message complet"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-extrabold">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Copier</span>
                </>
              )}
            </button>

            {/* Send SMS */}
            <button
              type="button"
              onClick={handleSendSMS}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Ouvrir l'application SMS"
            >
              <Smartphone className="w-4 h-4 text-slate-600" />
              <span>SMS</span>
            </button>

            {/* Send Email if available */}
            {tenant.email && (
              <button
                type="button"
                onClick={handleSendMail}
                className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                title={`Envoyer par e-mail à ${tenant.email}`}
              >
                <Mail className="w-4 h-4 text-blue-600" />
                <span>E-mail</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Annuler
            </button>

            {/* Primary Action: Send WhatsApp */}
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Envoyer via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
