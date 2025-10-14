// QuizScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

const rawQuiz: any = require("../../assets/data/eco_quiz_100.json");

type RootStackParamList = {
  // quizTxt больше не нужен; оставим только настройки жизней/таймера
  Quiz: { lives?: number; timePerQuestionMs?: number } | undefined;
};

type Question = {
  q: string;
  options: string[];      // перемешанные варианты
  correctIndex: number;   // индекс правильного в options
};

type RawItem = { q: string; correct: string; wrong: string[] };

const BG = "#D7F7C8";
const ACCENT = "#1b7f4a";
const DANGER = "#e74c3c";
const NEUTRAL = "#222";
const CARD = "#ffffff";

const DEFAULT_LIVES = 3;
const DEFAULT_TIME_PER_Q_MS = 0; // 0 = без таймера

// --- helpers ---------------------------------------------------------------

function shuffle<T>(arr: T[], seed?: number): T[] {
  const a = arr.slice();
  let rand = seed ?? Math.random();
  const rnd = () => {
    if (seed == null) return Math.random();
    rand = (rand * 9301 + 49297) % 233280;
    return rand / 233280;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Собираем вопросы один раз из JSON (детерминированно перемешаем по индексу)
const RAW: RawItem[] = (rawQuiz as RawItem[]).filter(
  (i) => i && i.q && i.correct && Array.isArray(i.wrong) && i.wrong.length === 3
);

function buildQuestions(): Question[] {
  return RAW.map((it, idx) => {
    const opts = [it.correct, ...it.wrong];
    const options = shuffle(opts, idx + 1);
    const correctIndex = options.indexOf(it.correct);
    return { q: it.q, options, correctIndex };
  });
}
const ALL_QUESTIONS: Question[] = buildQuestions();

// 🔢 выбираем случайные N вопросов из всех
const QUESTIONS_LIMIT = 10; // ← поменяй число как хочешь
function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = arr.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

const SELECTED_QUESTIONS = pickRandom(ALL_QUESTIONS, QUESTIONS_LIMIT);


// --- компонент -------------------------------------------------------------

export default function QuizScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, "Quiz">>();
  const { width: W } = Dimensions.get("window");

  const [paused, setPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null); // 3-2-1 при резюме
  const [tick, setTick] = useState(0); // форс-рендер
  const [score, setScore] = useState(0); // зелёные баллы
  const [lives, setLives] = useState(route.params?.lives ?? DEFAULT_LIVES);
  const [idx, setIdx] = useState(0); // текущий вопрос
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false); // анти-спам
  const [timeLeftMs, setTimeLeftMs] = useState(route.params?.timePerQuestionMs ?? DEFAULT_TIME_PER_Q_MS);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // используем локальный массив вопросов
  const questions = SELECTED_QUESTIONS;
  const q = questions[idx];

  const total = questions.length;
  const progress = total ? Math.min(100, Math.round(((idx + 1) / total) * 100)) : 0;

  const timePerQuestionMs = route.params?.timePerQuestionMs ?? DEFAULT_TIME_PER_Q_MS;

  // таймер вопроса (если включён)
  useEffect(() => {
    if (!q || paused || timePerQuestionMs <= 0) return;

    setTimeLeftMs(timePerQuestionMs);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeftMs((t) => {
        if (t <= 1000) {
          clearInterval(timerRef.current!);
          onAnswerTimeout();
          return 0;
        }
        return t - 1000;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, paused, q, timePerQuestionMs]);

  const onAnswerTimeout = useCallback(() => {
    if (!q || locked) return;
    setLocked(true);
    setSelected(-1);
    setLives((L) => Math.max(0, L - 1));
    setTimeout(() => {
      goNext();
    }, 700);
  }, [q, locked]);

  // навигация вопросов
  const goNext = useCallback(() => {
    setLocked(false);
    setSelected(null);
    if (idx + 1 < total) {
      setIdx((i) => i + 1);
    } else {
      // конец викторины
      setPaused(true);
    }
  }, [idx, total]);

  // выбор ответа
  const choose = (i: number) => {
    if (!q || locked || paused) return;
    setLocked(true);
    setSelected(i);

    const correct = i === q.correctIndex;
    if (correct) {
      setScore((s) => s + 1);
    } else {
      setLives((L) => Math.max(0, L - 1));
    }

    setTimeout(() => {
      goNext();
    }, 700);
  };

  // пауза/резюме с обратным отсчётом
  const togglePause = () => {
    if (!paused) {
      setPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else {
      setCountdown(3);
      resumeTimerRef.current && clearInterval(resumeTimerRef.current);
      resumeTimerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c && c > 1) return c - 1;
          clearInterval(resumeTimerRef.current!);
          resumeTimerRef.current = null;
          setCountdown(null);
          setPaused(false);
          return null;
        });
      }, 1000);
    }
  };

  const exit = () => {
    setPaused(true);
    nav.goBack();
  };

  // автопауза при нуле жизней
  useEffect(() => {
    if (lives <= 0) setPaused(true);
  }, [lives]);

  useEffect(() => {
    setTick((t) => t ^ 1);
  }, [paused, idx, lives, score, selected]);

  // стили для вариантов
  const optionStyle = (i: number) => {
    const isSelected = selected === i;
    const isCorrect = q && i === q.correctIndex;
    const showResult = selected !== null;

    let borderColor = "#ddd";
    let bg = CARD;
    let text = NEUTRAL;

    if (!showResult) {
      if (isSelected) {
        borderColor = ACCENT;
        bg = "#e9f7ef";
      }
    } else {
      if (isCorrect) {
        borderColor = ACCENT;
        bg = "#e9f7ef";
        text = "#0b5f37";
      } else if (isSelected) {
        borderColor = DANGER;
        bg = "#fdecea";
        text = "#8b2f2f";
      }
    }

    return {
      container: { borderColor, backgroundColor: bg },
      text: { color: text },
    };
  };

  const ProgressBar = () => (
    <View style={{ width: "100%", height: 10, backgroundColor: "#cfe9d2", borderRadius: 999 }}>
      <View
        style={{
          width: `${progress}%`,
          height: "100%",
          backgroundColor: ACCENT,
          borderRadius: 999,
        }}
      />
    </View>
  );

  const HUD = () => (
    <View style={styles.hud}>
      <Text style={styles.hudText}>Баллы: {score}</Text>
      <Text style={styles.hudText}>Жизни: {lives}</Text>
      <Text style={styles.hudText}>Вопрос: {idx + 1}/{total}</Text>
      {timePerQuestionMs > 0 && (
        <Text style={styles.hudText}>Таймер: {Math.ceil(timeLeftMs / 1000)}s</Text>
      )}
    </View>
  );

  if (!q) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator />
        <Text style={{ marginTop: 12 }}>Загружаем вопросы…</Text>
      </SafeAreaView>
    );
  }

  const isFinished = (idx + 1 >= total) && paused;
  const isGameOver = lives <= 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* HUD */}
      <HUD />

      {/* Кнопка меню/пауза */}
      <Pressable onPress={togglePause} style={styles.menuBtn}>
        <Text style={{ fontSize: 22 }}>≡</Text>
      </Pressable>

      {/* Прогресс */}
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <ProgressBar />
      </View>

      {/* Тело вопроса */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={[styles.card, { width: "100%" }]}>
          <Text style={styles.qText}>{q.q}</Text>

          <View style={{ height: 12 }} />

          {q.options.map((opt, i) => {
            const s = optionStyle(i);
            return (
              <Pressable
                key={i}
                onPress={() => choose(i)}
                disabled={locked || paused}
                style={({ pressed }) => [
                  styles.option,
                  s.container,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.996 }] },
                ]}
              >
                <Text style={[styles.optionText, s.text]}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Пауза / Итог / Game Over */}
      {(paused || countdown !== null) && (
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            {countdown !== null ? (
              <>
                <Text style={styles.modalTitle}>Продолжаем через</Text>
                <Text style={{ fontSize: 64, fontWeight: "800", color: ACCENT }}>
                  {countdown}
                </Text>
              </>
            ) : isGameOver ? (
              <>
                <Text style={styles.modalTitle}>Игра окончена</Text>
                <Text style={styles.modalText}>Баллы: {score}</Text>
                <Text style={[styles.modalText, { marginBottom: 12 }]}>
                  Вопросов пройдено: {idx}/{total}
                </Text>
                <Pressable
                  onPress={() => {
                    setScore(0);
                    setLives(route.params?.lives ?? DEFAULT_LIVES);
                    setIdx(0);
                    setSelected(null);
                    setLocked(false);
                    setPaused(false);
                  }}
                  style={btnStyle()}
                >
                  <Text style={btnTextStyle()}>Играть снова</Text>
                </Pressable>
                <Pressable onPress={exit} style={btnStyle("outline")}>
                  <Text style={btnTextStyle("outline")}>Выйти</Text>
                </Pressable>
              </>
            ) : isFinished ? (
              <>
                <Text style={styles.modalTitle}>Викторина завершена!</Text>
                <Text style={styles.modalText}>Баллы: {score} / {total}</Text>
                <Pressable onPress={exit} style={btnStyle()}>
                  <Text style={btnTextStyle()}>В меню</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setScore(0);
                    setLives(route.params?.lives ?? DEFAULT_LIVES);
                    setIdx(0);
                    setSelected(null);
                    setLocked(false);
                    setPaused(false);
                  }}
                  style={btnStyle("outline")}
                >
                  <Text style={btnTextStyle("outline")}>Сыграть ещё раз</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Пауза</Text>
                <Text style={[styles.modalText, { marginBottom: 12 }]}>
                  Баллы: {score} · Жизни: {lives}
                </Text>
                <Pressable onPress={togglePause} style={btnStyle()}>
                  <Text style={btnTextStyle()}>Продолжить</Text>
                </Pressable>
                <Pressable onPress={exit} style={btnStyle("outline")}>
                  <Text style={btnTextStyle("outline")}>Выйти</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// --- styles & helpers ------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  hud: {
    position: "absolute",
    left: 16,
    top: 90,
    zIndex: 20,
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  hudText: { fontSize: 16, color: "#0f3c25", fontWeight: "600" },
  menuBtn: {
    position: "absolute",
    right: 16,
    top: 80,
    padding: 10,
    zIndex: 10,
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  qText: {
    fontSize: 20,
    fontWeight: "700",
    color: NEUTRAL,
    lineHeight: 26,
  },
  option: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  optionText: {
    fontSize: 16,
    lineHeight: 22,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "92%",
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    color: NEUTRAL,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
});

function btnStyle(variant: "solid" | "outline" = "solid") {
  return ({
    width: "100%",
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: variant === "solid" ? ACCENT : NEUTRAL,
    alignItems: "center",
    marginTop: 10,
    backgroundColor: variant === "solid" ? ACCENT : "#fff",
  } as const);
}
function btnTextStyle(variant: "solid" | "outline" = "solid") {
  return ({
    color: variant === "solid" ? "#fff" : NEUTRAL,
    fontWeight: "700",
  } as const);
}
