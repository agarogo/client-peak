<<<<<<< HEAD
// src/screens/QuizScreen.tsx
=======
>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from "@react-navigation/native";

<<<<<<< HEAD
=======
// Подключаем JSON с вопросами
>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea
const rawQuiz: any = require("../../assets/data/eco_quiz_100.json");

type RootStackParamList = {
  Quiz: { lives?: number; timePerQuestionMs?: number; limit?: number } | undefined;
};

<<<<<<< HEAD
type Question = { q: string; options: string[]; correctIndex: number };
=======
type Question = {
  q: string;
  options: string[];
  correctIndex: number;
};

>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea
type RawItem = { q: string; correct: string; wrong: string[] };

const BG = "#D7F7C8";
const ACCENT = "#1b7f4a";
const DANGER = "#e74c3c";
const NEUTRAL = "#222";
const CARD = "#ffffff";

const DEFAULT_LIVES = 3;
<<<<<<< HEAD
const DEFAULT_TIME_PER_Q_MS = 0;
const DEFAULT_LIMIT = 10;

// ---- helpers
const RAW: RawItem[] = (rawQuiz as RawItem[]).filter(
  (i) => i && i.q && i.correct && Array.isArray(i.wrong) && i.wrong.length === 3
);
=======
const DEFAULT_TIME_PER_Q_MS = 0; // 0 = без таймера
const DEFAULT_LIMIT = 10;

// --- helpers ---------------------------------------------------------------

const RAW: RawItem[] = (rawQuiz as RawItem[]).filter(
  (i) => i && i.q && i.correct && Array.isArray(i.wrong) && i.wrong.length === 3
);

>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea
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
<<<<<<< HEAD
=======

>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea
function pickRandom<T>(arr: T[], n: number, seed?: number): T[] {
  const shuffled = shuffle(arr, seed);
  return shuffled.slice(0, Math.min(n, arr.length));
}

<<<<<<< HEAD
=======
// --- компонент -------------------------------------------------------------

>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea
export default function QuizScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, "Quiz">>();
  const { width: W } = Dimensions.get("window");

<<<<<<< HEAD
  // state
=======
>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(route.params?.lives ?? DEFAULT_LIVES);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState(
    route.params?.timePerQuestionMs ?? DEFAULT_TIME_PER_Q_MS
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

<<<<<<< HEAD
  // сборка вопросов
=======
  // Сборка вопросов (рандом каждого варианта + выбор N)
>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea
  const buildQuestions = useCallback((seed: number, limit: number): Question[] => {
    const all: Question[] = RAW.map((it, i) => {
      const options = shuffle([it.correct, ...it.wrong], seed + i);
      const correctIndex = options.indexOf(it.correct);
      return { q: it.q, options, correctIndex };
    });
    return pickRandom(all, limit, seed + 999);
  }, []);
<<<<<<< HEAD
  const runIdRef = useRef(0);

  const resetQuiz = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (resumeTimerRef.current) clearInterval(resumeTimerRef.current);
    resumeTimerRef.current = null;

    runIdRef.current += 1;
    const seed = Date.now() + runIdRef.current + Math.floor(Math.random() * 1e9);
    const limit = route.params?.limit ?? DEFAULT_LIMIT;
    const qs = buildQuestions(seed, limit);

    setQuestions(qs);
    setIdx(0);
    setScore(0);
    setLives(route.params?.lives ?? DEFAULT_LIVES);
    setSelected(null);
    setLocked(false);
    setTimeLeftMs(route.params?.timePerQuestionMs ?? DEFAULT_TIME_PER_Q_MS);
    setCountdown(null);
    setPaused(false);
  }, [buildQuestions, route.params]);

=======

  const runIdRef = useRef(0); // гарантированный новый сид при каждом ресете

  // Единая функция сброса викторины (новый набор вопросов)
  const resetQuiz = useCallback(() => {
  // стоп таймеры до перестройки
  if (timerRef.current) clearInterval(timerRef.current);
  timerRef.current = null;
  if (resumeTimerRef.current) clearInterval(resumeTimerRef.current);
  resumeTimerRef.current = null;

  // гарантированно новый сид
  runIdRef.current += 1;
  const seed = Date.now() + runIdRef.current + Math.floor(Math.random() * 1e9);
  const limit = route.params?.limit ?? DEFAULT_LIMIT;
  const qs = buildQuestions(seed, limit);

  setQuestions(qs);
  setIdx(0);
  setScore(0);
  setLives(route.params?.lives ?? DEFAULT_LIVES);
  setSelected(null);
  setLocked(false);
  setTimeLeftMs(route.params?.timePerQuestionMs ?? DEFAULT_TIME_PER_Q_MS);
  setCountdown(null);
  setPaused(false);
}, [buildQuestions, route.params]);


  // Генерация при входе на экран
>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea
  useFocusEffect(
    useCallback(() => {
      resetQuiz();
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
      };
    }, [resetQuiz])
  );

  const q = questions[idx];
  const total = questions.length;
  const progress = total ? Math.min(100, Math.round(((idx + 1) / total) * 100)) : 0;
  const timePerQuestionMs = route.params?.timePerQuestionMs ?? DEFAULT_TIME_PER_Q_MS;

<<<<<<< HEAD
  // таймер
=======
  // Таймер вопроса (если включён)
>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea
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
    setTimeout(() => goNext(), 700);
  }, [q, locked]);

  const goNext = useCallback(() => {
    setLocked(false);
    setSelected(null);
    if (idx + 1 < total) setIdx((i) => i + 1);
    else setPaused(true);
  }, [idx, total]);

  const choose = (i: number) => {
    if (!q || locked || paused) return;
    setLocked(true);
    setSelected(i);
    const correct = i === q.correctIndex;
    if (correct) setScore((s) => s + 1);
    else setLives((L) => Math.max(0, L - 1));
    setTimeout(() => goNext(), 700);
  };

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

  useEffect(() => {
    if (lives <= 0) setPaused(true);
  }, [lives]);

<<<<<<< HEAD
  // --- UI helpers
=======
>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea
  const optionStyle = (i: number) => {
    const isSelected = selected === i;
    const isCorrect = q && i === q.correctIndex;
    const showResult = selected !== null;

<<<<<<< HEAD
    let borderColor = "#e7e7e7";
=======
    let borderColor = "#ddd";
>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea
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
<<<<<<< HEAD
=======

>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea
    return { container: { borderColor, backgroundColor: bg }, text: { color: text } };
  };

  const ProgressBar = () => (
<<<<<<< HEAD
    <View style={styles.progressBg}>
      <View style={[styles.progressFg, { width: `${progress}%` }]} />
=======
    <View style={{ width: "100%", height: 10, backgroundColor: "#cfe9d2", borderRadius: 999 }}>
      <View
        style={{
          width: `${progress}%`,
          height: "100%",
          backgroundColor: ACCENT,
          borderRadius: 999,
        }}
      />
>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea
    </View>
  );

  const HUD = () => (
<<<<<<< HEAD
    <View style={styles.hudSheet}>
      <View style={{ height: 12 }} />

=======
    <View style={styles.hud}>
>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea
      <Text style={styles.hudText}>Баллы: {score}</Text>
      <Text style={styles.hudText}>Жизни: {lives}</Text>
      <Text style={styles.hudText}>
        Вопрос: {idx + 1}/{total}
      </Text>
      {timePerQuestionMs > 0 && (
        <Text style={styles.hudText}>Таймер: {Math.ceil(timeLeftMs / 1000)}s</Text>
      )}
    </View>
  );

<<<<<<< HEAD
  if (!q) {
    return (
      <SafeAreaView style={[styles.screen, { alignItems: "center", justifyContent: "center" }]}>
=======
  if (!q)
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea
        <ActivityIndicator />
        <Text style={{ marginTop: 12 }}>Загружаем вопросы…</Text>
      </SafeAreaView>
    );
<<<<<<< HEAD
  }
=======
>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea

  const isFinished = idx + 1 >= total && paused;
  const isGameOver = lives <= 0;

<<<<<<< HEAD
  const letters = ["A", "B", "C", "D"];

  return (
    <SafeAreaView style={styles.screen}>
      {/* большая белая карта */}
      <View style={styles.sheet}>
        {/* HUD и гамбургер внутри карты */}
        <HUD />
        <Pressable onPress={togglePause} style={styles.menuBtn}>
          <Text style={{ fontSize: 22 }}>≡</Text>
        </Pressable>

        {/* прогресс */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <ProgressBar />
        </View>

        {/* контент вопроса */}
        <ScrollView
          bounces={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.qText}>{q.q}</Text>

            <View style={{ height: 14 }} />

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
                    pressed && { opacity: 0.9, transform: [{ scale: 0.996 }] },
                  ]}
                >
                  <View style={[styles.bullet, selected === i && { borderColor: s.text.color }]}>
                    <Text style={styles.bulletText}>{letters[i] ?? String.fromCharCode(65 + i)}</Text>
                  </View>
                  <Text style={[styles.optionText, s.text]}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* модалка паузы / результата */}
=======
  return (
    <SafeAreaView style={styles.container}>
      <HUD />
      <Pressable onPress={togglePause} style={styles.menuBtn}>
        <Text style={{ fontSize: 22 }}>≡</Text>
      </Pressable>
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <ProgressBar />
      </View>
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
>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea
      {(paused || countdown !== null) && (
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            {countdown !== null ? (
              <>
                <Text style={styles.modalTitle}>Продолжаем через</Text>
                <Text style={{ fontSize: 64, fontWeight: "800", color: ACCENT }}>{countdown}</Text>
              </>
            ) : isGameOver ? (
              <>
                <Text style={styles.modalTitle}>Игра окончена</Text>
                <Text style={styles.modalText}>Баллы: {score}</Text>
                <Text style={[styles.modalText, { marginBottom: 12 }]}>
                  Вопросов пройдено: {idx}/{total}
                </Text>
                <Pressable onPress={resetQuiz} style={btnStyle()}>
                  <Text style={btnTextStyle()}>Играть снова</Text>
                </Pressable>
                <Pressable onPress={exit} style={btnStyle("outline")}>
                  <Text style={btnTextStyle("outline")}>Выйти</Text>
                </Pressable>
              </>
            ) : isFinished ? (
              <>
                <Text style={styles.modalTitle}>Викторина завершена!</Text>
                <Text style={styles.modalText}>
                  Баллы: {score} / {total}
                </Text>
                <Pressable onPress={exit} style={btnStyle()}>
                  <Text style={btnTextStyle()}>В меню</Text>
                </Pressable>
                <Pressable onPress={resetQuiz} style={btnStyle("outline")}>
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

<<<<<<< HEAD
// ---- styles
const RADIUS = 24;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  sheet: {
    flex: 1,
    marginHorizontal: 18,
    marginTop: 24,
    marginBottom: 18,
    backgroundColor: CARD,
    borderRadius: RADIUS,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  hudSheet: {
    position: "absolute",
    left: 16,
    top: 14,
    zIndex: 10,
    gap: 8,                 // было 2 — делаем интервал между строками HUD
  },
  hudText: {
    fontSize: 14,
    color: "#0f3c25",
    fontWeight: "600",
    lineHeight: 20,         // читаемее
  },

  menuBtn: { position: "absolute", right: 12, top: 6, padding: 10, zIndex: 10 },

  progressBg: {
    width: "100%",
    height: 10,
    backgroundColor: "#cfe9d2",
    borderRadius: 999,
  },
  progressFg: {
    height: "100%",
    backgroundColor: ACCENT,
    borderRadius: 999,
  },

=======
// --- styles ------------------------------------------------------

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
  menuBtn: { position: "absolute", right: 16, top: 80, padding: 10, zIndex: 10 },
>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea
  card: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 16,
<<<<<<< HEAD
    marginTop: 70, // 🆕 отступ между HUD (вопрос: 1/10) и текстом вопроса
  },

  qText: {
    fontSize: 20,
    fontWeight: "700",
    color: NEUTRAL,
    lineHeight: 28,         // больше межстрочный для вопроса
    marginBottom: 14,       // интервал от вопроса к вариантам (убери <View style={{height:12}}/>)
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,                // чуть больше расстояние между кружком и текстом
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,    // выше, чтобы тексту было просторнее
    paddingHorizontal: 16,
    marginTop: 14,          // интервал между вариантами
  },
  optionText: {
    fontSize: 16,
    lineHeight: 24,         // больше межстрочный в вариантах
    flexShrink: 1,
  },

  bullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dcdcdc",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginTop: 2,           // визуально центрирует с увеличенным lineHeight
  },
  bulletText: { fontWeight: "700", color: "#333" },

=======
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  qText: { fontSize: 20, fontWeight: "700", color: NEUTRAL, lineHeight: 26 },
  option: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  optionText: { fontSize: 16, lineHeight: 22 },
>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea
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
<<<<<<< HEAD
  modalText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 6,           // интервалы между строками в модалке
  },
=======
  modalText: { fontSize: 16, color: "#333", textAlign: "center" },
>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea
});

function btnStyle(variant: "solid" | "outline" = "solid") {
  return {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: variant === "solid" ? ACCENT : NEUTRAL,
    alignItems: "center",
    marginTop: 10,
    backgroundColor: variant === "solid" ? ACCENT : "#fff",
  } as const;
}
function btnTextStyle(variant: "solid" | "outline" = "solid") {
<<<<<<< HEAD
  return { color: variant === "solid" ? "#fff" : NEUTRAL, fontWeight: "700" } as const;
=======
  return {
    color: variant === "solid" ? "#fff" : NEUTRAL,
    fontWeight: "700",
  } as const;
>>>>>>> 25327e769cd8d83175f1704ee5b46f1e218eaaea
}
