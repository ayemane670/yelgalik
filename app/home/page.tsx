import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Search, Tag, Flame } from "lucide-react";

export default async function HomePage() {
  const supabase = createClient();
  const { data: nearbyRequests } = await supabase
    .from("requests")
    .select("id, title, max_budget, cities(name_ar)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <main className="px-5 pt-8">
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold leading-snug">يلقالك</h1>
        <p className="text-inkSoft text-sm mt-1">لا تبحث... خلي البضاعة تلقاك.</p>
      </header>

      {/* Seller entry: "what do you have?" */}
      <Link
        href="/post-product"
        className="block bg-teal text-paper rounded-card p-5 mb-4 shadow-card"
      >
        <div className="flex items-center gap-2 text-sm opacity-90 mb-1">
          <Tag size={16} />
          ماذا لديك؟
        </div>
        <p className="text-lg font-bold mb-3">اكتب المنتج الذي تملكه...</p>
        <span className="inline-block bg-paper text-teal text-sm font-bold px-4 py-2 rounded-pill">
          أبحث عن مشترين ←
        </span>
      </Link>

      {/* Buyer entry: "what are you looking for?" */}
      <Link
        href="/post-request"
        className="block bg-paper border border-line rounded-card p-5 mb-8 shadow-card"
      >
        <div className="flex items-center gap-2 text-sm text-inkSoft mb-1">
          <Search size={16} />
          ماذا تبحث عنه؟
        </div>
        <p className="text-lg font-bold mb-3 text-ink">اكتب المنتج الذي تريد شراءه...</p>
        <span className="inline-block bg-flame text-paper text-sm font-bold px-4 py-2 rounded-pill">
          أبحث عن عروض ←
        </span>
      </Link>

      <section>
        <h2 className="flex items-center gap-1.5 font-bold text-sm mb-3">
          <Flame size={16} className="text-flame" />
          طلبات قريبة منك
        </h2>
        <ul className="space-y-2.5">
          {(nearbyRequests ?? []).map((r: any) => (
            <li key={r.id} className="bg-paper border border-line rounded-card p-3.5 flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">{r.title}</p>
                <p className="text-xs text-inkSoft mt-0.5">
                  {r.cities?.name_ar ?? "—"} · حتى {r.max_budget.toLocaleString("ar-DZ")} دج
                </p>
              </div>
              <Link href={`/results?request_id=${r.id}`} className="text-teal text-xs font-bold">
                عندي هذا →
              </Link>
            </li>
          ))}
          {(!nearbyRequests || nearbyRequests.length === 0) && (
            <p className="text-inkSoft text-sm py-6 text-center">
              لا توجد طلبات بعد. كن أول من ينشر طلبًا في مدينتك.
            </p>
          )}
        </ul>
      </section>
    </main>
  );
}
