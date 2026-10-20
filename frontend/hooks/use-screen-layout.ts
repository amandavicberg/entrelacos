import { useWindowDimensions } from 'react-native';

/** Shared visual breakpoints. Large text keeps the single-column reading flow. */
export function useScreenLayout() {
  const { width, fontScale } = useWindowDimensions();
  return {
    compact: width < 600 || fontScale >= 1.5,
    wide: width >= 1000 && fontScale < 1.5,
    width,
    fontScale,
  };
}
