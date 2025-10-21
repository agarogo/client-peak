import React, { useRef, useState } from "react";
import {
  Alert, Animated, Easing, KeyboardAvoidingView, Platform,
  Text, TextInput, ActivityIndicator, View, StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, extractToken } from "../api/client";
import { saveToken } from "../storage/auth";
import { saveLastLogin } from "../storage/auth";

type Mode = "login" | "register";

function ViewButton({ title, onPress, disabled, loading }:{
  title: string; onPress: () => void; disabled?: boolean; loading?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const bg = pressed ? "#cdeec4" : "#bfe5b4";
  return (
    <View
      style={[styles.vBtn, { backgroundColor: bg, opacity: disabled ? 0.55 : 1 }]}
      onStartShouldSetResponder={() => !disabled}
      onResponderGrant={() => !disabled && setPressed(true)}
      onResponderRelease={() => { setPressed(false); if (!disabled) onPress(); }}
      onResponderTerminate={() => setPressed(false)}
    >
      {loading ? <ActivityIndicator /> : <Text style={styles.vBtnText}>{title}</Text>}
    </View>
  );
}

function SexSelect({ value, onChange }:{ value: string; onChange: (v: string) => void; }) {
  const options = [
    { key: "m", label: "мужской" },
    { key: "f", label: "женский" },
    { key: "u", label: "другое" },
  ];
  return (
    <View style={{ marginTop: 6 }}>
      <Text style={styles.label}>пол</Text>
      <View style={styles.sexRow}>
        {options.map((opt) => {
          const selected = value === opt.key;
          return (
            <View
              key={opt.key}
              style={[styles.sexChip, selected && styles.sexChipSelected]}
              onStartShouldSetResponder={() => true}
              onResponderRelease={() => onChange(opt.key)}
            >
              <Text style={[styles.sexChipText, selected && styles.sexChipTextSelected]}>
                {opt.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function AuthScreen() {
  const navigation = useNavigation<any>();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  // поля
  const [emailOrLogin, setEmailOrLogin] = useState("");
  const [password, setPassword] = useState("");

  // регистрация
  const [fullName, setFullName] = useState("");
  const [sex, setSex] = useState<"m" | "f" | "u" | "">("");
  const [email, setEmail] = useState("");

  // анимация карточки
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animateSwitch = (next: Mode) => {
    if (animating) return;
    setAnimating(true);
    Animated.parallel([
      Animated.timing(scale, { toValue: 0.7, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setMode(next);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.05, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
        Animated.timing(scale, { toValue: 1, duration: 100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start(() => setAnimating(false));
    });
  };

  const onToggle = () => animateSwitch(mode === "login" ? "register" : "login");

  const afterAuth = async () => {
    try {
      // сохраним последний логин (поможет, если sub не id)
      if (emailOrLogin) await saveLastLogin(emailOrLogin);
      // заранее определим и запомним user_id, чтобы Home мог сразу стянуть профиль
      await api.ensureUserId();
    } catch (e) {
      // не критично — Home всё равно попробует ещё раз
      console.log("ensureUserId failed:", e);
    }
    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  };

  const submitLogin = async () => {
    if (!emailOrLogin || !password) return Alert.alert("Ошибка", "Заполни почту/логин и пароль");
    setLoading(true);
    try {
      const tokenResp = await api.token(emailOrLogin, password);
      const { accessToken } = extractToken(tokenResp);
      if (!accessToken) throw new Error("Токен не получен от сервера");
      await saveToken(accessToken);
      await afterAuth();
    } catch (e: any) {
      console.log("LOGIN ERROR:", e?.status, e?.message, e?.body);
      Alert.alert("Ошибка входа", e?.message ?? String(e));
    } finally { setLoading(false); }
  };

  const submitRegister = async () => {
    if (!fullName || !email || !password) return Alert.alert("Ошибка", "Заполни имя, почту и пароль");
    setLoading(true);
    try {
      await api.register({ full_name: fullName, email_user: email, password, sex: sex || undefined });
      const tokenResp = await api.token(email, password);
      const { accessToken } = extractToken(tokenResp);
      if (!accessToken) throw new Error("Токен не получен от сервера");
      await saveToken(accessToken);
      setEmailOrLogin(email); // чтобы afterAuth сохранил lastLogin
      await afterAuth();
    } catch (e: any) {
      console.log("REGISTER ERROR:", e?.status, e?.message, e?.body);
      Alert.alert("Ошибка регистрации", e?.message ?? String(e));
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#D7F7C8" }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "center" }}>
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Animated.View style={styles.card(scale, opacity)}>
            {mode === "login" ? (
              <>
                <Text style={styles.title}>Авторизация</Text>
                <TextInput
                  placeholder="почта (или username)"
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
                <ViewButton title="войти" onPress={submitLogin} disabled={loading} loading={loading} />
                <Text style={styles.link} onPress={onToggle}>нет аккаунта? зарегаться</Text>
              </>
            ) : (
              <>
                <Text style={styles.title}>Регистрация</Text>
                <Text style={styles.label}>фамилия и имя</Text>
                <TextInput placeholder="Иванов Иван" value={fullName} onChangeText={setFullName} placeholderTextColor="#777" style={styles.input} />
                <SexSelect value={sex} onChange={(v) => setSex(v as any)} />
                <Text style={styles.label}>почта</Text>
                <TextInput placeholder="email@example.com" value={email} onChangeText={setEmail}
                  autoCapitalize="none" keyboardType="email-address" placeholderTextColor="#777" style={styles.input} />
                <Text style={styles.label}>пароль</Text>
                <TextInput placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry
                  placeholderTextColor="#777" style={styles.input} />
                <ViewButton title="зарегаться" onPress={submitRegister} disabled={loading} loading={loading} />
                <Text style={styles.link} onPress={onToggle}>уже есть? войти</Text>
              </>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { textAlign: "center", fontSize: 18, marginBottom: 12 },
  label: { marginLeft: 4, marginTop: 8, marginBottom: 4, color: "#555", fontSize: 13 },
  input: {
    marginVertical: 6, paddingVertical: 12, paddingHorizontal: 18,
    borderRadius: 999, borderWidth: 1, borderColor: "#000000ff", textAlign: "center",
  },
  link: { textAlign: "center", marginTop: 16, textDecorationLine: "underline" },
  vBtn: {
    width: "100%", paddingVertical: 14, borderRadius: 999, borderWidth: 1, borderColor: "#222",
    alignItems: "center", justifyContent: "center", marginTop: 14,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  vBtnText: { fontSize: 16, fontWeight: "600" },
  card: (scale: Animated.Value, opacity: Animated.Value) => ({
    width: "90%", backgroundColor: "#fff", borderRadius: 22, padding: 24,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
    transform: [{ scale }], opacity,
  }),
  sexRow: { flexDirection: "row", gap: 10 },
  sexChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: "#cfd6cf", backgroundColor: "#fff" },
  sexChipSelected: { borderColor: "#1b7f4a", backgroundColor: "#e9f7ef" },
  sexChipText: { color: "#333", fontWeight: "600" },
  sexChipTextSelected: { color: "#0b5f37" },
});
