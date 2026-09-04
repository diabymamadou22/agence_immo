import React, { useState, useMemo } from 'react';
import { Tenant } from '../../types';
import { useAppSelector, useAppDispatch } from '../../store';
import { addToast } from '../../store/uiSlice';
import { formatFCFA, formatDate, getTenantLateStatus } from '../../utils/formatters';
import { cleanPhoneNumberForWhatsApp } from '../../utils/whatsappUtils';
import {
  X,
  BellRing,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building,
  CheckSquare,
  Square,
  Sparkles,
  Smartphone,
  ExternalLink,
  Copy,
  Users
} from 'lucide-react';

interface BatchRentReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: Tenant[];
}

type CampaignTone = 'courtois' | 'ferme' | 'mise_en_demeure';

export const BatchRentReminderModal: React.FC<BatchRentReminderModalProps> = ({
  isOpen,
  onClose,
  tenants,
}) => {
  const dispatch = useAppDispatch();
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const [tone, setTone] = useState<CampaignTone>('courtois');
  const [filterMode, setFilterMode] = useState<'retard_et_echeance' | 'retard_strict' | 'partiel' | 'tous'>('retard_et_echeance');
  const [selectedTenantIds, setSelectedTenantIds] = useState<Record<string, boolean>>({});
  const [sentTracking, setSentTracking] = useState<Record<string, boolean>>({});

  // Current month string
  const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // Filter eligible tenants based on criteria
  const eligibleTenants = useMemo(() => {
    return tenants.filter((t) => {
      const lateStatus = getTenantLateStatus(t);
      const isRetard = t.status === 'retard' || lateStatus.isLate;
      const isPartiel = t.status === 'partiel' || (t.pendingBalance || 0) > 0;
      const notPaidCurrent = !t.lastPaymentMonth || !t.lastPaymentMonth.toLowerCase().includes(currentMonth.toLowerCase());

      if (filterMode === 'retard_strict') return isRetard;
      if (filterMode === 'partiel') return isPartiel;
      if (filterMode === 'retard_et_echeance') return isRetard || isPartiel || notPaidCurrent;
      return true; // 'tous'
    });
  }, [tenants, filterMode, currentMonth]);

  // Sync selectedTenantIds when eligibleTenants changes
  React.useEffect(() => {
    const initialMap: Record<string, boolean> = {};
    eligibleTenants.forEach((t) => {
      initialMap[t.id] = true;
    });
    setSelectedTenantIds(initialMap);
  }, [eligibleTenants]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedTenantIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelectAll = () => {
    const allSelected = eligibleTenants.every((t) => selectedTenantIds[t.id]);
    const updated: Record<string, boolean> = {};
    eligibleTenants.forEach((t) => {
      updated[t.id] = !allSelected;
    });
    setSelectedTenantIds(updated);
  };

  const selectedCount = eligibleTenants.filter((t) => selectedTenantIds[t.id]).length;
  const totalDueAmount = eligibleTenants
    .filter((t) => selectedTenantIds[t.id])
    .reduce((sum, t) => sum + ((t.pendingBalance && t.pendingBalance > 0) ? t.pendingBalance : t.monthlyRent), 0);

  // Generate personalized WhatsApp message for a single tenant
  const generateTenantMessage = (tenant: Tenant): string => {
    const lateStatus = getTenantLateStatus(tenant);
    const amountDue = (tenant.pendingBalance && tenant.pendingBalance > 0) ? tenant.pendingBalance : tenant.monthlyRent;
    const isPartial = (tenant.pendingBalance && tenant.pendingBalance > 0);

    let message = '';
    const agencyName = agencyConfig.name || 'Mali Immo Prestige';
    const orangeMoney = agencyConfig.orangeMoneyMerchant ? `• Orange Money : ${agencyConfig.orangeMoneyMerchant}` : '';
    const moovMoney = agencyConfig.moovMoneyMerchant ? `• Moov Money : ${agencyConfig.moovMoneyMerchant}` : '';
    const wave = agencyConfig.waveMerchant ? `• Wave : ${agencyConfig.waveMerchant}` : '';
    const rib = agencyConfig.bankRib ? `• RIB Virement : ${agencyConfig.bankRib} (${agencyConfig.bankName || 'Banque'})` : '';

    const paymentDetails = [orangeMoney, moovMoney, wave, rib].filter(Boolean).join('\n');

    if (tone === 'courtois') {
      message = `Bonjour M./Mme *${tenant.name}*,\n\nL'agence *${agencyName}* vous rappelle courtoisement que le loyer du mois de *${currentMonth}* pour votre logement *${tenant.propertyTitle}* (Porte/Unité: ${tenant.unitNumber || 'Principal'}) arrive à échéance.\n\n` +
        `• Montant exigible : *${formatFCFA(amountDue)}* ${isPartial ? '(Reliquat dû)' : ''}\n` +
        `• Date limite souhaitée : Le ${tenant.rentPaymentDay || 5} du mois\n\n` +
        `Canaux de règlement sécurisés :\n${paymentDetails}\n\n` +
        `Dès réception de votre versement, votre quittance certifiée avec cachet vous sera immédiatement transmise. Merci de votre fidélité et excellente journée !`;
    } else if (tone === 'ferme') {
      message = `AVIS DE RAPPEL DE LOYER - *${agencyName}*\n\n` +
        `M./Mme *${tenant.name}*,\n` +
        `Sauf erreur de nos services, nous constatons un retard de paiement pour le loyer du mois de *${currentMonth}* concernant le bien *${tenant.propertyTitle}*.\n\n` +
        `• Dette exigible : *${formatFCFA(amountDue)}*\n` +
        `• Retard constaté : ${lateStatus.daysLate > 0 ? `${lateStatus.daysLate} jour(s)` : 'Échéance dépassée'}\n\n` +
        `Nous vous prions de bien vouloir régulariser cette situation sous 48 heures via nos canaux officiels :\n${paymentDetails}\n\n` +
        `En cas de versement déjà effectué, merci de nous transmettre la capture ou référence de transaction. Direction du Contentieux Locatif.`;
    } else {
      // Mise en demeure
      message = `⚠️ MISE EN DEMEURE AVANT PROCÉDURE DE RÉSILIATION\n\n` +
        `Destinataire : M./Mme *${tenant.name}*\n` +
        `Bail concerné : *${tenant.propertyTitle}*\n` +
        `Agence : *${agencyName}*\n\n` +
        `Malgré nos précédentes relances, nous constatons le défaut de paiement de vos obligations locatives pour un montant total de *${formatFCFA(amountDue)}*.\n\n` +
        `Par la présente, vous êtes mis en demeure de régler l'intégralité de ladite somme sous un délai impératif de 8 jours francs, sous peine d'engagement des poursuites judiciaires conformément à la législation en vigueur au Mali (résiliation du bail, expulsion et saisie conservatoire).\n\n` +
        `Règlement immédiat par les canaux autorisés :\n${paymentDetails}\n\n` +
        `La Direction Juridique & Contentieux.`;
    }

    return message;
  };

  const handleSendSingleWhatsApp = (tenant: Tenant) => {
    const cleanPhone = cleanPhoneNumberForWhatsApp(tenant.phone);
    if (!cleanPhone) {
      dispatch(addToast({ type: 'error', message: `Numéro de téléphone invalide pour ${tenant.name}` }));
      return;
    }

    const text = generateTenantMessage(tenant);
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');

    setSentTracking((prev) => ({ ...prev, [tenant.id]: true }));
    dispatch(addToast({ type: 'success', message: `Rappel WhatsApp ouvert pour ${tenant.name}` }));
  };

  const handleCopySingleMessage = (tenant: Tenant) => {
    const text = generateTenantMessage(tenant);
    navigator.clipboard.writeText(text);
    dispatch(addToast({ type: 'info', message: `Message de rappel copié pour ${tenant.name}` }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold font-heading text-white">
                  Rappels Groupés des Loyers (WhatsApp & SMS)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black uppercase">
                  Échéance du 5
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Campagne de relance des baux actifs au Mali pour le mois de {currentMonth}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Campaign Controls */}
        <div className="p-6 space-y-6">
          
          {/* Tone Selector & Filter Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tone */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Ton du Message de Relance</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTone('courtois')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                    tone === 'courtois'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Courtois (Préventif)
                </button>
                <button
                  type="button"
                  onClick={() => setTone('ferme')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                    tone === 'ferme'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Ferme (Relance)
                </button>
                <button
                  type="button"
                  onClick={() => setTone('mise_en_demeure')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                    tone === 'mise_en_demeure'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Mise en Demeure
                </button>
              </div>
            </div>

            {/* Filter Target */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Ciblage des Locataires</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFilterMode('retard_et_echeance')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer truncate ${
                    filterMode === 'retard_et_echeance'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                  title="Locataires avec retard ou n'ayant pas encore payé le mois courant"
                >
                  Échéance & Retard
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('retard_strict')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer truncate ${
                    filterMode === 'retard_strict'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Retard Strict
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('partiel')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer truncate ${
                    filterMode === 'partiel'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Reliquat Partiel
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('tous')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer truncate ${
                    filterMode === 'tous'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Tous ({tenants.length})
                </button>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-amber-700 cursor-pointer"
              >
                {selectedCount === eligibleTenants.length && eligibleTenants.length > 0 ? (
                  <CheckSquare className="w-5 h-5 text-amber-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
                <span>Tout sélectionner ({eligibleTenants.length})</span>
              </button>
              <div className="h-4 w-px bg-amber-300 hidden sm:block" />
              <span className="text-xs text-amber-900 font-bold">
                <span className="text-amber-700 font-black">{selectedCount}</span> locataire(s) sélectionné(s)
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-600 font-semibold">Total créances ciblées : </span>
              <span className="text-base font-black text-slate-900">{formatFCFA(totalDueAmount)}</span>
            </div>
          </div>

          {/* Tenant List */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
              {eligibleTenants.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Aucun locataire ne correspond à ce filtre actuellement. Tous les loyers sont à jour !
                </div>
              ) : (
                eligibleTenants.map((t) => {
                  const isChecked = !!selectedTenantIds[t.id];
                  const isSent = !!sentTracking[t.id];
                  const late = getTenantLateStatus(t);
                  const amount = (t.pendingBalance && t.pendingBalance > 0) ? t.pendingBalance : t.monthlyRent;

                  return (
                    <div
                      key={t.id}
                      className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isChecked ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/70 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleSelect(t.id)}
                          className="mt-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-amber-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-slate-900">{t.name}</span>
                            <span className="text-xs font-semibold text-slate-500">{t.phone}</span>
                            {isSent && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                Relancé
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3 text-slate-400" />
                              {t.propertyTitle}
                            </span>
                            <span>• Porte: {t.unitNumber || 'Principal'}</span>
                            <span className="text-amber-700 font-bold">Échéance: {t.rentPaymentDay || 5} du mois</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0">
                        <div className="text-right">
                          <span className="block text-sm font-black text-slate-900">{formatFCFA(amount)}</span>
                          <span className={`text-[10px] font-bold ${late.isLate ? 'text-rose-600' : 'text-slate-500'}`}>
                            {t.status === 'partiel' ? 'Reliquat partiel' : late.isLate ? `Retard ${late.daysLate}j` : 'Mois en cours'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopySingleMessage(t)}
                            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                            title="Copier le message préparé"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendSingleWhatsApp(t)}
                            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                              isSent
                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{isSent ? 'Renvoyer' : 'Envoyer WhatsApp'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Helper Tips */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Astuce de gestion locative au Mali :</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              Pour respecter la politique anti-spam de WhatsApp et garantir un taux d'ouverture de 100%, chaque rappel s'ouvre individuellement avec le message personnalisé pré-rempli (mentionnant le nom exact, le numéro de porte, le montant en FCFA et les codes marchands Orange Money / Wave de l'agence).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 sm:p-6 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {Object.values(sentTracking).filter(Boolean).length} sur {eligibleTenants.length} contactés
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shadow-xs transition-colors"
          >
            Terminer la campagne
          </button>
        </div>

      </div>
    </div>
  );
};
