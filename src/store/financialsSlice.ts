import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AgencyExpense } from '../types';
import { getStorageItem, setStorageItem } from '../utils/safeStorage';

const LOCAL_STORAGE_EXPENSES_KEY = 'mali_immo_expenses';

export const INITIAL_EXPENSES: AgencyExpense[] = [
  {
    id: 'exp-001',
    title: 'Honoraires Géomètre - Bornage & Plan de masse Kalaban',
    category: 'geometre',
    amount: 150000,
    date: '2024-08-12',
    paymentMethod: 'Espèces',
    receiptNumber: 'REC-GEOM-084',
    notes: 'Vérification des 4 bornes géodésiques avant signature de compromis.',
  },
  {
    id: 'exp-002',
    title: 'Campagne Sponsorisée Facebook & WhatsApp Ads (Parcelles TF)',
    category: 'marketing',
    amount: 75000,
    date: '2024-08-15',
    paymentMethod: 'Orange Money',
    receiptNumber: 'OM-ADS-99120',
    notes: 'Campagne ciblée Diaspora Malienne en France, USA et Côte d\'Ivoire.',
  },
  {
    id: 'exp-003',
    title: 'Carburant Véhicule Tout-Terrain (Visites Kati & Baguineda)',
    category: 'carburant',
    amount: 45000,
    date: '2024-08-18',
    paymentMethod: 'Espèces',
    notes: 'Plein de gasoil pour 6 visites clients sur les parcelles périphériques.',
  },
  {
    id: 'exp-004',
    title: 'Frais de Réquisition & Quitus Conservation Foncière Bamako',
    category: 'juridique',
    amount: 30000,
    date: '2024-08-20',
    paymentMethod: 'Espèces',
    receiptNumber: 'REC-DGI-2024-118',
    notes: 'Recherche d\'antériorité et état hypothécaire à la Conservation Foncière.',
  },
];

const loadSavedExpenses = (): AgencyExpense[] => {
  try {
    const saved = getStorageItem(LOCAL_STORAGE_EXPENSES_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading expenses:', e);
  }
  return INITIAL_EXPENSES;
};

const saveExpenses = (expenses: AgencyExpense[]) => {
  try {
    setStorageItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.error('Error saving expenses:', e);
  }
};

interface FinancialsState {
  expenses: AgencyExpense[];
}

const initialState: FinancialsState = {
  expenses: loadSavedExpenses(),
};

export const financialsSlice = createSlice({
  name: 'financials',
  initialState,
  reducers: {
    addExpense: (state, action: PayloadAction<Omit<AgencyExpense, 'id'>>) => {
      const payloadAny = action.payload as any;
      const newExpense: AgencyExpense = {
        ...action.payload,
        id: payloadAny.id || `exp-${Date.now()}`,
      };
      state.expenses.unshift(newExpense);
      saveExpenses(state.expenses);
    },
    deleteExpense: (state, action: PayloadAction<string>) => {
      state.expenses = state.expenses.filter((e) => e.id !== action.payload);
      saveExpenses(state.expenses);
    },
    setExpenses: (state, action: PayloadAction<AgencyExpense[]>) => {
      state.expenses = action.payload;
      saveExpenses(state.expenses);
    },
    resetExpensesData: (state) => {
      state.expenses = INITIAL_EXPENSES;
      saveExpenses(INITIAL_EXPENSES);
    },
  },
});

export const { addExpense, deleteExpense, setExpenses, resetExpensesData } = financialsSlice.actions;
export default financialsSlice.reducer;
