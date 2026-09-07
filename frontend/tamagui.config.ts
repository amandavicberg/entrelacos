import { createSystemFont, defaultConfig } from '@tamagui/config/v5';
import { createTamagui } from 'tamagui';

const loginColors = {
  surface: '#FFFFFF',
  brandHover: '#6C4D35',
  brandPress: '#5F422D',
  inputBorder: '#9A8571',
};

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
  tokens: {
    ...defaultConfig.tokens,
    color: loginColors,
    size: { ...defaultConfig.tokens.size, control: 54, touchTarget: 44, loginContent: 440 },
    radius: { ...defaultConfig.tokens.radius, control: 16 },
  },
  fonts: {
    body: poppinsBody,
    heading: poppinsHeading,
  },
  themes: {
    ...defaultConfig.themes,
    light_login: {
      ...defaultConfig.themes.light,
      ...loginColors,
      background: '#F8F3EA',
      backgroundHover: '#EEE3D3',
      backgroundPress: '#E6D8C5',
      backgroundFocus: '#FFFFFF',
      color: '#342C26',
      colorHover: '#342C26',
      colorPress: '#342C26',
      colorFocus: '#342C26',
      brand: '#79583D',
      brandContrast: '#FFFFFF',
      muted: '#706459',
      placeholderColor: '#706459',
      borderColor: '#D9CDBD',
      borderColorHover: '#9A8571',
      borderColorFocus: '#95704D',
      borderColorPress: '#95704D',
      outlineColor: '#95704D',
      red9: '#A13630',
      red10: '#A13630',
      shadowColor: '#342C26',
    },
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
