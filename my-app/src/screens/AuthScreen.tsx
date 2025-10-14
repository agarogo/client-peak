import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = "https://backoik-back.up.railway.app";
type Mode = "login" | "register";

// Настройки
const SCALE_MIN = 0.02;        // вместо 5px используем масштаб по X
const SQUASH_DUR = 320;
const REVEAL_DUR = 420;
const CONTENT_FADE_DUR = 200;
const CONTENT_FADE_DELAY = 120;
const DROP_OFFSET = 140;
const SHAKE_AMPLITUDE = 5;
const SHAKE_SPEED = 40;

export default function AuthScreen() {
  const navigation = useNavigation<any>();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  const [emailOrLogin, setEmailOrLogin] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");

  const { width: W } = Dimensions.get("window");
  const cardWidth = useMemo(() => Math.min(600, W * 0.9), [W]);

  // ВСЕ анимации — на native driver (никаких width)
  const scaleX = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const translateXShake = useRef(new Animated.Value(0)).current;
  const scaleYImpact = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;

  // Входная анимация
  useEffect(() => {
    translateY.setValue(DROP_OFFSET);
    contentOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        stiffness: 220,
        damping: 20,
        mass: 0.9,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 280,
        delay: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const shakeX = () =>
    new Promise<void>((resolve) => {
      Animated.sequence([
        Animated.timing(translateXShake, { toValue: -SHAKE_AMPLITUDE, duration: SHAKE_SPEED, useNativeDriver: true }),
        Animated.timing(translateXShake, { toValue: SHAKE_AMPLITUDE, duration: SHAKE_SPEED, useNativeDriver: true }),
        Animated.timing(translateXShake, { toValue: -SHAKE_AMPLITUDE * 0.6, duration: SHAKE_SPEED, useNativeDriver: true }),
        Animated.timing(translateXShake, { toValue: SHAKE_AMPLITUDE * 0.3, duration: SHAKE_SPEED, useNativeDriver: true }),
        Animated.timing(translateXShake, { toValue: 0, duration: SHAKE_SPEED, useNativeDriver: true }),
      ]).start(() => resolve());
    });

  const impactSquash = () =>
    new Promise<void>((resolve) => {
      Animated.sequence([
        Animated.timing(scaleYImpact, { toValue: 0.96, duration: 70, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(scaleYImpact, { toValue: 1.0, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start(() => resolve());
    });

  // Главный переход без layout-коллапса (scaleX вместо width)
  const animateSwitch = (next: Mode) => {
    if (animating) return;
    setAnimating(true);

    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: CONTENT_FADE_DUR,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: DROP_OFFSET,
        duration: 260,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scaleX, {
        toValue: SCALE_MIN,
        duration: SQUASH_DUR,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMode(next);

      Animated.spring(translateY, {
        toValue: 0,
        stiffness: 340,
        damping: 18,
        mass: 0.8,
        useNativeDriver: true,
      }).start(async () => {
        await Promise.all([impactSquash(), shakeX()]);
        Animated.parallel([
          Animated.timing(scaleX, {
            toValue: 1,
            duration: REVEAL_DUR,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: CONTENT_FADE_DUR + 80,
            delay: CONTENT_FADE_DELAY,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start(() => setAnimating(false));
      });
    });
  };

  const onToggle = () => animateSwitch(mode === "login" ? "register" : "login");

  // сеть
  const doLogin = async (username: string, pwd: string) => {
    const res = await fetch(`${BASE_URL}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password: pwd }).toString(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || "Ошибка входа");
    const token: string | undefined = data?.access_token;
    if (!token) throw new Error("Токен не получен");
    await AsyncStorage.setItem("auth_token", token);
    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  };

  const submitLogin = async () => {
    if (!emailOrLogin || !password) return Alert.alert("Ошибка", "Заполни почту/логин и пароль");
    setLoading(true);
    try { await doLogin(emailOrLogin, password); } 
    catch (e: any) { Alert.alert("Ошибка входа", e?.message ?? String(e)); } 
    finally { setLoading(false); }
  };

  const submitRegister = async () => {
    if (!nickname || !email || !password) return Alert.alert("Ошибка", "Заполни имя, почту и пароль");
    setLoading(true);
    try {
      const regRes = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          email,
          password,
          test1_percentage: 0,
          test2_percentage: 0,
          test3_percentage: 0,
          test4_percentage: 0,
        }),
      });
      const regData = await regRes.json().catch(() => ({}));
      if (!regRes.ok) throw new Error(regData?.detail || "Ошибка регистрации");
      await doLogin(email, password);
    } catch (e: any) {
      Alert.alert("Ошибка регистрации", e?.message ?? String(e));
    } finally { setLoading(false); }
  };

  // Карточка: фиксированная ширина (layout стабилен), все эффекты — трансформы
  const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <View style={{ width: cardWidth, alignSelf: "center" }}>
      <Animated.View
        style={{
          padding: 24,
          backgroundColor: "#fff",
          borderRadius: 22,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
          transform: [
            { translateY },
            { scaleX },               // СУЖЕНИЕ/РАСКРЫТИЕ
            { translateX: translateXShake },
            { scaleY: scaleYImpact },
          ],
          opacity: contentOpacity,
        }}
      >
        {children}
      </Animated.View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#D7F7C8" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "center" }}
      >
        <Card>
          {mode === "login" ? (
            <>
              <Text style={{ textAlign: "center", fontSize: 18, marginBottom: 12 }}>вход</Text>
              <TextInput
                placeholder="почта или логин"
                value={emailOrLogin}
                onChangeText={setEmailOrLogin}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#777"
                style={styles.input}
              />
              <TextInput
                placeholder="пароль"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#777"
                style={styles.input}
              />
              <Pressable
                onPress={submitLogin}
                disabled={loading || animating}
                style={({ pressed }) => [styles.button, { backgroundColor: pressed ? "#e6f6e1" : "#fff" }]}
              >
                {loading ? <ActivityIndicator /> : <Text style={{ fontSize: 16 }}>войти</Text>}
              </Pressable>
              <Text style={styles.link} onPress={onToggle}>нет аккаунта? зарегаться</Text>
            </>
          ) : (
            <>
              <Text style={{ textAlign: "center", fontSize: 18, marginBottom: 12 }}>рега</Text>
              <TextInput
                placeholder="фамилия и имя"
                value={nickname}
                onChangeText={setNickname}
                placeholderTextColor="#777"
                style={styles.input}
              />
              <TextInput
                placeholder="почта"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#777"
                style={styles.input}
              />
              <TextInput
                placeholder="пароль"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#777"
                style={styles.input}
              />
              <Pressable
                onPress={submitRegister}
                disabled={loading || animating}
                style={({ pressed }) => [styles.button, { backgroundColor: pressed ? "#e6f6e1" : "#fff" }]}
              >
                {loading ? <ActivityIndicator /> : <Text style={{ fontSize: 16 }}>зарегаться</Text>}
              </Pressable>
              <Text style={styles.link} onPress={onToggle}>уже есть? войти</Text>
            </>
          )}
        </Card>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = {
  input: {
    marginVertical: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#222",
    textAlign: "center" as const,
  },
  button: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#222",
    alignItems: "center" as const,
  },
  link: {
    textAlign: "center" as const,
    marginTop: 16,
    textDecorationLine: "underline" as const,
  },
};
