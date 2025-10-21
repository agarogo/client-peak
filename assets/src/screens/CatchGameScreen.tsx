// src/screens/CatchGameScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Dimensions,
  GestureResponderEvent,
  StyleSheet,
  LayoutChangeEvent,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

type Ball = { id: number; x: number; y: number; vy: number; r: number };

const BG = "#D7F7C8";              // фон экрана
const CARD = "#ffffff";             // белое поле
const BALL_COLOR = "#ff5a58";

const RADIUS = 24;                  // скругление белого поля
const M_H = 20, M_T = 20, M_B = 10; // отступы белого поля

const PADDLE_W = 56;
const PADDLE_H = 120;
const PADDLE_BOTTOM = 28;           // отступ «корзины» от низа белого поля

const GRAVITY = 1200;
const MAX_BALLS = 12;
const SPAWN_MIN = 600;
const SPAWN_MAX = 1100;

// === PNG для «корзины» ===
// положи картинку в assets и пропиши путь (регистр важен!)
// если хочешь оставить серый блок — поставь PADDLE_IMG = null
const PADDLE_IMG = require("../../assets/Catch.png"); // <-- замени на свой путь

export default function CatchGameScreen() {
  const nav = useNavigation<any>();
  const { width: W } = Dimensions.get("window");

  // ----- GAME STATE -----
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [tick, setTick] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  // ----- REFS -----
  const ballsRef = useRef<Ball[]>([]);
  const paddleXRef = useRef(0); // центрируем после layout поля
  const lastTsRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idRef = useRef(1);

  // размеры/позиция белого поля (чтобы всё происходило внутри него)
  const field = useRef({ left: 0, top: 0, width: W - M_H * 2, height: 0 });
  const onFieldLayout = (e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    field.current = { left: x, top: y, width, height };
    // центрируем «корзину» в поле
    paddleXRef.current = width / 2 - PADDLE_W / 2;
  };

  // helpers
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  const reset = useCallback(() => {
    ballsRef.current = [];
    setScore(0);
    setLives(3);
    setGameOver(false);
    setPaused(false);
    lastTsRef.current = null;
    // переставим в центр при следующем layout/кадре
  }, []);

  // spawn balls (в пределах ширины поля)
  const scheduleSpawn = useCallback(() => {
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    const ms = Math.floor(Math.random() * (SPAWN_MAX - SPAWN_MIN)) + SPAWN_MIN;
    spawnTimerRef.current = setTimeout(() => {
      if (!paused && !gameOver && ballsRef.current.length < MAX_BALLS) {
        const r = 12;
        const fw = field.current.width;
        const x = clamp(Math.random() * fw, r + 6, fw - r - 6); // маленький внутренний отступ
        ballsRef.current.push({ id: idRef.current++, x, y: -r - 10, vy: 0, r });
      }
      scheduleSpawn();
    }, ms);
  }, [paused, gameOver]);

  // main loop (всё относительно высоты поля)
  const step = useCallback(
    (ts: number) => {
      if (paused || gameOver || countdown !== null) return;

      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = Math.min(32, ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      const fh = field.current.height;

      const paddleRect = {
        x1: paddleXRef.current,
        x2: paddleXRef.current + PADDLE_W,
        y1: fh - PADDLE_H - PADDLE_BOTTOM,
        y2: fh - PADDLE_BOTTOM,
      };

      const keep: Ball[] = [];
      let missed = 0;

      for (const b of ballsRef.current) {
        b.vy += GRAVITY * dt;
        b.y += b.vy * dt;

        const hitY = b.y + b.r >= paddleRect.y1 && b.y - b.r <= paddleRect.y2;
        const hitX = b.x + b.r >= paddleRect.x1 && b.x - b.r <= paddleRect.x2;
        if (hitX && hitY) {
          setScore((s) => s + 1);
          continue;
        }

        if (b.y - b.r > fh + 60) {
          missed++;
          continue;
        }

        keep.push(b);
      }
      ballsRef.current = keep;

      if (missed > 0) {
        setLives((L) => {
          const next = Math.max(0, L - missed);
          if (next === 0) {
            setGameOver(true);
            setPaused(true);
          }
          return next;
        });
      }

      setTick((t) => (t ^ 1));
      rafRef.current = requestAnimationFrame(step);
    },
    [paused, gameOver, countdown]
  );

  // run/stop loop + spawner
  useEffect(() => {
    if (!paused && !gameOver && countdown === null) {
      rafRef.current = requestAnimationFrame(step);
      scheduleSpawn();
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
      rafRef.current = null;
      spawnTimerRef.current = null;
    };
  }, [paused, gameOver, countdown, step, scheduleSpawn]);

  // input — двигаем «корзину» ТОЛЬКО внутри белого поля
  const updatePaddleByPageX = (pageX: number) => {
    const left = field.current.left;
    const fw = field.current.width;
    const xLocal = pageX - left;
    const newLeft = clamp(xLocal - PADDLE_W / 2, 0, fw - PADDLE_W);
    paddleXRef.current = newLeft;
  };
  const onTouchMove = (e: GestureResponderEvent) => {
    if (paused || gameOver || countdown !== null) return;
    updatePaddleByPageX(e.nativeEvent.pageX);
  };
  const onTouchStart = (e: GestureResponderEvent) => {
    if (paused || gameOver || countdown !== null) return;
    updatePaddleByPageX(e.nativeEvent.pageX);
  };

  // pause / resume (3..2..1)
  const togglePause = () => {
    if (gameOver) return;
    if (paused) {
      setCountdown(3);
      const t = setInterval(() => {
        setCountdown((n) => {
          if (n && n > 1) return n - 1;
          clearInterval(t);
          setCountdown(null);
          setPaused(false);
          lastTsRef.current = null;
          return null;
        });
      }, 1000);
    } else {
      setPaused(true);
    }
  };

  const exitToMenu = () => nav.navigate("GamesMenu");

  const restart = () => {
    reset();
    lastTsRef.current = null;
  };

  // ----- render -----
  return (
    <SafeAreaView style={styles.safe}>
      {/* Белое игровое поле */}
      <View
        style={styles.card}
        onLayout={onFieldLayout}
        onStartShouldSetResponder={() => !paused && !gameOver && countdown === null}
        onResponderStart={onTouchStart}
        onResponderMove={onTouchMove}
      >
        {/* HUD слева сверху — 2 строки */}
        <View style={styles.hudLeftTop}>
          <Text style={styles.hudText}>score: {score}</Text>
          <Text style={styles.hudText}>жизни: {lives}</Text>
        </View>
        {/* гамбургер */}
        <Pressable onPress={togglePause} hitSlop={10} style={styles.hamburger}>
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

        {/* корзина — PNG или серый прямоугольник */}
        {PADDLE_IMG ? (
          <Image
            source={PADDLE_IMG}
            resizeMode="contain"
            style={{
              position: "absolute",
              width: PADDLE_W,
              height: PADDLE_H,
              left: paddleXRef.current,
              bottom: PADDLE_BOTTOM,
            }}
          />
        // <View
        //     style={{
        //       position: "absolute",
        //       width: PADDLE_W,
        //       height: PADDLE_H,
        //       borderRadius: 12,
        //       backgroundColor: "#444",
        //       left: paddleXRef.current,
        //       bottom: PADDLE_BOTTOM,
        //     }}
        //   />
        ) : (
          <View
            style={{
              position: "absolute",
              width: PADDLE_W,
              height: PADDLE_H,
              borderRadius: 12,
              backgroundColor: "#444",
              left: paddleXRef.current,
              bottom: PADDLE_BOTTOM,
            }}
          />
        )}
      </View>

      {/* Пауза */}
      {paused && !gameOver && (
        <View pointerEvents="auto" style={styles.overlay}>
          {countdown === null ? (
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Пауза</Text>
              <Pressable onPress={togglePause} style={styles.pill}>
                <Text>Продолжить</Text>
              </Pressable>
              <Pressable onPress={exitToMenu} style={[styles.pill, styles.pillDanger]}>
                <Text>Выйти</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.countdown}>{countdown}</Text>
          )}
        </View>
      )}

      {/* Game Over */}
      {gameOver && (
        <View pointerEvents="auto" style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Game Over</Text>
            <Text style={{ marginBottom: 12 }}>Итоговый счёт: {score}</Text>
            <Pressable onPress={restart} style={styles.pill}>
              <Text>Заново</Text>
            </Pressable>
            <Pressable onPress={exitToMenu} style={[styles.pill, styles.pillDanger]}>
              <Text>В меню игр</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  card: {
    flex: 1,
    marginHorizontal: M_H,
    marginTop: M_T,
    marginBottom: M_B,
    backgroundColor: CARD,
    borderRadius: RADIUS,
    overflow: "hidden",
  },

  hudLeftTop: {
    position: "absolute",
    left: 16,
    top: 14,
    zIndex: 10,
  },
  hudText: { fontSize: 16 },

  hamburger: { position: "absolute", right: 16, top: 10, padding: 10, zIndex: 10 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modal: {
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
  },
  modalTitle: { fontSize: 18, marginBottom: 12 },
  pill: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#222",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#fff",
  },
  pillDanger: { backgroundColor: "#ffd6d6" },
  countdown: { fontSize: 64, color: "#fff", fontWeight: "600" },
});
