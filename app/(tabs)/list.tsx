import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { ManualEntryBar } from '../../src/components/ManualEntryBar';
import { useItems } from '../../src/state/ItemsContext';
import { ThemeColors, useThemeColors } from '../../src/theme/colors';
import { formatCentsArg, parseArgCurrencyWordToCents } from '../../src/utils/currency';

export default function ListScreen() {
  const { items, remove, edit, totalCents, add, clearAll } = useItems();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onOpenEdit = (id: string, cents: number) => {
    setEditingId(id);
    setInput(formatCentsArg(cents));
    setError(null);
  };

  const onSave = () => {
    if (!editingId) return;
    const cents = parseArgCurrencyWordToCents(input);
    if (cents == null || cents <= 0) {
      setError('Ingrese un monto válido (formato 1.234,56)');
      return;
    }
    edit(editingId, cents);
    setEditingId(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="playlist-remove" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No hay items aún</Text>
            <Text style={styles.emptyHint}>Agregue importes desde la cámara</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => it.id}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            contentContainerStyle={{ paddingVertical: 8 }}
            style={styles.list}
            renderItem={({ item }) => (
              <Swipeable
                renderRightActions={() => (
                  <View style={styles.deleteAction}>
                    <MaterialIcons name="delete" size={28} color={colors.destructiveContrast} />
                  </View>
                )}
                onSwipeableOpen={(dir) => dir === 'right' && remove(item.id)}
              >
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.amount}>${formatCentsArg(item.cents)}</Text>
                    <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
                  </View>
                  <Pressable style={styles.editBtn} onPress={() => onOpenEdit(item.id, item.cents)}>
                    <MaterialIcons name="edit" size={20} color={colors.accent} />
                    <Text style={styles.editText}>Editar</Text>
                  </Pressable>
                </View>
              </Swipeable>
            )}
          />
        )}
      </View>

      <Modal visible={editingId !== null} animationType="slide" transparent onRequestClose={() => setEditingId(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar importe</Text>
            <TextInput
              value={input}
              onChangeText={(t) => {
                setError(null);
                setInput(t);
              }}
              placeholder="1.234,56"
              keyboardType={Platform.select({ android: 'decimal-pad', ios: 'decimal-pad' })}
              autoFocus
              style={styles.input}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setEditingId(null)}>
                <Text style={[styles.btnText, styles.btnGhostText]}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onSave}>
                <Text style={[styles.btnText, styles.btnPrimaryText]}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <View style={styles.footer}>
        <ManualEntryBar totalCents={totalCents} onAdd={add} />
        {items.length > 0 ? (
          <Pressable style={styles.resetBtn} onPress={clearAll}>
            <MaterialIcons name="restart-alt" size={20} color={colors.destructiveContrast} />
            <Text style={styles.resetBtnText}>Vaciar lista</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1 },
    list: { flex: 1 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
    emptyText: { fontSize: 16, color: colors.textSecondary },
    emptyHint: { fontSize: 14, color: colors.textMuted },
    sep: { height: 1, backgroundColor: colors.border },
    row: {
      backgroundColor: colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    amount: { fontSize: 20, fontWeight: '600', color: colors.textPrimary },
    date: { marginTop: 2, fontSize: 12, color: colors.textSecondary },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surfaceAlt,
    },
    editText: { color: colors.accent, fontWeight: '600' },
    deleteAction: {
      width: 88,
      backgroundColor: colors.destructive,
      justifyContent: 'center',
      alignItems: 'center',
    },
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
    footer: { paddingTop: 8, paddingBottom: 24, gap: 12 },
    resetBtn: {
      marginHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.destructive,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    resetBtnText: { color: colors.destructiveContrast, fontWeight: '600', fontSize: 16 },
  });
