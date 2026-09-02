import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Property, Owner, LegalContract, OwnerPayout } from '../types';

export type AdminTab = 
  | 'overview' 
  | 'parcelles' 
  | 'properties' 
  | 'locations' 
  | 'owners' 
  | 'contracts' 
  | 'leads' 
  | 'financials' 
  | 'simulateur' 
  | 'agency_settings' 
  | 'backups';

export interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  duration?: number;
}

interface UiState {
  viewMode: 'client' | 'admin';
  activeAdminTab: AdminTab;
  isVisitModalOpen: boolean;
  visitPropertyId: string | null;
  isPropertyFormOpen: boolean;
  editingProperty: Property | null;
  propertyFormType: 'parcelle' | 'general';
  isReceiptModalOpen: boolean;
  isNotaryModalOpen: boolean;
  isPaymentModalOpen: boolean;
  paymentTenantId: string | null;
  isFavoritesDrawerOpen: boolean;
  
  // New Agency SaaS Modals
  isMortgageModalOpen: boolean;
  isOwnerDepositModalOpen: boolean;
  isOwnerModalOpen: boolean;
  editingOwner: Owner | null;
  isPayoutModalOpen: boolean;
  selectedOwnerForPayout: Owner | null;
  isContractFormModalOpen: boolean;
  isContractPrintModalOpen: boolean;
  selectedContractForPrint: LegalContract | null;
  isPayoutPrintModalOpen: boolean;
  selectedPayoutForPrint: OwnerPayout | null;

  // Admin Authentication / Password Protection
  isAdminAuthenticated: boolean;
  isAdminAuthModalOpen: boolean;

  // Cloud Sync Modal
  isCloudSyncModalOpen: boolean;

  toasts: ToastNotification[];
}

const getInitialAdminAuth = (): boolean => {
  try {
    return sessionStorage.getItem('mali_immo_admin_auth') === 'true';
  } catch {
    return false;
  }
};

const initialState: UiState = {
  viewMode: 'client',
  activeAdminTab: 'overview',
  isVisitModalOpen: false,
  visitPropertyId: null,
  isPropertyFormOpen: false,
  editingProperty: null,
  propertyFormType: 'general',
  isReceiptModalOpen: false,
  isNotaryModalOpen: false,
  isPaymentModalOpen: false,
  paymentTenantId: null,
  isFavoritesDrawerOpen: false,
  
  isMortgageModalOpen: false,
  isOwnerDepositModalOpen: false,
  isOwnerModalOpen: false,
  editingOwner: null,
  isPayoutModalOpen: false,
  selectedOwnerForPayout: null,
  isContractFormModalOpen: false,
  isContractPrintModalOpen: false,
  selectedContractForPrint: null,
  isPayoutPrintModalOpen: false,
  selectedPayoutForPrint: null,

  isAdminAuthenticated: getInitialAdminAuth(),
  isAdminAuthModalOpen: false,
  isCloudSyncModalOpen: false,

  toasts: [],
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setViewMode: (state, action: PayloadAction<'client' | 'admin'>) => {
      state.viewMode = action.payload;
    },
    setActiveAdminTab: (state, action: PayloadAction<AdminTab>) => {
      state.activeAdminTab = action.payload;
    },
    openVisitModal: (state, action: PayloadAction<string>) => {
      state.visitPropertyId = action.payload;
      state.isVisitModalOpen = true;
    },
    closeVisitModal: (state) => {
      state.isVisitModalOpen = false;
      state.visitPropertyId = null;
    },
    openPropertyForm: (
      state,
      action: PayloadAction<{ property?: Property; type?: 'parcelle' | 'general' } | undefined>
    ) => {
      state.editingProperty = action?.payload?.property || null;
      state.propertyFormType = action?.payload?.type || (action?.payload?.property?.propertyType === 'parcelle' ? 'parcelle' : 'general');
      state.isPropertyFormOpen = true;
    },
    closePropertyForm: (state) => {
      state.isPropertyFormOpen = false;
      state.editingProperty = null;
    },
    openReceiptModal: (state) => {
      state.isReceiptModalOpen = true;
    },
    closeReceiptModal: (state) => {
      state.isReceiptModalOpen = false;
    },
    openPaymentModal: (state, action: PayloadAction<string>) => {
      state.paymentTenantId = action.payload;
      state.isPaymentModalOpen = true;
    },
    closePaymentModal: (state) => {
      state.isPaymentModalOpen = false;
      state.paymentTenantId = null;
    },
    openNotaryModal: (state) => {
      state.isNotaryModalOpen = true;
    },
    closeNotaryModal: (state) => {
      state.isNotaryModalOpen = false;
    },
    setFavoritesDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.isFavoritesDrawerOpen = action.payload;
    },
    
    // Mortgage modal
    openMortgageModal: (state) => {
      state.isMortgageModalOpen = true;
    },
    closeMortgageModal: (state) => {
      state.isMortgageModalOpen = false;
    },

    // Owner deposit modal
    openOwnerDepositModal: (state) => {
      state.isOwnerDepositModalOpen = true;
    },
    closeOwnerDepositModal: (state) => {
      state.isOwnerDepositModalOpen = false;
    },

    // Owner modal
    openOwnerModal: (state, action: PayloadAction<Owner | null | undefined>) => {
      state.editingOwner = action.payload || null;
      state.isOwnerModalOpen = true;
    },
    closeOwnerModal: (state) => {
      state.isOwnerModalOpen = false;
      state.editingOwner = null;
    },

    // Payout modal
    openPayoutModal: (state, action: PayloadAction<Owner | null | undefined>) => {
      state.selectedOwnerForPayout = action.payload || null;
      state.isPayoutModalOpen = true;
    },
    closePayoutModal: (state) => {
      state.isPayoutModalOpen = false;
      state.selectedOwnerForPayout = null;
    },

    // Contract Form Modal
    openContractFormModal: (state) => {
      state.isContractFormModalOpen = true;
    },
    closeContractFormModal: (state) => {
      state.isContractFormModalOpen = false;
    },

    // Contract Print Modal
    openContractPrintModal: (state, action: PayloadAction<LegalContract>) => {
      state.selectedContractForPrint = action.payload;
      state.isContractPrintModalOpen = true;
    },
    closeContractPrintModal: (state) => {
      state.isContractPrintModalOpen = false;
      state.selectedContractForPrint = null;
    },

    // Payout Print Modal
    openPayoutPrintModal: (state, action: PayloadAction<OwnerPayout>) => {
      state.selectedPayoutForPrint = action.payload;
      state.isPayoutPrintModalOpen = true;
    },
    closePayoutPrintModal: (state) => {
      state.isPayoutPrintModalOpen = false;
      state.selectedPayoutForPrint = null;
    },

    // Admin Authentication
    setAdminAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAdminAuthenticated = action.payload;
      if (action.payload) {
        state.viewMode = 'admin';
        state.isAdminAuthModalOpen = false;
        try {
          sessionStorage.setItem('mali_immo_admin_auth', 'true');
        } catch (e) {
          console.error(e);
        }
      } else {
        try {
          sessionStorage.removeItem('mali_immo_admin_auth');
        } catch (e) {
          console.error(e);
        }
      }
    },
    openAdminAuthModal: (state) => {
      state.isAdminAuthModalOpen = true;
    },
    closeAdminAuthModal: (state) => {
      state.isAdminAuthModalOpen = false;
    },
    openCloudSyncModal: (state) => {
      state.isCloudSyncModalOpen = true;
    },
    closeCloudSyncModal: (state) => {
      state.isCloudSyncModalOpen = false;
    },
    logoutAdmin: (state) => {
      state.isAdminAuthenticated = false;
      state.viewMode = 'client';
      state.isAdminAuthModalOpen = false;
      try {
        sessionStorage.removeItem('mali_immo_admin_auth');
      } catch (e) {
        console.error(e);
      }
    },

    addToast: (state, action: PayloadAction<Omit<ToastNotification, 'id'>>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      state.toasts.push({
        ...action.payload,
        id,
      });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
  },
});

export const {
  setViewMode,
  setActiveAdminTab,
  openVisitModal,
  closeVisitModal,
  openPropertyForm,
  closePropertyForm,
  openReceiptModal,
  closeReceiptModal,
  openPaymentModal,
  closePaymentModal,
  openNotaryModal,
  closeNotaryModal,
  setFavoritesDrawerOpen,
  openMortgageModal,
  closeMortgageModal,
  openOwnerDepositModal,
  closeOwnerDepositModal,
  openOwnerModal,
  closeOwnerModal,
  openPayoutModal,
  closePayoutModal,
  openContractFormModal,
  closeContractFormModal,
  openContractPrintModal,
  closeContractPrintModal,
  openPayoutPrintModal,
  closePayoutPrintModal,
  setAdminAuthenticated,
  openAdminAuthModal,
  closeAdminAuthModal,
  openCloudSyncModal,
  closeCloudSyncModal,
  logoutAdmin,
  addToast,
  removeToast,
} = uiSlice.actions;

export default uiSlice.reducer;

