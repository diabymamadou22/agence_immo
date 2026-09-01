import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from './store';
import { setProperties } from './store/propertiesSlice';
import { setLeads } from './store/leadsSlice';
import { setTenants, setReceipts } from './store/tenantsSlice';
import { firestoreService } from './services/firestoreService';

// Client Components
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { ToastContainer } from './components/common/ToastContainer';
import { NotaryFeeModal } from './components/common/NotaryFeeModal';
import { FavoritesDrawer } from './components/common/FavoritesDrawer';
import { HeroSearch } from './components/client/HeroSearch';
import { PropertyGrid } from './components/client/PropertyGrid';
import { LandPlotGuideBanner } from './components/client/LandPlotGuideBanner';
import { PropertyDetailModal } from './components/client/PropertyDetailModal';
import { VisitBookingModal } from './components/client/VisitBookingModal';
import { MortgageCalculatorModal } from './components/client/MortgageCalculatorModal';
import { OwnerDepositModal } from './components/client/OwnerDepositModal';

// Admin Components
import { AdminHeader } from './components/admin/AdminHeader';
import { AdminDashboardOverview } from './components/admin/AdminDashboardOverview';
import { AdminParcelleManager } from './components/admin/AdminParcelleManager';
import { AdminPropertyManager } from './components/admin/AdminPropertyManager';
import { AdminTenantManager } from './components/admin/AdminTenantManager';
import { AdminLeadManager } from './components/admin/AdminLeadManager';
import { AdminNotaryFeeView } from './components/admin/AdminNotaryFeeView';
import { AdminOwnerManager } from './components/admin/AdminOwnerManager';
import { AdminContractGenerator } from './components/admin/AdminContractGenerator';
import { AdminFinancials } from './components/admin/AdminFinancials';
import { AdminAgencySettings } from './components/admin/AdminAgencySettings';
import { AdminBackupManager } from './components/admin/AdminBackupManager';
import { PropertyFormModal } from './components/admin/PropertyFormModal';
import { RecordPaymentModal } from './components/admin/RecordPaymentModal';
import { RentReceiptModal } from './components/admin/RentReceiptModal';
import { ContractPrintModal } from './components/admin/ContractPrintModal';
import { PayoutPrintModal } from './components/admin/PayoutPrintModal';
import { AdminAuthModal } from './components/admin/AdminAuthModal';
import { Lock, ShieldCheck, KeyRound, Home } from 'lucide-react';
import { openAdminAuthModal, setViewMode } from './store/uiSlice';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector((state) => state.ui.viewMode);
  const activeAdminTab = useAppSelector((state) => state.ui.activeAdminTab);
  const isAdminAuthenticated = useAppSelector((state) => state.ui.isAdminAuthenticated);
  const agencyConfig = useAppSelector((state) => state.agency.config);

  // Initialize Firestore listeners or load initial data
  useEffect(() => {
    // Subscribe to properties
    const unsubscribeProps = firestoreService.subscribeProperties((props) => {
      dispatch(setProperties(props));
    });

    // Subscribe to leads
    const unsubscribeLeads = firestoreService.subscribeLeads((leads) => {
      dispatch(setLeads(leads));
    });

    // Subscribe to tenants
    const unsubscribeTenants = firestoreService.subscribeTenants((tenants) => {
      dispatch(setTenants(tenants));
    });

    // Subscribe to receipts
    const unsubscribeReceipts = firestoreService.subscribeReceipts((receipts) => {
      dispatch(setReceipts(receipts));
    });

    return () => {
      unsubscribeProps();
      unsubscribeLeads();
      unsubscribeTenants();
      unsubscribeReceipts();
    };
  }, [dispatch]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/60 text-slate-900 font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Universal Header */}
      <Header />

      {/* Main Content Router */}
      {viewMode === 'client' ? (
        <main className="flex-1 pb-16 space-y-12">
          {/* Hero Section & Search Engine */}
          <HeroSearch />

          {/* Core Property Showcase & Cadastral Grid */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <PropertyGrid />
          </section>

          {/* Land Plot & Security Guide in Mali */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <LandPlotGuideBanner />
          </section>
        </main>
      ) : !isAdminAuthenticated ? (
        <main className="flex-1 flex items-center justify-center py-16 px-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border-2 border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 shadow-xs">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-extrabold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Zone Restreinte Agence</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 font-heading">
                Back-Office Verrouillé
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Cet espace est strictement réservé à la direction et aux gestionnaires de l'agence <strong>{agencyConfig.name}</strong>.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => dispatch(openAdminAuthModal())}
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Déverrouiller le Back-Office</span>
              </button>

              <button
                onClick={() => dispatch(setViewMode('client'))}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4 text-slate-500" />
                <span>Retourner au Portail Public</span>
              </button>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 pb-16">
          {/* Admin Back-Office Navigation Tabs */}
          <AdminHeader />

          {/* Admin Tab Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            {activeAdminTab === 'overview' && <AdminDashboardOverview />}
            {activeAdminTab === 'parcelles' && <AdminParcelleManager />}
            {activeAdminTab === 'properties' && <AdminPropertyManager />}
            {activeAdminTab === 'locations' && <AdminTenantManager />}
            {activeAdminTab === 'owners' && <AdminOwnerManager />}
            {activeAdminTab === 'contracts' && <AdminContractGenerator />}
            {activeAdminTab === 'leads' && <AdminLeadManager />}
            {activeAdminTab === 'financials' && <AdminFinancials />}
            {activeAdminTab === 'simulateur' && <AdminNotaryFeeView />}
            {activeAdminTab === 'agency_settings' && <AdminAgencySettings />}
            {activeAdminTab === 'backups' && <AdminBackupManager />}
          </div>
        </main>
      )}

      {/* Footer (Public Client mode only) */}
      {viewMode === 'client' && <Footer />}

      {/* Modals & Overlays */}
      <AdminAuthModal />
      <PropertyDetailModal />
      <VisitBookingModal />
      <NotaryFeeModal />
      <FavoritesDrawer />
      <MortgageCalculatorModal />
      <OwnerDepositModal />
      <PropertyFormModal />
      <RecordPaymentModal />
      <RentReceiptModal />
      <ContractPrintModal />
      <PayoutPrintModal />
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;

