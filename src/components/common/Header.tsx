import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  setViewMode, 
  openNotaryModal, 
  openMortgageModal, 
  openOwnerDepositModal, 
  setFavoritesDrawerOpen,
  openAdminAuthModal
} from '../../store/uiSlice';
import { 
  Building2, 
  ShieldCheck, 
  MessageCircle, 
  Phone,
  Heart, 
  Calculator, 
  UserCheck, 
  LayoutDashboard, 
  Home, 
  Landmark,
  PlusCircle,
  Lock
} from 'lucide-react';
import { cleanPhoneNumberForTel, cleanWhatsAppNumber } from '../../utils/formatters';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector((state) => state.ui.viewMode);
  const favorites = useAppSelector((state) => state.properties.favorites);
  const leads = useAppSelector((state) => state.leads.items);
  const agencyConfig = useAppSelector((state) => state.agency.config);
  const isAdminAuthenticated = useAppSelector((state) => state.ui.isAdminAuthenticated);

  const pendingLeadsCount = leads.filter((l) => l.status === 'nouveau').length;

  const agencyPhoneDisplay = agencyConfig.phoneDisplay || agencyConfig.phone || '+223 76 00 11 22';
  const agencyCallTel = cleanPhoneNumberForTel(agencyConfig.phone || agencyConfig.phoneDisplay);
  const agencyWhatsAppNumber = cleanWhatsAppNumber(agencyConfig.whatsappNumber);

  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${agencyWhatsAppNumber}?text=${encodeURIComponent(`Bonjour ${agencyConfig.name}, je vous contacte depuis votre site internet.`)}`, '_blank');
  };

  const handleAdminSwitch = () => {
    if (isAdminAuthenticated) {
      dispatch(setViewMode('admin'));
    } else {
      dispatch(openAdminAuthModal());
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
      {/* Top micro bar with Mali Agency Hotline & Hours */}
      <div className="bg-slate-950 px-4 py-1.5 text-xs text-slate-400 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {agencyConfig.name} • {agencyConfig.city}
            </span>
            <span className="hidden sm:inline text-slate-500">|</span>
            <span className="hidden sm:inline">RCCM: {agencyConfig.rccm}</span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline">{agencyConfig.workingHours}</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              id="header-direct-phone-call"
              href={`tel:${agencyCallTel}`}
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Appel : {agencyPhoneDisplay}</span>
            </a>
            <span className="hidden sm:inline text-slate-700">|</span>
            <button
              id="header-direct-call"
              onClick={handleWhatsAppClick}
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp : {agencyPhoneDisplay}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => dispatch(setViewMode('client'))}
          className="flex items-center gap-3 cursor-pointer group"
          id="header-brand-logo"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white font-heading uppercase">
                {agencyConfig.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide flex items-center gap-1">
              <span>{agencyConfig.slogan}</span>
            </p>
          </div>
        </div>

        {/* Quick Client Tools & Portal Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Confier un bien button */}
          <button
            onClick={() => dispatch(openOwnerDepositModal())}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Confier mon Bien / Parcelle</span>
          </button>

          {/* Client Favorites */}
          {viewMode === 'client' && (
            <button
              id="btn-open-favorites"
              onClick={() => dispatch(setFavoritesDrawerOpen(true))}
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Mes Biens Enregistrés"
            >
              <Heart className="w-4 h-4" />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center ring-2 ring-slate-900">
                  {favorites.length}
                </span>
              )}
            </button>
          )}

          {/* Mode Switcher: Client Portal <-> Admin Dashboard */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              id="btn-switch-client"
              onClick={() => dispatch(setViewMode('client'))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'client'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Portail Client</span>
              <span className="sm:hidden">Client</span>
            </button>
            <button
              id="btn-switch-admin"
              onClick={handleAdminSwitch}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'admin'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAdminAuthenticated ? (
                <LayoutDashboard className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="hidden sm:inline">Back-Office Agence</span>
              <span className="sm:hidden">Admin</span>
              {pendingLeadsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5"></span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};


