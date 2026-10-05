import { Tabs } from 'expo-router';
import { useTheme } from '../../core/theme';

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.text,
        tabBarStyle: { backgroundColor: theme.surfaceTonal, borderTopWidth: 0 },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: { fontSize: 14, marginBottom: 12 },
      }}>
      <Tabs.Screen name="health" options={{ title: 'Health' }} />
      <Tabs.Screen name="device" options={{ title: 'Device' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
