import { Property, Tenant, RentReceipt, AgencyConfig, OwnerPayout, AgencyExpense, SaleReceipt } from '../types';
import { formatFCFA, formatDate, getPropertyTypeLabel, getDocumentBadgeInfo } from './formatters';

/**
 * Exports data to a UTF-8 CSV file with BOM so Microsoft Excel and other
 * spreadsheet software display French accents and currency symbols accurately.
 */
export const exportToCSV = (filename: string, headers: string[], rows: (string | number | undefined | null)[][]) => {
  const escapeCell = (val: string | number | undefined | null): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCell).join(';');
  const dataLines = rows.map((row) => row.map(escapeCell).join(';'));
  const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export properties catalogue to formatted CSV
 */
export const exportPropertiesToCSV = (properties: Property[], filename = 'inventaire_biens_immobiliers') => {
  const headers = [
    'Référence',
    'Titre du Bien',
    'Type de Bien',
    'Opération',
    'Quartier',
    'Ville',
    'Commune',
    'Surface (m²)',
    'Dimensions',
    'Chambres',
    'Salles de bain',
    'Type de Document',
    'N° Document / TF',
    'N° Lot',
    'Section',
    'Prix (FCFA)',
    'Statut',
    'Date de Création'
  ];

  const rows = properties.map((p) => [
    p.reference || '',
    p.title || '',
    getPropertyTypeLabel(p.propertyType),
    p.dealType === 'vente' ? 'Vente' : 'Location',
    p.neighborhood || '',
    p.city || '',
    p.commune || '',
    p.surface || 0,
    p.dimensions || '',
    p.bedrooms || 0,
    p.bathrooms || 0,
    getDocumentBadgeInfo(p.documentType).shortLabel,
    p.documentNumber || '',
    p.lotNumber || '',
    p.section || '',
    p.price || 0,
    p.status.toUpperCase(),
    p.createdAt ? formatDate(p.createdAt) : ''
  ]);

  exportToCSV(filename, headers, rows);
};

/**
 * Export tenants and lease agreements to formatted CSV
 */
export const exportTenantsToCSV = (tenants: Tenant[], filename = 'registre_locataires_baux') => {
  const headers = [
    'Nom du Locataire',
    'Téléphone',
    'Email',
    'N° NINA / Pièce',
    'Bien Loué',
    'Unité / Porte',
    'Loyer Mensuel (FCFA)',
    'Caution Versée (FCFA)',
    'Jour d\'Échéance',
    'Date Début Bail',
    'Date Fin Bail',
    'Statut',
    'Dernier Paiement Effectué'
  ];

  const rows = tenants.map((t) => [
    t.name || '',
    t.phone || '',
    t.email || '',
    t.ninaNumber || '',
    t.propertyTitle || '',
    t.unitNumber || 'Principal',
    t.monthlyRent || 0,
    t.depositAmount || 0,
    `Le ${t.rentPaymentDay || 5} du mois`,
    t.leaseStartDate ? formatDate(t.leaseStartDate) : '',
    t.leaseEndDate ? formatDate(t.leaseEndDate) : '',
    t.status === 'actif' ? 'À Jour' : 'En Retard',
    t.lastPaymentMonth || 'Non renseigné'
  ]);

  exportToCSV(filename, headers, rows);
};

/**
 * Export rent receipts accounting journal to formatted CSV
 */
export const exportReceiptsToCSV = (receipts: RentReceipt[], filename = 'journal_quittances_loyers') => {
  const headers = [
    'N° Quittance',
    'Date d\'Encaissement',
    'Nom du Locataire',
    'Bien / Logement',
    'Période / Mois de Loyer',
    'Montant Encaissé (FCFA)',
    'Mode de Règlement',
    'N° Transaction / Réf',
    'Émis Par / Agence'
  ];

  const rows = receipts.map((r) => [
    r.receiptNumber || '',
    r.paymentDate ? formatDate(r.paymentDate) : '',
    r.tenantName || '',
    r.propertyTitle || '',
    r.periodMonth || '',
    r.amount || 0,
    r.paymentMethod || '',
    r.transactionRef || '',
    r.issuedBy || 'Direction Agence'
  ]);

  exportToCSV(filename, headers, rows);
};

export interface MonthlyFinancialSummaryItem {
  monthKey: string;      // "2024-08"
  label: string;         // "Août 2024"
  shortLabel: string;    // "Août"
  rentalCommissions: number;
  salesCommissions: number;
  dossierFees: number;
  revenus: number;       // Agency gross commission & fees
  depenses: number;      // Agency expenses
  benefice: number;      // revenus - depenses
  chargesDetailCount: number;
  marginPercent: number;
}

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const SHORT_MONTH_NAMES_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'
];

/**
 * Computes monthly financial breakdown from real entities
 */
export const computeMonthlyFinancialBreakdown = (
  properties: Property[],
  tenants: Tenant[],
  receipts: RentReceipt[],
  payouts: OwnerPayout[],
  expenses: AgencyExpense[],
  agencyConfig: AgencyConfig
): MonthlyFinancialSummaryItem[] => {
  const map = new Map<string, {
    monthKey: string;
    year: number;
    month: number;
    rentalCommissions: number;
    salesCommissions: number;
    dossierFees: number;
    depenses: number;
    chargesCount: number;
  }>();

  const getEntry = (year: number, month: number) => {
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    if (!map.has(monthKey)) {
      map.set(monthKey, {
        monthKey,
        year,
        month,
        rentalCommissions: 0,
        salesCommissions: 0,
        dossierFees: 0,
        depenses: 0,
        chargesCount: 0,
      });
    }
    return map.get(monthKey)!;
  };

  // 1. Process payouts (commissions earned by agency from owners' rentals)
  payouts.forEach((p) => {
    const pDate = p.payoutDate ? new Date(p.payoutDate) : new Date();
    if (!isNaN(pDate.getTime())) {
      const entry = getEntry(pDate.getFullYear(), pDate.getMonth());
      entry.rentalCommissions += (p.agencyCommissionAmount || 0);
    }
  });

  // 1b. If some receipts don't have payouts yet, calculate default 10% agency management commission
  receipts.forEach((r) => {
    const rDate = r.paymentDate ? new Date(r.paymentDate) : new Date();
    if (!isNaN(rDate.getTime())) {
      const entry = getEntry(rDate.getFullYear(), rDate.getMonth());
      if (payouts.length === 0) {
        entry.rentalCommissions += Math.round(r.amount * 0.10);
      }
    }
  });

  // 2. Process sold properties (sales commissions earned on conclusion)
  properties
    .filter((p) => p.status === 'vendu' && p.dealType === 'vente')
    .forEach((p) => {
      const dateStr = p.updatedAt || p.createdAt || '2024-08-01';
      const pDate = new Date(dateStr);
      if (!isNaN(pDate.getTime())) {
        const entry = getEntry(pDate.getFullYear(), pDate.getMonth());
        const commissionRate = agencyConfig.defaultSaleCommissionPercent || 5;
        entry.salesCommissions += Math.round(p.price * (commissionRate / 100));
      }
    });

  // 3. Process expenses
  expenses.forEach((e) => {
    const eDate = e.date ? new Date(e.date) : new Date();
    if (!isNaN(eDate.getTime())) {
      const entry = getEntry(eDate.getFullYear(), eDate.getMonth());
      entry.depenses += (e.amount || 0);
      entry.chargesCount += 1;
    }
  });

  // Ensure we have at least last 6 months spanning through current
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    getEntry(d.getFullYear(), d.getMonth());
  }

  // Sort entries chronologically
  const sortedEntries = Array.from(map.values()).sort((a, b) => {
    return a.monthKey.localeCompare(b.monthKey);
  });

  return sortedEntries.map((item) => {
    const totalRevenus = item.rentalCommissions + item.salesCommissions + item.dossierFees;
    const benefice = totalRevenus - item.depenses;
    const margin = totalRevenus > 0 ? Math.round((benefice / totalRevenus) * 100) : 0;

    return {
      monthKey: item.monthKey,
      label: `${MONTH_NAMES_FR[item.month]} ${item.year}`,
      shortLabel: `${SHORT_MONTH_NAMES_FR[item.month]} ${String(item.year).slice(2)}`,
      rentalCommissions: item.rentalCommissions,
      salesCommissions: item.salesCommissions,
      dossierFees: item.dossierFees,
      revenus: totalRevenus,
      depenses: item.depenses,
      benefice: benefice,
      chargesDetailCount: item.chargesCount,
      marginPercent: margin,
    };
  });
};

/**
 * Export Monthly Financial Report (Revenues vs Expenses & Net Profit) to formatted CSV
 */
export const exportMonthlyFinancialsToCSV = (
  monthlyData: MonthlyFinancialSummaryItem[],
  filename = 'rapport_comptable_revenus_depenses_mensuels'
) => {
  const headers = [
    'Période / Mois',
    'Commissions Gestion Locative (FCFA)',
    'Commissions Ventes Immobilières TF (FCFA)',
    'Frais de Dossier & Baux (FCFA)',
    'Total Revenus Bruts Agence (FCFA)',
    'Dépenses & Charges Exploitation (FCFA)',
    'Résultat Net Agence (FCFA)',
    'Marge Nette d\'Exploitation (%)',
    'Nombre de Dépenses Enregistrées'
  ];

  const rows: (string | number)[][] = monthlyData.map((d) => [
    d.label,
    d.rentalCommissions,
    d.salesCommissions,
    d.dossierFees,
    d.revenus,
    d.depenses,
    d.benefice,
    `${d.marginPercent}%`,
    d.chargesDetailCount
  ]);

  // Add summary / total row
  const totalRentalCommissions = monthlyData.reduce((acc, d) => acc + d.rentalCommissions, 0);
  const totalSalesCommissions = monthlyData.reduce((acc, d) => acc + d.salesCommissions, 0);
  const totalDossierFees = monthlyData.reduce((acc, d) => acc + d.dossierFees, 0);
  const totalRevenus = monthlyData.reduce((acc, d) => acc + d.revenus, 0);
  const totalDepenses = monthlyData.reduce((acc, d) => acc + d.depenses, 0);
  const totalBenefice = totalRevenus - totalDepenses;
  const overallMargin = totalRevenus > 0 ? Math.round((totalBenefice / totalRevenus) * 100) : 0;
  const totalExpensesCount = monthlyData.reduce((acc, d) => acc + d.chargesDetailCount, 0);

  rows.push([
    'TOTAL CUMULÉ DU RAPPORT',
    totalRentalCommissions,
    totalSalesCommissions,
    totalDossierFees,
    totalRevenus,
    totalDepenses,
    totalBenefice,
    `${overallMargin}%`,
    totalExpensesCount
  ]);

  exportToCSV(filename, headers, rows);
};

/**
 * Export Detailed Agency Expenses Ledger to formatted CSV
 */
export const exportExpensesToCSV = (
  expenses: AgencyExpense[],
  filename = 'journal_depenses_exploitation_agence'
) => {
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'geometre':
        return 'Frais Géomètre & Bornage Cadastral';
      case 'marketing':
        return 'Publicité Facebook / WhatsApp / Affiches';
      case 'carburant':
        return 'Carburant & Transport Visites Terrain';
      case 'juridique':
        return 'Frais Juridiques & Conservation Foncière';
      case 'salaires':
        return 'Commissions Négociateurs & Salaires';
      case 'bureau':
        return 'Loyer Bureau, Électricité & Internet';
      default:
        return 'Divers Frais';
    }
  };

  const headers = [
    'Date de Paiement',
    'Libellé / Intitulé de la Dépense',
    'Catégorie Comptable',
    'Montant Décaissé (FCFA)',
    'Mode de Règlement',
    'N° Reçu / Pièce Justificative'
  ];

  const rows: (string | number)[][] = expenses.map((e) => [
    e.date ? formatDate(e.date) : '',
    e.title || '',
    getCategoryLabel(e.category),
    e.amount || 0,
    e.paymentMethod || '',
    e.receiptNumber || 'Non renseigné'
  ]);

  const totalAmount = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  rows.push([
    'TOTAL DÉPENSES DÉCAISSÉES',
    `${expenses.length} enregistrements`,
    '',
    totalAmount,
    '',
    ''
  ]);

  exportToCSV(filename, headers, rows);
};

export interface GrandLivreEntry {
  date: string;
  pieceRef: string;
  operationType: string;
  tiers: string;
  designation: string;
  debit: number;   // Décaissements / Sorties
  credit: number;  // Encaissements / Entrées
  solde: number;   // Solde progressif
  modeReglement: string;
  agent: string;
}

/**
 * Export Grand Livre Comptable unifié de l'agence (tous flux de trésorerie avec débit/crédit et solde)
 */
export const exportGrandLivreComptableCSV = (
  receipts: RentReceipt[],
  sales: SaleReceipt[],
  payouts: OwnerPayout[],
  expenses: AgencyExpense[],
  filename = 'grand_livre_comptable_agence_mali'
) => {
  interface RawMovement {
    rawDate: number;
    dateFormatted: string;
    pieceRef: string;
    operationType: string;
    tiers: string;
    designation: string;
    debit: number;
    credit: number;
    modeReglement: string;
    agent: string;
  }

  const movements: RawMovement[] = [];

  // 1. Quittances de loyer (Entrées / Crédit)
  receipts.forEach((r) => {
    const d = r.paymentDate ? new Date(r.paymentDate) : new Date();
    movements.push({
      rawDate: d.getTime(),
      dateFormatted: formatDate(r.paymentDate),
      pieceRef: r.receiptNumber,
      operationType: 'Encaissement Loyer',
      tiers: r.tenantName,
      designation: `${r.propertyTitle} (${r.periodMonth})`,
      debit: 0,
      credit: r.amount || 0,
      modeReglement: r.paymentMethod,
      agent: r.issuedBy || 'Direction',
    });
  });

  // 2. Ventes de parcelles et biens (Entrées / Crédit)
  sales.forEach((s) => {
    const d = s.saleDate ? new Date(s.saleDate) : new Date();
    movements.push({
      rawDate: d.getTime(),
      dateFormatted: formatDate(s.saleDate),
      pieceRef: s.receiptNumber,
      operationType: `Vente Immobilière (${s.operationType === 'vente_totale' ? 'Comptant' : 'Acompte'})`,
      tiers: s.buyerName,
      designation: `${s.propertyTitle} (${s.neighborhood})`,
      debit: 0,
      credit: s.amountPaid || 0,
      modeReglement: s.paymentMethod,
      agent: s.issuedBy || 'Direction',
    });
  });

  // 3. Reversements aux propriétaires (Sorties / Débit)
  payouts.forEach((p) => {
    const d = p.payoutDate ? new Date(p.payoutDate) : new Date();
    movements.push({
      rawDate: d.getTime(),
      dateFormatted: formatDate(p.payoutDate),
      pieceRef: p.payoutNumber,
      operationType: 'Reversement Bailleur (Net Loyer)',
      tiers: p.ownerName,
      designation: `Mois: ${p.periodMonth} (Comm. retenue: ${p.agencyCommissionAmount} FCFA)`,
      debit: p.netPaidToOwner || 0,
      credit: 0,
      modeReglement: p.paymentMethod,
      agent: 'Comptabilité Agence',
    });
  });

  // 4. Dépenses d'exploitation agence (Sorties / Débit)
  expenses.forEach((e) => {
    const d = e.date ? new Date(e.date) : new Date();
    movements.push({
      rawDate: d.getTime(),
      dateFormatted: formatDate(e.date),
      pieceRef: e.receiptNumber || 'DEP-EXP',
      operationType: `Charge: ${e.category.toUpperCase()}`,
      tiers: 'Fournisseur / Prestataire',
      designation: e.title,
      debit: e.amount || 0,
      credit: 0,
      modeReglement: e.paymentMethod,
      agent: 'Agence',
    });
  });

  // Trier par date chronologique
  movements.sort((a, b) => a.rawDate - b.rawDate);

  // Calcul du solde progressif
  let soldeProgressif = 0;
  const rows: (string | number)[][] = movements.map((m) => {
    soldeProgressif += (m.credit - m.debit);
    return [
      m.dateFormatted,
      m.pieceRef,
      m.operationType,
      m.tiers,
      m.designation,
      m.debit,
      m.credit,
      soldeProgressif,
      m.modeReglement,
      m.agent,
    ];
  });

  // Ligne de total
  const totalDebit = movements.reduce((acc, m) => acc + m.debit, 0);
  const totalCredit = movements.reduce((acc, m) => acc + m.credit, 0);
  rows.push([
    'TOTAL CUMULÉ DU GRAND LIVRE',
    `${movements.length} écritures`,
    '',
    '',
    '',
    totalDebit,
    totalCredit,
    soldeProgressif,
    '',
    ''
  ]);

  const headers = [
    'Date Écriture',
    'N° Pièce / Réf Quittance',
    'Type d\'Opération',
    'Tiers (Locataire/Acheteur/Bailleur)',
    'Désignation / Bien',
    'Débit (Décaissements FCFA)',
    'Crédit (Encaissements FCFA)',
    'Solde Trésorerie Cumulatif (FCFA)',
    'Mode de Règlement',
    'Agent Comptable'
  ];

  exportToCSV(filename, headers, rows);
};

/**
 * Export État Récapitulatif des Impayés & Retards Locatifs pour mise en demeure
 */
export const exportImpayesLocatifsCSV = (
  tenants: Tenant[],
  filename = 'etat_nominatif_impayes_et_retards_locatifs'
) => {
  const currentMonthDate = new Date();
  const currentMonthName = currentMonthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // Filter tenants who are in delay or have pending balance
  const overdueTenants = tenants.filter((t) => {
    const isExplicitRetard = t.status === 'retard' || t.status === 'partiel';
    const hasPendingBalance = (t.pendingBalance || 0) > 0;
    const isNotPaidThisMonth = t.lastPaymentMonth && !t.lastPaymentMonth.toLowerCase().includes(currentMonthName.toLowerCase());
    return isExplicitRetard || hasPendingBalance || isNotPaidThisMonth;
  });

  const headers = [
    'Nom du Locataire',
    'Téléphone Principal',
    'Email',
    'N° Pièce / NINA',
    'Logement Loué',
    'Porte / N° Unité',
    'Loyer Mensuel (FCFA)',
    'Dernier Mois Payé',
    'Reliquat Partiel Restant Dû (FCFA)',
    'Estimation Dette Totale (FCFA)',
    'Jour Échéance Prévu au Bail',
    'Statut Bail',
    'Contact d\'Urgence / Caution'
  ];

  const rows: (string | number)[][] = overdueTenants.map((t) => {
    const monthlyRent = t.monthlyRent || 0;
    const pending = t.pendingBalance || 0;
    const totalDue = pending > 0 ? pending : monthlyRent;

    return [
      t.name,
      t.phone,
      t.email || '',
      t.ninaNumber || 'Non renseigné',
      t.propertyTitle,
      t.unitNumber || 'Principal',
      monthlyRent,
      t.lastPaymentMonth || 'Aucun versement récent',
      pending,
      totalDue,
      `Le ${t.rentPaymentDay || 5} du mois`,
      t.status === 'retard' ? 'En Retard' : t.status === 'partiel' ? 'Paiement Partiel' : 'Échéance Non Réglée',
      t.emergencyContact || 'Non renseigné'
    ];
  });

  const totalDette = rows.reduce((acc, r) => acc + (Number(r[9]) || 0), 0);
  rows.push([
    'TOTAL DES CRÉANCES DUES',
    `${overdueTenants.length} locataires en défaut`,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    totalDette,
    '',
    '',
    ''
  ]);

  exportToCSV(filename, headers, rows);
};

