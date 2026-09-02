import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SaleReceipt } from '../types';
import { INITIAL_SALE_RECEIPTS } from '../data/mockData';

const LOCAL_STORAGE_KEY = 'mali_immo_sale_receipts';

const loadSavedSales = (): SaleReceipt[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading sales receipts from localStorage:', e);
  }
  return INITIAL_SALE_RECEIPTS;
};

const saveToLocalStorage = (sales: SaleReceipt[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sales));
  } catch (e) {
    console.error('Error saving sales receipts to localStorage:', e);
  }
};

interface SalesState {
  items: SaleReceipt[];
  activeReceiptForPrint: SaleReceipt | null;
  selectedPropertyForSale: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: SalesState = {
  items: loadSavedSales(),
  activeReceiptForPrint: null,
  selectedPropertyForSale: null,
  loading: false,
  error: null,
};

export const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    setSalesReceipts: (state, action: PayloadAction<SaleReceipt[]>) => {
      state.items = action.payload;
      saveToLocalStorage(state.items);
    },
    addSaleReceipt: (state, action: PayloadAction<Omit<SaleReceipt, 'id' | 'receiptNumber' | 'createdAt'>>) => {
      const year = new Date().getFullYear();
      const count = state.items.length + 1;
      const receiptNumber = `RECU-VTE-${year}-${String(count).padStart(3, '0')}`;

      const newReceipt: SaleReceipt = {
        ...action.payload,
        id: `sale-rec-${Date.now()}`,
        receiptNumber,
        createdAt: new Date().toISOString(),
      };

      state.items.unshift(newReceipt);
      state.activeReceiptForPrint = newReceipt;
      saveToLocalStorage(state.items);
    },
    updateSaleReceipt: (state, action: PayloadAction<SaleReceipt>) => {
      const index = state.items.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
        if (state.activeReceiptForPrint?.id === action.payload.id) {
          state.activeReceiptForPrint = action.payload;
        }
        saveToLocalStorage(state.items);
      }
    },
    deleteSaleReceipt: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((s) => s.id !== action.payload);
      if (state.activeReceiptForPrint?.id === action.payload) {
        state.activeReceiptForPrint = null;
      }
      saveToLocalStorage(state.items);
    },
    setActiveReceiptForPrint: (state, action: PayloadAction<SaleReceipt | null>) => {
      state.activeReceiptForPrint = action.payload;
    },
    setSelectedPropertyForSale: (state, action: PayloadAction<any | null>) => {
      state.selectedPropertyForSale = action.payload;
    },
  },
});

export const {
  setSalesReceipts,
  addSaleReceipt,
  updateSaleReceipt,
  deleteSaleReceipt,
  setActiveReceiptForPrint,
  setSelectedPropertyForSale,
} = salesSlice.actions;

export default salesSlice.reducer;
