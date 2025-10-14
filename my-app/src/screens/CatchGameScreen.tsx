import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Dimensions, GestureResponderEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

type Ball = { id: number; x: number; y: number; vy: number; r: number };

const BG = "#D7F7C8";
const BALL_COLOR = "#ff5a58";
const PADDLE_W = 80;
const PADDLE_H = 140; // как на макете — вертикальная «колонка»
const SPAWN_EVERY_MS = [600, 1100]; // интервал спавна случайный в этом диапазоне
const GRAVITY = 1200; // px/s^2
const MAX_BALLS = 12;

export default function CatchGameScreen() {
  const nav = useNavigation<any>();
  const { width: W, height: H } = Dimensions.get("window");

  // состояние для отрисовки
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0); // чтобы форсить рендер по RAF

  // рефы игрового мира (без лишних ререндеров)
  const ballsRef = useRef<Ball[]>([]);
  const paddleXRef = useRef(W / 2 - PADDLE_W / 2);
  const lastTsRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idRef = useRef(1);

  const reset = () => {
    ballsRef.current = [];
    setScore(0);
    paddleXRef.current = W / 2 - PADDLE_W / 2;
    lastTsRef.current = null;
  };

  // спавн шариков
  const scheduleSpawn = useCallback(() => {
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    const ms =
      Math.floor(Math.random() * (SPAWN_EVERY_MS[1] - SPAWN_EVERY_MS[0])) + SPAWN_EVERY_MS[0];
    spawnTimerRef.current = setTimeout(() => {
      if (!paused && ballsRef.current.length < MAX_BALLS) {
        const r = 12; // радиус
        const x = Math.max(r, Math.min(W - r, Math.random() * W));
        ballsRef.current.push({
          id: idRef.current++,
          x,
          y: -r - 10,
          vy: 0,
          r,
        });
      }
      scheduleSpawn();
    }, ms);
  }, [paused, W]);

  // игровой цикл
  const step = useCallback((ts: number) => {
    if (paused) return;

    if (lastTsRef.current == null) lastTsRef.current = ts;
    const dt = Math.min(32, ts - lastTsRef.current) / 1000; // сек, ограничим «скачки»
    lastTsRef.current = ts;

    // апдейт шаров
    const paddleX = paddleXRef.current;
    const paddleRect = {
      x1: paddleX,
      x2: paddleX + PADDLE_W,
      y1: H - PADDLE_H - 40, // отступ от низа
      y2: H - 40,
    };

    const keep: Ball[] = [];
    for (const b of ballsRef.current) {
      // скорость + позиция
      b.vy += GRAVITY * dt;
      b.y += b.vy * dt;

      // столкновение с «корзиной» (прямоугольник)
      const hitY = b.y + b.r >= paddleRect.y1 && b.y - b.r <= paddleRect.y2;
      const hitX = b.x + b.r >= paddleRect.x1 && b.x - b.r <= paddleRect.x2;
      if (hitX && hitY) {
        setScore((s) => s + 1);
        continue; // пойман — не сохраняем
      }

      // если улетел вниз — просто пропускаем
      if (b.y - b.r > H + 60) continue;

      keep.push(b);
    }
    ballsRef.current = keep;

    setTick((t) => (t ^ 1)); // маленькое изменение, чтобы перерисовать

    rafRef.current = requestAnimationFrame(step);
  }, [H, paused]);

  // запуск/остановка игры
  useEffect(() => {
    if (!paused) {
      rafRef.current = requestAnimationFrame(step);
      scheduleSpawn();
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
      rafRef.current = null;
      spawnTimerRef.current = null;
    };
  }, [paused, scheduleSpawn, step]);

  // управление пальцем
  const onTouchMove = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.locationX;
    const left = Math.max(0, Math.min(W - PADDLE_W, x - PADDLE_W / 2));
    paddleXRef.current = left;
  };

  const onTouchStart = (e: GestureResponderEvent) => onTouchMove(e);

  // пауза/меню
  const togglePause = () => setPaused((p) => !p);
  const exit = () => {
    setPaused(true);
    reset();
    nav.goBack();
  };

  // отрисовка
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: BG }}
      onStartShouldSetResponder={() => true}
      onResponderMove={onTouchMove}
      onResponderStart={onTouchStart}
    >
      {/* HUD */}
      <View style={{ position: "absolute", left: 16, top: 90, zIndex: 20 }}>
        <Text style={{ fontSize: 20 }}>Собрано: {score}</Text>
      </View>

      {/* меню (гамбургер) */}
      <Pressable
        onPress={togglePause}
        style={{ position: "absolute", right: 16, top: 80, padding: 10, zIndex: 10 }}
      >
        <Text style={{ fontSize: 22 }}>≡</Text>
      </Pressable>

      {/* шары */}
      {ballsRef.current.map((b) => (
        <View
          key={b.id}
          style={{
            position: "absolute",
            width: b.r * 2,
            height: b.r * 2,
            borderRadius: b.r,
            backgroundColor: BALL_COLOR,
            left: b.x - b.r,
            top: b.y - b.r,
          }}
        />
      ))}

      {/* платформа-корзина */}
      <View
        style={{
          position: "absolute",
          width: PADDLE_W,
          height: PADDLE_H,
          borderRadius: 12,
          backgroundColor: "#444",
          left: paddleXRef.current,
          bottom: 40,
        }}
      />

      {/* Пауза-оверлей */}
      {paused && (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(0,0,0,0.35)",
            alignItems: "center",
            justifyContent: "center",
          } as any}
        >
          <View
            style={{
              width: "80%",
              backgroundColor: "#fff",
              borderRadius: 18,
              padding: 20,
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            }}
          >
            <Text style={{ fontSize: 18, marginBottom: 16 }}>Пауза</Text>
            <Pressable
              onPress={() => setPaused(false)}
              style={({ pressed }) => ({
                width: "100%",
                paddingVertical: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "#222",
                alignItems: "center",
                marginBottom: 12,
                backgroundColor: pressed ? "#e6f6e1" : "#fff",
              })}
            >
              <Text>Продолжить</Text>
            </Pressable>
            <Pressable
              onPress={exit}
              style={({ pressed }) => ({
                width: "100%",
                paddingVertical: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "#222",
                alignItems: "center",
                backgroundColor: pressed ? "#ffd6d6" : "#fff",
              })}
            >
              <Text>Выйти</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

import { StyleSheet } from "react-native";
