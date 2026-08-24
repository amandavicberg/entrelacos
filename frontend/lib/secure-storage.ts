import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const webMemoryStorage = new Map<string, string>();

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return webMemoryStorage.get(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      webMemoryStorage.set(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      webMemoryStorage.delete(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
