import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { openPaymentModal, setActiveAdminTab, addToast } from '../../store/uiSlice';
import { formatFCFA, formatDate } from '../../utils/formatters';
import { sendRentReminderWhatsApp, sendLeaseExpiryNoticeWhatsApp } from '../../utils/whatsappUtils';
import { Tenant } from '../../types';
import { 
  AlertTriangle, 
  MessageCircle, 
  DollarSign, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ArrowUpRight, 
  Phone, 
  User, 
  ChevronRight,
  ShieldAlert,
  Send,
  CreditCard
} from 'lucide-react';

export const RentLateAlertWidget: React.FC = () => {
  const dispatch = useAppDispatch();
  const tenants = useAppSelector((state) => state.tenants.items);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  const [activeSubTab, setActiveSubTab] = useState<'retards' | 'echeances'>('retards');

  // 1. Identify late tenants
  const lateTenants = tenants.filter(
    (t) => t.status === 'retard' || (t.pendingBalance && t.pendingBalance > 0)
  );

  // 2. Identify expiring leases (within 60 days or already passed)
  const now = new Date();
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const expiringTenants = tenants.filter((t) => {
    if (!t.leaseEndDate) return false;
    const end = new Date(t.leaseEndDate);
    return end <= sixtyDaysFromNow;
  });

  // Calculate total unpaid volume
  const totalLateAmount = lateTenants.reduce((sum, t) => {
    const due = t.pendingBalance && t.pendingBalance > 0 ? t.pendingBalance : t.monthlyRent;
    return sum + due;
  }, 0);

  const handleSendReminder = (tenant: Tenant) => {
    sendRentReminderWhatsApp(tenant, agencyConfig);
    dispatch(addToast({
      type: 'success',
      message: `Relance WhatsApp ouverte pour ${tenant.name}`
    }));
  };

  const handleSendLeaseNotice = (tenant: Tenant) => {
    sendLeaseExpiryNoticeWhatsApp(tenant, agencyConfig);
    dispatch(addToast({
      type: 'success',
      message: `Avis d'échéance WhatsApp ouvert pour ${tenant.name}`
    }));
  };

  const handleCollectPayment = (tenantId: string) => {
    dispatch(openPaymentModal(tenantId));
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header with high visual clarity */}
      <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
            lateTenants.length > 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {lateTenants.length > 0 ? (
              <AlertTriangle className="w-6 h-6 text-rose-400 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                Système d'Alertes Agence
              </span>
              <span className="text-[11px] text-slate-400">• Automatisation WhatsApp</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black font-heading text-white">
              {lateTenants.length > 0 
                ? `${lateTenants.length} Loyer${lateTenants.length > 1 ? 's' : ''} en Retard d'Encaissement`
                : 'Tous les Loyers du Mois sont à Jour'}
            </h3>
            <p className="text-xs text-slate-300">
              {lateTenants.length > 0
                ? `Montant total des impayés à recouvrer : ${formatFCFA(totalLateAmount)}`
                : 'Aucune anomalie de paiement constatée sur le parc locatif.'}
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation and Global View Link */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-700 text-xs">
            <button
              onClick={() => setActiveSubTab('retards')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'retards'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Impayés</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/60 font-black">
                {lateTenants.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('echeances')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'echeances'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Fins de bail</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/60 font-black">
                {expiringTenants.length}
              </span>
            </button>
          </div>

          <button
            onClick={() => dispatch(setActiveAdminTab('locations'))}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Ouvrir la gestion locative"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab 1: Loyers en Retard */}
      {activeSubTab === 'retards' && (
        <div className="p-5 sm:p-6 space-y-4">
          {lateTenants.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Excellente nouvelle !</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tous les locataires sont à jour dans le règlement de leurs loyers pour la période en cours.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lateTenants.map((tenant) => {
                const amountDue = tenant.pendingBalance && tenant.pendingBalance > 0 
                  ? tenant.pendingBalance 
                  : tenant.monthlyRent;
                
                return (
                  <div 
                    key={tenant.id}
                    className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50/80 transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900 font-heading">
                              {tenant.name}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                              En retard
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 truncate mt-0.5 font-medium">
                            🏢 {tenant.propertyTitle} {tenant.unitNumber ? `(${tenant.unitNumber})` : ''}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-black text-rose-700 block font-heading">
                            {formatFCFA(amountDue)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            Exigible le {tenant.rentPaymentDay || 5} du mois
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1 border-t border-rose-100">
                        <span className="flex items-center gap-1 font-mono font-semibold text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {tenant.phone}
                        </span>
                        {tenant.lastPaymentMonth && (
                          <span className="text-[11px] text-slate-500">
                            Dernier règlement : <strong className="text-slate-700">{tenant.lastPaymentMonth}</strong>
                          </span>
                        )}
                      </div>

                      {tenant.notes && (
                        <p className="text-[11px] text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-200/60 italic">
                          ℹ️ {tenant.notes}
                        </p>
                      )}
                    </div>

                    {/* Quick 1-Click Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-rose-100">
                      <button
                        onClick={() => handleSendReminder(tenant)}
                        className="flex-1 min-w-[140px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Ouvrir WhatsApp avec un message poli et légal pré-rédigé"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Relance WhatsApp</span>
                      </button>

                      <button
                        onClick={() => handleCollectPayment(tenant.id)}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Enregistrer le règlement et générer la quittance"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Encaisser</span>
                      </button>

                      <a
                        href={`tel:${tenant.phone.replace(/\s+/g, '')}`}
                        className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
                        title="Appeler directement"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Échéances de Baux (Renouvellements) */}
      {activeSubTab === 'echeances' && (
        <div className="p-5 sm:p-6 space-y-4">
          {expiringTenants.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 mx-auto flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Aucun bail n'arrive à échéance</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tous les contrats de bail en cours ont une validité supérieure à 60 jours.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {expiringTenants.map((tenant) => {
                const endDate = new Date(tenant.leaseEndDate);
                const isAlreadyExpired = endDate < now;

                return (
                  <div
                    key={tenant.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                      isAlreadyExpired
                        ? 'border-rose-200 bg-rose-50/30'
                        : 'border-amber-200 bg-amber-50/40'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900 font-heading">
                              {tenant.name}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              isAlreadyExpired
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {isAlreadyExpired ? 'Bail Expiré' : 'Échéance Proche'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 truncate mt-0.5 font-medium">
                            🏢 {tenant.propertyTitle}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-slate-700 block">
                            Fin du bail :
                          </span>
                          <span className={`text-xs font-black font-mono ${isAlreadyExpired ? 'text-rose-700' : 'text-amber-800'}`}>
                            {formatDate(tenant.leaseEndDate)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-600 pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1 font-mono font-semibold text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {tenant.phone}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Loyer : <strong className="text-slate-700">{formatFCFA(tenant.monthlyRent)}/mois</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleSendLeaseNotice(tenant)}
                        className="flex-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Proposer le renouvellement du bail ou convenir du préavis par WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Avis Renouvellement WhatsApp</span>
                      </button>

                      <button
                        onClick={() => dispatch(setActiveAdminTab('contracts'))}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
                        title="Générer avenant de contrat"
                      >
                        <span>Contrat</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
