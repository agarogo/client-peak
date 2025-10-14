import React from "react";
import { Text, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

function Pill({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 240,
        paddingVertical: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#222",
        alignItems: "center",
        marginVertical: 14,
        backgroundColor: pressed ? "#cdeec4" : "#bfe5b4",
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
        top: 10,
      })}
    >
      <Text>{title}</Text>
    </Pressable>
  );
}

export default function GamesMenuScreen() {
  const nav = useNavigation<any>();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#D7F7C8" }}>
      {/* аватар справа сверху — декоративно */}
      <View style={{ position: "absolute", right: 22, top: 22, width: 84, height: 84, borderRadius: 42, backgroundColor: "#f9c2f0", borderWidth: 3, borderColor: "#b34fb7" }} />
      {/* стрелка назад */}
      <Text style={{ position: "absolute", left: 20, top: 90, fontSize: 22 }} onPress={() => nav.goBack()}>←</Text>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Pill title="Отсортируй мусор" onPress={() => nav.navigate("CatchGame")} />
        <Pill title="Викторина" onPress={() => {/* TODO: добавить экран викторины */}} />
      </View>
    </SafeAreaView>
  );
}
