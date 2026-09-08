import { useSyncExternalStore } from 'react';

const darkQuery = '(prefers-color-scheme: dark)';

function subscribe(onChange: () => void) {
  const query = window.matchMedia(darkQuery);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function getSnapshot() {
  return window.matchMedia(darkQuery).matches ? 'dark' : 'light';
}

// A stable server snapshot preserves static hydration; the browser subscribes to live changes.
export function useColorScheme() {
  return useSyncExternalStore(subscribe, getSnapshot, () => 'light' as const);
}
