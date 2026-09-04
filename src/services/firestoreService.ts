import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import { 
  Property, 
  Lead, 
  Tenant, 
  RentReceipt, 
  Owner, 
  OwnerPayout, 
  LegalContract, 
  AgencyExpense, 
  AgencyConfig,
  SaleReceipt,
  TerrainInspectionRecord,
  AgencyUser
} from '../types';

export const COLLECTIONS = {
  PROPERTIES: 'properties',
  LEADS: 'leads',
  TENANTS: 'tenants',
  RECEIPTS: 'receipts',
  SALES: 'sales',
  OWNERS: 'owners',
  PAYOUTS: 'payouts',
  CONTRACTS: 'contracts',
  EXPENSES: 'expenses',
  AGENCY_CONFIG: 'agency_config',
  LOTISSEMENTS: 'lotissements',
  INSPECTIONS: 'inspections',
  USERS: 'agency_users',
};

/**
 * Strips undefined values recursively so Firestore never rejects the write with:
 * "Unsupported field value: undefined"
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as any;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean as T;
}

export const firestoreService = {
  // Check if live firestore is connected
  isLive: () => Boolean(isConfigured && db),

  // ================= PROPERTIES & PARCELLES =================
  async fetchProperties(): Promise<Property[]> {
    if (!db || !isConfigured) return [];
    try {
      const q = query(collection(db, COLLECTIONS.PROPERTIES), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Property);
    } catch (e) {
      console.warn('Firestore fetchProperties fallback:', e);
      return [];
    }
  },

  async saveProperty(property: Property): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      const clean = sanitizeForFirestore(property);
      await setDoc(doc(db, COLLECTIONS.PROPERTIES, clean.id), clean, { merge: true });
    } catch (e) {
      console.error('Firestore saveProperty error:', e);
    }
  },

  async deleteProperty(propertyId: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.PROPERTIES, propertyId));
    } catch (e) {
      console.warn('Firestore deleteProperty fallback:', e);
    }
  },

  async updatePropertyStatus(propertyId: string, status: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await updateDoc(doc(db, COLLECTIONS.PROPERTIES, propertyId), { status });
    } catch (e) {
      console.warn('Firestore updatePropertyStatus fallback:', e);
    }
  },

  // ================= LEADS & VISITS =================
  async fetchLeads(): Promise<Lead[]> {
    if (!db || !isConfigured) return [];
    try {
      const q = query(collection(db, COLLECTIONS.LEADS), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Lead);
    } catch (e) {
      console.warn('Firestore fetchLeads fallback:', e);
      return [];
    }
  },

  async saveLead(lead: Lead): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      const clean = sanitizeForFirestore(lead);
      await setDoc(doc(db, COLLECTIONS.LEADS, clean.id), clean, { merge: true });
    } catch (e) {
      console.error('Firestore saveLead error:', e);
    }
  },

  async updateLeadStatus(leadId: string, status: string, notes?: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      const updateData: any = { status };
      if (notes !== undefined && notes !== null) {
        updateData.notes = notes;
      }
      await updateDoc(doc(db, COLLECTIONS.LEADS, leadId), updateData);
    } catch (e) {
      console.warn('Firestore updateLeadStatus fallback:', e);
    }
  },

  async deleteLead(leadId: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.LEADS, leadId));
    } catch (e) {
      console.warn('Firestore deleteLead fallback:', e);
    }
  },

  // ================= TENANTS & RECEIPTS =================
  async fetchTenants(): Promise<Tenant[]> {
    if (!db || !isConfigured) return [];
    try {
      const q = query(collection(db, COLLECTIONS.TENANTS), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Tenant);
    } catch (e) {
      console.warn('Firestore fetchTenants fallback:', e);
      return [];
    }
  },

  async saveTenant(tenant: Tenant): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      const clean = sanitizeForFirestore(tenant);
      await setDoc(doc(db, COLLECTIONS.TENANTS, clean.id), clean, { merge: true });
    } catch (e) {
      console.error('Firestore saveTenant error:', e);
    }
  },

  async deleteTenant(tenantId: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.TENANTS, tenantId));
    } catch (e) {
      console.warn('Firestore deleteTenant fallback:', e);
    }
  },

  async fetchReceipts(): Promise<RentReceipt[]> {
    if (!db || !isConfigured) return [];
    try {
      const q = query(collection(db, COLLECTIONS.RECEIPTS), orderBy('paymentDate', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as RentReceipt);
    } catch (e) {
      console.warn('Firestore fetchReceipts fallback:', e);
      return [];
    }
  },

  async saveReceipt(receipt: RentReceipt): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      const clean = sanitizeForFirestore(receipt);
      await setDoc(doc(db, COLLECTIONS.RECEIPTS, clean.id), clean, { merge: true });
    } catch (e) {
      console.error('Firestore saveReceipt error:', e);
    }
  },

  async deleteReceipt(receiptId: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.RECEIPTS, receiptId));
    } catch (e) {
      console.warn('Firestore deleteReceipt fallback:', e);
    }
  },

  // ================= SALES & SALE RECEIPTS =================
  async fetchSaleReceipts(): Promise<SaleReceipt[]> {
    if (!db || !isConfigured) return [];
    try {
      const q = query(collection(db, COLLECTIONS.SALES), orderBy('saleDate', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as SaleReceipt);
    } catch (e) {
      console.warn('Firestore fetchSaleReceipts fallback:', e);
      return [];
    }
  },

  async saveSaleReceipt(sale: SaleReceipt): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      const clean = sanitizeForFirestore(sale);
      await setDoc(doc(db, COLLECTIONS.SALES, clean.id), clean, { merge: true });
    } catch (e) {
      console.error('Firestore saveSaleReceipt error:', e);
    }
  },

  async deleteSaleReceipt(saleId: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.SALES, saleId));
    } catch (e) {
      console.warn('Firestore deleteSaleReceipt fallback:', e);
    }
  },

  subscribeSaleReceipts(onUpdate: (sales: SaleReceipt[]) => void): () => void {
    if (!db || !isConfigured) return () => {};
    try {
      const q = query(collection(db, COLLECTIONS.SALES), orderBy('saleDate', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        const sales = snapshot.docs.map(doc => doc.data() as SaleReceipt);
        onUpdate(sales);
      }, (err) => console.warn('Sales subscription error:', err));
      return unsub;
    } catch (e) {
      console.warn('Firestore subscribeSaleReceipts error:', e);
      return () => {};
    }
  },

  // ================= OWNERS & PAYOUTS =================
  async fetchOwners(): Promise<Owner[]> {
    if (!db || !isConfigured) return [];
    try {
      const q = query(collection(db, COLLECTIONS.OWNERS), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Owner);
    } catch (e) {
      console.warn('Firestore fetchOwners fallback:', e);
      return [];
    }
  },

  async saveOwner(owner: Owner): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      const clean = sanitizeForFirestore(owner);
      await setDoc(doc(db, COLLECTIONS.OWNERS, clean.id), clean, { merge: true });
    } catch (e) {
      console.error('Firestore saveOwner error:', e);
    }
  },

  async deleteOwner(ownerId: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.OWNERS, ownerId));
    } catch (e) {
      console.warn('Firestore deleteOwner fallback:', e);
    }
  },

  async fetchPayouts(): Promise<OwnerPayout[]> {
    if (!db || !isConfigured) return [];
    try {
      const q = query(collection(db, COLLECTIONS.PAYOUTS), orderBy('payoutDate', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as OwnerPayout);
    } catch (e) {
      console.warn('Firestore fetchPayouts fallback:', e);
      return [];
    }
  },

  async savePayout(payout: OwnerPayout): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      const clean = sanitizeForFirestore(payout);
      await setDoc(doc(db, COLLECTIONS.PAYOUTS, clean.id), clean, { merge: true });
    } catch (e) {
      console.error('Firestore savePayout error:', e);
    }
  },

  async deletePayout(payoutId: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.PAYOUTS, payoutId));
    } catch (e) {
      console.warn('Firestore deletePayout fallback:', e);
    }
  },

  // ================= CONTRACTS =================
  async fetchContracts(): Promise<LegalContract[]> {
    if (!db || !isConfigured) return [];
    try {
      const q = query(collection(db, COLLECTIONS.CONTRACTS), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as LegalContract);
    } catch (e) {
      console.warn('Firestore fetchContracts fallback:', e);
      return [];
    }
  },

  async saveContract(contract: LegalContract): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      const clean = sanitizeForFirestore(contract);
      await setDoc(doc(db, COLLECTIONS.CONTRACTS, clean.id), clean, { merge: true });
    } catch (e) {
      console.error('Firestore saveContract error:', e);
    }
  },

  async deleteContract(contractId: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.CONTRACTS, contractId));
    } catch (e) {
      console.warn('Firestore deleteContract fallback:', e);
    }
  },

  // ================= EXPENSES =================
  async fetchExpenses(): Promise<AgencyExpense[]> {
    if (!db || !isConfigured) return [];
    try {
      const q = query(collection(db, COLLECTIONS.EXPENSES), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as AgencyExpense);
    } catch (e) {
      console.warn('Firestore fetchExpenses fallback:', e);
      return [];
    }
  },

  async saveExpense(expense: AgencyExpense): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      const clean = sanitizeForFirestore(expense);
      await setDoc(doc(db, COLLECTIONS.EXPENSES, clean.id), clean, { merge: true });
    } catch (e) {
      console.error('Firestore saveExpense error:', e);
    }
  },

  async deleteExpense(expenseId: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.EXPENSES, expenseId));
    } catch (e) {
      console.warn('Firestore deleteExpense fallback:', e);
    }
  },

  // ================= TERRAIN INSPECTIONS =================
  async fetchInspections(): Promise<TerrainInspectionRecord[]> {
    if (!db || !isConfigured) return [];
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.INSPECTIONS));
      const list = snap.docs.map(doc => doc.data() as TerrainInspectionRecord);
      list.sort((a, b) => (b.inspectionDate || '').localeCompare(a.inspectionDate || ''));
      return list;
    } catch (e) {
      console.warn('Firestore fetchInspections fallback:', e);
      return [];
    }
  },

  async saveInspection(inspection: TerrainInspectionRecord): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      const clean = sanitizeForFirestore(inspection);
      await setDoc(doc(db, COLLECTIONS.INSPECTIONS, clean.id), clean, { merge: true });
    } catch (e) {
      console.error('Firestore saveInspection error:', e);
    }
  },

  async deleteInspection(inspectionId: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.INSPECTIONS, inspectionId));
    } catch (e) {
      console.warn('Firestore deleteInspection fallback:', e);
    }
  },

  // ================= AGENCY CONFIG =================
  async fetchAgencyConfig(): Promise<AgencyConfig | null> {
    if (!db || !isConfigured) return null;
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.AGENCY_CONFIG));
      if (!snap.empty) {
        return snap.docs[0].data() as AgencyConfig;
      }
      return null;
    } catch (e) {
      console.warn('Firestore fetchAgencyConfig fallback:', e);
      return null;
    }
  },

  async saveAgencyConfig(config: AgencyConfig): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      const clean = sanitizeForFirestore(config);
      await setDoc(doc(db, COLLECTIONS.AGENCY_CONFIG, 'main_config'), clean, { merge: true });
    } catch (e) {
      console.error('Firestore saveAgencyConfig error:', e);
    }
  },

  // ================= USERS & COLLABORATORS (RBAC) =================
  async fetchUsers(): Promise<AgencyUser[]> {
    if (!db || !isConfigured) return [];
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.USERS));
      const list = snap.docs.map(doc => doc.data() as AgencyUser);
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      return list;
    } catch (e) {
      console.warn('Firestore fetchUsers fallback:', e);
      return [];
    }
  },

  async saveUser(user: AgencyUser): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      const clean = sanitizeForFirestore(user);
      await setDoc(doc(db, COLLECTIONS.USERS, clean.id), clean, { merge: true });
    } catch (e) {
      console.error('Firestore saveUser error:', e);
    }
  },

  async deleteUser(userId: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
    } catch (e) {
      console.warn('Firestore deleteUser fallback:', e);
    }
  },

  // ================= REAL-TIME LISTENERS =================
  subscribeProperties(onUpdate: (props: Property[]) => void): () => void {
    if (!db || !isConfigured) return () => {};
    try {
      const q = collection(db, COLLECTIONS.PROPERTIES);
      const unsub = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data() as Property);
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        onUpdate(list);
      }, (err) => console.warn('Properties subscription error:', err));
      return unsub;
    } catch (e) {
      console.warn('Firestore subscribeProperties error:', e);
      return () => {};
    }
  },

  subscribeLeads(onUpdate: (leads: Lead[]) => void): () => void {
    if (!db || !isConfigured) return () => {};
    try {
      const q = collection(db, COLLECTIONS.LEADS);
      const unsub = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data() as Lead);
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        onUpdate(list);
      }, (err) => console.warn('Leads subscription error:', err));
      return unsub;
    } catch (e) {
      console.warn('Firestore subscribeLeads error:', e);
      return () => {};
    }
  },

  subscribeTenants(onUpdate: (tenants: Tenant[]) => void): () => void {
    if (!db || !isConfigured) return () => {};
    try {
      const q = collection(db, COLLECTIONS.TENANTS);
      const unsub = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data() as Tenant);
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        onUpdate(list);
      }, (err) => console.warn('Tenants subscription error:', err));
      return unsub;
    } catch (e) {
      console.warn('Firestore subscribeTenants error:', e);
      return () => {};
    }
  },

  subscribeReceipts(onUpdate: (receipts: RentReceipt[]) => void): () => void {
    if (!db || !isConfigured) return () => {};
    try {
      const q = collection(db, COLLECTIONS.RECEIPTS);
      const unsub = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data() as RentReceipt);
        list.sort((a, b) => (b.paymentDate || '').localeCompare(a.paymentDate || ''));
        onUpdate(list);
      }, (err) => console.warn('Receipts subscription error:', err));
      return unsub;
    } catch (e) {
      console.warn('Firestore subscribeReceipts error:', e);
      return () => {};
    }
  },

  subscribeOwners(onUpdate: (owners: Owner[]) => void): () => void {
    if (!db || !isConfigured) return () => {};
    try {
      const q = collection(db, COLLECTIONS.OWNERS);
      const unsub = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data() as Owner);
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        onUpdate(list);
      }, (err) => console.warn('Owners subscription error:', err));
      return unsub;
    } catch (e) {
      console.warn('Firestore subscribeOwners error:', e);
      return () => {};
    }
  },

  subscribePayouts(onUpdate: (payouts: OwnerPayout[]) => void): () => void {
    if (!db || !isConfigured) return () => {};
    try {
      const q = collection(db, COLLECTIONS.PAYOUTS);
      const unsub = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data() as OwnerPayout);
        list.sort((a, b) => (b.payoutDate || '').localeCompare(a.payoutDate || ''));
        onUpdate(list);
      }, (err) => console.warn('Payouts subscription error:', err));
      return unsub;
    } catch (e) {
      console.warn('Firestore subscribePayouts error:', e);
      return () => {};
    }
  },

  subscribeContracts(onUpdate: (contracts: LegalContract[]) => void): () => void {
    if (!db || !isConfigured) return () => {};
    try {
      const q = collection(db, COLLECTIONS.CONTRACTS);
      const unsub = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data() as LegalContract);
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        onUpdate(list);
      }, (err) => console.warn('Contracts subscription error:', err));
      return unsub;
    } catch (e) {
      console.warn('Firestore subscribeContracts error:', e);
      return () => {};
    }
  },

  subscribeExpenses(onUpdate: (expenses: AgencyExpense[]) => void): () => void {
    if (!db || !isConfigured) return () => {};
    try {
      const q = collection(db, COLLECTIONS.EXPENSES);
      const unsub = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data() as AgencyExpense);
        list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        onUpdate(list);
      }, (err) => console.warn('Expenses subscription error:', err));
      return unsub;
    } catch (e) {
      console.warn('Firestore subscribeExpenses error:', e);
      return () => {};
    }
  },

  subscribeAgencyConfig(onUpdate: (config: AgencyConfig) => void): () => void {
    if (!db || !isConfigured) return () => {};
    try {
      const unsub = onSnapshot(doc(db, COLLECTIONS.AGENCY_CONFIG, 'main_config'), (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as AgencyConfig);
        }
      }, (err) => console.warn('Agency config subscription error:', err));
      return unsub;
    } catch (e) {
      console.warn('Firestore subscribeAgencyConfig error:', e);
      return () => {};
    }
  },

  subscribeUsers(onUpdate: (users: AgencyUser[]) => void): () => void {
    if (!db || !isConfigured) return () => {};
    try {
      const q = collection(db, COLLECTIONS.USERS);
      const unsub = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data() as AgencyUser);
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        onUpdate(list);
      }, (err) => console.warn('Users subscription error:', err));
      return unsub;
    } catch (e) {
      console.warn('Firestore subscribeUsers error:', e);
      return () => {};
    }
  },

  // ================= AUTO-SEED INITIAL DATA IF CLOUD IS EMPTY =================
  async ensureInitialDataSeeded(fallbackData: {
    properties: Property[];
    tenants: Tenant[];
    receipts: RentReceipt[];
    sales: SaleReceipt[];
    owners: Owner[];
    payouts: OwnerPayout[];
    contracts: LegalContract[];
    expenses: AgencyExpense[];
    leads: Lead[];
    agencyConfig?: AgencyConfig;
    users?: AgencyUser[];
  }): Promise<boolean> {
    if (!db || !isConfigured) return false;
    try {
      const q = collection(db, COLLECTIONS.PROPERTIES);
      const snap = await getDocs(q);
      if (snap.empty) {
        console.info('Base Firestore cloud database is empty. Auto-seeding initial master catalog...');
        await this.pushAllLocalDataToCloud(fallbackData);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Auto-seed check note:', e);
      return false;
    }
  },

  // ================= PUSH ALL LOCAL DATA TO CLOUD =================
  async pushAllLocalDataToCloud(data: {
    properties: Property[];
    tenants: Tenant[];
    receipts: RentReceipt[];
    sales?: SaleReceipt[];
    owners: Owner[];
    payouts: OwnerPayout[];
    contracts: LegalContract[];
    expenses: AgencyExpense[];
    leads: Lead[];
    agencyConfig?: AgencyConfig;
    users?: AgencyUser[];
  }): Promise<{ success: boolean; count: number; message: string }> {
    if (!db || !isConfigured) {
      return { success: false, count: 0, message: 'Firebase non configuré.' };
    }

    try {
      let totalPushed = 0;

      // 1. Properties
      for (const prop of data.properties) {
        await setDoc(doc(db, COLLECTIONS.PROPERTIES, prop.id), sanitizeForFirestore(prop), { merge: true });
        totalPushed++;
      }

      // 2. Tenants
      for (const tenant of data.tenants) {
        await setDoc(doc(db, COLLECTIONS.TENANTS, tenant.id), sanitizeForFirestore(tenant), { merge: true });
        totalPushed++;
      }

      // 3. Rent Receipts
      for (const receipt of data.receipts) {
        await setDoc(doc(db, COLLECTIONS.RECEIPTS, receipt.id), sanitizeForFirestore(receipt), { merge: true });
        totalPushed++;
      }

      // 4. Sales Receipts
      if (data.sales && Array.isArray(data.sales)) {
        for (const sale of data.sales) {
          await setDoc(doc(db, COLLECTIONS.SALES, sale.id), sanitizeForFirestore(sale), { merge: true });
          totalPushed++;
        }
      }

      // 5. Owners
      for (const owner of data.owners) {
        await setDoc(doc(db, COLLECTIONS.OWNERS, owner.id), sanitizeForFirestore(owner), { merge: true });
        totalPushed++;
      }

      // 6. Payouts
      for (const payout of data.payouts) {
        await setDoc(doc(db, COLLECTIONS.PAYOUTS, payout.id), sanitizeForFirestore(payout), { merge: true });
        totalPushed++;
      }

      // 7. Contracts
      for (const contract of data.contracts) {
        await setDoc(doc(db, COLLECTIONS.CONTRACTS, contract.id), sanitizeForFirestore(contract), { merge: true });
        totalPushed++;
      }

      // 8. Expenses
      for (const exp of data.expenses) {
        await setDoc(doc(db, COLLECTIONS.EXPENSES, exp.id), sanitizeForFirestore(exp), { merge: true });
        totalPushed++;
      }

      // 9. Leads
      for (const lead of data.leads) {
        await setDoc(doc(db, COLLECTIONS.LEADS, lead.id), sanitizeForFirestore(lead), { merge: true });
        totalPushed++;
      }

      // 10. Agency Config
      if (data.agencyConfig) {
        await setDoc(doc(db, COLLECTIONS.AGENCY_CONFIG, 'main_config'), sanitizeForFirestore(data.agencyConfig), { merge: true });
        totalPushed++;
      }

      // 11. Collaborators / Users (RBAC)
      if (data.users && Array.isArray(data.users)) {
        for (const user of data.users) {
          await setDoc(doc(db, COLLECTIONS.USERS, user.id), sanitizeForFirestore(user), { merge: true });
          totalPushed++;
        }
      }

      return {
        success: true,
        count: totalPushed,
        message: `${totalPushed} enregistrements ont été synchronisés et enregistrés avec succès sur le Cloud Firestore !`,
      };
    } catch (e: any) {
      console.error('Push all data error:', e);
      return {
        success: false,
        count: 0,
        message: e?.message || 'Erreur lors de la synchronisation vers Firestore.',
      };
    }
  },
};
