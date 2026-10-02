import { Platform } from 'react-native';

// Palette ispirata al vetro ambrato della birra e alla pietra chiara di montagna.
// Evitiamo di default crema+terracotta: qui l'accento è l'ambra reale della birra.
export const colors = {
  background: '#EDEAE1',
  surface: '#F5F3EC',
  ink: '#1F2420',
  inkMuted: '#5B6058',
  hairline: '#C9C2B0',
  amber: '#B6702B',
  amberMuted: '#DCC6A1',
  sage: '#4B5842',
  sageMuted: '#C7CFC0',
  danger: '#9C3B2E',
};

export const typography = {
  display: Platform.select({
    web: "'Fraunces', Georgia, 'Times New Roman', serif",
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }),
  body: Platform.select({
    web: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    default: 'System',
  }),
  mono: Platform.select({
    web: "'IBM Plex Mono', 'SF Mono', Menlo, monospace",
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
};

// Larghezza massima del contenuto su schermi larghi (web/tablet)
export const maxContentWidth = 640;
