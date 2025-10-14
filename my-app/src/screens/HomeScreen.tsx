import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Dimensions,
  PanResponder,
  Animated,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

const BG = "#D7F7C8";

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const [money] = useState(0);

  const { width: W, height: H } = Dimensions.get("window");

  // Карта — квадрат вдвое больше экрана
  const MAP_W = W * 2;
  const MAP_H = H * 2;

  // Старт по центру экрана
  const startX = (W - MAP_W) / 2;
  const startY = (H - MAP_H) / 2;

  // Только панорамирование
  const panX = useRef(new Animated.Value(startX)).current;
  const panY = useRef(new Animated.Value(startY)).current;
  const panXRef = useRef(startX);
  const panYRef = useRef(startY);
  const panStart = useRef({ x: startX, y: startY });

  // Границы (фиксированы, т.к. зума нет)
  const bounds = useMemo(
    () => ({
      minX: W - MAP_W,
      maxX: 0,
      minY: H - MAP_H,
      maxY: 0,
    }),
    [W, H, MAP_W, MAP_H]
  );
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const commitPan = (nx: number, ny: number) => {
    panXRef.current = nx; panYRef.current = ny;
    panX.setValue(nx);   panY.setValue(ny);
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: () => {
          panStart.current = { x: panXRef.current, y: panYRef.current };
        },

        onPanResponderMove: (_e, g) => {
          const nx = clamp(panStart.current.x + g.dx, bounds.minX, bounds.maxX);
          const ny = clamp(panStart.current.y + g.dy, bounds.minY, bounds.maxY);
          commitPan(nx, ny);
        },

        onPanResponderRelease: () => {
          // финальный «дожим» в границы (на всякий случай)
          const nx = clamp(panXRef.current, bounds.minX, bounds.maxX);
          const ny = clamp(panYRef.current, bounds.minY, bounds.maxY);
          commitPan(nx, ny);
        },

        onPanResponderTerminationRequest: () => true,
      }),
    [bounds]
  );

  // Объекты на карте
  const MAIN_W = 220, MAIN_H = 140;
  const buildings = [
    { id: "main", x: MAP_W / 2 - MAIN_W / 2, y: MAP_H / 2 - MAIN_H / 2, w: MAIN_W, h: MAIN_H, title: "главный дом" },
    { id: "d1", x: MAP_W / 2 - 260, y: MAP_H / 2 + 60,  w: 60, h: 90, title: "d:1" },
    { id: "d2", x: MAP_W / 2 - 120, y: MAP_H / 2 + 90,  w: 60, h: 90, title: "d:2" },
    { id: "d3", x: MAP_W / 2 + 20,  y: MAP_H / 2 + 120, w: 60, h: 90, title: "d:3" },
    { id: "d4", x: MAP_W / 2 + 180, y: MAP_H / 2 + 40,  w: 60, h: 90, title: "d:4" },
  ];

  const CircleWithLabel = ({
    title,
    onPress,
    size = 60,
  }: {
    title: string;
    onPress: () => void;
    size?: number;
  }) => (
    <View style={{ alignItems: "center" }}>
      {/* Это аналог <div> с onTouchStart */}
      <View
        onTouchStart={onPress}        // срабатывает при касании
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: "#222",
          backgroundColor: "#cdd0ff",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
      <Text style={{ marginTop: 8 }}>{title}</Text>
    </View>
  );





  return (
    <SafeAreaView style={styles.safe}>
      {/* Слой карты с жестами */}
      <View style={StyleSheet.absoluteFill} {...responder.panHandlers}>
        <Animated.View
          style={[
            styles.mapCanvas,
            {
              width: MAP_W,
              height: MAP_H,
              transform: [{ translateX: panX }, { translateY: panY }],
            },
          ]}
        >
          {buildings.map((b) => (
            <View
              key={b.id}
              style={{
                position: "absolute",
                left: b.x, top: b.y, width: b.w, height: b.h,
                borderRadius: 12, backgroundColor: "#ddd",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: b.id === "main" ? 14 : 12 }}>{b.title}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Верхний UI */}
      <View style={styles.topBar} pointerEvents="box-none">
        <Text style={{ fontSize: 16 }}>money: {money}</Text>
        <Pressable onPress={() => { /* nav.navigate("Profile") */ }} style={styles.avatar}>
          <View style={styles.avatarInner} />
          <View style={styles.avatarNeck} />
        </Pressable>
      </View>

      {/* Нижние кнопки */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 6,
          height: 96,
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-around",
          zIndex: 10,
          elevation: 10,
        }}
      >
        <CircleWithLabel title="Raiting" onPress={() => nav.navigate("Rating")} />
        <CircleWithLabel title="Games"   onPress={() => nav.navigate("GamesMenu")} />
        <CircleWithLabel title="Market"  onPress={() => nav.navigate("Market")} />
      </View>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  mapCanvas: { backgroundColor: "rgba(0,0,0,0.03)" },

  topBar: {
    position: "absolute", top: 45, left: 0, right: 0, height: 52,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: "#f9c2f0",
    borderWidth: 3, borderColor: "#b34fb7", alignItems: "center", justifyContent: "center",
  },
  avatarInner: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#b34fb7" },
  avatarNeck:  { position: "absolute", bottom: 6, width: 22, height: 10, borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: "#fff", borderWidth: 2, borderColor: "#b34fb7" },

  bottomBar: {
    position: "absolute", left: 0, right: 0, bottom: 6, height: 96,
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-around",
  },
  circle: {
    width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: "#222",
  },
});
