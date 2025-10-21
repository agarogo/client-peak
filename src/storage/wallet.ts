/* eslint-disable @typescript-eslint/no-explicit-any */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api/client";

const KEY = "local_coins";

/** ==== базовые операции ==== */
export async function getLocalCoins(): Promise<number> {
  const s = await AsyncStorage.getItem(KEY);
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}
export async function setLocalCoins(v: number) {
  await AsyncStorage.setItem(KEY, String(Math.max(0, Math.floor(v))));
}
export async function addLocalCoins(delta: number): Promise<number> {
  const cur = await getLocalCoins();
  const next = Math.max(0, Math.floor(cur + delta));
  await setLocalCoins(next);
  return next;
}

/** ==== чтение с приоритетом сервера (если доступен) ==== */
export async function getCoinsPreferServer(): Promise<{
  coins: number;
  source: "server" | "local";
  user?: any;
}> {
  try {
    const user = await api.currentUser();
    const remote = Number(user?.coins ?? 0);
    if (Number.isFinite(remote)) {
      await setLocalCoins(remote); // синхроним локальный
      return { coins: remote, source: "server", user };
    }
  } catch {}
  const local = await getLocalCoins();
  return { coins: local, source: "local" };
}

/** ==== награда за игру ==== */
export function computeAward(score: number, _durationSec: number): number {
  // 1 coin за 1 score (можешь поменять логику)
  return Math.max(0, Math.floor(score));
}

export async function awardCoins(score: number, durationSec: number): Promise<{
  awarded: number;
  total: number;
  source: "server" | "local";
}> {
  const fallbackAward = computeAward(score, durationSec);
  try {
    const resp = await api.postGameResult(score, durationSec); // может 401/timeout
    const awarded = Number(resp?.awarded ?? fallbackAward);
    const serverCoins = Number(resp?.coins);
    if (Number.isFinite(serverCoins)) {
      await setLocalCoins(serverCoins);
      return { awarded, total: serverCoins, source: "server" };
    }
    const total = await addLocalCoins(awarded);
    return { awarded, total, source: "local" };
  } catch {
    const total = await addLocalCoins(fallbackAward);
    return { awarded: fallbackAward, total, source: "local" };
  }
}

/** ==== магазин: потратить монеты локально ==== */
export async function canAfford(amount: number): Promise<boolean> {
  return (await getLocalCoins()) >= amount;
}
export async function spendCoins(amount: number): Promise<{
  ok: true;
  total: number;
  source: "local";
}> {
  const cur = await getLocalCoins();
  if (cur < amount) throw new Error("Недостаточно монет");
  const next = cur - amount;
  await setLocalCoins(next);
  // если позже появится серверный метод, тут можно делать попытку PATCH
  return { ok: true, total: next, source: "local" };
}
