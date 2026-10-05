import { useColorScheme } from 'react-native';

/** 8-point spacing scale. */
export const spacing = { xs: 8, sm: 16, md: 24, lg: 32 } as const;

const light = {
  background: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceTonal: '#E8ECF3',
  text: '#14171F',
  textMuted: '#5B6372',
  primary: '#2F5BEA',
  onPrimary: '#FFFFFF',
  danger: '#B3261E',
  success: '#1B7F4B',
};

const dark: typeof light = {
  background: '#101319',
  surface: '#1A1E27',
  surfaceTonal: '#252B37',
  text: '#ECEFF5',
  textMuted: '#9AA3B5',
  primary: '#8EA8FF',
  onPrimary: '#0B1330',
  danger: '#F2B8B5',
  success: '#7DDBA7',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
