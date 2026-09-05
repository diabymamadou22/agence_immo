/**
 * Safe local storage wrapper that prevents crashes in non-browser or SSR contexts
 */
export const getStorageItem = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch (e) {
    console.warn(`SafeStorage get error for ${key}:`, e);
  }
  return null;
};

export const setStorageItem = (key: string, value: string): void => {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn(`SafeStorage set error for ${key}:`, e);
  }
};
