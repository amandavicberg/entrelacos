import { defaultConfig } from '@tamagui/config/v5';
import { createTamagui } from 'tamagui';

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    light: {
      ...defaultConfig.themes.light,
      background: '#F7FAF9',
      color: '#18312D',
      brand: '#2F7D6D',
      brandContrast: '#FFFFFF',
      muted: '#5F746F',
      borderColor: '#D8E6E1',
    },
    dark: {
      ...defaultConfig.themes.dark,
      background: '#10201D',
      color: '#F1F7F5',
      brand: '#72C4B0',
      brandContrast: '#10201D',
      muted: '#B2C8C1',
      borderColor: '#2C4A43',
    },
  },
});

export default tamaguiConfig;

export type AppTamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}
