export type PropertyType = 
  | 'parcelle' 
  | 'maison' 
  | 'appartement' 
  | 'magasin_bureau' 
  | 'immeuble' 
  | 'entrepot';

export type DealType = 'vente' | 'location';

export type DocumentType = 
  | 'titre_foncier' 
  | 'bail' 
  | 'lettre_attribution' 
  | 'permis_occuper' 
  | 'concession_rurale'
  | 'decision';

export type PropertyStatus = 'disponible' | 'vendu' | 'loue' | 'reserve';

export interface Property {
  id: string;
  reference: string; // Ex: ML-BKO-2024-001
  title: string;
  description: string;
  propertyType: PropertyType;
  dealType: DealType;
  price: number; // In FCFA
  pricePeriod?: 'mois' | 'total' | 'm2'; // for rentals or per m2
  surface: number; // In m2
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  
  // Location Mali
  city: string; // Ex: Bamako, Kati, Koulikoro, Sikasso
  commune?: string; // Ex: Commune IV, Commune V, Commune VI
  neighborhood: string; // Ex: Kalaban Coura, Yirimadio, ACI 2000, Sotuba, Golf
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  landmark?: string; // Point de repère (ex: À 200m du goudron, Près du Marché)

  // Land plot specifics (Parcelles / Foncier)
  lotissement?: string; // Ex: Lotissement Saniya Extension
  section?: string; // Ex: Section AK
  lotNumber?: string; // Ex: Lot N° 142
  ilotNumber?: string; // Ex: Îlot 12
  dimensions?: string; // Ex: 15m x 20m (300m²)

  // Legal documentation
  documentType: DocumentType;
  documentNumber?: string; // Ex: TF N° 12458/BKO
  documentDetails?: string;

  // Media
  images: string[];
  featuredImage: string;

  // Features & Amenities
  amenities: string[]; // ['eau_somagep', 'electricite_edm', 'route_goudronnee', 'climatisation', etc.]
  isFenced?: boolean; // Clôturé
  hasSolar?: boolean; // Énergie solaire / Forage
  hasWaterWell?: boolean; // Forage / Puits

  // Owner reference
  ownerId?: string;
  ownerName?: string;
  ownerPhone?: string;

  // Status & Metadata
  status: PropertyStatus;
  isFeatured?: boolean;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type LeadType = 'contact' | 'demande_visite' | 'offre' | 'whatsapp' | 'depot_bien' | 'recherche_parcelle';
export type LeadStatus = 'nouveau' | 'contacte' | 'visite_programmee' | 'conclu' | 'annule';

export interface Lead {
  id: string;
  propertyId?: string;
  propertyTitle?: string;
  propertyRef?: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  leadType: LeadType;
  message: string;
  proposedPrice?: number;
  visitDate?: string;
  visitTime?: string;
  status: LeadStatus;
  createdAt: string;
  notes?: string;
  budgetFCFA?: number;
  desiredZone?: string;
}

export type PaymentMethod = 'Orange Money' | 'Moov Money' | 'Wave' | 'Virement Bancaire' | 'Espèces' | 'Chèque';
export type PaymentStatus = 'paye' | 'en_retard' | 'en_attente' | 'partiel';

export interface RentReceipt {
  id: string;
  receiptNumber: string; // Ex: QUITT-2024-08-004
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyTitle: string;
  periodMonth: string; // Ex: Août 2024
  amount: number; // In FCFA
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  status: PaymentStatus;
  issuedBy: string;
  notes?: string;
}

export interface Tenant {
  id: string;
  propertyId: string;
  propertyTitle: string;
  unitNumber?: string;
  name: string;
  phone: string;
  email?: string;
  ninaNumber?: string; // Numéro NINA Malien
  emergencyContact?: string;
  leaseStartDate: string;
  leaseEndDate: string;
  monthlyRent: number; // In FCFA
  depositAmount: number; // Caution in FCFA
  advanceMonths: number;
  rentPaymentDay: number; // Ex: le 5 du mois
  status: 'actif' | 'inactif' | 'retard';
  lastPaymentMonth?: string;
  receipts: RentReceipt[];
  notes?: string;
}

// Agency Owner / Landlord (Bailleur / Propriétaire Foncier)
export interface Owner {
  id: string;
  name: string;
  phone: string;
  email?: string;
  ninaNumber?: string;
  address: string;
  bankName?: string;
  accountNumber?: string;
  mobileMoneyNumber?: string;
  managementCommissionRate: number; // e.g. 10 (%)
  saleCommissionRate: number; // e.g. 5 (%)
  propertiesCount: number;
  status: 'actif' | 'inactif';
  createdAt: string;
  notes?: string;
}

// Owner Payout / Bordereau de Reversement des Loyers
export interface OwnerPayout {
  id: string;
  payoutNumber: string; // Ex: REV-2024-08-01
  ownerId: string;
  ownerName: string;
  periodMonth: string;
  grossRentCollected: number;
  agencyCommissionPercent: number;
  agencyCommissionAmount: number;
  maintenanceDeductions: number;
  netPaidToOwner: number;
  payoutDate: string;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  status: 'paye' | 'en_attente';
  notes?: string;
}

// Legal Contracts & Mandates
export type ContractType = 
  | 'bail_habitation' 
  | 'bail_commercial' 
  | 'mandat_vente' 
  | 'mandat_gestion' 
  | 'bon_visite' 
  | 'compromis_vente' 
  | 'etat_des_lieux';

export interface LegalContract {
  id: string;
  contractType: ContractType;
  reference: string;
  title: string;
  propertyId: string;
  propertyTitle: string;
  partyAName: string; // Bailleur / Vendeur / Mandant
  partyAPhone?: string;
  partyBName: string; // Locataire / Acheteur / Mandataire
  partyBPhone?: string;
  amountFCFA: number;
  depositFCFA?: number;
  startDate: string;
  endDate?: string;
  clauses: string[];
  status: 'actif' | 'signe' | 'archive';
  createdAt: string;
}

// Agency Financials & Expenses
export interface AgencyExpense {
  id: string;
  title: string;
  category: 'geometre' | 'marketing' | 'carburant' | 'juridique' | 'salaires' | 'bureau' | 'divers';
  amount: number; // in FCFA
  date: string;
  paymentMethod: PaymentMethod;
  receiptNumber?: string;
  notes?: string;
}

// Agency White-Label & SaaS Profile
export interface AgencyConfig {
  name: string;
  slogan: string;
  tagline: string;
  phone: string;
  phoneDisplay: string;
  whatsappNumber: string;
  email: string;
  address: string;
  city: string;
  country: string;
  rccm: string;
  nif: string;
  workingHours: string;
  currency: 'FCFA' | 'EUR' | 'USD';
  
  // Bank details
  bankName: string;
  bankRib: string;
  bankAccountName: string;

  // Mobile money merchant codes
  orangeMoneyMerchant: string;
  moovMoneyMerchant: string;
  waveMerchant: string;

  // Default commission rates
  defaultRentalCommissionPercent: number; // e.g. 10%
  defaultSaleCommissionPercent: number; // e.g. 5%

  // Visual Theme / Stamp
  themeColor: 'amber' | 'emerald' | 'blue' | 'slate' | 'indigo';
  officialStampText: string;
  isCustomBranding: boolean;
  logoUrl?: string;
  stampUrl?: string;

  // Security / Back-Office Access Password
  adminPassword?: string; // Default: 00223
}

export interface PropertyFilterState {
  dealType: DealType | 'all';
  propertyType: PropertyType | 'all';
  city: string;
  neighborhood: string;
  minPrice: number;
  maxPrice: number;
  minSurface: number;
  maxSurface: number;
  documentType: DocumentType | 'all';
  searchQuery: string;
  status: PropertyStatus | 'all';
  amenities: string[];
  onlyWithTF: boolean;
}

