// src/screens/MarketScreen.tsx
import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { canAfford, spendCoins, getCoinsPreferServer } from "../storage/wallet";
import { ALL_SLOTS, buyTree, getTree, hasTreeAt, TreeSlotId, upgradeTree } from "../storage/trees";

const BG = "#D7F7C8";
const CARD = "#fff";
const ACCENT = "#1b7f4a";

const PRICE_SEEDLING = 20;
const PRICE_WATER_L0 = 10; // 0->1
const PRICE_WATER_L1 = 12; // 1->2

const SPRITES = [
  require("../../assets/Tree_0.png"),
  require("../../assets/Tree_1.png"),
  require("../../assets/Tree_2.png"),
];

type Row = { slot: TreeSlotId; owned: boolean; level: number };

export default function MarketScreen() {
  const nav = useNavigation<any>();
  const [coins, setCoins] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>(ALL_SLOTS.map((s) => ({ slot: s, owned: false, level: 0 })));

  const refresh = useCallback(async () => {
    const { coins } = await getCoinsPreferServer();
    const state: Row[] = [];
    for (const slot of ALL_SLOTS) {
      const t = await getTree(slot);
      state.push({ slot, owned: !!t, level: t?.level ?? 0 });
    }
    setCoins(coins);
    setRows(state);
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const buy = async (slot: TreeSlotId) => {
    setBusy(`buy-${slot}`);
    try {
      if (await hasTreeAt(slot)) return;
      const ok = await canAfford(PRICE_SEEDLING);
      if (!ok) return Alert.alert("Не хватает монет", `Нужно ${PRICE_SEEDLING}, у тебя ${coins}`);
      await spendCoins(PRICE_SEEDLING);
      await buyTree(slot);
      Alert.alert("Готово", `Саженец посажен (${slot})`, [{ text: "Ок", onPress: () => nav.navigate("Home") }]);
    } catch (e: any) {
      Alert.alert("Ошибка", e?.message || "Не удалось купить саженец");
    } finally {
      setBusy(null);
      await refresh();
    }
  };

  const water = async (slot: TreeSlotId, level: number) => {
    const price = level === 0 ? PRICE_WATER_L0 : PRICE_WATER_L1;
    setBusy(`water-${slot}`);
    try {
      const ok = await canAfford(price);
      if (!ok) return Alert.alert("Не хватает монет", `Нужно ${price}, у тебя ${coins}`);
      await spendCoins(price);
      await upgradeTree(slot);
    } catch (e: any) {
      Alert.alert("Ошибка", e?.message || "Не удалось полить");
    } finally {
      setBusy(null);
      await refresh();
    }
  };

  const RowCard = ({ r }: { r: Row }) => {
    const img = SPRITES[Math.min(r.level, 2)];
    return (
      <View style={styles.item}>
        <Image source={img} style={{ width: 56, height: 56, marginRight: 10 }} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>Саженец — слот {r.slot.toUpperCase()}</Text>
          <Text style={styles.itemSub}>{r.owned ? `Уровень: ${r.level}` : `Цена: ${PRICE_SEEDLING} монет`}</Text>
        </View>

        {!r.owned ? (
          <Pressable style={[styles.actionBtn, busy && { opacity: 0.6 }]} disabled={!!busy} onPress={() => buy(r.slot)}>
            {busy === `buy-${r.slot}` ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionTxt}>Купить</Text>}
          </Pressable>
        ) : r.level >= 2 ? (
          <View style={[styles.actionBtn, { backgroundColor: "#999" }]}>
            <Text style={styles.actionTxt}>MAX</Text>
          </View>
        ) : (
          <Pressable
            style={[styles.actionBtn, busy && { opacity: 0.6 }]}
            disabled={!!busy}
            onPress={() => water(r.slot, r.level)}
          >
            {busy?.startsWith(`water-${r.slot}`) ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionTxt}>
                Полить {r.level === 0 ? `(${PRICE_WATER_L0})` : `(${PRICE_WATER_L1})`}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.back} onPress={() => nav.goBack()}>
          ←
        </Text>
        <Text style={{ fontSize: 16 }}>money: {coins}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Магазин</Text>
        {rows.map((r) => (
          <RowCard key={r.slot} r={r} />
        ))}
        <View style={{ height: 4 }} />
        <Text style={{ color: "#666", fontSize: 12 }}>
          Полив повышает уровень дерева: Tree_0 → Tree_1 (за {PRICE_WATER_L0}), затем → Tree_2 (за {PRICE_WATER_L1}).
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  topBar: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginTop: 45,
  },
  back: { fontSize: 22 },

  card: {
    margin: 16,
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 12 },

  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  itemTitle: { fontSize: 16, fontWeight: "700" },
  itemSub: { color: "#666", marginTop: 2 },

  actionBtn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTxt: { color: "#fff", fontWeight: "700" },
});
