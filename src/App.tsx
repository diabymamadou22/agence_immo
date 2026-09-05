import React, { useEffect, Suspense, lazy } from 'react';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from './store';
import { setProperties } from './store/propertiesSlice';
import { setLeads } from './store/leadsSlice';
import { setTenants, setReceipts } from './store/tenantsSlice';
import { setSalesReceipts } from './store/salesSlice';
import { setOwners, setPayouts } from './store/ownersSlice';
import { setContracts } from './store/contractsSlice';
import { setExpenses } from './store/financialsSlice';
import { setAgencyConfig } from './store/agencySlice';
import { firestoreService } from './services/firestoreService';

// Client Direct Core Components
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { ToastContainer } from './components/common/ToastContainer';
import { FavoritesDrawer } from './components/common/FavoritesDrawer';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';
import { HeroSearch } from './components/client/HeroSearch';
import { PropertyGrid } from './components/client/PropertyGrid';
import { LandPlotGuideBanner } from './components/client/LandPlotGuideBanner';
import { PropertyDetailModal } from './components/client/PropertyDetailModal';
import { VisitBookingModal } from './components/client/VisitBookingModal';
import { AdminHeader } from './components/admin/AdminHeader';
import { AdminAuthModal } from './components/admin/AdminAuthModal';
import { Lock, ShieldCheck, KeyRound, Home, Loader2 } from 'lucide-react';
import { openAdminAuthModal, setViewMode } from './store/uiSlice';

// Code-Splitting: Lazy-Loaded Secondary Modals
const NotaryFeeModal = lazy(() => import('./components/common/NotaryFeeModal').then(m => ({ default: m.NotaryFeeModal })));
const CloudSyncModal = lazy(() => import('./components/common/CloudSyncModal').then(m => ({ default: m.CloudSyncModal })));
const MortgageCalculatorModal = lazy(() => import('./components/client/MortgageCalculatorModal').then(m => ({ default: m.MortgageCalculatorModal })));
const OwnerDepositModal = lazy(() => import('./components/client/OwnerDepositModal').then(m => ({ default: m.OwnerDepositModal })));

// Code-Splitting: Lazy-Loaded Admin Modules (Heavy Back-Office tabs)
const AdminDashboardOverview = lazy(() => import('./components/admin/AdminDashboardOverview').then(m => ({ default: m.AdminDashboardOverview })));
const AdminParcelleManager = lazy(() => import('./components/admin/AdminParcelleManager').then(m => ({ default: m.AdminParcelleManager })));
const AdminPropertyManager = lazy(() => import('./components/admin/AdminPropertyManager').then(m => ({ default: m.AdminPropertyManager })));
const AdminSaleReceiptsList = lazy(() => import('./components/admin/AdminSaleReceiptsList').then(m => ({ default: m.AdminSaleReceiptsList })));
const AdminTenantManager = lazy(() => import('./components/admin/AdminTenantManager').then(m => ({ default: m.AdminTenantManager })));
const AdminLeadManager = lazy(() => import('./components/admin/AdminLeadManager').then(m => ({ default: m.AdminLeadManager })));
const AdminNotaryFeeView = lazy(() => import('./components/admin/AdminNotaryFeeView').then(m => ({ default: m.AdminNotaryFeeView })));
const AdminOwnerManager = lazy(() => import('./components/admin/AdminOwnerManager').then(m => ({ default: m.AdminOwnerManager })));
const AdminContractGenerator = lazy(() => import('./components/admin/AdminContractGenerator').then(m => ({ default: m.AdminContractGenerator })));
const AdminFinancials = lazy(() => import('./components/admin/AdminFinancials').then(m => ({ default: m.AdminFinancials })));
const AdminAgencySettings = lazy(() => import('./components/admin/AdminAgencySettings').then(m => ({ default: m.AdminAgencySettings })));
const AdminBackupManager = lazy(() => import('./components/admin/AdminBackupManager').then(m => ({ default: m.AdminBackupManager })));
const AdminTeamManager = lazy(() => import('./components/admin/AdminTeamManager').then(m => ({ default: m.AdminTeamManager })));

// Code-Splitting: Lazy-Loaded Action Modals
const PropertyFormModal = lazy(() => import('./components/admin/PropertyFormModal').then(m => ({ default: m.PropertyFormModal })));
const RecordPaymentModal = lazy(() => import('./components/admin/RecordPaymentModal').then(m => ({ default: m.RecordPaymentModal })));
const RentReceiptModal = lazy(() => import('./components/admin/RentReceiptModal').then(m => ({ default: m.RentReceiptModal })));
const RecordSaleModal = lazy(() => import('./components/admin/RecordSaleModal').then(m => ({ default: m.RecordSaleModal })));
const SaleReceiptModal = lazy(() => import('./components/admin/SaleReceiptModal').then(m => ({ default: m.SaleReceiptModal })));
const RecordSaleInstallmentModal = lazy(() => import('./components/admin/RecordSaleInstallmentModal').then(m => ({ default: m.RecordSaleInstallmentModal })));
const SaleInstallmentReceiptModal = lazy(() => import('./components/admin/SaleInstallmentReceiptModal').then(m => ({ default: m.SaleInstallmentReceiptModal })));
const ContractPrintModal = lazy(() => import('./components/admin/ContractPrintModal').then(m => ({ default: m.ContractPrintModal })));
const PayoutPrintModal = lazy(() => import('./components/admin/PayoutPrintModal').then(m => ({ default: m.PayoutPrintModal })));

const AdminLoadingFallback: React.FC = () => (
  <div className="py-16 flex flex-col items-center justify-center space-y-3">
    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
    <span className="text-xs font-bold text-slate-500">Chargement du module de gestion...</span>
  </div>
);

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector((state) => state.ui.viewMode);
  const activeAdminTab = useAppSelector((state) => state.ui.activeAdminTab);
  const isAdminAuthenticated = useAppSelector((state) => state.ui.isAdminAuthenticated);
  const agencyConfig = useAppSelector((state) => state.agency.config);
  const properties = useAppSelector((state) => state.properties.items);
  const tenants = useAppSelector((state) => state.tenants.items);
  const receipts = useAppSelector((state) => state.tenants.receipts);
  const sales = useAppSelector((state) => state.sales.items);
  const owners = useAppSelector((state) => state.owners.items);
  const payouts = useAppSelector((state) => state.owners.payouts);
  const contracts = useAppSelector((state) => state.contracts.items);
  const expenses = useAppSelector((state) => state.financials.expenses);
  const leads = useAppSelector((state) => state.leads.items);

  // Initialize Firestore listeners for multi-device real-time sync across all collections
  useEffect(() => {
    // 0. Auto-seed Cloud Firestore if empty so all devices share the identical base catalog
    firestoreService.ensureInitialDataSeeded({
      properties,
      tenants,
      receipts,
      sales,
      owners,
      payouts,
      contracts,
      expenses,
      leads,
      agencyConfig,
    }).catch((err) => console.warn('Auto-seed check notice:', err));

    // 1. Properties & Parcelles
    const unsubscribeProps = firestoreService.subscribeProperties((props) => {
      if (props && Array.isArray(props)) {
        dispatch(setProperties(props));
      }
    });

    // 2. Leads & Visits
    const unsubscribeLeads = firestoreService.subscribeLeads((leads) => {
      if (leads && Array.isArray(leads)) {
        dispatch(setLeads(leads));
      }
    });

    // 3. Tenants
    const unsubscribeTenants = firestoreService.subscribeTenants((tenants) => {
      if (tenants && Array.isArray(tenants)) {
        dispatch(setTenants(tenants));
      }
    });

    // 4. Receipts
    const unsubscribeReceipts = firestoreService.subscribeReceipts((receipts) => {
      if (receipts && Array.isArray(receipts)) {
        dispatch(setReceipts(receipts));
      }
    });

    // 4b. Sales Receipts
    const unsubscribeSales = firestoreService.subscribeSaleReceipts((sales) => {
      if (sales && Array.isArray(sales)) {
        dispatch(setSalesReceipts(sales));
      }
    });

    // 5. Owners
    const unsubscribeOwners = firestoreService.subscribeOwners((owners) => {
      if (owners && Array.isArray(owners)) {
        dispatch(setOwners(owners));
      }
    });

    // 6. Payouts
    const unsubscribePayouts = firestoreService.subscribePayouts((payouts) => {
      if (payouts && Array.isArray(payouts)) {
        dispatch(setPayouts(payouts));
      }
    });

    // 7. Contracts
    const unsubscribeContracts = firestoreService.subscribeContracts((contracts) => {
      if (contracts && Array.isArray(contracts)) {
        dispatch(setContracts(contracts));
      }
    });

    // 8. Expenses
    const unsubscribeExpenses = firestoreService.subscribeExpenses((expenses) => {
      if (expenses && Array.isArray(expenses)) {
        dispatch(setExpenses(expenses));
      }
    });

    // 9. Agency Config
    const unsubscribeAgency = firestoreService.subscribeAgencyConfig((cfg) => {
      if (cfg && cfg.name) {
        dispatch(setAgencyConfig(cfg));
      }
    });

    return () => {
      unsubscribeProps();
      unsubscribeLeads();
      unsubscribeTenants();
      unsubscribeReceipts();
      unsubscribeSales();
      unsubscribeOwners();
      unsubscribePayouts();
      unsubscribeContracts();
      unsubscribeExpenses();
      unsubscribeAgency();
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

          {/* Admin Tab Content with Code-Splitting Suspense */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <Suspense fallback={<AdminLoadingFallback />}>
              {activeAdminTab === 'overview' && <AdminDashboardOverview />}
              {activeAdminTab === 'parcelles' && <AdminParcelleManager />}
              {activeAdminTab === 'properties' && <AdminPropertyManager />}
              {activeAdminTab === 'sales_receipts' && <AdminSaleReceiptsList />}
              {activeAdminTab === 'locations' && <AdminTenantManager />}
              {activeAdminTab === 'owners' && <AdminOwnerManager />}
              {activeAdminTab === 'contracts' && <AdminContractGenerator />}
              {activeAdminTab === 'leads' && <AdminLeadManager />}
              {activeAdminTab === 'financials' && <AdminFinancials />}
              {activeAdminTab === 'simulateur' && <AdminNotaryFeeView />}
              {activeAdminTab === 'agency_settings' && <AdminAgencySettings />}
              {activeAdminTab === 'backups' && <AdminBackupManager />}
              {activeAdminTab === 'team' && <AdminTeamManager />}
            </Suspense>
          </div>
        </main>
      )}

      {/* Footer (Public Client mode only) */}
      {viewMode === 'client' && <Footer />}

      {/* Core Instant Modals */}
      <AdminAuthModal />
      <PropertyDetailModal />
      <VisitBookingModal />
      <FavoritesDrawer />
      <PWAInstallBanner />
      <ToastContainer />

      {/* Code-Splitted Modals (loaded on demand) */}
      <Suspense fallback={null}>
        <CloudSyncModal />
        <NotaryFeeModal />
        <MortgageCalculatorModal />
        <OwnerDepositModal />
        <PropertyFormModal />
        <RecordPaymentModal />
        <RentReceiptModal />
        <RecordSaleModal />
        <SaleReceiptModal />
        <RecordSaleInstallmentModal />
        <SaleInstallmentReceiptModal />
        <ContractPrintModal />
        <PayoutPrintModal />
      </Suspense>
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
