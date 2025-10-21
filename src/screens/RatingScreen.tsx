import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { api } from "../api/client";
import { getCoinsPreferServer } from "../storage/wallet";

const BG = "#D7F7C8";
const CARD = "#fff";

type Row = { id: string; name: string; coins: number; you?: boolean };

export default function RatingScreen() {
  const nav = useNavigation<any>();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let list: any[] = [];
      try {
        const data = await api.listUsers(); // [{id, full_name, coins, ...}]
        list = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      } catch {
        list = [];
      }

      if (!list.length) {
        // сервер недоступен — показываем локально только себя
        const { coins } = await getCoinsPreferServer();
        setRows([{ id: "me", name: "Вы", coins, you: true }]);
        return;
      }

      const mapped: Row[] = list.map((u: any) => ({
        id: String(u.id),
        name: u.full_name || u.email_user || `user#${u.id}`,
        coins: Number(u.coins ?? 0),
      }));
      mapped.sort((a, b) => b.coins - a.coins);
      setRows(mapped.slice(0, 50));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.back} onPress={() => nav.goBack()}>←</Text>
        <Text style={{ fontSize: 18, fontWeight: "800" }}>Рейтинг</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.card}>
        {loading ? (
          <View style={{ alignItems: "center", padding: 20 }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8 }}>Загружаем…</Text>
          </View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(it) => it.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item, index }) => (
              <View style={styles.row}>
                <Text style={[styles.rank, item.you && { color: "#1b7f4a" }]}>{index + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, item.you && { color: "#1b7f4a", fontWeight: "800" }]}>
                    {item.name}
                  </Text>
                </View>
                <Text style={styles.coins}>{item.coins}</Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  topBar: {
    height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, marginTop: 45,
  },
  back: { fontSize: 22 },

  card: {
    margin: 16, backgroundColor: CARD, borderRadius: 18, padding: 8,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  row: {
    flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#eee",
  },
  rank: { width: 28, textAlign: "center", fontWeight: "700", color: "#555" },
  name: { fontSize: 16, color: "#222" },
  coins: { fontWeight: "700" },
});
