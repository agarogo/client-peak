// src/screens/HomeScreen.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  View, Text, Pressable, Dimensions, PanResponder, Animated, StyleSheet, ActivityIndicator, Image, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import { api } from "../api/client";
import { clearToken } from "../storage/auth";
import { getCoinsPreferServer } from "../storage/wallet";
import { getTrees, Tree } from "../storage/trees";
import { resetProgress } from "../storage/reset";

const BG = "#D7F7C8";
const CARD = "#ffffff";
const ACCENT = "#1b7f4a";

const HOUSE_IMG = require("../../assets/Rabbitss.png");
const TREE_SPRITES = [
  require("../../assets/Tree_0.png"),
  require("../../assets/Tree_1.png"),
  require("../../assets/Tree_2.png"),
];

type User = {
  id?: number | string;
  full_name?: string;
  nickname?: string;
  email_user?: string;
  email?: string;
  coins?: number;
};

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { width: W, height: H } = Dimensions.get("window");

  const [user, setUser] = useState<User | null>(null);
  const [money, setMoney] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [trees, setTreesState] = useState<Tree[]>([]);

  // карта
  const MAP_W = W * 1.6;
  const MAP_H = H * 1.6;
  const startX = (W - MAP_W) / 2;
  const startY = (H - MAP_H) / 2;

  const panX = useRef(new Animated.Value(startX)).current;
  const panY = useRef(new Animated.Value(startY)).current;
  const panXRef = useRef(startX);
  const panYRef = useRef(startY);
  const panStart = useRef({ x: startX, y: startY });

  const bounds = useMemo(() => ({ minX: W - MAP_W, maxX: 0, minY: H - MAP_H, maxY: 0 }), [W, H, MAP_W, MAP_H]);
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const commitPan = (nx: number, ny: number) => { panXRef.current = nx; panYRef.current = ny; panX.setValue(nx); panY.setValue(ny); };

  const responder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { panStart.current = { x: panXRef.current, y: panYRef.current }; },
      onPanResponderMove: (_e, g) => {
        const nx = clamp(panStart.current.x + g.dx, bounds.minX, bounds.maxX);
        const ny = clamp(panStart.current.y + g.dy, bounds.minY, bounds.maxY);
        commitPan(nx, ny);
      },
      onPanResponderRelease: () => {
        const nx = clamp(panXRef.current, bounds.minX, bounds.maxX);
        const ny = clamp(panYRef.current, bounds.minY, bounds.maxY);
        commitPan(nx, ny);
      },
      onPanResponderTerminationRequest: () => true,
    }),
    [bounds]
  );

  // профиль — анимация
  const overlay = useRef(new Animated.Value(0)).current;
  const panel = useRef(new Animated.Value(0)).current;
  const panelScale = panel.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });
  const panelTranslateY = panel.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] });
  const overlayOpacity = overlay.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] });

  const openProfile = () => {
    setProfileOpen(true);
    Animated.parallel([
      Animated.timing(overlay, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(panel, { toValue: 1, damping: 16, stiffness: 190, mass: 0.6, useNativeDriver: true }),
    ]).start();
  };
  const closeProfile = () => {
    Animated.parallel([
      Animated.timing(overlay, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(panel, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start(({ finished }) => finished && setProfileOpen(false));
  };

  const signOut = async () => {
    await clearToken();
    try { nav.reset({ index: 0, routes: [{ name: "Auth" }] }); } catch { nav.navigate("Auth"); }
  };

  const reload = async () => {
    setLoading(true);
    try {
      let u: User | null = null;
      try { u = await api.currentUser(); } catch {}
      setUser(u);

      const { coins } = await getCoinsPreferServer();
      setMoney(coins);

      const t = await getTrees();
      setTreesState(t);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      (async () => { await reload(); })();
      if (route?.params?.openProfile) {
        setTimeout(openProfile, 50);
        nav.setParams?.({ openProfile: undefined });
      }
    }, [nav, route?.params?.openProfile])
  );

  const doReset = () => {
    Alert.alert("Сброс прогресса", "Обнулить монеты и удалить все деревья?", [
      { text: "Отмена", style: "cancel" },
      { text: "Сбросить", style: "destructive", onPress: async () => { await resetProgress(); await reload(); Alert.alert("Готово", "Прогресс сброшен"); } },
    ]);
  };

  const displayName = user?.full_name || user?.nickname || "—";
  const displayEmail = user?.email_user || user?.email || "—";

  // координаты
  const HOUSE_W = 180, HOUSE_H = 130;
  const houseX = MAP_W / 2 - HOUSE_W / 2;
  const houseY = MAP_H / 2 - HOUSE_H / 2;

  const TREE_SIZE = 48;
  const GAP = 16;

  const xCenter = houseX + HOUSE_W / 2 - TREE_SIZE / 2;
  const yBottom = houseY + HOUSE_H + 8;
  const ySide = houseY + HOUSE_H - TREE_SIZE + 2;

  const coords = {
    d1: { x: houseX - TREE_SIZE - GAP, y: ySide },                      // слева
    d2: { x: xCenter, y: yBottom },                                      // снизу центр
    d3: { x: houseX + HOUSE_W + GAP, y: ySide },                         // справа
    d4: { x: xCenter - (TREE_SIZE + GAP), y: yBottom },                  // снизу слева от центра
    d5: { x: xCenter + (TREE_SIZE + GAP), y: yBottom },                  // снизу справа от центра
  } as const;

  return (
    <SafeAreaView style={styles.safe}>
      {/* карта */}
      <View style={StyleSheet.absoluteFill} {...responder.panHandlers}>
        <Animated.View style={[styles.mapCanvas, { width: MAP_W, height: MAP_H, transform: [{ translateX: panX }, { translateY: panY }] }]}>
          {/* дом */}
          <View style={{ position: "absolute", left: houseX, top: houseY, width: HOUSE_W, height: HOUSE_H }}>
            <Image source={HOUSE_IMG} resizeMode="contain" style={{ width: "100%", height: "100%" }} />
          </View>

          {/* деревья */}
          {trees.map((t) => {
            const pos = coords[t.slotId as keyof typeof coords];
            if (!pos) return null;
            const sprite = TREE_SPRITES[Math.min(2, t.level)];
            return (
              <Image
                key={t.slotId}
                source={sprite}
                style={{ position: "absolute", left: pos.x, top: pos.y, width: TREE_SIZE, height: TREE_SIZE }}
                resizeMode="contain"
              />
            );
          })}
        </Animated.View>
      </View>

      {/* верх */}
      <View style={styles.topBar} pointerEvents="box-none">
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 16 }}>money: {money}</Text>
          {loading && <ActivityIndicator size="small" />}
        </View>
        <Pressable onPress={openProfile} style={styles.avatar}>
          <View style={styles.avatarInner} />
          <View style={styles.avatarNeck} />
        </Pressable>
      </View>

      {/* низ */}
      <View style={styles.bottomBar}>
        <CircleWithLabel title="Raiting" onPress={() => nav.navigate("Rating")} />
        <CircleWithLabel title="Games" onPress={() => nav.navigate("GamesMenu")} />
        <CircleWithLabel title="Market" onPress={() => nav.navigate("Market")} />
      </View>

      {/* профиль */}
      {profileOpen && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#000", opacity: overlayOpacity }]} pointerEvents="auto">
            <Pressable style={{ flex: 1 }} onPress={closeProfile} />
          </Animated.View>

          <Animated.View pointerEvents="auto" style={[styles.profileCardWrap, { transform: [{ translateY: panelTranslateY }, { scale: panelScale }] }]}>
            <View style={styles.profileCardHeader}>
              <Text style={styles.profileTitle}>Профиль</Text>
              <Pressable onPress={closeProfile} hitSlop={10}><Text style={{ fontSize: 18 }}>✕</Text></Pressable>
            </View>

            <View style={styles.row}><Text style={styles.label}>Имя</Text><Text style={styles.value}>{displayName}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Email</Text><Text style={styles.value}>{displayEmail}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Баланс</Text><Text style={styles.value}>{money}</Text></View>

            
            <Pressable onPress={signOut} style={styles.logoutBtn}><Text style={styles.logoutTxt}>Выйти</Text></Pressable>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

function CircleWithLabel({ title, onPress, size = 60 }: { title: string; onPress: () => void; size?: number }) {
  return (
    <View style={{ alignItems: "center" }}>
      <View
        onTouchStart={onPress}
        style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: "#222", backgroundColor: "#cdd0ff", alignItems: "center", justifyContent: "center" }}
      />
      <Text style={{ marginTop: 8 }}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  mapCanvas: { backgroundColor: "rgba(0,0,0,0.02)" },

  topBar: {
    position: "absolute", top: 45, left: 0, right: 0, height: 52,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: "#f9c2f0",
    borderWidth: 3, borderColor: "#b34fb7", alignItems: "center", justifyContent: "center",
  },
  avatarInner: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#b34fb7" },
  avatarNeck: { position: "absolute", bottom: 6, width: 22, height: 10, borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: "#fff", borderWidth: 2, borderColor: "#b34fb7" },

  bottomBar: {
    position: "absolute", left: 0, right: 0, bottom: 6, height: 96,
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-around",
  },

  // профиль
  profileCardWrap: {
    position: "absolute", top: 90, right: 12, left: 12, backgroundColor: CARD, borderRadius: 18, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  profileCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  profileTitle: { fontSize: 18, fontWeight: "800", color: "#222" },

  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#e7e7e7" },
  label: { color: "#666" },
  value: { color: "#222", fontWeight: "600" },

  logoutBtn: { marginTop: 10, paddingVertical: 12, borderRadius: 999, alignItems: "center", backgroundColor: ACCENT },
  logoutTxt: { color: "#fff", fontWeight: "700" },
});
