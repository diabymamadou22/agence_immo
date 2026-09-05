import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AgencyConfig } from '../types';
import { firestoreService } from '../services/firestoreService';
import { getStorageItem, setStorageItem } from '../utils/safeStorage';

const LOCAL_STORAGE_AGENCY_KEY = 'mali_immo_agency_config';

export const AGENCY_PRESETS: { id: string; label: string; city: string; config: AgencyConfig }[] = [
  {
    id: 'mali_immo_prestige',
    label: 'Mali Immo Prestige (Bamako ACI 2000)',
    city: 'Bamako',
    config: {
      name: 'Mali Immo Prestige',
      slogan: 'L\'Excellence Foncière & Immobilière au Mali',
      tagline: 'Vente de Parcelles avec Titre Foncier, Gestion Locative & Villas de Standing',
      phone: '+223 90 07 03 21',
      phoneDisplay: '+223 90 07 03 21',
      whatsappNumber: '22390070321',
      email: 'contact@mali-immoprestige.ml',
      address: 'Hamdallaye ACI 2000, Rue 318, Face Immeuble BNDA, Bamako, Mali',
      city: 'Bamako',
      country: 'Mali',
      rccm: 'MA-BKO-2022-B-12890',
      nif: '0852147983X',
      workingHours: 'Lun - Sam: 08h00 - 18h30',
      currency: 'FCFA',
      bankName: 'BDM-SA (Banque de Développement du Mali)',
      bankRib: 'ML016 01201 02541289001 45',
      bankAccountName: 'MALI IMMO PRESTIGE SARL',
      orangeMoneyMerchant: 'OM-76001122',
      moovMoneyMerchant: 'MOOV-66998877',
      waveMerchant: 'WAVE-BKO-001',
      defaultRentalCommissionPercent: 10,
      defaultSaleCommissionPercent: 5,
      specialties: ['vente', 'location', 'gestion'],
      primarySpecialty: 'toutes',
      specialtyDetails: 'Transactions foncières (Parcelles TF & Titres définitifs), location résidentielle et gestion locative avec quittances officielles.',
      themeColor: 'amber',
      officialStampText: 'MALI IMMO PRESTIGE SARL • DIRECTION GÉNÉRALE • VISA & SCEAU OFFICIEL',
      isCustomBranding: false,
      adminPassword: '00223',
    },
  },
  {
    id: 'mande_habitat',
    label: 'Mandé Habitat & Invest (Bamako Golf / Sotuba)',
    city: 'Bamako',
    config: {
      name: 'Mandé Habitat & Terroirs',
      slogan: 'Votre Partenaire Foncier de Confiance au Sahel',
      tagline: 'Lotissements Viabilisés, Villas de Luxe & Conseil Juridique Foncier',
      phone: '+223 76 00 11 22',
      phoneDisplay: '+223 76 00 11 22',
      whatsappNumber: '22376001122',
      email: 'contact@mande-habitat.ml',
      address: 'Zone du Golf, Près de l\'Hôtel Mandé, Baco-Djicoroni, Bamako, Mali',
      city: 'Bamako',
      country: 'Mali',
      rccm: 'MA-BKO-2021-B-09412',
      nif: '0714892301Y',
      workingHours: 'Lun - Sam: 08h30 - 19h00',
      currency: 'FCFA',
      bankName: 'BOA Mali (Bank of Africa)',
      bankRib: 'ML084 01100 00894127002 18',
      bankAccountName: 'MANDE HABITAT & TERROIRS SAS',
      orangeMoneyMerchant: 'OM-70884422',
      moovMoneyMerchant: 'MOOV-75113355',
      waveMerchant: 'WAVE-BKO-002',
      defaultRentalCommissionPercent: 8,
      defaultSaleCommissionPercent: 5,
      specialties: ['vente', 'gestion'],
      primarySpecialty: 'vente',
      specialtyDetails: 'Vente de parcelles viabilisées, domaines sécurisés et gestion de patrimoine foncier.',
      themeColor: 'emerald',
      officialStampText: 'MANDE HABITAT & TERROIRS SAS • DÉPARTEMENT JURIDIQUE & TRANSACTION',
      isCustomBranding: true,
      adminPassword: '00223',
    },
  },
  {
    id: 'koulikoro_foncier',
    label: 'Koulikoro Foncier S.A.R.L. (Kati / Koulikoro)',
    city: 'Koulikoro',
    config: {
      name: 'Koulikoro Foncier S.A.R.L.',
      slogan: 'Le Spécialiste des Terrains Agricoles et Parcelles TF',
      tagline: 'Grands Domaines, Parcelles Loties et Concessions Rurales',
      phone: '+223 76 00 11 22',
      phoneDisplay: '+223 76 00 11 22',
      whatsappNumber: '22376001122',
      email: 'infos@koulikoro-foncier.ml',
      address: 'Avenue du 22 Septembre, Face Préfecture de Kati, Mali',
      city: 'Kati / Koulikoro',
      country: 'Mali',
      rccm: 'MA-KTI-2023-B-03189',
      nif: '0981245091Z',
      workingHours: 'Lun - Ven: 08h00 - 17h30',
      currency: 'FCFA',
      bankName: 'BNDA (Banque Nationale de Développement Agricole)',
      bankRib: 'ML042 01005 00019283746 88',
      bankAccountName: 'KOULIKORO FONCIER SARL',
      orangeMoneyMerchant: 'OM-76001122',
      moovMoneyMerchant: 'MOOV-66002244',
      waveMerchant: 'WAVE-KTI-001',
      defaultRentalCommissionPercent: 10,
      defaultSaleCommissionPercent: 6,
      specialties: ['vente'],
      primarySpecialty: 'vente',
      specialtyDetails: 'Spécialiste exclusif en vente et immatriculation de parcelles, fermes et terrains agricoles.',
      themeColor: 'blue',
      officialStampText: 'KOULIKORO FONCIER SARL • SERVICE CONSERVATION & TRANSACTIONS',
      isCustomBranding: true,
      adminPassword: '00223',
    },
  },
  {
    id: 'sahel_immo',
    label: 'Sahel Immobilier International (Hippodrome)',
    city: 'Bamako',
    config: {
      name: 'Sahel Immobilier International',
      slogan: 'L\'Immobilier Haut de Gamme & Gestion de Patrimoine',
      tagline: 'Bureaux ACI 2000, Résidences Diplomatiques & Investissement Diaspora',
      phone: '+223 76 00 11 22',
      phoneDisplay: '+223 76 00 11 22',
      whatsappNumber: '22376001122',
      email: 'direction@sahel-immo.ml',
      address: 'Hippodrome Rue 240, Porte 88, Bamako, Mali',
      city: 'Bamako',
      country: 'Mali',
      rccm: 'MA-BKO-2020-B-07651',
      nif: '0654129870W',
      workingHours: 'Lun - Sam: 09h00 - 19h00',
      currency: 'FCFA',
      bankName: 'Ecobank Mali',
      bankRib: 'ML091 01012 00192837465 12',
      bankAccountName: 'SAHEL IMMOBILIER INTERNATIONAL',
      orangeMoneyMerchant: 'OM-66554433',
      moovMoneyMerchant: 'MOOV-70009988',
      waveMerchant: 'WAVE-BKO-003',
      defaultRentalCommissionPercent: 10,
      defaultSaleCommissionPercent: 5,
      specialties: ['location', 'gestion'],
      primarySpecialty: 'gestion',
      specialtyDetails: 'Gestion locative haut de gamme, syndic de copropriété et baux diplomatiques.',
      themeColor: 'slate',
      officialStampText: 'SAHEL IMMOBILIER INTERNATIONAL • CONSEIL D\'ADMINISTRATION',
      isCustomBranding: true,
      adminPassword: '00223',
    },
  },
];

export const INITIAL_AGENCY_CONFIG: AgencyConfig = AGENCY_PRESETS[0].config;

const loadSavedAgencyConfig = (): AgencyConfig => {
  try {
    const saved = getStorageItem(LOCAL_STORAGE_AGENCY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.name) {
        // If phone was the old placeholder +223 76 00 11 22 and user didn't customize it, default to the new +223 90 07 03 21
        const rawPhone = parsed.phoneDisplay || parsed.phone;
        const phoneToUse = rawPhone && rawPhone.includes('76 00 11 22') ? '+223 90 07 03 21' : (rawPhone || '+223 90 07 03 21');
        const waToUse = parsed.whatsappNumber && parsed.whatsappNumber.includes('76001122') ? '22390070321' : (parsed.whatsappNumber || '22390070321');

        return {
          ...AGENCY_PRESETS[0].config,
          ...parsed,
          phone: phoneToUse,
          phoneDisplay: phoneToUse,
          whatsappNumber: waToUse,
          specialties: parsed.specialties && Array.isArray(parsed.specialties) && parsed.specialties.length > 0
            ? parsed.specialties
            : (AGENCY_PRESETS[0].config.specialties || ['vente', 'location', 'gestion']),
          primarySpecialty: parsed.primarySpecialty || AGENCY_PRESETS[0].config.primarySpecialty || 'toutes',
          specialtyDetails: parsed.specialtyDetails !== undefined ? parsed.specialtyDetails : AGENCY_PRESETS[0].config.specialtyDetails,
          adminPassword: parsed.adminPassword || '00223',
        };
      }
    }
  } catch (e) {
    console.error('Error loading agency config:', e);
  }
  return AGENCY_PRESETS[0].config;
};

const saveAgencyConfig = (config: AgencyConfig) => {
  try {
    setStorageItem(LOCAL_STORAGE_AGENCY_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving agency config:', e);
  }
};

interface AgencyState {
  config: AgencyConfig;
  selectedPresetId: string;
}

const initialState: AgencyState = {
  config: loadSavedAgencyConfig(),
  selectedPresetId: 'mali_immo_prestige',
};

export const agencySlice = createSlice({
  name: 'agency',
  initialState,
  reducers: {
    updateAgencyConfig: (state, action: PayloadAction<Partial<AgencyConfig>>) => {
      const payload = { ...action.payload };
      // Always synchronize phone and phoneDisplay so neither can hold stale data
      if (payload.phoneDisplay !== undefined) {
        payload.phone = payload.phoneDisplay;
      } else if (payload.phone !== undefined) {
        payload.phoneDisplay = payload.phone;
      }
      state.config = {
        ...state.config,
        ...payload,
        isCustomBranding: true,
      };
      saveAgencyConfig(state.config);
    },
    setAgencyConfig: (state, action: PayloadAction<AgencyConfig>) => {
      const payload = { ...action.payload };
      const unifiedPhone = payload.phoneDisplay || payload.phone || '+223 90 07 03 21';
      payload.phone = unifiedPhone;
      payload.phoneDisplay = unifiedPhone;
      state.config = payload;
      saveAgencyConfig(state.config);
    },
    setAgencyPreset: (state, action: PayloadAction<string>) => {
      const preset = AGENCY_PRESETS.find((p) => p.id === action.payload);
      if (preset) {
        state.selectedPresetId = preset.id;
        state.config = { ...preset.config };
        saveAgencyConfig(state.config);
      }
    },
    resetAgencyConfig: (state) => {
      state.config = AGENCY_PRESETS[0].config;
      state.selectedPresetId = 'mali_immo_prestige';
      saveAgencyConfig(state.config);
    },
  },
});

export const { updateAgencyConfig, setAgencyConfig, setAgencyPreset, resetAgencyConfig } = agencySlice.actions;
export default agencySlice.reducer;
