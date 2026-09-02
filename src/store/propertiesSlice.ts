import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Property, PropertyFilterState, PropertyStatus } from '../types';
import { INITIAL_PROPERTIES } from '../data/mockData';

const LOCAL_STORAGE_KEY = 'mali_immo_properties';

const loadSavedProperties = (): Property[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading properties from localStorage:', e);
  }
  return INITIAL_PROPERTIES;
};

const saveToLocalStorage = (properties: Property[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(properties));
  } catch (e) {
    console.error('Error saving properties to localStorage:', e);
  }
};

const initialFilters: PropertyFilterState = {
  dealType: 'all',
  propertyType: 'all',
  city: 'all',
  neighborhood: 'all',
  minPrice: 0,
  maxPrice: 200000000,
  minSurface: 0,
  maxSurface: 50000,
  documentType: 'all',
  searchQuery: '',
  status: 'all',
  amenities: [],
  onlyWithTF: false,
};

interface PropertiesState {
  items: Property[];
  filters: PropertyFilterState;
  selectedPropertyId: string | null;
  favorites: string[]; // array of property IDs
  loading: boolean;
  error: string | null;
}

const loadSavedFavorites = (): string[] => {
  try {
    const favs = localStorage.getItem('mali_immo_favorites');
    if (favs) return JSON.parse(favs);
  } catch (e) {
    console.error('Error loading favorites:', e);
  }
  return [];
};

const initialState: PropertiesState = {
  items: loadSavedProperties(),
  filters: initialFilters,
  selectedPropertyId: null,
  favorites: loadSavedFavorites(),
  loading: false,
  error: null,
};

export const propertiesSlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    setProperties: (state, action: PayloadAction<Property[]>) => {
      state.items = action.payload;
      saveToLocalStorage(state.items);
    },
    addProperty: (state, action: PayloadAction<Omit<Property, 'id' | 'reference' | 'viewsCount' | 'createdAt' | 'updatedAt'>>) => {
      const count = state.items.length + 1;
      const cityPrefix = action.payload.city?.toUpperCase().slice(0, 3) || 'BKO';
      const year = new Date().getFullYear();
      const ref = `ML-${cityPrefix}-${year}-${String(count).padStart(3, '0')}`;
      
      const payloadAny = action.payload as any;
      const newProperty: Property = {
        ...action.payload,
        id: payloadAny.id || `prop-${Date.now()}`,
        reference: payloadAny.reference || ref,
        viewsCount: payloadAny.viewsCount || 1,
        createdAt: payloadAny.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      state.items.unshift(newProperty);
      saveToLocalStorage(state.items);
    },
    updateProperty: (state, action: PayloadAction<Property>) => {
      const index = state.items.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = {
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
        saveToLocalStorage(state.items);
      }
    },
    deleteProperty: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(p => p.id !== action.payload);
      saveToLocalStorage(state.items);
    },
    updatePropertyStatus: (state, action: PayloadAction<{ id: string; status: PropertyStatus }>) => {
      const property = state.items.find(p => p.id === action.payload.id);
      if (property) {
        property.status = action.payload.status;
        property.updatedAt = new Date().toISOString();
        saveToLocalStorage(state.items);
      }
    },
    incrementPropertyViews: (state, action: PayloadAction<string>) => {
      const property = state.items.find(p => p.id === action.payload);
      if (property) {
        property.viewsCount = (property.viewsCount || 0) + 1;
        saveToLocalStorage(state.items);
      }
    },
    setSelectedPropertyId: (state, action: PayloadAction<string | null>) => {
      state.selectedPropertyId = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<PropertyFilterState>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialFilters;
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.favorites.includes(id)) {
        state.favorites = state.favorites.filter(favId => favId !== id);
      } else {
        state.favorites.push(id);
      }
      try {
        localStorage.setItem('mali_immo_favorites', JSON.stringify(state.favorites));
      } catch (e) {
        console.error('Error saving favorites:', e);
      }
    },
    resetToMockData: (state) => {
      state.items = INITIAL_PROPERTIES;
      saveToLocalStorage(INITIAL_PROPERTIES);
    },
  },
});

export const {
  setProperties,
  addProperty,
  updateProperty,
  deleteProperty,
  updatePropertyStatus,
  incrementPropertyViews,
  setSelectedPropertyId,
  setFilters,
  resetFilters,
  toggleFavorite,
  resetToMockData,
} = propertiesSlice.actions;

export default propertiesSlice.reducer;
