import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

function safeUrl(raw: string): string {
  const parsed = new URL(raw);
  if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('Link inválido.');
  return parsed.toString();
}

/** Opens the tab during the user gesture, before the signed URL request completes. */
export async function openExternalResource(loadUrl: () => Promise<string>): Promise<void> {
  if (Platform.OS !== 'web') {
    await Linking.openURL(safeUrl(await loadUrl()));
    return;
  }
  const tab = window.open('', '_blank');
  if (!tab) throw new Error('Permita a abertura de uma nova aba para acessar o arquivo.');
  tab.opener = null;
  try {
    tab.location.href = safeUrl(await loadUrl());
  } catch (error) {
    tab.close();
    throw error;
  }
}
