"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const SLIDES = [
  {
    title: "لا تبحث... خلي البضاعة تلقاك",
    body: "انشر ما تبحث عنه بدل أن تقضي وقتك في البحث اليدوي.",
  },
  {
    title: "المطابقة تتم تلقائيًا",
    body: "بمجرد أن ينشر أحدهم منتجًا يطابق طلبك، نُخطرك فورًا.",
  },
  {
    title: "الأمان أولًا",
    body: "دردشة داخلية، ولا يتم كشف رقم هاتفك إلا بموافقتك.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];

  return (
    <main className="px-6 pt-20 flex flex-col min-h-[80vh]">
      <div className="flex-1">
        <h1 className="text-2xl font-extrabold mb-3 leading-snug">{slide.title}</h1>
        <p className="text-inkSoft">{slide.body}</p>
      </div>

      <div className="flex gap-1.5 mb-6 justify-center">
        {SLIDES.map((_, i) => (
          <span key={i} className={`h-1.5 rounded-pill ${i === step ? "w-6 bg-teal" : "w-1.5 bg-line"}`} />
        ))}
      </div>

      <button
        onClick={() => (step < SLIDES.length - 1 ? setStep(step + 1) : router.push("/signup"))}
        className="w-full bg-teal text-paper font-bold py-3.5 rounded-pill mb-3"
      >
        {step < SLIDES.length - 1 ? "التالي" : "ابدأ الآن"}
      </button>
      <button onClick={() => router.push("/login")} className="text-inkSoft text-sm text-center">
        لديك حساب؟ سجّل الدخول
      </button>
    </main>
  );
}
