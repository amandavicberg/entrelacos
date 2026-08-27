import { createSystemFont, defaultConfig } from '@tamagui/config/v5';
import { createTamagui } from 'tamagui';

const poppinsBody = createSystemFont({
  font: {
    family: 'Poppins_400Regular',
    weight: {
      1: '400',
      6: '600',
      9: '700',
    },
  },
});

const poppinsHeading = createSystemFont({
  font: {
    family: 'Poppins_700Bold',
    weight: {
      1: '700',
      6: '700',
      9: '800',
    },
  },
});

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  fonts: {
    body: poppinsBody,
    heading: poppinsHeading,
  },
  themes: {
    ...defaultConfig.themes,
    light: {
      ...defaultConfig.themes.light,
      background: '#F5FAF9',
      color: '#163B3E',
      brand: '#2D7480',
      brandContrast: '#FFFFFF',
      muted: '#617D80',
      borderColor: '#D6E7E6',
    },
    dark: {
      ...defaultConfig.themes.dark,
      background: '#102426',
      color: '#EFF8F7',
      brand: '#69B7B5',
      brandContrast: '#102426',
      muted: '#B3CDCB',
      borderColor: '#2C4D50',
    },
  },
});

export default tamaguiConfig;

export type AppTamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}
