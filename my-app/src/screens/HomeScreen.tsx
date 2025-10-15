// src/screens/HomeScreen.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View, Text, Pressable, Dimensions, PanResponder, Animated, StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { api } from "../api/client";
import { clearToken } from "../storage/auth";

const BG = "#D7F7C8";
const CARD = "#ffffff";
const ACCENT = "#1b7f4a";

type User = {
  id?: number | string;
  nickname?: string;
  email?: string;
  money?: number;        // если бэкенд так отдаёт
  balance?: number;      // или так
};

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const { width: W, height: H } = Dimensions.get("window");

  const [user, setUser] = useState<User | null>(null);
  const [money, setMoney] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  // ====== КАРТА ======
  const MAP_W = W * 2, MAP_H = H * 2;
  const startX = (W - MAP_W) / 2, startY = (H - MAP_H) / 2;
  const panX = useRef(new Animated.Value(startX)).current;
  const panY = useRef(new Animated.Value(startY)).current;
  const panXRef = useRef(startX), panYRef = useRef(startY);
  const panStart = useRef({ x: startX, y: startY });

  const bounds = useMemo(
    () => ({ minX: W - MAP_W, maxX: 0, minY: H - MAP_H, maxY: 0 }),
    [W, H, MAP_W, MAP_H]
  );
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const commitPan = (nx: number, ny: number) => { panXRef.current = nx; panYRef.current = ny; panX.setValue(nx); panY.setValue(ny); };
  const responder = useMemo(() =>
    PanResponder.create({
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
    }), [bounds]
  );

  const MAIN_W = 220, MAIN_H = 140;
  const buildings = [
    { id: "main", x: MAP_W / 2 - MAIN_W / 2, y: MAP_H / 2 - MAIN_H / 2, w: MAIN_W, h: MAIN_H, title: "главный дом" },
    { id: "d1", x: MAP_W / 2 - 260, y: MAP_H / 2 + 60,  w: 60, h: 90, title: "d:1" },
    { id: "d2", x: MAP_W / 2 - 120, y: MAP_H / 2 + 90,  w: 60, h: 90, title: "d:2" },
    { id: "d3", x: MAP_W / 2 + 20,  y: MAP_H / 2 + 120, w: 60, h: 90, title: "d:3" },
    { id: "d4", x: MAP_W / 2 + 180, y: MAP_H / 2 + 40,  w: 60, h: 90, title: "d:4" },
  ];

  // ====== Профиль: анимация панели
  const overlay = useRef(new Animated.Value(0)).current;
  const panel = useRef(new Animated.Value(0)).current;
  const panelScale = panel.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });
  const panelTranslateY = panel.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] });
  const overlayOpacity = overlay.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] });

  const openProfile = () => {
    setProfileOpen(true);
    Animated.parallel([
      Animated.timing(overlay, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(panel, { toValue: 1, damping: 14, stiffness: 180, mass: 0.6, useNativeDriver: true }),
    ]).start();
  };
  const closeProfile = () => {
    Animated.parallel([
      Animated.timing(overlay, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(panel,   { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start(({ finished }) => finished && setProfileOpen(false));
  };

  const signOut = async () => {
    await clearToken();
    try { nav.reset({ index: 0, routes: [{ name: "Login" }] }); } catch { nav.navigate("Login"); }
  };

  // ====== Загрузка профиля/денег по токену
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        try {
          // профиль
          const me: User = await api.me();            // ⚠️ проверь путь на бэкенде
          if (cancelled) return;
          setUser(me);

          // деньги: если их отдаёт /me, используй это поле; иначе попробуй отдельную ручку
          const moneyValue =
            (typeof me.money === "number" ? me.money :
            typeof me.balance === "number" ? me.balance : undefined);

          if (moneyValue != null) {
            setMoney(moneyValue);
          } else {
            // если есть отдельная ручка — раскомментируй:
            // const bal = await api.balance();
            // if (!cancelled) setMoney(Number(bal?.money ?? bal?.balance ?? 0));
            setMoney(0); // дефолт
          }
        } catch (e: any) {
          if (e?.status === 401) {
            await clearToken();
            Alert.alert("Сессия истекла", "Войдите снова", [
              { text: "Ок", onPress: () => signOut() },
            ]);
          } else {
            // не валимся, просто покажем алерт один раз
            console.warn("load profile failed:", e);
            Alert.alert("Ошибка загрузки", e?.message || "Не удалось получить профиль");
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }, [])
  );

  const CircleWithLabel = ({
    title, onPress, size = 60,
  }: { title: string; onPress: () => void; size?: number }) => (
    <View style={{ alignItems: "center" }}>
      <View
        onTouchStart={onPress}
        style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: 2, borderColor: "#222",
          backgroundColor: "#cdd0ff", alignItems: "center", justifyContent: "center",
        }}
      />
      <Text style={{ marginTop: 8 }}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* КАРТА */}
      <View style={StyleSheet.absoluteFill} {...responder.panHandlers}>
        <Animated.View
          style={[
            styles.mapCanvas,
            { width: MAP_W, height: MAP_H, transform: [{ translateX: panX }, { translateY: panY }] },
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

      {/* ВЕРХНИЙ БАР */}
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

      {/* НИЗ */}
      <View style={styles.bottomBar}>
        <CircleWithLabel title="Raiting" onPress={() => nav.navigate("Rating")} />
        <CircleWithLabel title="Games"   onPress={() => nav.navigate("GamesMenu")} />
        <CircleWithLabel title="Market"  onPress={() => nav.navigate("Market")} />
      </View>

      {/* ПРОФИЛЬ */}
      {profileOpen && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View
            style={[StyleSheet.absoluteFillObject, { backgroundColor: "#000", opacity: overlayOpacity }]}
            pointerEvents="auto"
          >
            <Pressable style={{ flex: 1 }} onPress={closeProfile} />
          </Animated.View>

          <Animated.View
            pointerEvents="auto"
            style={[
              styles.profileCardWrap,
              { transform: [{ translateY: panelTranslateY }, { scale: panelScale }] },
            ]}
          >
            <View style={styles.profileCardHeader}>
              <Text style={styles.profileTitle}>Профиль</Text>
              <Pressable onPress={closeProfile} hitSlop={10}><Text style={{ fontSize: 18 }}>✕</Text></Pressable>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Имя</Text>
              <Text style={styles.value}>{user?.nickname ?? "—"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user?.email ?? "—"}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Баланс</Text>
              <Text style={styles.value}>{money}</Text>
            </View>

            <Pressable onPress={signOut} style={styles.logoutBtn}>
              <Text style={styles.logoutTxt}>Выйти</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}
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

  // профиль
  profileCardWrap: {
    position: "absolute",
    top: 90, right: 12, left: 12,
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  profileCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  profileTitle: { fontSize: 18, fontWeight: "800", color: "#222" },

  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#e7e7e7",
  },
  label: { color: "#666" },
  value: { color: "#222", fontWeight: "600" },

  logoutBtn: {
    marginTop: 14, paddingVertical: 12, borderRadius: 999, alignItems: "center",
    backgroundColor: ACCENT,
  },
  logoutTxt: { color: "#fff", fontWeight: "700" },
});
