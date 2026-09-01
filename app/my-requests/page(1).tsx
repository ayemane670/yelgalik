"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("requests")
        .select("*, cities(name_ar)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setRequests(data ?? []);
    })();
  }, []);

  return (
    <main className="px-5 pt-8">
      <h1 className="text-xl font-extrabold mb-6">طلباتي</h1>
      <ul className="space-y-2.5">
        {requests.map((r) => (
          <li key={r.id} className="p-3.5 rounded-card border border-line flex justify-between items-center">
            <div>
              <p className="font-semibold text-sm">{r.title}</p>
              <p className="text-xs text-inkSoft mt-0.5">
                {r.cities?.name_ar} · حتى {r.max_budget.toLocaleString("ar-DZ")} دج · {r.status === "active" ? "نشط" : "مغلق"}
              </p>
            </div>
            <Link href={`/results?request_id=${r.id}`} className="text-teal text-xs font-bold">التطابقات →</Link>
          </li>
        ))}
        {requests.length === 0 && <p className="text-inkSoft text-sm text-center py-16">لم تنشر أي طلب بعد.</p>}
      </ul>
    </main>
  );
}
