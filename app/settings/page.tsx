"use client";
import { useState } from "react";

export default function SettingsPage() {
  const [lang, setLang] = useState<"ar" | "fr">("ar");
  const [notifs, setNotifs] = useState(true);

  return (
    <main className="px-5 pt-8 space-y-6">
      <h1 className="text-xl font-extrabold">الإعدادات</h1>

      <div>
        <p className="text-sm font-semibold mb-2">اللغة</p>
        <div className="flex gap-2">
          {(["ar", "fr"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-4 py-2 rounded-pill text-sm border ${
                lang === l ? "bg-teal text-paper border-teal" : "border-line"
              }`}
            >
              {l === "ar" ? "العربية" : "Français"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">الإشعارات</p>
        <button
          onClick={() => setNotifs(!notifs)}
          className={`w-11 h-6 rounded-pill relative transition-colors ${notifs ? "bg-teal" : "bg-line"}`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-paper rounded-full transition-transform ${
              notifs ? "translate-x-[-22px]" : "translate-x-[-2px]"
            }`}
          />
        </button>
      </div>

      <a href="/report" className="block text-danger text-sm font-semibold">الإبلاغ عن مشكلة</a>
    </main>
  );
}
