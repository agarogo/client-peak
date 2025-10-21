// src/storage/reset.ts
import { setLocalCoins } from "./wallet";
import { setTrees } from "./trees";

/** Полный локальный сброс: 0 монет, пустые слоты деревьев */
export async function resetProgress() {
  await setLocalCoins(0);
  await setTrees([]); // убрать все деревья/уровни
}
