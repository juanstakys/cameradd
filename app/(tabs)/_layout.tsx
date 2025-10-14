import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useThemeColors } from '../../src/theme/colors';

export default function TabsLayout() {
  const colors = useThemeColors();

  return (
    <Tabs
      sceneContainerStyle={{ backgroundColor: colors.background }}
      screenOptions={{
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: colors.headerBackground },
        headerTintColor: colors.headerTint,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
        },
        tabBarLabelStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Cámara',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="photo-camera" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: 'Lista',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="list-alt" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
