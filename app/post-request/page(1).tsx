"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCategoriesAndCities, ChipSelect } from "@/components/CategoryCityPicker";
import { ArrowRight } from "lucide-react";

const CONDITIONS = [
  { id: "any", label: "أي حالة" },
  { id: "new", label: "جديد" },
  { id: "like_new", label: "شبه جديد" },
  { id: "good", label: "جيدة" },
  { id: "used", label: "مستعمل" },
];

export default function PostRequestPage() {
  const router = useRouter();
  const { categories, cities } = useCategoriesAndCities();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [budget, setBudget] = useState("");
  const [condition, setCondition] = useState("any");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category_id: categoryId,
        max_budget: Number(budget),
        city_id: cityId,
        accepted_condition: condition,
        notes,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "حدث خطأ، حاول مجددًا");
      return;
    }
    router.push(`/results?request_id=${data.request.id}&found=${data.matches_found}`);
  }

  return (
    <main className="px-5 pt-6">
      <button onClick={() => router.back()} className="mb-4 text-inkSoft">
        <ArrowRight size={20} />
      </button>
      <h1 className="text-xl font-extrabold mb-1">ماذا تبحث عنه؟</h1>
      <p className="text-inkSoft text-sm mb-6">سنبحث فورًا عن بائعين لديهم هذا المنتج.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: iPhone 13 128GB"
            className="w-full bg-paperDim rounded-card px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-teal"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-inkSoft mb-2">الفئة</label>
          <ChipSelect options={categories} value={categoryId} onChange={setCategoryId} />
        </div>

        <div>
          <label className="block text-xs font-bold text-inkSoft mb-2">الميزانية القصوى (دج)</label>
          <input
            required
            type="number"
            inputMode="numeric"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="70000"
            className="w-full bg-paperDim rounded-card px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-teal"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-inkSoft mb-2">المدينة</label>
          <ChipSelect options={cities} value={cityId} onChange={setCityId} />
        </div>

        <div>
          <label className="block text-xs font-bold text-inkSoft mb-2">الحالة المقبولة</label>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCondition(c.id)}
                className={`px-3.5 py-1.5 rounded-pill text-sm border ${
                  condition === c.id ? "bg-flame text-paper border-flame" : "bg-paper text-ink border-line"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ملاحظات إضافية (اختياري)"
          rows={2}
          className="w-full bg-paperDim rounded-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal"
        />

        {error && <p className="text-danger text-sm">{error}</p>}

        <button
          disabled={loading}
          className="w-full bg-flame text-paper font-bold py-3.5 rounded-pill disabled:opacity-60"
        >
          {loading ? "جارِ البحث..." : "أبحث عن عروض 🔍"}
        </button>
      </form>
    </main>
  );
}
