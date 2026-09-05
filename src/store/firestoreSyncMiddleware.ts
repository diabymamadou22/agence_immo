import { Middleware } from '@reduxjs/toolkit';
import { firestoreService } from '../services/firestoreService';

/**
 * Redux Middleware that automatically synchronizes every state mutation 
 * (create, update, delete) to Cloud Firestore in real time.
 * This guarantees that multiple devices (phones, tablets, PCs) always share 
 * the exact same up-to-date data simultaneously.
 */
export const firestoreSyncMiddleware: Middleware = (storeApi) => (next) => (action: any) => {
  const result = next(action);
  const type = action?.type;
  if (!type || typeof type !== 'string') return result;

  // Ignore set* actions to prevent ping-pong loops when updating from onSnapshot listeners
  if (
    type.startsWith('properties/set') ||
    type.startsWith('properties/reset') ||
    type.startsWith('tenants/set') ||
    type.startsWith('sales/set') ||
    type.startsWith('leads/set') ||
    type.startsWith('owners/set') ||
    type.startsWith('contracts/set') ||
    type.startsWith('financials/set') ||
    type.startsWith('users/set') ||
    type.startsWith('ui/') ||
    action.meta?.fromCloud
  ) {
    return result;
  }

  // 1. Properties & Parcelles
  if (type === 'properties/addProperty') {
    const state: any = storeApi.getState();
    const newProp = state.properties?.items?.[0];
    if (newProp) firestoreService.saveProperty(newProp);
  } else if (type === 'properties/updateProperty') {
    if (action.payload) firestoreService.saveProperty(action.payload);
  } else if (type === 'properties/updatePropertyStatus') {
    const state: any = storeApi.getState();
    const prop = state.properties?.items?.find((p: any) => p.id === action.payload?.id);
    if (prop) firestoreService.saveProperty(prop);
  } else if (type === 'properties/deleteProperty') {
    if (action.payload) firestoreService.deleteProperty(action.payload);
  }

  // 2. Tenants & Receipts
  else if (type === 'tenants/addTenant') {
    const state: any = storeApi.getState();
    const newTenant = state.tenants?.items?.[0];
    if (newTenant) firestoreService.saveTenant(newTenant);
  } else if (type === 'tenants/updateTenant') {
    if (action.payload) firestoreService.saveTenant(action.payload);
  } else if (type === 'tenants/deleteTenant') {
    if (action.payload) firestoreService.deleteTenant(action.payload);
  } else if (type === 'tenants/recordRentPayment' || type === 'tenants/recordPaymentReceipt') {
    const state: any = storeApi.getState();
    const newReceipt = state.tenants?.receipts?.[0];
    const tenant = state.tenants?.items?.find((t: any) => t.id === action.payload?.tenantId);
    if (newReceipt) firestoreService.saveReceipt(newReceipt);
    if (tenant) firestoreService.saveTenant(tenant);
  } else if (type === 'tenants/deleteReceipt') {
    if (action.payload) firestoreService.deleteReceipt(action.payload);
  }

  // 3. Sales Receipts
  else if (type === 'sales/addSaleReceipt') {
    const state: any = storeApi.getState();
    const newSale = state.sales?.items?.[0];
    if (newSale) firestoreService.saveSaleReceipt(newSale);
  } else if (type === 'sales/updateSaleReceipt') {
    if (action.payload) firestoreService.saveSaleReceipt(action.payload);
  } else if (type === 'sales/deleteSaleReceipt') {
    if (action.payload) firestoreService.deleteSaleReceipt(action.payload);
  }

  // 4. Leads & Contact Requests
  else if (type === 'leads/addLead') {
    const state: any = storeApi.getState();
    const newLead = state.leads?.items?.[0];
    if (newLead) firestoreService.saveLead(newLead);
  } else if (type === 'leads/updateLeadStatus') {
    if (action.payload?.id && action.payload?.status) {
      firestoreService.updateLeadStatus(action.payload.id, action.payload.status, action.payload.notes);
    }
  } else if (type === 'leads/deleteLead') {
    if (action.payload) firestoreService.deleteLead(action.payload);
  }

  // 5. Landlords (Owners) & Payouts
  else if (type === 'owners/addOwner') {
    const state: any = storeApi.getState();
    const newOwner = state.owners?.items?.[0];
    if (newOwner) firestoreService.saveOwner(newOwner);
  } else if (type === 'owners/updateOwner') {
    if (action.payload) firestoreService.saveOwner(action.payload);
  } else if (type === 'owners/deleteOwner') {
    if (action.payload) firestoreService.deleteOwner(action.payload);
  } else if (type === 'owners/recordPayout') {
    const state: any = storeApi.getState();
    const newPayout = state.owners?.payouts?.[0];
    if (newPayout) firestoreService.savePayout(newPayout);
  } else if (type === 'owners/deletePayout') {
    if (action.payload) firestoreService.deletePayout(action.payload);
  }

  // 6. Contracts
  else if (type === 'contracts/addContract') {
    const state: any = storeApi.getState();
    const newContract = state.contracts?.items?.[0];
    if (newContract) firestoreService.saveContract(newContract);
  } else if (type === 'contracts/deleteContract') {
    if (action.payload) firestoreService.deleteContract(action.payload);
  }

  // 7. Expenses
  else if (type === 'financials/addExpense') {
    const state: any = storeApi.getState();
    const newExp = state.financials?.expenses?.[0];
    if (newExp) firestoreService.saveExpense(newExp);
  } else if (type === 'financials/deleteExpense') {
    if (action.payload) firestoreService.deleteExpense(action.payload);
  }

  // 8. Agency Configuration
  else if (
    type === 'agency/updateAgencyConfig' ||
    type === 'agency/setAgencyPreset' ||
    type === 'agency/resetAgencyConfig'
  ) {
    const state: any = storeApi.getState();
    if (state.agency?.config) {
      firestoreService.saveAgencyConfig(state.agency.config);
    }
  } else if (type === 'agency/setAgencyConfig') {
    if (action.payload && !action.meta?.fromCloud) {
      firestoreService.saveAgencyConfig(action.payload);
    }
  }

  // 9. Agency Collaborators & RBAC Users
  else if (type === 'users/addUser') {
    if (action.payload) {
      firestoreService.saveUser(action.payload);
    }
  } else if (type === 'users/updateUser') {
    if (action.payload) {
      firestoreService.saveUser(action.payload);
    }
  } else if (type === 'users/deleteUser') {
    if (action.payload) {
      firestoreService.deleteUser(action.payload);
    }
  }

  return result;
};
