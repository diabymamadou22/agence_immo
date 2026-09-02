import { DocumentType, PropertyType, PropertyStatus, DealType, PaymentMethod } from '../types';

export const CLIENT_CONTACT_PHONE = '+223 76 00 11 22';
export const CLIENT_CALL_TEL = '+22376001122';
export const CLIENT_WHATSAPP_NUMBER = '22376001122';
export const CLIENT_PHONE_DISPLAY = '+223 76 00 11 22';

/**
 * Clean a phone string for use in tel: href (preserves leading +, strips spaces)
 */
export function cleanPhoneNumberForTel(phone?: string): string {
  if (!phone || !phone.trim()) return CLIENT_CALL_TEL;
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/[^0-9]/g, '');
  return hasPlus ? `+${digits}` : `+${digits}`;
}

/**
 * Clean a WhatsApp number for use in wa.me URL (only digits)
 */
export function cleanWhatsAppNumber(phone?: string): string {
  if (!phone || !phone.trim()) return CLIENT_WHATSAPP_NUMBER;
  const digits = phone.replace(/[^0-9]/g, '');
  return digits || CLIENT_WHATSAPP_NUMBER;
}

export const AGENCY_INFO = {
  name: 'Mali Immo Prestige',
  slogan: 'L\'Excellence Foncière & Immobilière au Mali',
  tagline: 'L\'Excellence Foncière & Immobilière au Mali',
  phone: '+223 76 00 11 22',
  phoneDisplay: '+223 76 00 11 22',
  whatsappNumber: '22376001122',
  email: 'contact@mali-immoprestige.ml',
  address: 'Hamdallaye ACI 2000, Près du Monument de l\'Obélisque, Bamako, Mali',
  rccm: 'MA-BKO-2022-B-12890',
  nif: '0852147983X',
  workingHours: 'Lun - Sam: 08h00 - 18h30',
};

/**
 * Format amount in West African CFA Franc (XOF / FCFA) with clean space separation
 * Example: 15000000 -> "15 000 000 FCFA"
 */
export function formatFCFA(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 FCFA';
  const formatted = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FCFA`;
}

/**
 * Format surface area in m2
 * Example: 300 -> "300 m²"
 */
export function formatSurface(m2: number | undefined | null): string {
  if (!m2) return 'Non précisée';
  return `${m2} m²`;
}

/**
 * Format French dates (e.g. "25 Août 2024")
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format Document type into user-friendly French label and badge style
 */
export function getDocumentBadgeInfo(docType: DocumentType): { label: string; shortLabel: string; color: string; description: string } {
  switch (docType) {
    case 'titre_foncier':
      return {
        label: 'Titre Foncier (TF)',
        shortLabel: 'TF Inattaquable',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        description: 'Titre de propriété définitif et inattaquable devant la loi malienne.',
      };
    case 'bail':
      return {
        label: 'Bail Emphytéotique / Commercial',
        shortLabel: 'Bail',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        description: 'Contrat de location longue durée accordé par l\'État ou la collectivité.',
      };
    case 'lettre_attribution':
      return {
        label: 'Lettre d\'Attribution',
        shortLabel: 'Lettre d\'Attribution',
        color: 'bg-amber-100 text-amber-800 border-amber-300',
        description: 'Document provisoire délivré par la mairie ou le préfet avant mutation en TF.',
      };
    case 'permis_occuper':
      return {
        label: 'Permis d\'Occuper (CU)',
        shortLabel: 'Permis d\'Occuper',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        description: 'Concession urbaine d\'habitation délivrée par les autorités administratives.',
      };
    case 'concession_rurale':
      return {
        label: 'Concession Rurale',
        shortLabel: 'Concession Rurale',
        color: 'bg-lime-100 text-lime-800 border-lime-300',
        description: 'Titre d\'exploitation et d\'attribution pour terrain agricole ou périurbain.',
      };
    case 'decision':
      return {
        label: 'Décision d\'Attribution',
        shortLabel: 'Décision',
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        description: 'Arrêté ou décision préfectorale d\'attribution de parcelle.',
      };
    default:
      return {
        label: 'Document légal',
        shortLabel: 'Document',
        color: 'bg-slate-100 text-slate-800 border-slate-300',
        description: 'Document officiel en cours de régularisation.',
      };
  }
}

/**
 * Property Type translation to readable French
 */
export function getPropertyTypeLabel(type: PropertyType): string {
  switch (type) {
    case 'parcelle':
      return 'Parcelle / Terrain';
    case 'maison':
      return 'Maison / Villa';
    case 'appartement':
      return 'Appartement';
    case 'magasin_bureau':
      return 'Magasin / Bureau';
    case 'immeuble':
      return 'Immeuble';
    case 'entrepot':
      return 'Entrepôt / Hangar';
    default:
      return type;
  }
}

/**
 * Deal Type translation
 */
export function getDealTypeLabel(dealType: DealType): string {
  return dealType === 'vente' ? 'À Vendre' : 'À Louer';
}

/**
 * Property Status translation and badges
 */
export function getStatusBadgeInfo(status: PropertyStatus): { label: string; color: string } {
  switch (status) {
    case 'disponible':
      return { label: 'Disponible', color: 'bg-emerald-500 text-white' };
    case 'reserve':
      return { label: 'Réservé', color: 'bg-amber-500 text-white' };
    case 'loue':
      return { label: 'Loué', color: 'bg-blue-600 text-white' };
    case 'vendu':
      return { label: 'Vendu', color: 'bg-slate-600 text-white' };
    default:
      return { label: status, color: 'bg-slate-500 text-white' };
  }
}

/**
 * Generate prefilled WhatsApp URL for instant client contact with active agency phone number
 */
export function generateWhatsAppLink(
  propertyTitle: string,
  propertyRef: string,
  price: number,
  dealType: DealType,
  customMsg?: string,
  whatsappNumber?: string,
  agencyName?: string
): string {
  const priceText = formatFCFA(price);
  const actionText = dealType === 'vente' ? 'l\'achat' : 'la location';
  const targetName = agencyName || 'l\'agence';
  const targetNumber = cleanWhatsAppNumber(whatsappNumber || CLIENT_WHATSAPP_NUMBER);
  
  const defaultMsg = `Bonjour ${targetName},\n\nJe suis très intéressé(e) par ${actionText} du bien suivant :\n📌 *${propertyTitle}*\n🆔 Réf : *${propertyRef}*\n💰 Prix : *${priceText}*\n\nEst-il toujours disponible ? Pouvons-nous convenir d'une visite sur le terrain ?\nMerci !`;
  
  const textToSend = customMsg ? customMsg : defaultMsg;
  return `https://wa.me/${targetNumber}?text=${encodeURIComponent(textToSend)}`;
}

/**
 * Malian Land & Real Estate Notary Fees Simulator
 */
export interface NotaryEstimate {
  propertyPrice: number;
  registrationTax: number; // Droits d'enregistrement (7%)
  landRegistryFee: number; // Conservation foncière & timbres (1.5%)
  notaryHonoraires: number; // Émoluments notaire
  taxOnHonoraires: number; // TVA 18% sur émoluments
  deboursAndStamps: number; // Frais de timbres et débours
  totalNotaryFees: number;
  totalAcquisitionCost: number;
  percentageOfPrice: number;
}

export function calculateNotaryFeesMali(price: number, docType: DocumentType = 'titre_foncier'): NotaryEstimate {
  if (price <= 0) {
    return {
      propertyPrice: 0,
      registrationTax: 0,
      landRegistryFee: 0,
      notaryHonoraires: 0,
      taxOnHonoraires: 0,
      deboursAndStamps: 0,
      totalNotaryFees: 0,
      totalAcquisitionCost: 0,
      percentageOfPrice: 0,
    };
  }

  // Droits d'enregistrement au Mali (7% pour TF ordinaire / 8% à 10%)
  const regRate = docType === 'titre_foncier' ? 0.07 : 0.08;
  const registrationTax = Math.round(price * regRate);

  // Conservation foncière (1.5%)
  const landRegistryFee = Math.round(price * 0.015);

  // Émoluments notaire dégressifs barème Mali (approx 2.5% à 3.5%)
  let notaryRate = 0.035;
  if (price > 50000000) notaryRate = 0.025;
  if (price > 100000000) notaryRate = 0.02;
  const notaryHonoraires = Math.round(price * notaryRate);

  // TVA sur honoraires (18%)
  const taxOnHonoraires = Math.round(notaryHonoraires * 0.18);

  // Débours géomètre, timbres fiscaux cadastre
  const deboursAndStamps = Math.round(Math.min(350000, price * 0.008));

  const totalNotaryFees = registrationTax + landRegistryFee + notaryHonoraires + taxOnHonoraires + deboursAndStamps;
  const totalAcquisitionCost = price + totalNotaryFees;
  const percentageOfPrice = Number(((totalNotaryFees / price) * 100).toFixed(1));

  return {
    propertyPrice: price,
    registrationTax,
    landRegistryFee,
    notaryHonoraires,
    taxOnHonoraires,
    deboursAndStamps,
    totalNotaryFees,
    totalAcquisitionCost,
    percentageOfPrice,
  };
}

/**
 * Amenity translations and metadata
 */
export const AMENITY_DEFINITIONS: Record<string, { label: string; icon: string; category: string }> = {
  eau_somagep: { label: 'Eau SOMAGEP (Robinet)', icon: 'Droplet', category: 'Utilitaires' },
  electricite_edmsa: { label: 'Électricité EDM-SA', icon: 'Zap', category: 'Utilitaires' },
  electricite_edm: { label: 'Électricité EDM-SA', icon: 'Zap', category: 'Utilitaires' },
  forage_solaire: { label: 'Forage avec château d\'eau & Solaire', icon: 'Sun', category: 'Autonomie' },
  acces_goudron: { label: 'Accès goudronné / Pavé', icon: 'Navigation', category: 'Accessibilité' },
  route_goudronnee: { label: 'Accès goudronné / Pavé', icon: 'Navigation', category: 'Accessibilité' },
  cloture: { label: 'Terrain / Cour entièrement clôturé', icon: 'ShieldCheck', category: 'Sécurité' },
  gardiennage: { label: 'Guérite & Service de Gardiennage', icon: 'Shield', category: 'Sécurité' },
  climatisation: { label: 'Climatisation installée', icon: 'Wind', category: 'Confort' },
  groupe_electrogene: { label: 'Groupe électrogène de secours', icon: 'BatteryCharging', category: 'Autonomie' },
  piscine: { label: 'Piscine privée', icon: 'Waves', category: 'Luxe' },
  parking: { label: 'Parking intérieur / Garage', icon: 'Car', category: 'Véhicules' },
  jardin: { label: 'Cour arborée / Jardin', icon: 'Trees', category: 'Confort' },
  wifi_fibre: { label: 'Connexion Fibre Optique (Malitel / Orange)', icon: 'Wifi', category: 'Technologie' },
};

/**
 * List of popular neighborhoods and cities in Mali
 */
export const MALI_LOCATIONS = {
  cities: [
    'Bamako',
    'Kati',
    'Koulikoro',
    'Sanankoroba',
    'Sikasso',
    'Ségou',
    'Mopti',
    'Kayes',
  ],
  neighborhoodsBamako: [
    'ACI 2000',
    'Kalaban Coura',
    'Yirimadio',
    'Badalabougou',
    'Sotuba',
    'Golf (Zone du Golf)',
    'Hamdallaye',
    'Bacodjicoroni ACI',
    'Baco Djicoroni Golf',
    'Titibougou',
    'Moribabougou',
    'Sénou',
    'Dialakorobougou',
    'Missabougou',
    'Magnambougou',
    'Faladié',
    'Banankabougou',
    'Torokorobougou',
    'Sebenikoro',
    'Djélibougou',
    'Korofina',
    'Niamakoro',
    'Hippodrome',
    'Quinzambougou',
    'Sangarébougou',
    'Kambila (Kati)',
    'Kati Sananfara',
    'Baguineda',
    'Mountougoula',
  ],
};
