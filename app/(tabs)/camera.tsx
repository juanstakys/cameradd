import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useItems } from '../../src/state/ItemsContext';
import { ThemeColors, useThemeColors } from '../../src/theme/colors';
import { ManualEntryBar } from '../../src/components/ManualEntryBar';

export default function CameraScreen() {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const { totalCents, add } = useItems();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>No se encontró una cámara disponible.</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionText}>Permitir acceso a la cámara</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.preview}>
        <Camera style={StyleSheet.absoluteFill} device={device} isActive resizeMode="cover" />
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>Reconocimiento de importes</Text>
          <Text style={styles.overlayText}>
            En la próxima iteración, vas a poder tocar los montos detectados para agregarlos.
          </Text>
        </View>
      </View>
      <ManualEntryBar totalCents={totalCents} onAdd={add} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    preview: { flex: 1, position: 'relative' },
    overlay: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 24,
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.overlayBackground,
      gap: 6,
    },
    overlayTitle: { color: colors.overlayTextPrimary, fontSize: 16, fontWeight: '600' },
    overlayText: { color: colors.overlayTextSecondary, fontSize: 14 },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    centerText: { color: colors.textPrimary, textAlign: 'center', fontSize: 16, marginBottom: 12 },
    permissionBtn: {
      backgroundColor: colors.accent,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
    },
    permissionText: { color: colors.accentContrast, fontSize: 16, fontWeight: '600' },
  });
