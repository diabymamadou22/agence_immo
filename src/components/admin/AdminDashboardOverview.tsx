import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setActiveAdminTab, openPropertyForm, openPaymentModal, openRecordSaleModal } from '../../store/uiSlice';
import { setSelectedPropertyId } from '../../store/propertiesSlice';
import { setSelectedPropertyForSale } from '../../store/salesSlice';
import { formatFCFA, formatDate, getDocumentBadgeInfo, getStatusBadgeInfo, formatSurface } from '../../utils/formatters';
import { canViewMargins, ROLES_CONFIG } from '../../utils/rbac';
import { RentLateAlertWidget } from './RentLateAlertWidget';
import { 
  Building2, 
  Layers, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  Receipt, 
  Eye, 
  Plus,
  Shield,
  MapPin,
  Compass
} from 'lucide-react';

export const AdminDashboardOverview: React.FC = () => {
  const dispatch = useAppDispatch();
  const properties = useAppSelector((state) => state.properties.items);
  const leads = useAppSelector((state) => state.leads.items);
  const tenants = useAppSelector((state) => state.tenants.items);
  const receipts = useAppSelector((state) => state.tenants.receipts);
  const currentUser = useAppSelector((state) => state.users.currentUser);

  const role = currentUser?.role || 'directeur';
  const roleConfig = ROLES_CONFIG[role];
  const marginsVisible = canViewMargins(role);

  // Metrics Calculations
  const parcelles = properties.filter((p) => p.propertyType === 'parcelle');
  const parcellesWithTF = parcelles.filter((p) => p.documentType === 'titre_foncier');
  const propertiesForSale = properties.filter((p) => p.dealType === 'vente');
  const totalPortfolioValueFCFA = propertiesForSale.reduce((acc, p) => acc + (p.price || 0), 0);

  const totalMonthlyRentsFCFA = tenants.reduce((acc, t) => acc + (t.monthlyRent || 0), 0);
  const activeTenantsCount = tenants.filter((t) => t.status === 'actif').length;
  const tenantsInLateCount = tenants.filter((t) => t.status === 'retard').length;

  const currentMonthReceipts = receipts.filter((r) => r.periodMonth.includes('Août') || r.periodMonth.includes('2024'));
  const collectedThisMonthFCFA = currentMonthReceipts.reduce((acc, r) => acc + (r.amount || 0), 0);

  const pendingLeads = leads.filter((l) => l.status === 'nouveau');
  const upcomingVisits = leads.filter((l) => l.status === 'visite_programmee');

  return (
    <div className="space-y-8">
      {/* Top Welcome & Agency Quick Stats */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 uppercase tracking-wider">
              Back-Office Agence
            </span>
            <span className="text-xs text-slate-400">Mali Immo Prestige • Bamako ACI 2000</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
            Tableau de Bord Foncier & Locatif
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Suivi des cessions de parcelles avec Titre Foncier, encaissement des loyers via Orange Money/Banque et gestion des visites terrain.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {roleConfig.canIssueSalesReceipts && (
            <button
              onClick={() => {
                dispatch(setSelectedPropertyForSale(null));
                dispatch(openRecordSaleModal());
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-slate-950" />
              <span>Émettre Reçu de Vente</span>
            </button>
          )}
          {roleConfig.canManageProperties && (
            <button
              onClick={() => dispatch(openPropertyForm({ type: 'parcelle' }))}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Nouvelle Parcelle</span>
            </button>
          )}
          {roleConfig.canManageRentals && (
            <button
              onClick={() => dispatch(setActiveAdminTab('locations'))}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>Quittance Loyer</span>
            </button>
          )}
          {roleConfig.canManageLeadsAndVisits && (
            <button
              onClick={() => dispatch(setActiveAdminTab('leads'))}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Planning Visites</span>
            </button>
          )}
        </div>
      </div>

      {/* Role Confidentiality Banner if Margins Masked */}
      {!marginsVisible && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-blue-900">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Profil {roleConfig.label} actif :</strong> Vue terrain opérationnelle. Les marges globales, dépenses internes et bilans financiers de l'agence sont masqués par politique de confidentialité.
            </span>
          </div>
          <button
            onClick={() => dispatch(setActiveAdminTab('leads'))}
            className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shrink-0 transition-colors"
          >
            Accéder aux Visites
          </button>
        </div>
      )}

      {/* 4 Main Key Performance Cards in FCFA (or Operational Metrics for Commercial) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {marginsVisible ? (
          <>
            {/* Card 1: Portefeuille Parcelles & Ventes */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Valeur du Portefeuille
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 font-heading">
                  {formatFCFA(totalPortfolioValueFCFA)}
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>{propertiesForSale.length} biens en vente</span>
                  <span>•</span>
                  <span className="text-emerald-600 font-semibold">{parcellesWithTF.length} Parcelles TF</span>
                </p>
              </div>
            </div>

            {/* Card 2: Recouvrement Loyers Mensuels */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Loyers Mensuels Actifs
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 font-heading">
                  {formatFCFA(totalMonthlyRentsFCFA)} <span className="text-xs font-normal text-slate-500">/ mois</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>{activeTenantsCount} locataires actifs</span>
                  {tenantsInLateCount > 0 && (
                    <span className="text-rose-600 font-bold">({tenantsInLateCount} retard)</span>
                  )}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Card 1 Commercial: Mandats & Biens en Vente */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Mandats & Biens à la Vente
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 font-heading">
                  {propertiesForSale.length} Biens
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span className="text-emerald-600 font-semibold">{parcellesWithTF.length} Parcelles Titre Foncier</span>
                </p>
              </div>
            </div>

            {/* Card 2 Commercial: Visites Terrain à Réaliser */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Visites Terrain Planifiées
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 font-heading">
                  {upcomingVisits.length} Visites
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>Sur les parcelles & villas Bamako</span>
                </p>
              </div>
            </div>
          </>
        )}

        {/* Card 3: Parcelles & Terrains Lotis */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Stock Parcelles Foncier
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-heading">
              {parcelles.length} Parcelles
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{parcellesWithTF.length} sous Titre Foncier (TF)</span>
            </p>
          </div>
        </div>

        {/* Card 4: Demandes de Visite & Leads */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Demandes & Visites
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-heading">
              {leads.length} Prospects
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-amber-600 font-bold">{pendingLeads.length} nouveaux</span>
              <span>•</span>
              <span className="text-blue-600 font-semibold">{upcomingVisits.length} visites</span>
            </p>
          </div>
        </div>
      </div>

      {/* Late Rents Alert Center - Visible only for rental managers */}
      {roleConfig.canManageRentals && <RentLateAlertWidget />}

      {/* 2-Column Split: Upcoming Visits & Recent Parcel Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upcoming Visits & Leads */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold text-base text-slate-900 font-heading">
                Prochaines Visites sur le Terrain
              </h3>
            </div>
            <button
              onClick={() => dispatch(setActiveAdminTab('leads'))}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Voir tout ({leads.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {leads.slice(0, 4).map((lead) => (
              <div
                key={lead.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors flex items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{lead.clientName}</span>
                    <span className="text-[11px] font-mono text-emerald-700 font-semibold">{lead.clientPhone}</span>
                  </div>
                  <p className="text-xs text-slate-600 truncate font-medium">
                    📌 {lead.propertyTitle || 'Demande générale'}
                  </p>
                  {lead.visitDate && (
                    <div className="flex items-center gap-1 text-[11px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded w-fit">
                      <Clock className="w-3 h-3" />
                      <span>Visite : {formatDate(lead.visitDate)} à {lead.visitTime || '10h00'}</span>
                    </div>
                  )}
                </div>

                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                  lead.status === 'nouveau'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : lead.status === 'visite_programmee'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {lead.status === 'nouveau' ? 'Nouveau' : lead.status === 'visite_programmee' ? 'Visite Calée' : lead.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Parcelles avec Titre Foncier */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-base text-slate-900 font-heading">
                Dernières Parcelles Titre Foncier (TF)
              </h3>
            </div>
            <button
              onClick={() => dispatch(setActiveAdminTab('parcelles'))}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Gestion Foncier</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {parcelles.slice(0, 4).map((parcel) => (
              <div
                key={parcel.id}
                onClick={() => dispatch(setSelectedPropertyId(parcel.id))}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-all flex items-center gap-3 cursor-pointer group"
              >
                <img
                  src={parcel.featuredImage || parcel.images[0]}
                  alt={parcel.title}
                  className="w-14 h-14 rounded-lg object-cover shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{parcel.reference}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      {parcel.documentNumber || 'Titre Foncier'}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 truncate group-hover:text-amber-600 transition-colors">
                    {parcel.title}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    📍 {parcel.neighborhood} • {formatSurface(parcel.surface)}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-slate-900 font-heading block">
                    {formatFCFA(parcel.price)}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700">Disponible</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
