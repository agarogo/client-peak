// src/storage/trees.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export type TreeSlotId = "d1" | "d2" | "d3" | "d4" | "d5";
export type Tree = { slotId: TreeSlotId; level: number }; // 0..2

const KEY = "my_trees_v2";
export const ALL_SLOTS: TreeSlotId[] = ["d1", "d2", "d3", "d4", "d5"];

async function read(): Promise<Tree[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr
      .map((t) => ({ slotId: t?.slotId, level: Number(t?.level ?? 0) }))
      .filter((t) => ALL_SLOTS.includes(t.slotId as TreeSlotId) && Number.isFinite(t.level))
      .map((t) => ({ ...t, level: Math.max(0, Math.min(2, Math.floor(t.level))) }));
  } catch {
    return [];
  }
}
async function write(list: Tree[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function getTrees(): Promise<Tree[]> {
  return read();
}
export async function getTree(slotId: TreeSlotId): Promise<Tree | undefined> {
  const list = await read();
  return list.find((t) => t.slotId === slotId);
}
export async function hasTreeAt(slotId: TreeSlotId): Promise<boolean> {
  return Boolean(await getTree(slotId));
}
export async function buyTree(slotId: TreeSlotId): Promise<Tree> {
  const list = await read();
  if (list.find((t) => t.slotId === slotId)) throw new Error("Слот уже занят");
  const t: Tree = { slotId, level: 0 };
  list.push(t);
  await write(list);
  return t;
}
export async function upgradeTree(slotId: TreeSlotId): Promise<Tree> {
  const list = await read();
  const t = list.find((x) => x.slotId === slotId);
  if (!t) throw new Error("Дерево не куплено");
  if (t.level >= 2) throw new Error("Уровень максимальный");
  t.level += 1;
  await write(list);
  return t;
}
export async function setTrees(list: Tree[]) {
  await write(list);
}
