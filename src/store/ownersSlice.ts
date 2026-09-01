import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Owner, OwnerPayout } from '../types';

const LOCAL_STORAGE_OWNERS_KEY = 'mali_immo_owners';
const LOCAL_STORAGE_PAYOUTS_KEY = 'mali_immo_payouts';

export const INITIAL_OWNERS: Owner[] = [
  {
    id: 'own-001',
    name: 'El Hadj Oumar Diallo',
    phone: '+223 76 11 22 33',
    email: 'elhadj.diallo.bko@gmail.com',
    ninaNumber: '1 68 02 750 011 44M',
    address: 'Badalabougou Est, Près de l\'Hôtel du Fleuve, Bamako',
    bankName: 'BDM-SA',
    accountNumber: '025110098471-22',
    mobileMoneyNumber: '+223 76 11 22 33 (Orange Money)',
    managementCommissionRate: 10,
    saleCommissionRate: 5,
    propertiesCount: 2,
    status: 'actif',
    createdAt: '2023-05-10T10:00:00.000Z',
    notes: 'Grand propriétaire foncier à Sotuba et ACI 2000. Très réactif.',
  },
  {
    id: 'own-002',
    name: 'Mme Salimata Sanogo',
    phone: '+223 66 44 88 00',
    email: 'salimata.sanogo@yahoo.fr',
    ninaNumber: '2 75 08 890 045 19F',
    address: 'Golf Bamako, Cité Baco-Djicoroni',
    bankName: 'BOA Mali',
    accountNumber: '00894127002-18',
    mobileMoneyNumber: '+223 66 44 88 00 (Moov Money)',
    managementCommissionRate: 8,
    saleCommissionRate: 5,
    propertiesCount: 1,
    status: 'actif',
    createdAt: '2023-09-15T14:30:00.000Z',
    notes: 'Propriétaire de la Villa Meublée en Zone du Golf.',
  },
  {
    id: 'own-003',
    name: 'Colonel (R) Daouda Coulibaly',
    phone: '+223 79 55 66 77',
    email: 'd.coulibaly.foncier@gmail.com',
    ninaNumber: '1 59 11 640 098 72M',
    address: 'Kati Sananfara, Villa N° 45',
    bankName: 'Ecobank Mali',
    accountNumber: '00192837465-12',
    mobileMoneyNumber: '+223 79 55 66 77 (Orange Money)',
    managementCommissionRate: 10,
    saleCommissionRate: 6,
    propertiesCount: 3,
    status: 'actif',
    createdAt: '2024-01-20T09:00:00.000Z',
    notes: 'Détient plusieurs parcelles TF à Kalaban Coura et domaines à Kati Kambila.',
  },
];

export const INITIAL_PAYOUTS: OwnerPayout[] = [
  {
    id: 'pay-001',
    payoutNumber: 'REV-2024-08-001',
    ownerId: 'own-001',
    ownerName: 'El Hadj Oumar Diallo',
    periodMonth: 'Août 2024',
    grossRentCollected: 1800000, // 600k (Sotuba) + 1.2M (Bureaux ACI 2000)
    agencyCommissionPercent: 10,
    agencyCommissionAmount: 180000,
    maintenanceDeductions: 25000, // Menus travaux plomberie
    netPaidToOwner: 1595000,
    payoutDate: '2024-08-08',
    paymentMethod: 'Virement Bancaire',
    transactionReference: 'VIR-BDM-REV-99201',
    status: 'paye',
    notes: 'Reversement mensuel effectué sur le compte BDM-SA avec quittances jointes.',
  },
  {
    id: 'pay-002',
    payoutNumber: 'REV-2024-07-001',
    ownerId: 'own-001',
    ownerName: 'El Hadj Oumar Diallo',
    periodMonth: 'Juillet 2024',
    grossRentCollected: 1800000,
    agencyCommissionPercent: 10,
    agencyCommissionAmount: 180000,
    maintenanceDeductions: 0,
    netPaidToOwner: 1620000,
    payoutDate: '2024-07-07',
    paymentMethod: 'Virement Bancaire',
    transactionReference: 'VIR-BDM-REV-88192',
    status: 'paye',
  },
  {
    id: 'pay-003',
    payoutNumber: 'REV-2024-08-002',
    ownerId: 'own-002',
    ownerName: 'Mme Salimata Sanogo',
    periodMonth: 'Août 2024',
    grossRentCollected: 850000,
    agencyCommissionPercent: 8,
    agencyCommissionAmount: 68000,
    maintenanceDeductions: 0,
    netPaidToOwner: 782000,
    payoutDate: '2024-08-10',
    paymentMethod: 'Orange Money',
    transactionReference: 'OM-TX-REV-77112',
    status: 'paye',
    notes: 'Reversement loyal Villa Golf.',
  },
];

const loadSavedOwners = (): Owner[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_OWNERS_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading owners:', e);
  }
  return INITIAL_OWNERS;
};

const loadSavedPayouts = (): OwnerPayout[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_PAYOUTS_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading payouts:', e);
  }
  return INITIAL_PAYOUTS;
};

const saveOwners = (owners: Owner[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_OWNERS_KEY, JSON.stringify(owners));
  } catch (e) {
    console.error('Error saving owners:', e);
  }
};

const savePayouts = (payouts: OwnerPayout[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_PAYOUTS_KEY, JSON.stringify(payouts));
  } catch (e) {
    console.error('Error saving payouts:', e);
  }
};

interface OwnersState {
  items: Owner[];
  payouts: OwnerPayout[];
  selectedOwnerId: string | null;
  selectedPayoutId: string | null;
}

const initialState: OwnersState = {
  items: loadSavedOwners(),
  payouts: loadSavedPayouts(),
  selectedOwnerId: null,
  selectedPayoutId: null,
};

export const ownersSlice = createSlice({
  name: 'owners',
  initialState,
  reducers: {
    addOwner: (state, action: PayloadAction<Omit<Owner, 'id' | 'createdAt'>>) => {
      const newOwner: Owner = {
        ...action.payload,
        id: `own-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      state.items.unshift(newOwner);
      saveOwners(state.items);
    },
    updateOwner: (state, action: PayloadAction<Owner>) => {
      const idx = state.items.findIndex((o) => o.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
        saveOwners(state.items);
      }
    },
    deleteOwner: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((o) => o.id !== action.payload);
      saveOwners(state.items);
    },
    deletePayout: (state, action: PayloadAction<string>) => {
      state.payouts = state.payouts.filter((p) => p.id !== action.payload);
      savePayouts(state.payouts);
    },
    addPayout: (state, action: PayloadAction<Omit<OwnerPayout, 'id' | 'payoutNumber'>>) => {
      const count = state.payouts.length + 1;
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const payoutNumber = `REV-${year}-${month}-${String(count).padStart(3, '0')}`;

      const newPayout: OwnerPayout = {
        ...action.payload,
        id: `payout-${Date.now()}`,
        payoutNumber,
      };
      state.payouts.unshift(newPayout);
      savePayouts(state.payouts);
    },
    setSelectedOwnerId: (state, action: PayloadAction<string | null>) => {
      state.selectedOwnerId = action.payload;
    },
    setSelectedPayoutId: (state, action: PayloadAction<string | null>) => {
      state.selectedPayoutId = action.payload;
    },
    resetOwnersData: (state) => {
      state.items = INITIAL_OWNERS;
      state.payouts = INITIAL_PAYOUTS;
      saveOwners(INITIAL_OWNERS);
      savePayouts(INITIAL_PAYOUTS);
    },
  },
});

export const {
  addOwner,
  updateOwner,
  deleteOwner,
  deletePayout,
  addPayout,
  setSelectedOwnerId,
  setSelectedPayoutId,
  resetOwnersData,
} = ownersSlice.actions;

export default ownersSlice.reducer;
