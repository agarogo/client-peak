import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
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
import { DebugPillButton } from "../components/PillButton";

const BASE_URL = "https://backoik-back.up.railway.app";
type Mode = "login" | "register";

export default function AuthScreen() {
  const navigation = useNavigation<any>();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  const [emailOrLogin, setEmailOrLogin] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  

  // Анимации (нативный драйвер)
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  /** Простая анимация "уменьшилась и исчезла → увеличилась и появилась" */
  const animateSwitch = (next: Mode) => {
  if (animating) return;
  setAnimating(true);

  // Фаза 1: уменьшиться и пропасть
  Animated.parallel([
    Animated.timing(scale, {
      toValue: 0.7,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }),
    Animated.timing(opacity, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }),
  ]).start(() => {
    // Переключаем контент, когда он уже спрятан
    setMode(next);

    // Фаза 2: появиться и слегка «подпрыгнуть»
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => setAnimating(false));
  });
};


  const onToggle = () => animateSwitch(mode === "login" ? "register" : "login");

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#D7F7C8" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "center" }}
      >
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Animated.View
            style={{
              width: "90%",
              backgroundColor: "#fff",
              borderRadius: 22,
              padding: 24,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
              transform: [{ scale }],
              opacity,
            }}
          >
            {mode === "login" ? (
              <>
                <Text style={{ textAlign: "center", fontSize: 18, marginBottom: 12 }}>Авторизация</Text>
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
                
                <DebugPillButton title="войти" onPress={submitLogin} />
                
                <Text style={styles.link} onPress={onToggle}>нет аккаунта? зарегаться</Text>
              </>
            ) : (
              <>
                <Text style={{ textAlign: "center", fontSize: 18, marginBottom: 12 }}>Регистрация</Text>
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
                <DebugPillButton title="зарегаться" onPress={submitRegister} />
                <Text style={styles.link} onPress={onToggle}>уже есть? войти</Text>
              </>
            )}
          </Animated.View>
        </View>
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
    borderColor: "#000000ff",
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
