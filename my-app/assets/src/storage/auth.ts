// src/storage/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "auth_token";

export async function saveToken(token: string) {
  await AsyncStorage.setItem(KEY, token);
}
export async function getToken() {
  return AsyncStorage.getItem(KEY);
}
export async function clearToken() {
  await AsyncStorage.removeItem(KEY);
}
