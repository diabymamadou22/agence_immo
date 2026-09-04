import { AgencyUser, AgencyUserRole } from '../types';
import { AdminTab } from '../store/uiSlice';

export interface RoleDefinition {
  role: AgencyUserRole;
  label: string;
  shortLabel: string;
  badgeClass: string;
  borderClass: string;
  description: string;
  allowedTabs: AdminTab[];
  canViewGlobalMargins: boolean;
  canViewFinancialStatements: boolean;
  canManageExpenses: boolean;
  canManageTeam: boolean;
  canManageAgencySettings: boolean;
  canManageBackups: boolean;
  canManageProperties: boolean;
  canManageLeadsAndVisits: boolean;
  canManageContracts: boolean;
  canIssueSalesReceipts: boolean;
  canManageRentals: boolean;
}

export const ROLES_CONFIG: Record<AgencyUserRole, RoleDefinition> = {
  directeur: {
    role: 'directeur',
    label: "Directeur d'Agence (Superviseur Global)",
    shortLabel: 'Directeur',
    badgeClass: 'bg-amber-500 text-slate-950 font-black',
    borderClass: 'border-amber-500',
    description: "Accès intégral sans restriction : bilans financiers, marges globales nettes, gestion de l'équipe RBAC, sauvegardes et configuration SaaS.",
    allowedTabs: [
      'overview',
      'parcelles',
      'properties',
      'sales_receipts',
      'locations',
      'owners',
      'contracts',
      'leads',
      'financials',
      'simulateur',
      'team',
      'agency_settings',
      'backups',
    ],
    canViewGlobalMargins: true,
    canViewFinancialStatements: true,
    canManageExpenses: true,
    canManageTeam: true,
    canManageAgencySettings: true,
    canManageBackups: true,
    canManageProperties: true,
    canManageLeadsAndVisits: true,
    canManageContracts: true,
    canIssueSalesReceipts: true,
    canManageRentals: true,
  },
  comptable: {
    role: 'comptable',
    label: 'Comptable & Trésorier',
    shortLabel: 'Comptable',
    badgeClass: 'bg-emerald-600 text-white font-bold',
    borderClass: 'border-emerald-500',
    description: "Gestion de la trésorerie, des quittances de loyer, reversements bailleurs, saisie des dépenses, grand livre comptable et bilans financiers.",
    allowedTabs: [
      'overview',
      'sales_receipts',
      'locations',
      'owners',
      'contracts',
      'financials',
      'simulateur',
    ],
    canViewGlobalMargins: true,
    canViewFinancialStatements: true,
    canManageExpenses: true,
    canManageTeam: false,
    canManageAgencySettings: false,
    canManageBackups: false,
    canManageProperties: false,
    canManageLeadsAndVisits: false,
    canManageContracts: true,
    canIssueSalesReceipts: true,
    canManageRentals: true,
  },
  commercial: {
    role: 'commercial',
    label: 'Agent Commercial Terrain & Négociateur',
    shortLabel: 'Commercial Terrain',
    badgeClass: 'bg-blue-600 text-white font-bold',
    borderClass: 'border-blue-500',
    description: "Gestion des visites terrain, fiches d'inspection, catalogue parcelles & villas, mandats et suivi des prospects. Marges et bilans financiers strictement masqués.",
    allowedTabs: [
      'overview',
      'parcelles',
      'properties',
      'leads',
      'contracts',
      'sales_receipts',
      'simulateur',
    ],
    canViewGlobalMargins: false, // STRICTEMENT MASQUÉ
    canViewFinancialStatements: false, // STRICTEMENT MASQUÉ
    canManageExpenses: false,
    canManageTeam: false,
    canManageAgencySettings: false,
    canManageBackups: false,
    canManageProperties: true,
    canManageLeadsAndVisits: true,
    canManageContracts: true,
    canIssueSalesReceipts: true,
    canManageRentals: false,
  },
  gestionnaire: {
    role: 'gestionnaire',
    label: 'Gestionnaire Locatif',
    shortLabel: 'Gestionnaire',
    badgeClass: 'bg-indigo-600 text-white font-bold',
    borderClass: 'border-indigo-500',
    description: "Gestion opérationnelle des locataires, états des lieux d'entrée/sortie, quittances et relances impayés. Marges globales agence masquées.",
    allowedTabs: [
      'overview',
      'locations',
      'owners',
      'contracts',
      'leads',
      'simulateur',
    ],
    canViewGlobalMargins: false,
    canViewFinancialStatements: false,
    canManageExpenses: false,
    canManageTeam: false,
    canManageAgencySettings: false,
    canManageBackups: false,
    canManageProperties: false,
    canManageLeadsAndVisits: true,
    canManageContracts: true,
    canIssueSalesReceipts: false,
    canManageRentals: true,
  },
};

export const INITIAL_COLLABORATORS: AgencyUser[] = [
  {
    id: 'user_dir_1',
    name: 'Mamadou Diaby',
    email: 'diabymamadou3344@gmail.com',
    phone: '+223 76 45 89 12',
    role: 'directeur',
    pinCode: '00223',
    title: 'Directeur Général & Fondateur',
    avatar: 'MD',
    status: 'actif',
    createdAt: '2024-01-01T08:00:00.000Z',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'user_cpt_2',
    name: 'Aïssata Touré',
    email: 'aissata.toure@maliimmoprestige.ml',
    phone: '+223 65 30 11 44',
    role: 'comptable',
    pinCode: '1234',
    title: 'Responsable Comptabilité & Trésorerie',
    avatar: 'AT',
    status: 'actif',
    createdAt: '2024-02-15T09:00:00.000Z',
  },
  {
    id: 'user_com_3',
    name: 'Oumar Sangaré',
    email: 'oumar.sangare@maliimmoprestige.ml',
    phone: '+223 79 12 34 56',
    role: 'commercial',
    pinCode: '5678',
    title: 'Agent Commercial & Négociateur Foncier',
    avatar: 'OS',
    status: 'actif',
    createdAt: '2024-03-01T10:00:00.000Z',
  },
  {
    id: 'user_ges_4',
    name: 'Fatoumata Keïta',
    email: 'fatou.keita@maliimmoprestige.ml',
    phone: '+223 71 88 99 00',
    role: 'gestionnaire',
    pinCode: '9900',
    title: 'Gestionnaire du Parc Locatif & Baux',
    avatar: 'FK',
    status: 'actif',
    createdAt: '2024-03-10T11:00:00.000Z',
  },
];

export function isTabAllowed(tab: AdminTab, role?: AgencyUserRole): boolean {
  if (!role) return true;
  const config = ROLES_CONFIG[role];
  if (!config) return true;
  return config.allowedTabs.includes(tab);
}

export function canViewMargins(role?: AgencyUserRole): boolean {
  if (!role) return true;
  return ROLES_CONFIG[role]?.canViewGlobalMargins ?? true;
}

export function canViewFinancials(role?: AgencyUserRole): boolean {
  if (!role) return true;
  return ROLES_CONFIG[role]?.canViewFinancialStatements ?? true;
}

export function canManageTeam(role?: AgencyUserRole): boolean {
  if (!role) return true;
  return ROLES_CONFIG[role]?.canManageTeam ?? false;
}
