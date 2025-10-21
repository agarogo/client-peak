// src/api/client.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getToken, clearToken } from "../storage/auth";

/** Базовый адрес бэка (один-единственный экспорт, чтобы не было «already declared») */
export const BASE_URL = "https://eloquent-gentleness-backs.up.railway.app";

/** Опциональный хук на 401 (например, показать логин) */
let onUnauthorized: null | (() => void) = null;
export function setUnauthorizedHandler(fn: () => void) { onUnauthorized = fn; }

/** === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ === */

/** простейший base64url → строка (ASCII) без внешних пакетов */
function base64urlToAscii(input: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let str = input.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";

  let output = "";
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < str.length; i++) {
    const c = str.charAt(i);
    if (c === "=") break;
    const idx = chars.indexOf(c);
    if (idx === -1) continue;
    buffer = (buffer << 6) | idx;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      const byte = (buffer >> bits) & 0xff;
      output += String.fromCharCode(byte);
    }
  }
  return output;
}

/** Декодирование JWT (только payload) */
export function decodeJwt(token?: string | null): { header?: any; payload?: any } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const headerStr = base64urlToAscii(parts[0]);
    const payloadStr = base64urlToAscii(parts[1]);
    return {
      header: headerStr ? JSON.parse(headerStr) : undefined,
      payload: payloadStr ? JSON.parse(payloadStr) : undefined,
    };
  } catch {
    return null;
  }
}

/** Универсальный fetch с таймаутом/логами/разбором ошибок */
async function raw(path: string, init: RequestInit, timeoutMs = 15000) {
  const url = `${BASE_URL}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.headers as Record<string, string>),
      },
      signal: ctrl.signal,
    });

    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    // полезный лог
    console.log(
      "HTTP",
      res.status,
      (init.method || "GET"),
      path,
      "->",
      typeof data === "string" ? data.slice(0, 200) : data
    );

    if (!res.ok) {
      const detail = (data && (data.detail || data.message)) || res.statusText || "Request failed";
      const msg = typeof detail === "string"
        ? detail
        : Array.isArray(detail) && detail[0]?.msg
          ? detail[0].msg
          : JSON.stringify(detail);
      const err: any = new Error(msg);
      err.status = res.status;
      err.body = data;

      if (res.status === 401) {
        try { await clearToken(); } catch {}
        onUnauthorized?.();
      }
      throw err;
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}

/** «Пробуем несколько путей» — удобно, когда на бэке могут быть слэш-версии */
async function tryPaths<T>(paths: string[], make: (p: string) => Promise<T>): Promise<T> {
  let lastErr: any;
  for (const p of paths) {
    try { return await make(p); }
    catch (e: any) {
      lastErr = e;
      if (e?.status && ![404, 405].includes(e.status)) break;
    }
  }
  throw lastErr;
}

/** Из ответа /auth/token достаём токен/тип */
export function extractToken(data: any): { accessToken?: string; tokenType?: string } {
  if (!data) return {};
  const accessToken = data.access_token || data.token || data.accessToken;
  const rawType = data.token_type || data.tokenType || "bearer";
  const tokenType = typeof rawType === "string" ? rawType.toLowerCase() : "bearer";
  return { accessToken, tokenType };
}

/** === API === */
export const api = {
  /** Регистрация */
  register: (payload: { full_name: string; email_user: string; password: string; sex?: string }) =>
    tryPaths(["/users/", "/users"], (path) =>
      raw(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    ),

  /** Токен (OAuth2 password) */
  token: (username: string, password: string) =>
    raw("/auth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        username,
        password,
        grant_type: "password",
      }).toString(),
    }),

  /** Получить пользователя по id */
  getUserById: (id: number | string) =>
    raw(`/users/${id}`, { method: "GET" }),

  /** Список пользователей (для рейтинга) */
  listUsers: () =>
    raw("/users", { method: "GET" }),

  /**
   * Текущий пользователь: берём email из sub в JWT,
   * потом ищем в /users и запрашиваем /users/{id}
   */
  currentUser: async () => {
    const tokenRaw = await getToken();
    const token = (tokenRaw || "").trim().replace(/^"|"$/g, "");
    if (!token) { const e: any = new Error("Нет токена"); e.status = 401; throw e; }

    const decoded = decodeJwt(token);
    const subEmail = decoded?.payload?.sub;
    if (!subEmail || typeof subEmail !== "string") {
      throw new Error("В токене нет sub (email)");
    }

    // 1) пробуем получить всех пользователей (как в твоём бэке)
    let list: any = null;
    try {
      list = await tryPaths(["/users", "/users/"], (p) => raw(p, { method: "GET" }));
    } catch {
      // 2) если вдруг список не дался — пробуем филтрацию по email
      list = await raw(`/users?email_user=${encodeURIComponent(subEmail)}`, { method: "GET" });
    }

    const arr: any[] =
      Array.isArray(list) ? list : (Array.isArray(list?.items) ? list.items : []);

    const found = arr.find(
      (u) => String(u?.email_user).toLowerCase() === String(subEmail).toLowerCase()
    );
    if (!found?.id) throw new Error("Пользователь с таким email не найден");

    return api.getUserById(found.id);
  },

  /** Алиас */
  me: async () => api.currentUser(),

  /** Обновление своего профиля (если когда-нибудь понадобится) */
  updateMe: async (patch: Record<string, any>) => {
    const tokenRaw = await getToken();
    const token = (tokenRaw || "").trim().replace(/^"|"$/g, "");
    if (!token) { const e: any = new Error("Нет токена"); e.status = 401; throw e; }
    const headersAuth = { Authorization: `Bearer ${token}` };
    return raw("/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...headersAuth },
      body: JSON.stringify(patch),
    });
  },

  /**
   * Результат игры: если бэк принимает — вернёт {awarded, coins}
   * Идёт с Authorization Bearer <token>
   */
  postGameResult: async (score: number, duration_sec: number) => {
    const tokenRaw = await getToken();
    const token = (tokenRaw || "").trim().replace(/^"|"$/g, "");
    if (!token) { const e: any = new Error("Нет токена"); e.status = 401; throw e; }

    const headersAuth = { Authorization: `Bearer ${token}` };

    return tryPaths(["/quizes/games/result", "/quizes/games/result/"], (path) =>
      raw(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headersAuth },
        body: JSON.stringify({ score, duration_sec }),
      })
    );
  },
};
