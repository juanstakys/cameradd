import TextRecognition, { type Frame } from '@react-native-ml-kit/text-recognition';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { ManualEntryBar } from '../../src/components/ManualEntryBar';
import { useItems } from '../../src/state/ItemsContext';
import { ThemeColors, useThemeColors } from '../../src/theme/colors';
import { formatCentsArg, parseArgCurrencyWordToCents } from '../../src/utils/currency';

type BlockOverlay = { frame: Frame; text: string; cents: number };

const extractNumericAmount = (
  text: string
): { display: string; cents: number } | null => {
  const matches = text.match(/-?\d(?:[\s.,]?\d)*/g);
  if (!matches) return null;

  for (const raw of matches) {
    const cents = parseArgCurrencyWordToCents(raw);
    if (cents && cents > 0) {
      return { display: formatCentsArg(cents), cents };
    }
  }
  return null;
};

export default function CameraScreen() {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const { totalCents, add } = useItems();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const cameraRef = useRef<Camera>(null);
  const isProcessingRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [anticipatedAmount, setAnticipatedAmount] = useState<BlockOverlay | null>(null);
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePreviewLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setPreviewSize({ width, height });
  }, []);

  const handleRecognize = useCallback(async () => {
    if (!cameraRef.current || isProcessingRef.current || flushTimeoutRef.current) return;

    try {
      isProcessingRef.current = true;
      setIsProcessing(true);
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'balanced',
        skipMetadata: true,
      });

      const photoPath = photo?.path;
      if (!photoPath || !photo?.width || !photo?.height) {
        throw new Error('No se obtuvo una imagen válida desde la cámara.');
      }

      const imageURL = photoPath.startsWith('file://') ? photoPath : `file://${photoPath}`;
      const result = await TextRecognition.recognize(imageURL);
      const overlays: BlockOverlay[] = [];
      for (const block of result.blocks) {
        if (!block.frame) continue;
        const amount = extractNumericAmount(block.text);
        if (!amount) continue;
        overlays.push({ frame: block.frame, text: amount.display, cents: amount.cents });
      }

      if (overlays.length === 0) {
        setAnticipatedAmount(null);
        return;
      }

      const largestOverlay = overlays.reduce((largest, current) => {
        const largestArea = largest.frame.width * largest.frame.height;
        const currentArea = current.frame.width * current.frame.height;
        return currentArea > largestArea ? current : largest;
      }, overlays[0]);

      setAnticipatedAmount(largestOverlay);
    } catch (error) {
      console.warn('Fallo el reconocimiento de texto', error);
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, []);

  const handleAddAnticipated = useCallback(() => {
    if (!anticipatedAmount) return;

    add(anticipatedAmount.cents);

    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
    }

    flushTimeoutRef.current = setTimeout(() => {
      setAnticipatedAmount(null);
      flushTimeoutRef.current = null;
    }, 2000);
  }, [add, anticipatedAmount]);

  useEffect(() => {
    return () => {
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
        flushTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!hasPermission || !device) {
      return;
    }

    const interval = setInterval(() => {
      void handleRecognize();
    }, 300);

    return () => clearInterval(interval);
  }, [device, handleRecognize, hasPermission]);

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
      <View style={styles.preview} onLayout={handlePreviewLayout}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          resizeMode="cover"
          photo
        />
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <View
            pointerEvents="none"
            style={[
              styles.focusGuideContainer,
              { transform: [{ translateY: previewSize.height ? -previewSize.height * 0.2 : 0 }] },
            ]}
          >
            <View style={styles.focusGuideBox} />
          </View>
          <View style={styles.captureButtonContainer}>
            <Pressable
              style={[styles.captureButton, !anticipatedAmount && styles.captureButtonDisabled]}
              onPress={handleAddAnticipated}
              disabled={!anticipatedAmount}
              accessibilityRole="button"
              accessibilityLabel="Agregar monto reconocido"
            >
              <View style={styles.captureButtonInner} />
            </Pressable>
          </View>
        </View>
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>Reconocimiento de importes</Text>
          <Text style={styles.overlayText}>
            {anticipatedAmount ? anticipatedAmount.text : isProcessing ? 'Escaneando monto...' : 'Buscando monto...'}
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
    focusGuideContainer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
    focusGuideBox: {
      width: '75%',
      maxWidth: 320,
      aspectRatio: 2.5,
      borderWidth: 3,
      borderRadius: 16,
      borderColor: '#ffffff',
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    overlay: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 140,
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.overlayBackground,
      gap: 12,
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
    captureButtonContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    captureButton: {
      width: 76,
      height: 76,
      borderRadius: 38,
      borderWidth: 3,
      borderColor: '#ffffff',
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    captureButtonInner: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: '#ffffff',
    },
    captureButtonDisabled: {
      opacity: 0.6,
    },
  });
