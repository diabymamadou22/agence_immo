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
import { Property, Lead, Tenant, RentReceipt } from '../types';

export const COLLECTIONS = {
  PROPERTIES: 'properties',
  LEADS: 'leads',
  TENANTS: 'tenants',
  RECEIPTS: 'receipts',
  LOTISSEMENTS: 'lotissements',
};

export const firestoreService = {
  // Check if live firestore is connected
  isLive: () => Boolean(isConfigured && db),

  // Properties
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
    } catch (e) {
      console.warn('Firestore deleteProperty fallback:', e);
    }
  },

  // Leads
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

  // Tenants & Receipts
  async saveTenant(tenant: Tenant): Promise<void> {
    if (!db || !isConfigured) return;
    try {
      await setDoc(doc(db, COLLECTIONS.TENANTS, tenant.id), tenant, { merge: true });
    } catch (e) {
      console.warn('Firestore saveTenant fallback:', e);
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
