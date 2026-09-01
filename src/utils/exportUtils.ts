import { Property, Tenant, RentReceipt, AgencyConfig } from '../types';
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
