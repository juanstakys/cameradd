import React, { useState } from 'react';
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

export default function CameraScreen() {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const { totalCents, add } = useItems();

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
        <Text>No se encontró una cámara disponible.</Text>
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
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  preview: { flex: 1, position: 'relative' },
  overlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    gap: 6,
  },
  overlayTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  overlayText: { color: '#f3f4f6', fontSize: 14 },
  totalBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: { fontSize: 16, color: '#6b7280' },
  totalValue: { fontSize: 24, fontWeight: '600' },
  addBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  permissionBtn: { backgroundColor: '#1f2937', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  permissionText: { color: '#fff', fontSize: 16 },
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
