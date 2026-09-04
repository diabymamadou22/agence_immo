import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AgencyUser, AgencyUserRole } from '../types';
import { INITIAL_COLLABORATORS } from '../utils/rbac';

const USERS_STORAGE_KEY = 'mali_immo_agency_users';
const CURRENT_USER_KEY = 'mali_immo_current_user';

const getInitialUsers = (): AgencyUser[] => {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to load users from localStorage:', e);
  }
  return INITIAL_COLLABORATORS;
};

const getInitialCurrentUser = (): AgencyUser | null => {
  try {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch (e) {
    console.warn('Failed to load current user from sessionStorage:', e);
  }
  return null;
};

interface UsersState {
  items: AgencyUser[];
  currentUser: AgencyUser | null;
  activeFilterRole: AgencyUserRole | 'all';
}

const initialState: UsersState = {
  items: getInitialUsers(),
  currentUser: getInitialCurrentUser(),
  activeFilterRole: 'all',
};

export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setUsers: (state, action: PayloadAction<AgencyUser[]>) => {
      state.items = action.payload;
      try {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(action.payload));
        }
      } catch (e) {
        console.error('Error saving users to storage:', e);
      }
    },
    addUser: (state, action: PayloadAction<AgencyUser>) => {
      state.items.unshift(action.payload);
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(state.items));
      } catch (e) {
        console.error(e);
      }
    },
    updateUser: (state, action: PayloadAction<AgencyUser>) => {
      const index = state.items.findIndex((u) => u.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
        // If updating the currently logged-in user, refresh their session
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = action.payload;
          try {
            sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(action.payload));
          } catch (e) {
            console.error(e);
          }
        }
        try {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(state.items));
        } catch (e) {
          console.error(e);
        }
      }
    },
    deleteUser: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((u) => u.id !== action.payload);
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(state.items));
      } catch (e) {
        console.error(e);
      }
    },
    setCurrentUser: (state, action: PayloadAction<AgencyUser | null>) => {
      state.currentUser = action.payload;
      try {
        if (action.payload) {
          sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(action.payload));
          // Update lastLoginAt
          const userIndex = state.items.findIndex((u) => u.id === action.payload!.id);
          if (userIndex !== -1) {
            state.items[userIndex].lastLoginAt = new Date().toISOString();
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(state.items));
          }
        } else {
          sessionStorage.removeItem(CURRENT_USER_KEY);
        }
      } catch (e) {
        console.error('Error updating current user session:', e);
      }
    },
    setFilterRole: (state, action: PayloadAction<AgencyUserRole | 'all'>) => {
      state.activeFilterRole = action.payload;
    },
  },
});

export const {
  setUsers,
  addUser,
  updateUser,
  deleteUser,
  setCurrentUser,
  setFilterRole,
} = usersSlice.actions;

export default usersSlice.reducer;
