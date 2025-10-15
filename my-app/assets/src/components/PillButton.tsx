import React from "react";
import { View, Text, Pressable } from "react-native";

export function DebugPillButton({ onPress, title = "войти" }: { onPress: () => void; title?: string }) {
  return (
    <View style={{ width: "90%", alignSelf: "center", marginTop: 14 }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          {
            // заметный контейнер-копия поля ввода:
            paddingVertical: 12,
            paddingHorizontal: 18,
            borderRadius: 999,
            borderWidth: 2,          // потолще, чтобы было видно
            borderColor: "#222",
            backgroundColor: pressed ? "#e6f6e1" : "#fff",
            alignItems: "center",
            
            justifyContent: "center",
          },
        ]}
      >
        <Text style={{ fontSize: 18, color: "#111", alignSelf: "center" }}>{title}</Text>
      </Pressable>
    </View>
  );
}
