import type { CapacitorConfig } from "@capacitor/cli";

/**
 * ID приложения (package name). Перед публикацией в Google Play замените его
 * здесь и в android/app/build.gradle (namespace и applicationId).
 */
export const APP_ID = "com.example.myhabits";

const config: CapacitorConfig = {
  appId: APP_ID,
  appName: "Мои привычки",
  // TanStack Start prerenders static app files into .output/public
  webDir: ".output/public",
  android: {
    adjustMarginsForEdgeToEdge: "auto",
    allowMixedContent: false,
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: "DARK",
      backgroundColor: "#111827",
    },
    LocalNotifications: {
      smallIcon: "ic_stat_habit",
      iconColor: "#2F7A5B",
    },
  },
};

export default config;
