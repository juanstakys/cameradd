import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Camera, VisionCameraProxy, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { useItems } from '../../src/state/ItemsContext';
import { formatCentsArg, parseArgCurrencyWordToCents } from '../../src/utils/currency';

type WordBox = {
  id: string;
  text: string;
  box: { x: number; y: number; width: number; height: number };
  frame: { width: number; height: number };
};

export default function CameraScreen() {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const { totalCents, add } = useItems();
  const [candidates, setCandidates] = useState<WordBox[]>([]);
  const lastRun = useSharedValue(0);

  const plugin = useMemo(() => {
    try {
      // @ts-expect-error worklet types are provided by the lib
      return VisionCameraProxy.initFrameProcessorPlugin('recognizeNumbers', {});
    } catch (e) {
      return undefined;
    }
  }, []);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const now = global.performance.now();
    if (now - lastRun.value < 200) return; // throttle ~5fps
    lastRun.value = now;

    try {
      if (!plugin) return;
      const result: any = plugin.call(frame, {});
      const items: any[] = [];
      if (Array.isArray(result)) {
        for (const node of result) {
          if (!node) continue;
          const text = String(node.text ?? '').trim();
          if (!text) continue;
          if (!/[0-9OoIl|]/.test(text)) continue;
          const rb = node.box;
          if (!rb) continue;
          items.push({
            id: `${text}-${rb.x}-${rb.y}-${rb.width}-${rb.height}`,
            text,
            box: { x: rb.x, y: rb.y, width: rb.width, height: rb.height },
            frame: { width: frame.width, height: frame.height },
          });
        }
      }
      runOnJS(setCandidates)(items);
    } catch (e) {
      // ignore OCR errors per frame
    }
  }, [lastRun, plugin]);

  const [viewSize, setViewSize] = useState({ width: 0, height: 0 });

  const validNumbers = useMemo(() => {
    return candidates
      .map((w) => {
        // Accept only if the entire item text is a single valid AR-format number
        const cents = parseArgCurrencyWordToCents(w.text);
        if (cents == null || cents <= 0) return null;
        return { ...w, cents };
      })
      .filter(Boolean) as Array<WordBox & { cents: number }>;
  }, [candidates]);

  if (!device) {
    return (
      <View style={styles.center}> 
        <Text>No camera device found.</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionText}>Grant Camera Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.preview} onLayout={(e) => setViewSize(e.nativeEvent.layout)}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          resizeMode="cover"
          pixelFormat="yuv"
          frameProcessor={frameProcessor}
        />
        {validNumbers.map((w) => {
          const rect = mapBoxToView(w.box, w.frame, viewSize);
          const label = formatCentsArg(w.cents);
          const placeAbove = rect.y > 18;
          return (
            <Pressable
              key={w.id}
              onPress={() => add(w.cents)}
              style={[styles.box, {
                left: rect.x,
                top: rect.y,
                width: rect.width,
                height: rect.height,
              }]}
            >
              <View style={[styles.badge, placeAbove ? { bottom: rect.height + 4 } : { top: rect.height + 4 }]}>
                <Text style={styles.badgeText}>{label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>${formatCentsArg(totalCents)}</Text>
      </View>
    </View>
  );
}

function mapBoxToView(
  box: { x: number; y: number; width: number; height: number },
  frame: { width: number; height: number },
  view: { width: number; height: number }
) {
  // cover mode mapping
  const scale = Math.max(view.width / frame.width, view.height / frame.height);
  const scaledW = frame.width * scale;
  const scaledH = frame.height * scale;
  const offsetX = (view.width - scaledW) / 2;
  const offsetY = (view.height - scaledH) / 2;
  return {
    x: box.x * scale + offsetX,
    y: box.y * scale + offsetY,
    width: box.width * scale,
    height: box.height * scale,
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  preview: { flex: 1, position: 'relative', backgroundColor: '#000' },
  totalBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 16, color: '#666' },
  totalValue: { fontSize: 24, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  permissionBtn: { backgroundColor: '#1f2937', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  permissionText: { color: '#fff', fontSize: 16 },
  box: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#00D2C9',
  },
  badge: {
    position: 'absolute',
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
