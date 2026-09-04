import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SaleReceipt, SaleInstallment, PaymentMethod } from '../types';
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

export interface ActiveInstallmentPrintPayload {
  sale: SaleReceipt;
  installment: SaleInstallment;
}

interface SalesState {
  items: SaleReceipt[];
  activeReceiptForPrint: SaleReceipt | null;
  activeInstallmentForPrint: ActiveInstallmentPrintPayload | null;
  selectedPropertyForSale: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: SalesState = {
  items: loadSavedSales(),
  activeReceiptForPrint: null,
  activeInstallmentForPrint: null,
  selectedPropertyForSale: null,
  loading: false,
  error: null,
};

export interface RecordSaleInstallmentPayload {
  saleId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  issuedBy: string;
  notes?: string;
}

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
      const payloadAny = action.payload as any;

      const newReceipt: SaleReceipt = {
        ...action.payload,
        id: payloadAny.id || `sale-rec-${Date.now()}`,
        receiptNumber: payloadAny.receiptNumber || receiptNumber,
        createdAt: payloadAny.createdAt || new Date().toISOString(),
        installments: payloadAny.installments || [
          {
            id: `inst-init-${Date.now()}`,
            installmentNumber: 1,
            receiptNumber: `TRANCHE-01-${payloadAny.receiptNumber || receiptNumber}`,
            paymentDate: action.payload.saleDate,
            amount: action.payload.amountPaid,
            paymentMethod: action.payload.paymentMethod,
            transactionReference: action.payload.transactionReference,
            previousBalance: action.payload.totalAgreedPrice,
            remainingBalanceAfter: action.payload.remainingBalance,
            issuedBy: action.payload.issuedBy,
            notes: action.payload.operationType === 'acompte' ? 'Acompte initial de réservation' : 'Versement initial',
            createdAt: new Date().toISOString(),
          }
        ],
      };

      state.items.unshift(newReceipt);
      state.activeReceiptForPrint = newReceipt;
      saveToLocalStorage(state.items);
    },
    recordSaleInstallment: (state, action: PayloadAction<RecordSaleInstallmentPayload>) => {
      const index = state.items.findIndex((s) => s.id === action.payload.saleId);
      if (index === -1) return;

      const sale = state.items[index];
      const previousBalance = Number(sale.remainingBalance) || 0;
      const amountToPay = Math.min(Number(action.payload.amount) || 0, previousBalance);
      if (amountToPay <= 0) return;

      const remainingBalanceAfter = Math.max(0, previousBalance - amountToPay);
      const newAmountPaid = (Number(sale.amountPaid) || 0) + amountToPay;

      const existingInstallments = Array.isArray(sale.installments) ? [...sale.installments] : [];
      const installmentNum = existingInstallments.length + 1;
      const year = new Date().getFullYear();
      const trancheReceiptNum = `TRANCHE-${String(installmentNum).padStart(2, '0')}-${sale.receiptNumber}`;

      const newInstallment: SaleInstallment = {
        id: `inst-${Date.now()}`,
        installmentNumber: installmentNum,
        receiptNumber: trancheReceiptNum,
        paymentDate: action.payload.paymentDate || new Date().toISOString().split('T')[0],
        amount: amountToPay,
        paymentMethod: action.payload.paymentMethod,
        transactionReference: action.payload.transactionReference,
        previousBalance,
        remainingBalanceAfter,
        issuedBy: action.payload.issuedBy || 'Service Commercial',
        notes: action.payload.notes,
        createdAt: new Date().toISOString(),
      };

      existingInstallments.push(newInstallment);

      const updatedSale: SaleReceipt = {
        ...sale,
        amountPaid: newAmountPaid,
        remainingBalance: remainingBalanceAfter,
        operationType: remainingBalanceAfter === 0 ? 'solde' : 'versement_echelonne',
        installments: existingInstallments,
      };

      state.items[index] = updatedSale;
      state.activeReceiptForPrint = updatedSale;
      state.activeInstallmentForPrint = {
        sale: updatedSale,
        installment: newInstallment,
      };

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
      if (state.activeInstallmentForPrint?.sale.id === action.payload) {
        state.activeInstallmentForPrint = null;
      }
      saveToLocalStorage(state.items);
    },
    setActiveReceiptForPrint: (state, action: PayloadAction<SaleReceipt | null>) => {
      state.activeReceiptForPrint = action.payload;
    },
    setActiveInstallmentForPrint: (state, action: PayloadAction<ActiveInstallmentPrintPayload | null>) => {
      state.activeInstallmentForPrint = action.payload;
    },
    setSelectedPropertyForSale: (state, action: PayloadAction<any | null>) => {
      state.selectedPropertyForSale = action.payload;
    },
  },
});

export const {
  setSalesReceipts,
  addSaleReceipt,
  recordSaleInstallment,
  updateSaleReceipt,
  deleteSaleReceipt,
  setActiveReceiptForPrint,
  setActiveInstallmentForPrint,
  setSelectedPropertyForSale,
} = salesSlice.actions;

export default salesSlice.reducer;

