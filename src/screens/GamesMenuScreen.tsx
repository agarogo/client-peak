import React, { useCallback, useState } from "react";
import { Text, View, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCoinsPreferServer } from "../storage/wallet";

type TileProps = { title: string; onPress: () => void; bg?: string };

function GameTile({ title, onPress, bg = "#bfe5b4" }: TileProps) {
  const [pressed, setPressed] = useState(false);
  return (
    <View
      style={[styles.tile, { backgroundColor: pressed ? "#cdeec4" : bg }]}
      onStartShouldSetResponder={() => true}
      onResponderGrant={() => setPressed(true)}
      onResponderRelease={() => { setPressed(false); onPress(); }}
      onResponderTerminate={() => setPressed(false)}
    >
      <Text style={styles.tileText}>{title}</Text>
      <View style={styles.chevron}/>
    </View>
  );
}

export default function GamesMenuScreen() {
  const nav = useNavigation<any>();
  const [coins, setCoins] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useFocusEffect(useCallback(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const { coins } = await getCoinsPreferServer();
        if (alive) setCoins(coins);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []));

  return (
    <SafeAreaView style={styles.safe}>
      {/* верхняя панель */}
      <View style={styles.topBar} pointerEvents="box-none">
        <Text style={styles.back} onPress={() => nav.navigate("Home")}>←</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 16 }}>money: {coins}</Text>
          {loading && <ActivityIndicator size="small" />}
        </View>
        <Pressable onPress={() => nav.navigate("Home", { openProfile: true })} style={styles.avatar}>
          <View style={styles.avatarInner} />
          <View style={styles.avatarNeck} />
        </Pressable>
      </View>

      {/* плитки */}
      <View style={styles.center}>
        <GameTile title="Отсортируй мусор" onPress={() => nav.navigate("CatchGame")} />
        <GameTile title="Викторина" onPress={() => nav.navigate("Quiz")} bg="#cfe0ff" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#D7F7C8" },
  topBar: {
    position: "absolute", top: 45, left: 0, right: 0, height: 52,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  back: { left: 0, fontSize: 22 },

  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: "#f9c2f0",
    borderWidth: 3, borderColor: "#b34fb7", alignItems: "center", justifyContent: "center",
  },
  avatarInner: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#b34fb7" },
  avatarNeck:  { position: "absolute", bottom: 6, width: 22, height: 10,
    borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: "#fff",
    borderWidth: 2, borderColor: "#b34fb7" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  tile: {
    width: 260, paddingVertical: 16, borderRadius: 999, borderWidth: 1, borderColor: "#222",
    alignItems: "center", justifyContent: "center", marginVertical: 14,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4,
    position: "relative",
  },
  tileText: { fontSize: 16, fontWeight: "600" },
  chevron: {
    position: "absolute", right: 14, width: 10, height: 10,
    borderRightWidth: 2, borderTopWidth: 2, borderColor: "#222", transform: [{ rotate: "45deg" }],
  },
});
