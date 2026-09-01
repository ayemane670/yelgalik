import type { Metadata } from "next";
import { Tajawal, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import NativeBridge from "@/components/NativeBridge";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["500", "700", "800"],
  variable: "--font-tajawal",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-arabic",
});

export const metadata: Metadata = {
  title: "يلقالك — لا تبحث، خلي البضاعة تلقاك",
  description: "انشر ما تبحث عنه أو ما تبيعه، ونحن نطابقك تلقائيًا مع الطرف المناسب.",
  openGraph: {
    title: "يلقالك",
    description: "لا تبحث عن المشتري؛ دع المشتري يبحث عنك.",
    locale: "ar_DZ",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${plexArabic.variable}`}>
      <body>
        <NativeBridge />
        <div className="mx-auto max-w-md min-h-screen pb-20 relative">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
