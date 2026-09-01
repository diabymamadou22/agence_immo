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
  Unsubscribe,
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
  AgencyConfig 
} from '../types';

export const COLLECTIONS = {
  PROPERTIES: 'properties',
  LEADS: 'leads',
  TENANTS: 'tenants',
  RECEIPTS: 'receipts',
  OWNERS: 'owners',
  PAYOUTS: 'payouts',
  CONTRACTS: 'contracts',
  EXPENSES: 'expenses',
  AGENCY_CONFIG: 'agency_config',
  LOTISSEMENTS: 'lotissements',
};

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
      await setDoc(doc(db, COLLECTIONS.PROPERTIES, property.id), property, { merge: true });
    } catch (e) {
      console.warn('Firestore saveProperty fallback:', e);
    }
  },

  async deleteProperty(propertyId: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.PROPERTIES, propertyId));
      console.info(`Firestore: Property ${propertyId} deleted.`);
    } catch (e) {
      console.warn('Firestore deleteProperty fallback:', e);
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
      await setDoc(doc(db, COLLECTIONS.LEADS, lead.id), lead, { merge: true });
    } catch (e) {
      console.warn('Firestore saveLead fallback:', e);
    }
  },

  async updateLeadStatus(leadId: string, status: string, notes?: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await updateDoc(doc(db, COLLECTIONS.LEADS, leadId), { status, ...(notes ? { notes } : {}) });
    } catch (e) {
      console.warn('Firestore updateLeadStatus fallback:', e);
    }
  },

  async deleteLead(leadId: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.LEADS, leadId));
      console.info(`Firestore: Lead ${leadId} deleted.`);
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
      await setDoc(doc(db, COLLECTIONS.TENANTS, tenant.id), tenant, { merge: true });
    } catch (e) {
      console.warn('Firestore saveTenant fallback:', e);
    }
  },

  async deleteTenant(tenantId: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.TENANTS, tenantId));
      console.info(`Firestore: Tenant ${tenantId} deleted.`);
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
      await setDoc(doc(db, COLLECTIONS.RECEIPTS, receipt.id), receipt, { merge: true });
    } catch (e) {
      console.warn('Firestore saveReceipt fallback:', e);
    }
  },

  async deleteReceipt(receiptId: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.RECEIPTS, receiptId));
      console.info(`Firestore: Receipt ${receiptId} deleted.`);
    } catch (e) {
      console.warn('Firestore deleteReceipt fallback:', e);
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
      await setDoc(doc(db, COLLECTIONS.OWNERS, owner.id), owner, { merge: true });
    } catch (e) {
      console.warn('Firestore saveOwner fallback:', e);
    }
  },

  async deleteOwner(ownerId: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.OWNERS, ownerId));
      console.info(`Firestore: Owner ${ownerId} deleted.`);
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
      await setDoc(doc(db, COLLECTIONS.PAYOUTS, payout.id), payout, { merge: true });
    } catch (e) {
      console.warn('Firestore savePayout fallback:', e);
    }
  },

  async deletePayout(payoutId: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.PAYOUTS, payoutId));
      console.info(`Firestore: Payout ${payoutId} deleted.`);
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
      await setDoc(doc(db, COLLECTIONS.CONTRACTS, contract.id), contract, { merge: true });
    } catch (e) {
      console.warn('Firestore saveContract fallback:', e);
    }
  },

  async deleteContract(contractId: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.CONTRACTS, contractId));
      console.info(`Firestore: Contract ${contractId} deleted.`);
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
      await setDoc(doc(db, COLLECTIONS.EXPENSES, expense.id), expense, { merge: true });
    } catch (e) {
      console.warn('Firestore saveExpense fallback:', e);
    }
  },

  async deleteExpense(expenseId: string): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.EXPENSES, expenseId));
      console.info(`Firestore: Expense ${expenseId} deleted.`);
    } catch (e) {
      console.warn('Firestore deleteExpense fallback:', e);
    }
  },

  // ================= REAL-TIME LISTENERS =================
  // Real-time listener for properties
  subscribeProperties(onUpdate: (props: Property[]) => void): () => void {
    if (!db || !isConfigured) return () => {};
    try {
      const q = query(collection(db, COLLECTIONS.PROPERTIES), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data() as Property);
        onUpdate(list);
      });
      return unsub;
    } catch (e) {
      console.warn('Firestore subscribeProperties error:', e);
      return () => {};
    }
  },

  // Real-time listener for leads
  subscribeLeads(onUpdate: (leads: Lead[]) => void): () => void {
    if (!db || !isConfigured) return () => {};
    try {
      const q = query(collection(db, COLLECTIONS.LEADS), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data() as Lead);
        onUpdate(list);
      });
      return unsub;
    } catch (e) {
      console.warn('Firestore subscribeLeads error:', e);
      return () => {};
    }
  },

  // Real-time listener for tenants
  subscribeTenants(onUpdate: (tenants: Tenant[]) => void): () => void {
    if (!db || !isConfigured) return () => {};
    try {
      const q = query(collection(db, COLLECTIONS.TENANTS), orderBy('name', 'asc'));
      const unsub = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data() as Tenant);
        onUpdate(list);
      });
      return unsub;
    } catch (e) {
      console.warn('Firestore subscribeTenants error:', e);
      return () => {};
    }
  },

  // Real-time listener for receipts
  subscribeReceipts(onUpdate: (receipts: RentReceipt[]) => void): () => void {
    if (!db || !isConfigured) return () => {};
    try {
      const q = query(collection(db, COLLECTIONS.RECEIPTS), orderBy('paymentDate', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data() as RentReceipt);
        onUpdate(list);
      });
      return unsub;
    } catch (e) {
      console.warn('Firestore subscribeReceipts error:', e);
      return () => {};
    }
  },
};
