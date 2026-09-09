import { createSystemFont, defaultConfig } from '@tamagui/config/v5';
import { animations } from '@tamagui/config/v5-rn';
import { createTamagui } from 'tamagui';

// Paleta oficial do EntreLaços. Os nomes semânticos abaixo devem ser usados
// pelos componentes; não introduza valores hexadecimais em telas.
const entrelacosLightColors = {
  surface: '#FFFCF6',
  soft: '#E4EAEB',
  brandHover: '#293A4D',
  brandPress: '#202D3C',
  inputBorder: '#91A2AA',
  pendingBackground: '#F8E8CF',
  pendingColor: '#74501F',
  declinedBackground: '#F3E1DD',
  declinedColor: '#8D4037',
};

const entrelacosDarkColors = {
  surface: '#34465C',
  soft: '#40556D',
  brandHover: '#C79F61',
  brandPress: '#D9B778',
  inputBorder: '#91A2AA',
  pendingBackground: '#5B482D',
  pendingColor: '#F3D49C',
  declinedBackground: '#5A3735',
  declinedColor: '#F4BBB3',
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
  animations,
  tokens: {
    ...defaultConfig.tokens,
    color: entrelacosLightColors,
    size: { ...defaultConfig.tokens.size, control: 54, touchTarget: 44, loginContent: 440 },
    radius: { ...defaultConfig.tokens.radius, control: 16, panel: 24 },
  },
  fonts: {
    body: poppinsBody,
    heading: poppinsHeading,
  },
  themes: {
    ...defaultConfig.themes,
    light_professional: {
      ...defaultConfig.themes.light,
      ...entrelacosLightColors,
      background: '#F3EBDD', color: '#292F36',
      brand: '#34465C', brandContrast: '#F3EBDD', muted: '#59656E',
      borderColor: '#C8D1D2',
    },
    dark_professional: {
      ...defaultConfig.themes.dark,
      ...entrelacosDarkColors,
      background: '#202B38', color: '#F3EBDD',
      brand: '#BE914F', brandContrast: '#292F36', muted: '#C4CED1',
      borderColor: '#526473',
    },
    light_login: {
      ...defaultConfig.themes.light,
      ...entrelacosLightColors,
      background: '#F3EBDD',
      backgroundHover: '#E9E0D0',
      backgroundPress: '#DED2BE',
      backgroundFocus: '#FFFCF6',
      color: '#292F36',
      colorHover: '#292F36',
      colorPress: '#292F36',
      colorFocus: '#292F36',
      brand: '#34465C',
      brandContrast: '#F3EBDD',
      muted: '#59656E',
      placeholderColor: '#6C777E',
      borderColor: '#C8D1D2',
      borderColorHover: '#91A2AA',
      borderColorFocus: '#34465C',
      borderColorPress: '#34465C',
      outlineColor: '#34465C',
      red9: '#A13630',
      red10: '#A13630',
      shadowColor: '#292F36',
    },
    light: {
      ...defaultConfig.themes.light,
      ...entrelacosLightColors,
      background: '#F3EBDD',
      color: '#292F36',
      brand: '#34465C',
      brandContrast: '#F3EBDD',
      muted: '#59656E',
      borderColor: '#C8D1D2',
    },
    dark: {
      ...defaultConfig.themes.dark,
      ...entrelacosDarkColors,
      background: '#202B38',
      color: '#F3EBDD',
      brand: '#BE914F',
      brandContrast: '#292F36',
      muted: '#C4CED1',
      borderColor: '#526473',
    },
  },
});

export default tamaguiConfig;

export type AppTamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}
