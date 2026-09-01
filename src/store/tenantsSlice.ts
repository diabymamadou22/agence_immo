import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Tenant, RentReceipt, PaymentMethod } from '../types';
import { INITIAL_TENANTS, INITIAL_RECEIPTS } from '../data/mockData';

const LOCAL_STORAGE_KEY_TENANTS = 'mali_immo_tenants';
const LOCAL_STORAGE_KEY_RECEIPTS = 'mali_immo_receipts';

const loadSavedTenants = (): Tenant[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_TENANTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading tenants:', e);
  }
  return INITIAL_TENANTS;
};

const loadSavedReceipts = (): RentReceipt[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_RECEIPTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading receipts:', e);
  }
  return INITIAL_RECEIPTS;
};

const saveToLocalStorage = (tenants: Tenant[], receipts: RentReceipt[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_TENANTS, JSON.stringify(tenants));
    localStorage.setItem(LOCAL_STORAGE_KEY_RECEIPTS, JSON.stringify(receipts));
  } catch (e) {
    console.error('Error saving tenants/receipts:', e);
  }
};

interface TenantsState {
  items: Tenant[];
  receipts: RentReceipt[];
  activeReceiptForPrint: RentReceipt | null;
  loading: boolean;
}

const initialState: TenantsState = {
  items: loadSavedTenants(),
  receipts: loadSavedReceipts(),
  activeReceiptForPrint: null,
  loading: false,
};

export const tenantsSlice = createSlice({
  name: 'tenants',
  initialState,
  reducers: {
    setTenants: (state, action: PayloadAction<Tenant[]>) => {
      state.items = action.payload;
      saveToLocalStorage(state.items, state.receipts);
    },
    setReceipts: (state, action: PayloadAction<RentReceipt[]>) => {
      state.receipts = action.payload;
      saveToLocalStorage(state.items, state.receipts);
    },
    addTenant: (state, action: PayloadAction<Omit<Tenant, 'id' | 'receipts'>>) => {
      const newTenant: Tenant = {
        ...action.payload,
        id: `ten-${Date.now()}`,
        receipts: [],
      };
      state.items.unshift(newTenant);
      saveToLocalStorage(state.items, state.receipts);
    },
    updateTenant: (state, action: PayloadAction<Tenant>) => {
      const index = state.items.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
        saveToLocalStorage(state.items, state.receipts);
      }
    },
    deleteTenant: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(t => t.id !== action.payload);
      saveToLocalStorage(state.items, state.receipts);
    },
    recordRentPayment: (
      state,
      action: PayloadAction<{
        tenantId: string;
        tenantName?: string;
        propertyId?: string;
        propertyTitle?: string;
        amount: number;
        periodMonth: string;
        paymentMethod: PaymentMethod;
        transactionRef?: string;
        notes?: string;
      }>
    ) => {
      const tenant = state.items.find(t => t.id === action.payload.tenantId);
      if (!tenant) return;

      const dateObj = new Date();
      const year = dateObj.getFullYear();
      const monthNum = String(dateObj.getMonth() + 1).padStart(2, '0');
      const count = state.receipts.length + 1;
      const receiptNumber = `QUIT-${year}-${monthNum}-${String(count).padStart(3, '0')}`;

      const newReceipt: RentReceipt = {
        id: `rec-${Date.now()}`,
        receiptNumber,
        tenantId: tenant.id,
        tenantName: tenant.name,
        propertyId: tenant.propertyId,
        propertyTitle: tenant.propertyTitle,
        periodMonth: action.payload.periodMonth,
        amount: action.payload.amount,
        paymentDate: dateObj.toISOString().slice(0, 10),
        paymentMethod: action.payload.paymentMethod,
        transactionRef: action.payload.transactionRef,
        status: 'paye',
        issuedBy: 'Mali Immo Prestige - Comptabilité',
        notes: action.payload.notes,
      };

      state.receipts.unshift(newReceipt);
      tenant.lastPaymentMonth = action.payload.periodMonth;
      tenant.status = 'actif';
      if (!tenant.receipts) tenant.receipts = [];
      tenant.receipts.unshift(newReceipt);
      state.activeReceiptForPrint = newReceipt;

      saveToLocalStorage(state.items, state.receipts);
    },
    recordPaymentReceipt: (
      state,
      action: PayloadAction<{
        tenantId: string;
        periodMonth: string;
        amount: number;
        paymentDate: string;
        paymentMethod: PaymentMethod;
        transactionRef?: string;
        notes?: string;
      }>
    ) => {
      const tenant = state.items.find(t => t.id === action.payload.tenantId);
      if (!tenant) return;

      const dateObj = new Date(action.payload.paymentDate);
      const year = dateObj.getFullYear();
      const monthNum = String(dateObj.getMonth() + 1).padStart(2, '0');
      const count = state.receipts.length + 1;
      const receiptNumber = `QUITT-${year}-${monthNum}-${String(count).padStart(3, '0')}`;

      const newReceipt: RentReceipt = {
        id: `rec-${Date.now()}`,
        receiptNumber,
        tenantId: tenant.id,
        tenantName: tenant.name,
        propertyId: tenant.propertyId,
        propertyTitle: tenant.propertyTitle,
        periodMonth: action.payload.periodMonth,
        amount: action.payload.amount,
        paymentDate: action.payload.paymentDate,
        paymentMethod: action.payload.paymentMethod,
        transactionRef: action.payload.transactionRef,
        status: 'paye',
        issuedBy: 'Mali Immo Prestige - Comptabilité',
        notes: action.payload.notes,
      };

      state.receipts.unshift(newReceipt);
      tenant.lastPaymentMonth = action.payload.periodMonth;
      tenant.status = 'actif';
      if (!tenant.receipts) tenant.receipts = [];
      tenant.receipts.unshift(newReceipt);
      state.activeReceiptForPrint = newReceipt;

      saveToLocalStorage(state.items, state.receipts);
    },
    setActiveReceiptForPrint: (state, action: PayloadAction<RentReceipt | null>) => {
      state.activeReceiptForPrint = action.payload;
    },
  },
});

export const {
  setTenants,
  setReceipts,
  addTenant,
  updateTenant,
  deleteTenant,
  recordRentPayment,
  recordPaymentReceipt,
  setActiveReceiptForPrint,
} = tenantsSlice.actions;

export default tenantsSlice.reducer;
