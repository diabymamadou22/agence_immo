import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setActiveAdminTab, openPropertyForm, logoutAdmin, addToast, AdminTab } from '../../store/uiSlice';
import { setCurrentUser } from '../../store/usersSlice';
import { isTabAllowed, ROLES_CONFIG } from '../../utils/rbac';
import { AgencyUser } from '../../types';
import { 
  LayoutDashboard, 
  Layers, 
  Building2, 
  Users, 
  MessageSquare, 
  Calculator, 
  Plus, 
  FileText,
  UserCheck,
  TrendingUp,
  Settings,
  Database,
  Lock,
  Receipt,
  Shield,
  UserCircle2,
  ChevronDown,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';

export const AdminHeader: React.FC = () => {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector((state) => state.ui.activeAdminTab);
  const leads = useAppSelector((state) => state.leads.items);
  const properties = useAppSelector((state) => state.properties.items);
  const sales = useAppSelector((state) => state.sales.items);
  const tenants = useAppSelector((state) => state.tenants.items);
  const owners = useAppSelector((state) => state.owners.items);
  const contracts = useAppSelector((state) => state.contracts.items);
  const users = useAppSelector((state) => state.users.items);
  const currentUser = useAppSelector((state) => state.users.currentUser);

  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const pendingLeads = leads.filter((l) => l.status === 'nouveau').length;
  const tenantsInArrears = tenants.filter((t) => t.status === 'retard').length;

  const currentRole = currentUser?.role || 'directeur';
  const roleConfig = ROLES_CONFIG[currentRole];

  const allTabs: { id: AdminTab; label: string; icon: any; count?: number; badgeColor?: string }[] = [
    { id: 'overview', label: 'Vue d\'Ensemble', icon: LayoutDashboard },
    { id: 'parcelles', label: 'Parcelles & Foncier', icon: Layers, count: properties.filter((p) => p.propertyType === 'parcelle').length },
    { id: 'properties', label: 'Stock Biens', icon: Building2, count: properties.length },
    { id: 'sales_receipts', label: 'Reçus de Vente', icon: Receipt, count: sales.length, badgeColor: 'bg-amber-500 text-slate-950 font-black' },
    { 
      id: 'locations', 
      label: 'Locations & Quittances', 
      icon: Users, 
      count: tenantsInArrears > 0 ? tenantsInArrears : undefined,
      badgeColor: 'bg-rose-500 text-white' 
    },
    { id: 'owners', label: 'Propriétaires & Reversements', icon: UserCheck, count: owners.length },
    { id: 'contracts', label: 'Contrats & Mandats', icon: FileText, count: contracts.length },
    { 
      id: 'leads', 
      label: 'Prospects & Visites', 
      icon: MessageSquare, 
      count: pendingLeads > 0 ? pendingLeads : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold'
    },
    { id: 'financials', label: 'Comptabilité & Marges', icon: TrendingUp },
    { id: 'simulateur', label: 'Barème Notaire', icon: Calculator },
    { id: 'team', label: 'Équipe & Rôles', icon: Shield, count: users.length, badgeColor: 'bg-indigo-600 text-white font-bold' },
    { id: 'agency_settings', label: 'Mon Agence (SaaS)', icon: Settings },
    { id: 'backups', label: 'Sauvegardes', icon: Database },
  ];

  // RBAC Filtering of allowed tabs
  const allowedTabs = allTabs.filter((tab) => isTabAllowed(tab.id, currentUser?.role));

  const handleSwitchUser = (user: AgencyUser) => {
    dispatch(setCurrentUser(user));
    setShowRoleSwitcher(false);
    dispatch(
      addToast({
        type: 'info',
        message: `Session active : ${user.name} (${ROLES_CONFIG[user.role].label}).`,
      })
    );
    if (!isTabAllowed(activeTab, user.role)) {
      if (user.role === 'commercial') {
        dispatch(setActiveAdminTab('leads'));
      } else if (user.role === 'comptable') {
        dispatch(setActiveAdminTab('financials'));
      } else if (user.role === 'gestionnaire') {
        dispatch(setActiveAdminTab('locations'));
      } else {
        dispatch(setActiveAdminTab('overview'));
      }
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 sticky top-[68px] z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {allowedTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`admin-tab-${tab.id}`}
                onClick={() => dispatch(setActiveAdminTab(tab.id))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${tab.badgeColor || 'bg-slate-200 text-slate-800'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action Buttons & User Profile with Role */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Collaborator Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition-all cursor-pointer"
              title="Changer d'utilisateur / Profil RBAC"
            >
              <div className="w-5 h-5 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-black text-[10px]">
                {currentUser?.avatar || currentUser?.name.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-[11px] font-extrabold text-slate-900 block leading-none">
                  {currentUser?.name.split(' ')[0] || 'Directeur'}
                </span>
                <span className="text-[9px] text-slate-500 font-semibold leading-none">
                  {roleConfig.shortLabel}
                </span>
              </div>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider ${roleConfig.badgeClass}`}>
                {roleConfig.shortLabel}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu for quick role change */}
            {showRoleSwitcher && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fadeIn">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Changer de Collaborateur (RBAC)
                  </p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    Tester les permissions en temps réel
                  </p>
                </div>

                <div className="py-1 space-y-1">
                  {users.map((u) => {
                    const isSelected = currentUser?.id === u.id;
                    const rConfig = ROLES_CONFIG[u.role];
                    return (
                      <button
                        key={u.id}
                        onClick={() => handleSwitchUser(u)}
                        className={`w-full p-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected ? 'bg-slate-100 font-extrabold text-slate-950' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                            {u.avatar || u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-900 text-xs">{u.name}</span>
                            <span className="text-[10px] text-slate-500">{u.title || rConfig.shortLabel}</span>
                          </div>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${rConfig.badgeClass}`}>
                          {rConfig.shortLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {roleConfig.canManageTeam && (
                  <div className="pt-2 border-t border-slate-100 mt-1">
                    <button
                      onClick={() => {
                        setShowRoleSwitcher(false);
                        dispatch(setActiveAdminTab('team'));
                      }}
                      className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-indigo-700 hover:bg-indigo-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Gérer l'Équipe & Matrice RBAC</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Create Buttons (If permitted) */}
          {roleConfig.canManageProperties && (
            <>
              <button
                id="btn-admin-add-parcelle"
                onClick={() => dispatch(openPropertyForm({ type: 'parcelle' }))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Parcelle TF</span>
              </button>

              <button
                id="btn-admin-add-property"
                onClick={() => dispatch(openPropertyForm({ type: 'general' }))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">+ Villa / Bien</span>
              </button>
            </>
          )}

          <button
            id="btn-admin-logout"
            onClick={() => {
              dispatch(logoutAdmin());
              dispatch(
                addToast({
                  type: 'info',
                  message: 'Back-Office verrouillé. Redirection vers le portail public.',
                })
              );
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 font-bold text-xs shadow-xs transition-all cursor-pointer"
            title="Verrouiller l'accès au Back-Office"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Verrouiller</span>
          </button>
        </div>
      </div>
    </div>
  );
};


