import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_TOKEN = "auth_token";
const KEY_USER_ID = "auth_user_id";
const KEY_LAST_LOGIN = "auth_last_login";

export async function saveToken(token: string) {
  await AsyncStorage.setItem(KEY_TOKEN, token);
}
export async function getToken() {
  return AsyncStorage.getItem(KEY_TOKEN);
}
export async function clearToken() {
  await AsyncStorage.removeItem(KEY_TOKEN);
}

export async function saveUserId(id: number | string) {
  await AsyncStorage.setItem(KEY_USER_ID, String(id));
}
export async function getUserId(): Promise<string | null> {
  return AsyncStorage.getItem(KEY_USER_ID);
}
export async function clearUserId() {
  await AsyncStorage.removeItem(KEY_USER_ID);
}

export async function saveLastLogin(login: string) {
  await AsyncStorage.setItem(KEY_LAST_LOGIN, login);
}
export async function getLastLogin() {
  return AsyncStorage.getItem(KEY_LAST_LOGIN);
}
export async function clearLastLogin() {
  await AsyncStorage.removeItem(KEY_LAST_LOGIN);
}

/** Полная очистка локальной auth-информации */
export async function clearAuth() {
  await Promise.all([clearToken(), clearUserId(), clearLastLogin()]);
}
