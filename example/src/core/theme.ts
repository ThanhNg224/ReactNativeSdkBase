import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

/** 8-point spacing scale. */
export const spacing = { xs: 8, sm: 16, md: 24, lg: 32 } as const;

export const radius = { md: 12, lg: 16, full: 999 } as const;

/** Minimum touch target for any interactive element. */
export const minTouchTarget = 48;

export const typography = {
  headline: { fontSize: 24, lineHeight: 32, fontWeight: '600' },
  title: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
} as const;

// Every `on*` colour is meant for text on the matching background; the pairs meet WCAG AA (4.5:1).
// Elevation is tonal: surfaces step from `background` to `surface` to `surfaceTonal`, no shadows.
const light = {
  background: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceTonal: '#E8ECF3',
  text: '#14171F',
  textMuted: '#5B6372',
  outline: '#79818F',
  primary: '#2F5BEA',
  onPrimary: '#FFFFFF',
  primaryContainer: '#DCE4FF',
  onPrimaryContainer: '#0F2A87',
  danger: '#B3261E',
  dangerContainer: '#FBE0DE',
  onDangerContainer: '#7A1712',
  success: '#1B7F4B',
  successContainer: '#D4F0E0',
  onSuccessContainer: '#0F5132',
};

const dark: typeof light = {
  background: '#101319',
  surface: '#1A1E27',
  surfaceTonal: '#252B37',
  text: '#ECEFF5',
  textMuted: '#9AA3B5',
  outline: '#7B8497',
  primary: '#8EA8FF',
  onPrimary: '#0B1330',
  primaryContainer: '#2A3A78',
  onPrimaryContainer: '#DCE4FF',
  danger: '#F2B8B5',
  dangerContainer: '#5C1F1B',
  onDangerContainer: '#F9DEDC',
  success: '#7DDBA7',
  successContainer: '#1B4A33',
  onSuccessContainer: '#C8F0DA',
};

export type Theme = typeof light;

export type ThemeScheme = 'light' | 'dark';

/** Overrides the system colour scheme for a subtree; `null` follows the system. */
export const ThemeSchemeContext = createContext<ThemeScheme | null>(null);

export function useTheme(): Theme {
  const override = useContext(ThemeSchemeContext);
  const system = useColorScheme();
  return (override ?? system) === 'dark' ? dark : light;
}
