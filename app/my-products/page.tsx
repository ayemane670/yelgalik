"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function MyProductsPage() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("products")
        .select("*, cities(name_ar)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setProducts(data ?? []);
    })();
  }, []);

  return (
    <main className="px-5 pt-8">
      <h1 className="text-xl font-extrabold mb-6">منتجاتي</h1>
      <ul className="space-y-2.5">
        {products.map((p) => (
          <li key={p.id} className="p-3.5 rounded-card border border-line flex justify-between items-center">
            <div>
              <p className="font-semibold text-sm">{p.title}</p>
              <p className="text-xs text-inkSoft mt-0.5">
                {p.cities?.name_ar} · {p.price.toLocaleString("ar-DZ")} دج · {p.status === "active" ? "نشط" : "مباع"}
              </p>
            </div>
            <Link href={`/results?product_id=${p.id}`} className="text-teal text-xs font-bold">المشترون →</Link>
          </li>
        ))}
        {products.length === 0 && <p className="text-inkSoft text-sm text-center py-16">لم تنشر أي منتج بعد.</p>}
      </ul>
    </main>
  );
}
