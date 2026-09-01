"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, Flame, MapPin, Star } from "lucide-react";

function scoreLabel(score: number) {
  if (score >= 90) return { emoji: "🟢", label: "تطابق ممتاز" };
  if (score >= 70) return { emoji: "🟡", label: "تطابق جيد" };
  if (score >= 50) return { emoji: "🟠", label: "تطابق متوسط" };
  return { emoji: "⚪", label: "تطابق ضعيف" };
}

export default function ResultsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const requestId = params.get("request_id");
  const productId = params.get("product_id");
  const found = params.get("found");
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qs = requestId ? `request_id=${requestId}` : `product_id=${productId}`;
    fetch(`/api/matches?${qs}`)
      .then((r) => r.json())
      .then((d) => setMatches(d.matches ?? []))
      .finally(() => setLoading(false));
  }, [requestId, productId]);

  async function requestContact(matchId: string, toUserId: string) {
    await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ match_id: matchId, to_user_id: toUserId }),
    });
    alert("تم إرسال طلب التواصل. سيصلك إشعار عند الموافقة.");
  }

  return (
    <main className="px-5 pt-6">
      <button onClick={() => router.push("/home")} className="mb-4 text-inkSoft">
        <ArrowRight size={20} />
      </button>

      <div className="bg-flame-light bg-flame/10 border border-flame/30 rounded-card p-4 mb-6 flex items-center gap-2.5">
        <Flame className="text-flame pulse-flame" size={22} />
        <p className="font-bold text-sm">
          {found ?? matches.length} {requestId ? "عرضًا" : "شخصًا"} {requestId ? "يناسب طلبك" : "يبحثون عن هذا"}
        </p>
      </div>

      {loading && <p className="text-inkSoft text-sm text-center py-10">جارِ التحميل...</p>}

      <ul className="space-y-3">
        {matches.map((m: any) => {
          const counterpart = requestId ? m.product : m.request;
          const counterpartUserId = requestId ? m.product?.user_id : m.request?.user_id;
          const { emoji, label } = scoreLabel(m.score);
          return (
            <li key={m.id} className="bg-paper border border-line rounded-card p-4 shadow-card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold">{counterpart?.title}</p>
                  <p className="text-sm text-teal font-semibold mt-0.5">
                    {requestId ? `${counterpart?.price?.toLocaleString("ar-DZ")} دج` : `حتى ${counterpart?.max_budget?.toLocaleString("ar-DZ")} دج`}
                  </p>
                </div>
                <span className="text-xs font-bold whitespace-nowrap bg-paperDim px-2.5 py-1 rounded-pill">
                  {emoji} {m.score}%
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-inkSoft mb-3">
                <span className="flex items-center gap-1"><MapPin size={13} /> {counterpart?.cities?.name_ar ?? "—"}</span>
                {requestId && m.product?.users?.rating_avg > 0 && (
                  <span className="flex items-center gap-1"><Star size={13} /> {m.product.users.rating_avg}</span>
                )}
                <span>{label}</span>
              </div>
              <button
                onClick={() => requestContact(m.id, counterpartUserId)}
                className="w-full bg-ink text-paper text-sm font-bold py-2.5 rounded-pill"
              >
                طلب تواصل
              </button>
            </li>
          );
        })}
      </ul>

      {!loading && matches.length === 0 && (
        <p className="text-inkSoft text-sm text-center py-10">
          لا توجد تطابقات بعد. سنُعلمك فور ظهور واحدة.
        </p>
      )}
    </main>
  );
}
