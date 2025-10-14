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
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [blockOverlays, setBlockOverlays] = useState<BlockOverlay[]>([]);

  const scaledBoxes = useMemo(() => {
    if (!imageSize || previewSize.width === 0 || previewSize.height === 0) {
      return [];
    }

    const scale = Math.max(
      previewSize.width / imageSize.width,
      previewSize.height / imageSize.height
    );

    const scaledImageWidth = imageSize.width * scale;
    const scaledImageHeight = imageSize.height * scale;
    const offsetX = (scaledImageWidth - previewSize.width) / 2;
    const offsetY = (scaledImageHeight - previewSize.height) / 2;

    return blockOverlays.map((overlay, index) => ({
      key: `box-${index}`,
      overlayIndex: index,
      text: overlay.text,
      cents: overlay.cents,
      left: overlay.frame.left * scale - offsetX,
      top: overlay.frame.top * scale - offsetY,
      width: overlay.frame.width * scale,
      height: overlay.frame.height * scale,
    }));
  }, [blockOverlays, imageSize, previewSize]);

  const handlePreviewLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setPreviewSize({ width, height });
  }, []);

  const handleRecognize = useCallback(async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
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
      setBlockOverlays(overlays);
      setImageSize({ width: photo.width, height: photo.height });
    } catch (error) {
      console.warn('Fallo el reconocimiento de texto', error);
      setBlockOverlays([]);
      setImageSize(null);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const handleAddAmount = useCallback(
    (overlayIndex: number, cents: number) => {
      add(cents);
      setBlockOverlays((prev) => prev.filter((_, idx) => idx !== overlayIndex));
    },
    [add]
  );

  useEffect(() => {
    if (!hasPermission || !device) {
      return;
    }
    const interval = setInterval(() => {
      handleRecognize();
    }, 200);
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
            style={[styles.focusGuideContainer, { transform: [{ translateY: -previewSize.height * 0.2 || 0 }] }]}
          >
            <View style={styles.focusGuideBox} />
          </View>
          {scaledBoxes.map((box) => (
            <Pressable
              key={box.key}
              style={[
                styles.resultPressable,
                {
                  top: box.top,
                  left: box.left,
                  width: box.width,
                  height: box.height,
                },
              ]}
              onPress={() => handleAddAmount(box.overlayIndex, box.cents)}
            >
              <View pointerEvents="none" style={styles.resultHighlight} />
              <View
                pointerEvents="none"
                style={[
                  styles.resultLabel,
                  {
                    maxWidth: Math.max(56, previewSize.width - box.left),
                  },
                ]}
              >
                <Text style={styles.resultLabelText} numberOfLines={1} ellipsizeMode="tail">
                  {box.text}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>Reconocimiento de importes</Text>
          <Text style={styles.overlayText}>
            Detectando texto automáticamente...
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
      bottom: 24,
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.overlayBackground,
      gap: 12,
    },
    overlayTitle: { color: colors.overlayTextPrimary, fontSize: 16, fontWeight: '600' },
    overlayText: { color: colors.overlayTextSecondary, fontSize: 14 },
    resultPressable: {
      position: 'absolute',
      overflow: 'visible',
    },
    resultHighlight: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderWidth: 2,
      borderColor: '#22c55e',
      borderRadius: 8,
    },
    resultLabel: {
      position: 'absolute',
      bottom: '100%',
      left: 0,
      marginBottom: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: 'rgba(34,197,94,0.85)',
      minWidth: 56,
    },
    resultLabelText: { color: '#052e16', fontSize: 12, fontWeight: '600' },
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
