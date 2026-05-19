export default {
  expo: {
    name: "ReceiptAI",
    slug: "receiptai",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.receiptai.app",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#6C63FF",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.receiptai.app",
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
      ],
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-camera",
      "expo-image-picker",
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#6C63FF",
          sounds: [],
        },
      ],
    ],
    extra: {
      eas: {
        projectId: "6255771d-3a60-488c-bad2-d4c90f991aca",
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
    owner: "sam_porter",
  },
};
