// src/api/client.ts
export const BASE_URL = "https://backoik-back.up.railway.app";

async function request(path: string, init: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, init);
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = data?.detail || data?.message || res.statusText || "Request failed";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

export const api = {
  // /register принимает JSON с nickname/email/password и твоими test полями
  register: (payload: {
    nickname: string;
    email: string;
    password: string;
    test1_percentage?: number;
    test2_percentage?: number;
    test3_percentage?: number;
    test4_percentage?: number;
  }) =>
    request("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        test1_percentage: 0,
        test2_percentage: 0,
        test3_percentage: 0,
        test4_percentage: 0,
        ...payload,
      }),
    }),

  // /token ждёт x-www-form-urlencoded: username + password
  token: (emailOrLogin: string, password: string) =>
    request("/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        username: emailOrLogin,
        password,
      }).toString(),
    }),
};
