"use client";
import { useEffect } from "react";

/**
 * Mounted once in the root layout. Detects whether the app is running
 * inside the Capacitor native shell (vs a normal browser tab) and, if so,
 * wires up native push notifications + hides the splash screen.
 * Safe no-op on the web — Capacitor packages are only touched when the
 * native `window.Capacitor` bridge is actually present.
 */
export default function NativeBridge() {
  useEffect(() => {
    // @ts-ignore — injected by Capacitor at runtime, absent on plain web
    if (typeof window === "undefined" || !window.Capacitor) return;

    (async () => {
      const { SplashScreen } = await import("@capacitor/splash-screen");
      const { StatusBar, Style } = await import("@capacitor/status-bar");
      const { PushNotifications } = await import("@capacitor/push-notifications");

      await SplashScreen.hide();
      await StatusBar.setStyle({ style: Style.Light }).catch(() => {});

      const perm = await PushNotifications.requestPermissions();
      if (perm.receive === "granted") {
        await PushNotifications.register();
      }

      // TODO: send this token to a `push_tokens` table (user_id, token, platform)
      // so /api/notifications can trigger real push notifications, not just in-app ones.
      PushNotifications.addListener("registration", (token) => {
        console.log("Push registration token:", token.value);
      });
    })();
  }, []);

  return null;
}
