import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LegalContract } from '../types';

const LOCAL_STORAGE_CONTRACTS_KEY = 'mali_immo_contracts';

export const INITIAL_CONTRACTS: LegalContract[] = [
  {
    id: 'cnt-001',
    contractType: 'bail_habitation',
    reference: 'BAIL-2024-BKO-001',
    title: 'Contrat de Bail d\'Habitation - Villa Zone du Golf',
    propertyId: 'prop-003',
    propertyTitle: 'Villa Meublée 4 Pièces à Louer - Zone du Golf',
    partyAName: 'Mme Salimata Sanogo (Bailleur)',
    partyAPhone: '+223 66 44 88 00',
    partyBName: 'Moussa Fofana (Preneur / Locataire)',
    partyBPhone: '+223 75 99 00 11',
    amountFCFA: 850000,
    depositFCFA: 1700000, // 2 mois de caution
    startDate: '2023-09-01',
    endDate: '2024-08-31',
    clauses: [
      'Le loyer mensuel est fixé à 850 000 FCFA payable d\'avance au plus tard le 5 de chaque mois.',
      'Une caution de garantie équivalente à deux (02) mois de loyer, soit 1 700 000 FCFA est déposée.',
      'Toute sous-location totale ou partielle est strictement interdite sauf accord écrit du bailleur.',
      'Le locataire prendra à sa charge les factures d\'eau SOMAGEP, électricité EDM-SA et gardiennage.',
      'Conforme aux dispositions du Code Civil Malien et de l\'Acte Uniforme OHADA.'
    ],
    status: 'actif',
    createdAt: '2023-08-28T10:00:00.000Z',
  },
  {
    id: 'cnt-002',
    contractType: 'mandat_vente',
    reference: 'MANDAT-2024-TF-002',
    title: 'Mandat Exclusif de Vente de Parcelle Titre Foncier (Kalaban Coura)',
    propertyId: 'prop-001',
    propertyTitle: 'Parcelle Résidentielle avec Titre Foncier Individuel',
    partyAName: 'Colonel (R) Daouda Coulibaly (Mandant / Propriétaire)',
    partyAPhone: '+223 79 55 66 77',
    partyBName: 'Mali Immo Prestige SARL (Mandataire / Agence)',
    partyBPhone: '+223 76 00 11 22',
    amountFCFA: 18500000,
    startDate: '2024-07-01',
    endDate: '2024-12-31',
    clauses: [
      'Le mandant confie à l\'agence le mandat exclusif de trouver acquéreur pour la parcelle TF 18.420 / BKO.',
      'Le prix net vendeur convenu est de 18 500 000 FCFA.',
      'La commission d\'agence est fixée à 5% hors taxes du montant de la cession, payable à la signature notariée.',
      'L\'agence assure la publicité, les visites encadrées et la préparation du dossier chez le Notaire.'
    ],
    status: 'actif',
    createdAt: '2024-07-01T08:30:00.000Z',
  },
  {
    id: 'cnt-003',
    contractType: 'bon_visite',
    reference: 'BV-2024-08-019',
    title: 'Bon de Visite Terrain & Engagement d\'Achat (Kati Kambila 2ha)',
    propertyId: 'prop-005',
    propertyTitle: 'Terrain Agricole / Concession 2 Hectares à Kati Kambila',
    partyAName: 'Mali Immo Prestige (Cabinet Immobilier)',
    partyBName: 'Dr. Boubacar Cissé (Visiteur / Acquéreur potentiel)',
    partyBPhone: '+223 79 33 22 11',
    amountFCFA: 45000000,
    startDate: '2024-08-25',
    clauses: [
      'Le visiteur reconnaît visiter ce jour le terrain désigné sous la conduite de l\'agence.',
      'Le visiteur s\'interdit formellement de traiter directement avec le propriétaire sans le concours de l\'agence.',
      'En cas d\'acquisition, les honoraires d\'agence de négociation restent dus conformément au barème légal.'
    ],
    status: 'signe',
    createdAt: '2024-08-25T07:30:00.000Z',
  },
];

const loadSavedContracts = (): LegalContract[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_CONTRACTS_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading contracts:', e);
  }
  return INITIAL_CONTRACTS;
};

const saveContracts = (contracts: LegalContract[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_CONTRACTS_KEY, JSON.stringify(contracts));
  } catch (e) {
    console.error('Error saving contracts:', e);
  }
};

interface ContractsState {
  items: LegalContract[];
  selectedContractId: string | null;
}

const initialState: ContractsState = {
  items: loadSavedContracts(),
  selectedContractId: null,
};

export const contractsSlice = createSlice({
  name: 'contracts',
  initialState,
  reducers: {
    addContract: (state, action: PayloadAction<Omit<LegalContract, 'id' | 'createdAt'>>) => {
      const newContract: LegalContract = {
        ...action.payload,
        id: `cnt-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      state.items.unshift(newContract);
      saveContracts(state.items);
    },
    updateContract: (state, action: PayloadAction<LegalContract>) => {
      const idx = state.items.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
        saveContracts(state.items);
      }
    },
    deleteContract: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((c) => c.id !== action.payload);
      saveContracts(state.items);
    },
    setSelectedContractId: (state, action: PayloadAction<string | null>) => {
      state.selectedContractId = action.payload;
    },
    setContracts: (state, action: PayloadAction<LegalContract[]>) => {
      state.items = action.payload;
      saveContracts(state.items);
    },
    resetContractsData: (state) => {
      state.items = INITIAL_CONTRACTS;
      saveContracts(INITIAL_CONTRACTS);
    },
  },
});

export const {
  addContract,
  updateContract,
  deleteContract,
  setSelectedContractId,
  setContracts,
  resetContractsData,
} = contractsSlice.actions;

export default contractsSlice.reducer;
