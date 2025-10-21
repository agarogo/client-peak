import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AuthScreen from "./src/screens/AuthScreen";
import HomeScreen from "./src/screens/HomeScreen";
import GamesMenuScreen from "./src/screens/GamesMenuScreen";
import CatchGameScreen from "./src/screens/CatchGameScreen";
import QuizScreen from "./src/screens/QuizScreen";
import MarketScreen from "./src/screens/MarketScreen";
import RatingScreen from "./src/screens/RatingScreen";
import "./global.css";

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined | { openProfile?: boolean };
  GamesMenu: undefined;
  CatchGame: undefined;
  Quiz: undefined;
  Market: undefined;
  Rating: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [initial, setInitial] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem("auth_token");
      setInitial(t ? "Home" : "Auth");
    })();
  }, []);

  if (!initial) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initial}
        screenOptions={{ headerShown: false, animation: "none", gestureEnabled: false }}
      >
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="GamesMenu" component={GamesMenuScreen} />
        <Stack.Screen name="CatchGame" component={CatchGameScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="Market" component={MarketScreen} />
        <Stack.Screen name="Rating" component={RatingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
