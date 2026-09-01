import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setActiveAdminTab, openPropertyForm, logoutAdmin, addToast, AdminTab } from '../../store/uiSlice';
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
  Lock
} from 'lucide-react';

export const AdminHeader: React.FC = () => {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector((state) => state.ui.activeAdminTab);
  const leads = useAppSelector((state) => state.leads.items);
  const properties = useAppSelector((state) => state.properties.items);
  const tenants = useAppSelector((state) => state.tenants.items);
  const owners = useAppSelector((state) => state.owners.items);
  const contracts = useAppSelector((state) => state.contracts.items);

  const pendingLeads = leads.filter((l) => l.status === 'nouveau').length;
  const tenantsInArrears = tenants.filter((t) => t.status === 'retard').length;

  const tabs: { id: AdminTab; label: string; icon: any; count?: number; badgeColor?: string }[] = [
    { id: 'overview', label: 'Vue d\'Ensemble', icon: LayoutDashboard },
    { id: 'parcelles', label: 'Parcelles & Foncier', icon: Layers, count: properties.filter((p) => p.propertyType === 'parcelle').length },
    { id: 'properties', label: 'Stock Biens', icon: Building2, count: properties.length },
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
    { id: 'financials', label: 'Comptabilité & Commissions', icon: TrendingUp },
    { id: 'simulateur', label: 'Barème Notaire', icon: Calculator },
    { id: 'agency_settings', label: 'Mon Agence (SaaS)', icon: Settings },
    { id: 'backups', label: 'Sauvegardes', icon: Database },
  ];

  return (
    <div className="bg-white border-b border-slate-200 sticky top-[68px] z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {tabs.map((tab) => {
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

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-admin-add-parcelle"
            onClick={() => dispatch(openPropertyForm({ type: 'parcelle' }))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Parcelle TF</span>
          </button>

          <button
            id="btn-admin-add-property"
            onClick={() => dispatch(openPropertyForm({ type: 'general' }))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Villa / Bien</span>
          </button>

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

