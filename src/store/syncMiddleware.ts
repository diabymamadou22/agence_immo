import { Middleware } from '@reduxjs/toolkit';
import { firestoreService } from '../services/firestoreService';

const handleSyncErr = (e: any) => console.warn('Firestore sync notice:', e);

/**
 * Redux Middleware that automatically synchronizes any local mutations
 * directly to Cloud Firestore in real-time.
 * This guarantees that changes made on Device A (phone, tablet, PC)
 * instantly propagate to Device B through Firestore onSnapshot listeners.
 */
export const firestoreSyncMiddleware: Middleware = (storeAPI) => (next) => (action: any) => {
  const result = next(action);

  // If not connected to live Firestore, skip syncing
  if (!firestoreService.isLive()) {
    return result;
  }

  const type = action?.type;
  if (typeof type !== 'string') {
    return result;
  }

  try {
    // 1. PROPERTIES
    if (type === 'properties/addProperty' || type === 'properties/updateProperty') {
      const state = storeAPI.getState();
      const updatedItem = action.payload?.id 
        ? state.properties.items.find((p: any) => p.id === action.payload.id)
        : state.properties.items[0];
      if (updatedItem) {
        firestoreService.saveProperty(updatedItem).catch(handleSyncErr);
      }
    } else if (type === 'properties/deleteProperty') {
      const propertyId = action.payload;
      if (propertyId) {
        firestoreService.deleteProperty(propertyId).catch(handleSyncErr);
      }
    } else if (type === 'properties/updatePropertyStatus') {
      const state = storeAPI.getState();
      const item = state.properties.items.find((p: any) => p.id === action.payload?.id);
      if (item) {
        firestoreService.saveProperty(item).catch(handleSyncErr);
      }
    }

    // 2. TENANTS
    else if (type === 'tenants/addTenant' || type === 'tenants/updateTenant') {
      const state = storeAPI.getState();
      const updatedTenant = action.payload?.id 
        ? state.tenants.items.find((t: any) => t.id === action.payload.id)
        : state.tenants.items[0];
      if (updatedTenant) {
        firestoreService.saveTenant(updatedTenant).catch(handleSyncErr);
      }
    } else if (type === 'tenants/deleteTenant') {
      const tenantId = action.payload;
      if (tenantId) {
        firestoreService.deleteTenant(tenantId).catch(handleSyncErr);
      }
    } else if (type === 'tenants/recordRentPayment' || type === 'tenants/recordPaymentReceipt') {
      const state = storeAPI.getState();
      const receipt = state.tenants.receipts[0];
      if (receipt) {
        firestoreService.saveReceipt(receipt).catch(handleSyncErr);
      }
      const tenant = state.tenants.items.find((t: any) => t.id === action.payload?.tenantId);
      if (tenant) {
        firestoreService.saveTenant(tenant).catch(handleSyncErr);
      }
    } else if (type === 'tenants/deleteReceipt') {
      const receiptId = action.payload;
      if (receiptId) {
        firestoreService.deleteReceipt(receiptId).catch(handleSyncErr);
      }
    }

    // 2b. SALES & SALE RECEIPTS
    else if (type === 'sales/addSaleReceipt') {
      const state = storeAPI.getState();
      const sale = state.sales.items[0];
      if (sale) {
        firestoreService.saveSaleReceipt(sale).catch(handleSyncErr);
      }
    } else if (type === 'sales/updateSaleReceipt') {
      const state = storeAPI.getState();
      const sale = state.sales.items.find((s: any) => s.id === action.payload?.id) || action.payload;
      if (sale) {
        firestoreService.saveSaleReceipt(sale).catch(handleSyncErr);
      }
    } else if (type === 'sales/deleteSaleReceipt') {
      const saleId = action.payload;
      if (saleId) {
        firestoreService.deleteSaleReceipt(saleId).catch(handleSyncErr);
      }
    }

    // 3. LEADS
    else if (type === 'leads/addLead') {
      const state = storeAPI.getState();
      const lead = state.leads.items[0];
      if (lead) {
        firestoreService.saveLead(lead).catch(handleSyncErr);
      }
    } else if (type === 'leads/updateLeadStatus') {
      firestoreService.updateLeadStatus(action.payload?.id, action.payload?.status, action.payload?.notes).catch(handleSyncErr);
    } else if (type === 'leads/deleteLead') {
      firestoreService.deleteLead(action.payload).catch(handleSyncErr);
    }

    // 4. OWNERS
    else if (type === 'owners/addOwner' || type === 'owners/updateOwner') {
      const state = storeAPI.getState();
      const owner = action.payload?.id 
        ? state.owners.items.find((o: any) => o.id === action.payload.id)
        : state.owners.items[0];
      if (owner) {
        firestoreService.saveOwner(owner).catch(handleSyncErr);
      }
    } else if (type === 'owners/deleteOwner') {
      firestoreService.deleteOwner(action.payload).catch(handleSyncErr);
    } else if (type === 'owners/recordPayout') {
      const state = storeAPI.getState();
      const payout = state.owners.payouts[0];
      if (payout) {
        firestoreService.savePayout(payout).catch(handleSyncErr);
      }
    } else if (type === 'owners/deletePayout') {
      firestoreService.deletePayout(action.payload).catch(handleSyncErr);
    }

    // 5. CONTRACTS
    else if (type === 'contracts/addContract' || type === 'contracts/updateContract') {
      const state = storeAPI.getState();
      const contract = action.payload?.id 
        ? state.contracts.items.find((c: any) => c.id === action.payload.id)
        : state.contracts.items[0];
      if (contract) {
        firestoreService.saveContract(contract).catch(handleSyncErr);
      }
    } else if (type === 'contracts/deleteContract') {
      firestoreService.deleteContract(action.payload).catch(handleSyncErr);
    }

    // 6. FINANCIAL EXPENSES
    else if (type === 'financials/addExpense') {
      const state = storeAPI.getState();
      const exp = state.financials.expenses[0];
      if (exp) {
        firestoreService.saveExpense(exp).catch(handleSyncErr);
      }
    } else if (type === 'financials/deleteExpense') {
      firestoreService.deleteExpense(action.payload).catch(handleSyncErr);
    }

    // 7. AGENCY CONFIG
    else if (type === 'agency/updateAgencyConfig' || type === 'agency/setAgencyConfig') {
      const state = storeAPI.getState();
      if (state.agency.config) {
        firestoreService.saveAgencyConfig(state.agency.config).catch(handleSyncErr);
      }
    }
  } catch (err) {
    console.warn('Sync middleware error:', err);
  }

  return result;
};
