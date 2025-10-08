import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useItems } from '../../src/state/ItemsContext';
import { formatCentsArg, parseArgCurrencyWordToCents } from '../../src/utils/currency';
import { ThemeColors, useThemeColors } from '../../src/theme/colors';

export default function CameraScreen() {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const { totalCents, add } = useItems();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [showManualModal, setShowManualModal] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const openManualModal = () => {
    setInput('');
    setError(null);
    setShowManualModal(true);
  };

  const handleAddManual = () => {
    const cents = parseArgCurrencyWordToCents(input);
    if (cents == null || cents <= 0) {
      setError('Ingrese un monto válido (formato 1.234,56)');
      return;
    }
    add(cents);
    setShowManualModal(false);
  };

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
      <View style={styles.totalBar}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${formatCentsArg(totalCents)}</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={openManualModal}>
          <Text style={styles.addBtnText}>Agregar manual</Text>
        </Pressable>
      </View>

      <Modal visible={showManualModal} animationType="slide" transparent onRequestClose={() => setShowManualModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Agregar importe</Text>
            <TextInput
              value={input}
              onChangeText={(value) => {
                setError(null);
                setInput(value);
              }}
              placeholder="1.234,56"
              keyboardType={Platform.select({ android: 'decimal-pad', ios: 'decimal-pad' })}
              autoFocus
              style={styles.input}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setShowManualModal(false)}>
                <Text style={[styles.btnText, styles.btnGhostText]}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={handleAddManual}>
                <Text style={[styles.btnText, styles.btnPrimaryText]}>Agregar</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    totalBar: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    totalLabel: { fontSize: 16, color: colors.textSecondary },
    totalValue: { fontSize: 24, fontWeight: '600', color: colors.textPrimary },
    addBtn: {
      backgroundColor: colors.accent,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
    },
    addBtnText: { color: colors.accentContrast, fontWeight: '600', fontSize: 16 },
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
    modalBackdrop: {
      flex: 1,
      backgroundColor: colors.modalBackdrop,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalCard: {
      backgroundColor: colors.modalBackground,
      padding: 16,
      borderRadius: 16,
      width: '100%',
      maxWidth: 420,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: colors.textPrimary },
    input: {
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 18,
      backgroundColor: colors.inputBackground,
      color: colors.textPrimary,
    },
    error: { color: colors.destructive, marginTop: 8 },
    modalActions: { marginTop: 16, flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    btnGhost: {
      backgroundColor: colors.buttonGhostBackground,
      borderWidth: 1,
      borderColor: colors.buttonGhostBorder,
    },
    btnGhostText: { color: colors.buttonGhostText },
    btnPrimary: { backgroundColor: colors.accent },
    btnPrimaryText: { color: colors.accentContrast, fontWeight: '700' },
    btnText: { fontSize: 16, color: colors.textPrimary },
  });
