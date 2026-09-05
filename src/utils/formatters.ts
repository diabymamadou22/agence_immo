import { DocumentType, PropertyType, PropertyStatus, DealType, PaymentMethod, Tenant } from '../types';

export const CLIENT_CONTACT_PHONE = '+223 90 07 03 21';
export const CLIENT_CALL_TEL = '+22390070321';
export const CLIENT_WHATSAPP_NUMBER = '22390070321';
export const CLIENT_PHONE_DISPLAY = '+223 90 07 03 21';

/**
 * Clean a phone string for use in tel: href.
 * Detects 8-digit Malian numbers (e.g. "90070321" -> "+22390070321"),
 * strips spaces, brackets, hyphens, and correctly formats international prefixes.
 */
export function cleanPhoneNumberForTel(phone?: string): string {
  if (!phone || !phone.trim()) return CLIENT_CALL_TEL;
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^0-9]/g, '');
  if (!digits) return CLIENT_CALL_TEL;

  // Mali national numbers are 8 digits (e.g., 90070321, 76001122, etc.)
  if (digits.length === 8) {
    return `+223${digits}`;
  }
  // Starts with 00223: e.g. 0022390070321 -> +22390070321
  if (digits.startsWith('00223')) {
    return `+${digits.slice(2)}`;
  }
  // Starts with 223 (11 digits: country code 223 + 8-digit phone)
  if (digits.startsWith('223') && digits.length === 11) {
    return `+${digits}`;
  }
  // Already has explicit + prefix
  if (trimmed.startsWith('+')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

/**
 * Clean a WhatsApp number for use in wa.me URL (strictly digits with country code, no +)
 * If an 8-digit Malian number is provided (e.g. "90070321"), prepends Mali country code 223 ("22390070321")
 */
export function cleanWhatsAppNumber(phone?: string): string {
  if (!phone || !phone.trim()) return CLIENT_WHATSAPP_NUMBER;
  const digits = phone.trim().replace(/[^0-9]/g, '');
  if (!digits) return CLIENT_WHATSAPP_NUMBER;

  // Mali 8-digit number -> prepend 223
  if (digits.length === 8) {
    return `223${digits}`;
  }
  // Starts with 00223 -> strip leading 00
  if (digits.startsWith('00223')) {
    return digits.slice(2);
  }
  return digits;
}

/**
 * Formats a phone number into an elegant readable Malian format
 * Example: "90070321" -> "+223 90 07 03 21"
 */
export function formatMaliPhoneDisplay(phone?: string): string {
  if (!phone || !phone.trim()) return CLIENT_PHONE_DISPLAY;
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^0-9]/g, '');
  if (digits.length === 8) {
    return `+223 ${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)}`;
  }
  if (digits.length === 11 && digits.startsWith('223')) {
    const d8 = digits.slice(3);
    return `+223 ${d8.slice(0, 2)} ${d8.slice(2, 4)} ${d8.slice(4, 6)} ${d8.slice(6, 8)}`;
  }
  return trimmed;
}

export const AGENCY_INFO = {
  name: 'Mali Immo Prestige',
  slogan: 'L\'Excellence Foncière & Immobilière au Mali',
  tagline: 'L\'Excellence Foncière & Immobilière au Mali',
  phone: '+223 90 07 03 21',
  phoneDisplay: '+223 90 07 03 21',
  whatsappNumber: '22390070321',
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
 * Convert number in Francs CFA to French Words (for official notary deeds and receipts)
 */
export function formatAmountInFrenchWords(amount: number | undefined | null): string {
  if (!amount || isNaN(amount) || amount <= 0) return 'Zéro Franc CFA';

  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
    'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];

  function convertGroup(n: number): string {
    if (n === 0) return '';
    let result = '';

    // Hundreds
    if (n >= 100) {
      const h = Math.floor(n / 100);
      if (h === 1) {
        result += 'cent';
      } else {
        result += `${units[h]} cent${n % 100 === 0 ? 's' : ''}`;
      }
      n = n % 100;
      if (n > 0) result += ' ';
    }

    // Tens and Units
    if (n > 0) {
      if (n < 20) {
        result += units[n];
      } else if (n < 70) {
        const t = Math.floor(n / 10);
        const u = n % 10;
        result += tens[t];
        if (u === 1) result += ' et un';
        else if (u > 1) result += `-${units[u]}`;
      } else if (n < 80) {
        const u = n - 60;
        result += 'soixante';
        if (u === 11) result += ' et onze';
        else result += `-${units[u]}`;
      } else if (n < 100) {
        const u = n - 80;
        result += 'quatre-vingt';
        if (u === 0) result += 's';
        else result += `-${units[u]}`;
      }
    }

    return result.trim();
  }

  const rounded = Math.round(amount);
  if (rounded === 0) return 'Zéro Franc CFA';

  const billions = Math.floor(rounded / 1000000000);
  const millions = Math.floor((rounded % 1000000000) / 1000000);
  const thousands = Math.floor((rounded % 1000000) / 1000);
  const remainder = rounded % 1000;

  const parts: string[] = [];

  if (billions > 0) {
    if (billions === 1) parts.push('un milliard');
    else parts.push(`${convertGroup(billions)} milliards`);
  }

  if (millions > 0) {
    if (millions === 1) parts.push('un million');
    else parts.push(`${convertGroup(millions)} millions`);
  }

  if (thousands > 0) {
    if (thousands === 1) parts.push('mille');
    else parts.push(`${convertGroup(thousands)} mille`);
  }

  if (remainder > 0) {
    parts.push(convertGroup(remainder));
  }

  const rawWords = parts.join(' ').trim();
  const capitalized = rawWords.charAt(0).toUpperCase() + rawWords.slice(1);
  return `${capitalized} Francs CFA`;
}

/**
 * Get user-friendly label for sale operation types
 */
export function getSaleOperationLabel(type: 'vente_totale' | 'acompte' | 'solde' | 'versement_echelonne'): { label: string; badge: string; color: string } {
  switch (type) {
    case 'vente_totale':
      return {
        label: 'Vente Définitive (Paiement Intégral)',
        badge: 'Règlement Intégral',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    case 'acompte':
      return {
        label: 'Acompte / Versement de Réservation',
        badge: 'Acompte Reçu',
        color: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    case 'solde':
      return {
        label: 'Règlement du Solde Final',
        badge: 'Solde Acquit',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
      };
    case 'versement_echelonne':
      return {
        label: 'Tranche / Versement Échelonné',
        badge: 'Versement Échelonné',
        color: 'bg-purple-100 text-purple-800 border-purple-300',
      };
    default:
      return {
        label: 'Reçu de Vente Immobilière',
        badge: 'Vente',
        color: 'bg-slate-100 text-slate-800 border-slate-300',
      };
  }
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

/**
 * Tenant overdue rent status and visual indicator (pastille)
 */
export interface TenantLateStatus {
  isLate: boolean;
  daysLate: number;
  isOver5Days: boolean;
  isCritical: boolean; // > 15 days
  level: 'safe' | 'warning' | 'late_over_5' | 'late_critical';
  dotColor: string; // Background color for the pastille dot
  pingColor: string; // Ping ripple color for pulsing animation
  badgeBg: string; // Badge styling
  badgeText: string;
  label: string;
  description: string;
}

/**
 * Computes overdue status and visual alert pastilles for a tenant.
 * Analyzes rentPaymentDay, status, and pending balance.
 */
export function getTenantLateStatus(tenant: Tenant): TenantLateStatus {
  const now = new Date();
  const currentDay = now.getDate();
  const dueDay = tenant.rentPaymentDay || 5;

  const isExplicitlyLate = tenant.status === 'retard';
  const hasPendingBalance = (tenant.pendingBalance ?? 0) > 0;
  const isPartiel = tenant.status === 'partiel';

  // If active, no balance, and not marked as late
  if (!isExplicitlyLate && !hasPendingBalance && !isPartiel) {
    return {
      isLate: false,
      daysLate: 0,
      isOver5Days: false,
      isCritical: false,
      level: 'safe',
      dotColor: 'bg-emerald-500',
      pingColor: 'bg-emerald-400',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badgeText: 'À Jour',
      label: 'Loyer à Jour',
      description: 'Paiement régularisé pour la période en cours.',
    };
  }

  // Calculate days overdue
  let daysLate = 0;
  if (currentDay > dueDay) {
    daysLate = currentDay - dueDay;
  } else {
    // Due in previous month cycle: 30 - dueDay + currentDay
    daysLate = (30 - dueDay) + currentDay;
  }

  // If explicitly flagged as 'retard' in the database/mock data, ensure minimum 8 days overdue
  // to reflect that the normal grace period (5 days) has already passed.
  if (isExplicitlyLate && daysLate < 6) {
    daysLate = Math.max(daysLate, 8);
  }

  const isOver5Days = daysLate > 5;
  const isCritical = daysLate > 15;

  if (isCritical) {
    return {
      isLate: true,
      daysLate,
      isOver5Days: true,
      isCritical: true,
      level: 'late_critical',
      dotColor: 'bg-rose-700',
      pingColor: 'bg-rose-600',
      badgeBg: 'bg-rose-100 text-rose-950 border-rose-300 font-black ring-1 ring-rose-300',
      badgeText: `Retard +${daysLate}j`,
      label: `Retard Critique (+${daysLate} jours)`,
      description: `Loyer impayé depuis plus de 15 jours. Relance WhatsApp et mise en demeure urgentes.`,
    };
  }

  if (isOver5Days) {
    return {
      isLate: true,
      daysLate,
      isOver5Days: true,
      isCritical: false,
      level: 'late_over_5',
      dotColor: 'bg-rose-500',
      pingColor: 'bg-rose-400',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200 font-extrabold',
      badgeText: `Retard > 5j (+${daysLate}j)`,
      label: `Retard > 5 jours (+${daysLate} jours)`,
      description: `Dépassement du délai de tolérance (5 jours). Relance WhatsApp recommandée.`,
    };
  }

  // Delay within grace period (1 to 5 days)
  return {
    isLate: true,
    daysLate,
    isOver5Days: false,
    isCritical: false,
    level: 'warning',
    dotColor: 'bg-amber-500',
    pingColor: 'bg-amber-400',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
    badgeText: `Retard ${daysLate}j`,
    label: `Retard léger (${daysLate} jour${daysLate > 1 ? 's' : ''})`,
    description: `Délai de grâce habituel de 5 jours en cours.`,
  };
}

