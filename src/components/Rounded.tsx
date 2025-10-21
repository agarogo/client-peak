import React from "react";
import { TextInput, View, Text, Pressable } from "react-native";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        marginTop: 60,
        marginHorizontal: 20,
        padding: 24,
        backgroundColor: "#fff",
        borderRadius: 22,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      }}
    >
      {children}
    </View>
  );
}

export const Field = React.forwardRef<TextInput, React.ComponentProps<typeof TextInput>>(
  (props, ref) => (
    <TextInput
      ref={ref}
      placeholderTextColor="#777"
      {...props}
      style={[
        {
          marginVertical: 10,
          paddingVertical: 12,
          paddingHorizontal: 18,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: "#222",
          textAlign: "center",
        },
        props.style,
      ]}
    />
  )
);

export function PillButton({
  title,
  onPress,
}: { title: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        marginVertical: 10,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#222",
        alignItems: "center",
        backgroundColor: pressed ? "#e6f6e1" : "#fff",
      })}
    >
      <Text style={{ fontSize: 16 }}>{title}</Text>
    </Pressable>
  );
}
