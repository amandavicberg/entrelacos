import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const webMemoryStorage = new Map<string, string>();

function webStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try { return window.sessionStorage; } catch { return null; }
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try { return webStorage()?.getItem(key) ?? webMemoryStorage.get(key) ?? null; }
      catch { return webMemoryStorage.get(key) ?? null; }
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      webMemoryStorage.set(key, value);
      try { webStorage()?.setItem(key, value); } catch { /* Private browsing can disable storage. */ }
      return;
    }
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      webMemoryStorage.delete(key);
      try { webStorage()?.removeItem(key); } catch { /* In-memory session remains cleared. */ }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
