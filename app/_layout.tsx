import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ItemsProvider } from '../src/state/ItemsContext';
import { useIsDarkMode, useThemeColors } from '../src/theme/colors';

export default function RootLayout() {
  const colors = useThemeColors();
  const isDark = useIsDarkMode();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <ItemsProvider>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.background },
            headerStyle: { backgroundColor: colors.headerBackground },
            headerTintColor: colors.headerTint,
            statusBarStyle: isDark ? 'light' : 'dark',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ItemsProvider>
    </GestureHandlerRootView>
  );
}
