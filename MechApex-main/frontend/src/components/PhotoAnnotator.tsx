import { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Image, PanResponder, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/src/theme';

type Props = {
  visible: boolean;
  imageBase64: string; // data URI
  onClose: () => void;
  onSave: (paths: string[], note: string) => void;
};

const COLORS = ['#DC2626', '#F59E0B', '#22C55E', '#2563EB', '#111827'];

export function PhotoAnnotator({ visible, imageBase64, onClose, onSave }: Props) {
  const [paths, setPaths] = useState<string[]>([]);
  const [current, setCurrent] = useState<string>('');
  const [color, setColor] = useState<string>(COLORS[0]);
  const [colored, setColored] = useState<{ d: string; c: string }[]>([]);

  const win = Dimensions.get('window');
  const canvasHeight = Math.min(win.height - 260, 500);

  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const { locationX, locationY } = e.nativeEvent;
      setCurrent(`M${locationX.toFixed(1)} ${locationY.toFixed(1)}`);
    },
    onPanResponderMove: (e) => {
      const { locationX, locationY } = e.nativeEvent;
      setCurrent((cur) => cur + ` L${locationX.toFixed(1)} ${locationY.toFixed(1)}`);
    },
    onPanResponderRelease: () => {
      if (current) {
        setColored((prev) => [...prev, { d: current, c: color }]);
        setPaths((prev) => [...prev, current]);
        setCurrent('');
      }
    },
  });

  function undo() {
    setPaths((p) => p.slice(0, -1));
    setColored((p) => p.slice(0, -1));
  }
  function clear() {
    setPaths([]); setColored([]); setCurrent('');
  }
  function save() {
    // Serialise each stroke as JSON string with color
    const serialized = colored.map((c) => JSON.stringify(c));
    onSave(serialized, '');
    setPaths([]); setColored([]); setCurrent('');
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.container} testID="photo-annotator">
        <View style={s.header}>
          <Pressable onPress={onClose} testID="annot-close" hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.onSurface} />
          </Pressable>
          <Text style={s.title}>Annotate</Text>
          <Pressable onPress={save} testID="annot-save" hitSlop={12}>
            <Text style={{ color: colors.brandPrimary, fontWeight: '800' }}>Save</Text>
          </Pressable>
        </View>

        <View style={[s.canvasWrap, { height: canvasHeight }]}>
          <Image source={{ uri: imageBase64 }} style={StyleSheet.absoluteFill} resizeMode="contain" />
          <View style={StyleSheet.absoluteFill} {...responder.panHandlers}>
            <Svg width="100%" height="100%">
              {colored.map((p, i) => (
                <Path key={i} d={p.d} stroke={p.c} strokeWidth={4} fill="none" strokeLinecap="round" />
              ))}
              {current ? <Path d={current} stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" /> : null}
            </Svg>
          </View>
        </View>

        <View style={s.tools}>
          <View style={s.colors}>
            {COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[s.colorSw, { backgroundColor: c }, color === c && s.colorSwActive]}
                testID={`annot-color-${c}`}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={undo} style={s.toolBtn} testID="annot-undo" disabled={colored.length === 0}>
              <Ionicons name="arrow-undo" size={20} color={colored.length === 0 ? colors.muted : colors.onSurface} />
            </Pressable>
            <Pressable onPress={clear} style={s.toolBtn} testID="annot-clear" disabled={colored.length === 0}>
              <Ionicons name="trash-outline" size={20} color={colored.length === 0 ? colors.muted : colors.error} />
            </Pressable>
          </View>
        </View>
        <Text style={s.hint}>Draw on the image to highlight issues. Save when done.</Text>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg, paddingTop: 60,
  },
  title: { fontSize: 17, fontWeight: '800', color: colors.onSurface },
  canvasWrap: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.md, overflow: 'hidden',
    backgroundColor: '#000',
  },
  tools: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg,
  },
  colors: { flexDirection: 'row', gap: 8 },
  colorSw: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#fff' },
  colorSwActive: { borderColor: colors.onSurface, transform: [{ scale: 1.15 }] },
  toolBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  hint: { textAlign: 'center', color: colors.muted, fontSize: 12, marginBottom: 20, paddingHorizontal: 20 },
});
