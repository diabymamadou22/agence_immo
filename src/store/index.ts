import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import propertiesReducer from './propertiesSlice';
import leadsReducer from './leadsSlice';
import tenantsReducer from './tenantsSlice';
import uiReducer from './uiSlice';
import agencyReducer from './agencySlice';
import ownersReducer from './ownersSlice';
import contractsReducer from './contractsSlice';
import financialsReducer from './financialsSlice';
import salesReducer from './salesSlice';
import { firestoreSyncMiddleware } from './syncMiddleware';

export const store = configureStore({
  reducer: {
    properties: propertiesReducer,
    leads: leadsReducer,
    tenants: tenantsReducer,
    ui: uiReducer,
    agency: agencyReducer,
    owners: ownersReducer,
    contracts: contractsReducer,
    financials: financialsReducer,
    sales: salesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(firestoreSyncMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector.withTypes<RootState>();

