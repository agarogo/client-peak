// src/api/client.ts
import { getToken } from "../storage/auth";

export const BASE_URL = "https://backoik-back.up.railway.app";

async function request(path: string, init: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, init);
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || res.statusText || "Request failed";
    const err: any = new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    (err.status = res.status);
    throw err;
  }
  return data;
}

async function authRequest(path: string, init: RequestInit = {}) {
  const token = await getToken();
  if (!token) {
    const e: any = new Error("No auth token");
    e.status = 401;
    throw e;
  }
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  // JSON по умолчанию можно не ставить; добавляй при POST/PUT
  return request(path, { ...init, headers });
}

export const api = {
  register: (payload: {
    nickname: string; email: string; password: string;
    test1_percentage?: number; test2_percentage?: number;
    test3_percentage?: number; test4_percentage?: number;
  }) =>
    request("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        test1_percentage: 0, test2_percentage: 0, test3_percentage: 0, test4_percentage: 0,
        ...payload,
      }),
    }),

  token: (emailOrLogin: string, password: string) =>
    request("/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: emailOrLogin, password }).toString(),
    }),

  // ⚠️ если у тебя другой путь (например /users/me) — поменяй здесь
  me: () => authRequest("/me", { method: "GET" }),
  // пример: финансы/баланс, если есть отдельная ручка
  balance: () => authRequest("/balance", { method: "GET" }),
};
