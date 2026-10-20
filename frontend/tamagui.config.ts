import { createSystemFont, defaultConfig } from '@tamagui/config/v5';
import { animations } from '@tamagui/config/v5-rn';
import { createTamagui } from 'tamagui';

// Cores oficiais e suas superfícies derivadas, compartilhadas por todas as telas.
const entrelacosLightColors = {
  background: '#F3EBDD', backgroundHover: '#ECE4D7', backgroundPress: '#E2D8C8', backgroundFocus: '#FFFFFF',
  surface: '#FFFCF6', soft: '#E8EDEE', color: '#292F36', colorHover: '#292F36', colorPress: '#292F36', colorFocus: '#292F36',
  brand: '#34465C', brandContrast: '#FFFCF6', brandHover: '#293A4D', brandPress: '#202D3C',
  muted: '#59656E', placeholderColor: '#65727B', inputBorder: '#A4AFB2',
  borderColor: '#DDD8CD', borderColorHover: '#91A2AA', borderColorFocus: '#34465C', borderColorPress: '#34465C', outlineColor: '#34465C',
  accent: '#BE914F', accentSoft: '#EDE0C9', accentText: '#755522',
  hero: '#34465C', heroText: '#FFFCF6', heroMuted: '#D5DFE4', heroLine: '#637387', glass: '#FFFCF61F', glassBorder: '#FFFCF64D', photoShade: '#16233466', photoShadeStrong: '#16233499',
  pendingBackground: '#F8E8CF', pendingColor: '#74501F',
  declinedBackground: '#F3E1DD', declinedColor: '#8D4037', red9: '#A13630', red10: '#A13630',
  confirmedBackground: '#E4F2E9', confirmedColor: '#276249',
  shadowColor: '#292F36', overlay: '#00000052',
  logoSurface: '#F3EBDD', logoBorder: '#E1D4BE',
};
const entrelacosDarkColors = {
  background: '#1D2733', backgroundHover: '#334355', backgroundPress: '#40556D', backgroundFocus: '#293747',
  surface: '#263444', soft: '#334355', color: '#F3EBDD', colorHover: '#F3EBDD', colorPress: '#F3EBDD', colorFocus: '#F3EBDD',
  brand: '#C6D7E8', brandContrast: '#202D3C', brandHover: '#D9E4EE', brandPress: '#AABFD3',
  muted: '#C4CED1', placeholderColor: '#B4C0C7', inputBorder: '#91A2AA',
  borderColor: '#4A5D70', borderColorHover: '#91A2AA', borderColorFocus: '#C6D7E8', borderColorPress: '#C6D7E8', outlineColor: '#C6D7E8',
  accent: '#BE914F', accentSoft: '#463D30', accentText: '#E8C58F',
  hero: '#34465C', heroText: '#FFFCF6', heroMuted: '#D5DFE4', heroLine: '#637387', glass: '#FFFCF61F', glassBorder: '#FFFCF64D', photoShade: '#16233466', photoShadeStrong: '#16233499',
  pendingBackground: '#5B482D', pendingColor: '#F3D49C',
  declinedBackground: '#5A3735', declinedColor: '#F4BBB3', red9: '#F4BBB3', red10: '#F4BBB3',
  confirmedBackground: '#274739', confirmedColor: '#B6E9C9',
  shadowColor: '#000000', overlay: '#00000085',
  logoSurface: '#F3EBDD', logoBorder: '#BE914F',
};

// Component subthemes reset missing custom colors to token defaults on web.
// Carry semantic colors into them so dark inputs/buttons keep their contrast.
const brandComponentThemes = Object.fromEntries(
  Object.entries(defaultConfig.themes).map(([name, theme]) => [
    name,
    { ...theme, ...(name.startsWith('dark') ? entrelacosDarkColors : entrelacosLightColors) },
  ]),
);

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
    family: 'Poppins_500Medium',
    weight: {
      1: '500',
      6: '600',
      9: '700',
    },
  },
});

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  animations,
  tokens: {
    ...defaultConfig.tokens,
    color: entrelacosLightColors,
    size: { ...defaultConfig.tokens.size, control: 56, touchTarget: 44, loginContent: 480, page: 1184, reading: 1000 },
    radius: { ...defaultConfig.tokens.radius, control: 18, panel: 28, feature: 36, sheet: 40, pill: 999 },
  },
  fonts: {
    body: poppinsBody,
    heading: poppinsHeading,
  },
  themes: {
    ...brandComponentThemes,
    light: { ...defaultConfig.themes.light, ...entrelacosLightColors },
    dark: { ...defaultConfig.themes.dark, ...entrelacosDarkColors },
    light_login: { ...defaultConfig.themes.light, ...entrelacosLightColors },
    light_patient: { ...defaultConfig.themes.light, ...entrelacosLightColors },
    light_professional: { ...defaultConfig.themes.light, ...entrelacosLightColors },
    dark_professional: { ...defaultConfig.themes.dark, ...entrelacosDarkColors },
  },
});

export default tamaguiConfig;

export type AppTamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Tamagui uses interface augmentation.
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}
