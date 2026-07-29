import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { LogBox, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { initLang } from "@/src/i18n";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();
  const [langReady, setLangReady] = useState(false);

  useEffect(() => { initLang().then(() => setLangReady(true)); }, []);

  useEffect(() => {
    if ((loaded || error) && langReady) SplashScreen.hideAsync();
  }, [loaded, error, langReady]);

  if ((!loaded && !error) || !langReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F3F4F6' } }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
