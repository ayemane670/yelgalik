import type { CapacitorConfig } from "@capacitor/cli";

// IMPORTANT:
// Because this app has server-rendered pages, API routes, and middleware,
// it CANNOT be statically exported. Capacitor instead loads the live,
// deployed URL inside a native WebView — this is the standard pattern
// for wrapping a dynamic Next.js app.
//
// Steps:
//   1. Deploy the Next.js app first (e.g. to Vercel) and get its URL.
//   2. Put that URL below in server.url.
//   3. Run `npx cap sync` after any config change.
//
// For local development against `npm run dev`, temporarily point server.url
// to your machine's LAN IP (e.g. http://192.168.1.10:3000) so the phone/
// simulator on the same network can reach it, and set androidScheme to "http".

const config: CapacitorConfig = {
  appId: "dz.yelgalik.app",
  appName: "يلقالك",
  webDir: "public", // required by Capacitor CLI even though we load a remote URL
  server: {
    url: "https://yelgalik-dnifxu89v-ayemane670.vercel.app", // ⬅️ replace with your real deployed URL
    cleartext: false,
  },
  ios: {
    contentInset: "always",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
