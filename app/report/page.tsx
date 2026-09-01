"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const REASONS = ["محتوى مزيف", "احتيال", "إزعاج/سبام", "محتوى غير لائق", "أخرى"];

function ReportContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reported_user_id: params.get("user_id") || undefined,
        reported_request_id: params.get("request_id") || undefined,
        reported_product_id: params.get("product_id") || undefined,
        reason,
        details,
      }),
    });
    setSent(true);
    setTimeout(() => router.push("/home"), 1500);
  }

  if (sent) {
    return <main className="px-5 pt-24 text-center text-inkSoft">تم إرسال البلاغ. شكرًا لمساعدتك في الحفاظ على أمان المجتمع.</main>;
  }

  return (
    <main className="px-5 pt-8">
      <h1 className="text-xl font-extrabold mb-6">إبلاغ</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={`px-3.5 py-1.5 rounded-pill text-sm border ${
                reason === r ? "bg-danger text-paper border-danger" : "border-line"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="اشرح المشكلة بالتفصيل..."
          rows={4}
          className="w-full bg-paperDim rounded-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal"
        />
        <button className="w-full bg-danger text-paper font-bold py-3.5 rounded-pill">إرسال البلاغ</button>
      </form>
    </main>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<main className="px-5 pt-24 text-center text-inkSoft">جارِ التحميل...</main>}>
      <ReportContent />
    </Suspense>
  );
}
