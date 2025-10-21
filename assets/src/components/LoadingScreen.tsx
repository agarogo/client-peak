import React, { useEffect, useRef } from "react";
import { Animated, Easing, SafeAreaView, StyleSheet, Text, View } from "react-native";

const TRACK_WIDTH = 260;
const TRACK_HEIGHT = 18;
const PILL_WIDTH = 140;

export default function LoadingScreen() {
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const distance = TRACK_WIDTH - PILL_WIDTH;

    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(x, {
          toValue: distance,
          duration: 1600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true, // надежно и на iOS/Android/Web
        }),
        Animated.timing(x, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [x]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressWrap}>
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.fill,
              {
                width: PILL_WIDTH,
                transform: [{ translateX: x }],
              },
            ]}
          />
        </View>
        <Text style={styles.label}>download</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#D7F7C8" },
  progressWrap: {
    position: "absolute", left: 0, right: 0, bottom: 120, alignItems: "center",
  },
  track: {
    width: TRACK_WIDTH, height: TRACK_HEIGHT, backgroundColor: "#FFFFFF",
    borderRadius: 999, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  fill: { height: "100%", borderRadius: 999, backgroundColor: "#A7F2BF" },
  label: { marginTop: 10, fontSize: 14, color: "#111" },
});
