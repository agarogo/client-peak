import React from "react";
import { SafeAreaView, View, Text, Pressable } from "react-native";
import { clearToken } from "../storage/auth";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../App";
import "../../global.css";

type P = NativeStackScreenProps<RootStackParamList, "Home">;

function MenuButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 220,
        paddingVertical: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#222",
        backgroundColor: pressed ? "#cdeec4" : "#bfe5b4",
        alignItems: "center",
        marginVertical: 12,
      })}
    >
      <Text>{title}</Text>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }: P) {
  const logout = async () => {
    await AsyncStorage.removeItem("auth_token");
    // Было: routes: [{ name: "Login" }]
    navigation.reset({
      index: 0,
      routes: [{ name: "Auth" }],
    }); 

  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#D7F7C8" }}>
      {/* аватар в правом верхнем углу */}
      <View style={{ position: "absolute", right: 22, top: 22, width: 96, height: 96, borderRadius: 48, backgroundColor: "#f9c2f0", borderWidth: 3, borderColor: "#b34fb7", alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: "#b34fb7" }} />
        <View style={{ position: "absolute", bottom: 12, width: 48, height: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: "#fff", borderWidth: 2, borderColor: "#b34fb7" }} />
      </View>

      {/* центр меню */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <MenuButton title="мой лес" onPress={() => {}} />
        <MenuButton title="игры" onPress={() => navigation.navigate("GamesMenu")} />
        <MenuButton title="магазин" onPress={() => {}} />
        <Text onPress={logout} style={{ marginTop: 20, textDecorationLine: "underline" }}>
          выйти
        </Text>
      </View>
    </SafeAreaView>
  );
}
