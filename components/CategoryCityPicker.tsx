"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Option = { id: number; name_ar: string };

/** Fetches categories + cities once and exposes them as chip/select options. */
export function useCategoriesAndCities() {
  const [categories, setCategories] = useState<Option[]>([]);
  const [cities, setCities] = useState<Option[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("categories").select("id, name_ar").then(({ data }) => setCategories(data ?? []));
    supabase.from("cities").select("id, name_ar").then(({ data }) => setCities(data ?? []));
  }, []);

  return { categories, cities };
}

export function ChipSelect({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: number | null;
  onChange: (id: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`px-3.5 py-1.5 rounded-pill text-sm border transition-colors ${
            value === opt.id
              ? "bg-teal text-paper border-teal"
              : "bg-paper text-ink border-line"
          }`}
        >
          {opt.name_ar}
        </button>
      ))}
    </div>
  );
}
