import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { ThemeColors, useThemeColors } from '../theme/colors';
import { formatCentsArg, parseArgCurrencyWordToCents } from '../utils/currency';

type ManualEntryBarProps = {
  totalCents: number;
  onAdd: (cents: number) => void;
  containerStyle?: ViewStyle;
};

export function ManualEntryBar({ totalCents, onAdd, containerStyle }: ManualEntryBarProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [visible, setVisible] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const openModal = () => {
    setInput('');
    setError(null);
    setVisible(true);
  };

  const closeModal = () => setVisible(false);

  const handleSubmit = () => {
    const cents = parseArgCurrencyWordToCents(input);
    if (cents == null || cents <= 0) {
      setError('Ingrese un monto válido (formato 1.234,56)');
      return;
    }
    onAdd(cents);
    setVisible(false);
  };

  return (
    <>
      <View style={[styles.container, containerStyle]}>
        <View>
          <Text style={styles.label}>Total</Text>
          <Text style={styles.total}>${formatCentsArg(totalCents)}</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={openModal}>
          <Text style={styles.addBtnText}>Agregar manual</Text>
        </Pressable>
      </View>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={closeModal}>
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
              <Pressable style={[styles.btn, styles.btnGhost]} onPress={closeModal}>
                <Text style={[styles.btnText, styles.btnGhostText]}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={handleSubmit}>
                <Text style={[styles.btnText, styles.btnPrimaryText]}>Agregar</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    label: { fontSize: 16, color: colors.textSecondary },
    total: { fontSize: 24, fontWeight: '600', color: colors.textPrimary },
    addBtn: {
      backgroundColor: colors.accent,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
    },
    addBtnText: { color: colors.accentContrast, fontWeight: '600', fontSize: 16 },
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
