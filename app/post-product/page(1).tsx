"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCategoriesAndCities, ChipSelect } from "@/components/CategoryCityPicker";
import { ArrowRight, ImagePlus } from "lucide-react";

const CONDITIONS = [
  { id: "new", label: "جديد" },
  { id: "like_new", label: "شبه جديد" },
  { id: "good", label: "جيدة" },
  { id: "used", label: "مستعمل" },
];

export default function PostProductPage() {
  const router = useRouter();
  const { categories, cities } = useCategoriesAndCities();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("good");
  const [description, setDescription] = useState("");
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

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category_id: categoryId,
        price: Number(price),
        city_id: cityId,
        condition,
        description,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "حدث خطأ، حاول مجددًا");
      return;
    }
    router.push(`/results?product_id=${data.product.id}&found=${data.buyers_found}`);
  }

  return (
    <main className="px-5 pt-6">
      <button onClick={() => router.back()} className="mb-4 text-inkSoft">
        <ArrowRight size={20} />
      </button>
      <h1 className="text-xl font-extrabold mb-1">ماذا لديك؟</h1>
      <p className="text-inkSoft text-sm mb-6">سنبحث فورًا عن أشخاص يبحثون عن هذا بالضبط.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <button
          type="button"
          className="w-full h-28 border-2 border-dashed border-line rounded-card flex flex-col items-center justify-center text-inkSoft gap-1"
        >
          <ImagePlus size={22} />
          <span className="text-xs">أضف صورة (اختياري في MVP)</span>
        </button>

        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="مثال: iPhone 13 128GB حالة جيدة"
          className="w-full bg-paperDim rounded-card px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-teal"
        />

        <div>
          <label className="block text-xs font-bold text-inkSoft mb-2">الفئة</label>
          <ChipSelect options={categories} value={categoryId} onChange={setCategoryId} />
        </div>

        <div>
          <label className="block text-xs font-bold text-inkSoft mb-2">السعر (دج)</label>
          <input
            required
            type="number"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="70000"
            className="w-full bg-paperDim rounded-card px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-teal"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-inkSoft mb-2">المدينة</label>
          <ChipSelect options={cities} value={cityId} onChange={setCityId} />
        </div>

        <div>
          <label className="block text-xs font-bold text-inkSoft mb-2">الحالة</label>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCondition(c.id)}
                className={`px-3.5 py-1.5 rounded-pill text-sm border ${
                  condition === c.id ? "bg-teal text-paper border-teal" : "bg-paper text-ink border-line"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="تفاصيل إضافية (اختياري)"
          rows={2}
          className="w-full bg-paperDim rounded-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal"
        />

        {error && <p className="text-danger text-sm">{error}</p>}

        <button
          disabled={loading}
          className="w-full bg-teal text-paper font-bold py-3.5 rounded-pill disabled:opacity-60"
        >
          {loading ? "جارِ البحث..." : "أبحث عن مشترين 🎯"}
        </button>
      </form>
    </main>
  );
}
