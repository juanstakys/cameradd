import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ThemeColors, useThemeColors } from '../theme/colors';

type ClearListButtonProps = {
  onPress: () => void;
  style?: ViewStyle;
};

export function ClearListButton({ onPress, style }: ClearListButtonProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const closeConfirm = () => setConfirmVisible(false);
  const handleConfirm = () => {
    setConfirmVisible(false);
    onPress();
  };

  return (
    <View style={[styles.container, style]}>
      <Pressable style={styles.button} onPress={() => setConfirmVisible(true)}>
        <MaterialIcons name="restart-alt" size={20} color={colors.destructiveContrast} />
        <Text style={styles.text}>Vaciar lista</Text>
      </Pressable>
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={closeConfirm}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Vaciar la lista</Text>
            <Text style={styles.modalDescription}>
              ¿Seguro que desea eliminar todos los importes guardados?
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={closeConfirm}>
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.confirmButton]} onPress={handleConfirm}>
                <Text style={[styles.modalButtonText, styles.confirmButtonText]}>Vaciar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingTop: 8,
      paddingBottom: 8,
      gap: 12,
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    button: {
      marginHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.destructive,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    text: {
      color: colors.destructiveContrast,
      fontWeight: '600',
      fontSize: 16,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: colors.modalBackdrop,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalCard: {
      width: '100%',
      maxWidth: 360,
      borderRadius: 16,
      padding: 20,
      backgroundColor: colors.modalBackground,
      gap: 12,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
    modalDescription: { fontSize: 15, color: colors.textSecondary },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
    modalButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
    },
    modalButtonText: { fontSize: 16, fontWeight: '600' },
    cancelButton: {
      backgroundColor: colors.buttonGhostBackground,
      borderWidth: 1,
      borderColor: colors.buttonGhostBorder,
    },
    cancelButtonText: { color: colors.buttonGhostText },
    confirmButton: { backgroundColor: colors.destructive },
    confirmButtonText: { color: colors.destructiveContrast },
  });
