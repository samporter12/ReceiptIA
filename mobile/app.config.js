export default {
  expo: {
    name: "ReceiptAI",
    slug: "receiptai",
    version: "1.0.0",
    orientation: "portrait",
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};