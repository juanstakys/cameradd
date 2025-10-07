import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { useItems } from '../../src/state/ItemsContext';
import { formatCentsArg, parseArgCurrencyWordToCents, sanitizeOCRTextForArg } from '../../src/utils/currency';

export default function ListScreen() {
  const { items, remove, edit } = useItems();
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
      {items.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcons name="playlist-remove" size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>No hay items aún</Text>
          <Text style={styles.emptyHint}>Agregue importes desde la cámara</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          contentContainerStyle={{ paddingVertical: 8 }}
          renderItem={({ item }) => (
            <Swipeable
              renderRightActions={() => (
                <View style={styles.deleteAction}>
                  <MaterialIcons name="delete" size={28} color="#fff" />
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
                  <MaterialIcons name="edit" size={20} color="#2563eb" />
                  <Text style={styles.editText}>Editar</Text>
                </Pressable>
              </View>
            </Swipeable>
          )}
        />
      )}

      <Modal visible={editingId !== null} animationType="slide" transparent onRequestClose={() => setEditingId(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 16, color: '#6b7280' },
  emptyHint: { fontSize: 14, color: '#9ca3af' },
  sep: { height: 1, backgroundColor: '#e5e7eb' },
  row: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  amount: { fontSize: 20, fontWeight: '600' },
  date: { marginTop: 2, fontSize: 12, color: '#6b7280' },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  editText: { color: '#2563eb', fontWeight: '600' },
  deleteAction: {
    width: 88,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
  },
  error: { color: '#ef4444', marginTop: 8 },
  modalActions: { marginTop: 16, flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  btnGhost: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db' },
  btnGhostText: { color: '#374151' },
  btnPrimary: { backgroundColor: '#2563eb' },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },
  btnText: { fontSize: 16 },
});

