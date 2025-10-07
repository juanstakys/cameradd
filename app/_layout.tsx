import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { ItemsProvider } from '../src/state/ItemsContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ItemsProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ItemsProvider>
    </GestureHandlerRootView>
  );
}
