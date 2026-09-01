import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Lead, LeadStatus } from '../types';
import { INITIAL_LEADS } from '../data/mockData';

const LOCAL_STORAGE_KEY = 'mali_immo_leads';

const loadSavedLeads = (): Lead[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading leads:', e);
  }
  return INITIAL_LEADS;
};

const saveToLocalStorage = (leads: Lead[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(leads));
  } catch (e) {
    console.error('Error saving leads:', e);
  }
};

interface LeadsState {
  items: Lead[];
  filterStatus: LeadStatus | 'all';
  loading: boolean;
}

const initialState: LeadsState = {
  items: loadSavedLeads(),
  filterStatus: 'all',
  loading: false,
};

export const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    setLeads: (state, action: PayloadAction<Lead[]>) => {
      state.items = action.payload;
      saveToLocalStorage(state.items);
    },
    addLead: (state, action: PayloadAction<Omit<Lead, 'id' | 'createdAt' | 'status'>>) => {
      const newLead: Lead = {
        ...action.payload,
        id: `lead-${Date.now()}`,
        status: 'nouveau',
        createdAt: new Date().toISOString(),
      };
      state.items.unshift(newLead);
      saveToLocalStorage(state.items);
    },
    updateLeadStatus: (state, action: PayloadAction<{ id: string; status: LeadStatus; notes?: string }>) => {
      const lead = state.items.find(l => l.id === action.payload.id);
      if (lead) {
        lead.status = action.payload.status;
        if (action.payload.notes !== undefined) {
          lead.notes = action.payload.notes;
        }
        saveToLocalStorage(state.items);
      }
    },
    updateLeadVisit: (state, action: PayloadAction<{ id: string; visitDate: string; visitTime?: string }>) => {
      const lead = state.items.find(l => l.id === action.payload.id);
      if (lead) {
        lead.visitDate = action.payload.visitDate;
        if (action.payload.visitTime) lead.visitTime = action.payload.visitTime;
        lead.status = 'visite_programmee';
        saveToLocalStorage(state.items);
      }
    },
    deleteLead: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(l => l.id !== action.payload);
      saveToLocalStorage(state.items);
    },
    setLeadFilterStatus: (state, action: PayloadAction<LeadStatus | 'all'>) => {
      state.filterStatus = action.payload;
    },
  },
});

export const {
  setLeads,
  addLead,
  updateLeadStatus,
  updateLeadVisit,
  deleteLead,
  setLeadFilterStatus,
} = leadsSlice.actions;

export default leadsSlice.reducer;
