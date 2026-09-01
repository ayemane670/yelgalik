import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeMatchScore, normalizeTitle, MATCH_THRESHOLD } from "@/lib/matching";

// GET /api/requests?city=5&category=1 — list active requests (feed / "طلبات قريبة منك")
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const category = searchParams.get("category");

  let query = supabase
    .from("requests")
    .select("*, users(full_name, avatar_url, rating_avg), cities(name_ar), categories(name_ar)")
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (city) query = query.eq("city_id", city);
  if (category) query = query.eq("category_id", category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ requests: data });
}

// POST /api/requests — create a new "buying" request, then reverse-search matching products
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await req.json();
  const { title, category_id, max_budget, city_id, accepted_condition, quantity, specs, notes, image_url } = body;

  if (!title || !max_budget) {
    return NextResponse.json({ error: "العنوان والميزانية مطلوبان" }, { status: 400 });
  }

  const { data: request, error } = await supabase
    .from("requests")
    .insert({
      user_id: user.id,
      title,
      normalized_title: normalizeTitle(title),
      category_id,
      max_budget,
      city_id,
      accepted_condition: accepted_condition ?? "any",
      quantity: quantity ?? 1,
      specs: specs ?? {},
      notes,
      image_url,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // ---- REVERSE SEARCH: find existing active products that match this new request ----
  const { data: candidateProducts } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .eq("category_id", category_id ?? -1);

  const matchesToInsert: any[] = [];
  const notifications: any[] = [];

  for (const product of candidateProducts ?? []) {
    const score = computeMatchScore({
      requestTitle: title,
      requestCategoryId: category_id,
      requestMaxBudget: max_budget,
      requestCityId: city_id,
      requestCondition: accepted_condition ?? "any",
      requestSpecs: specs ?? {},
      productTitle: product.title,
      productCategoryId: product.category_id,
      productPrice: product.price,
      productCityId: product.city_id,
      productCondition: product.condition,
      productSpecs: product.specs ?? {},
    });

    if (score >= MATCH_THRESHOLD) {
      matchesToInsert.push({ request_id: request.id, product_id: product.id, score });
    }
  }

  if (matchesToInsert.length > 0) {
    await supabase.from("matches").upsert(matchesToInsert, { onConflict: "request_id,product_id" });

    // Notify the buyer: "🔥 وجدنا عرضًا قد يناسب طلبك"
    notifications.push({
      user_id: user.id,
      type: "new_match",
      title: "🔥 وجدنا عروضًا تناسب طلبك!",
      body: `${matchesToInsert.length} عرض متاح الآن لـ "${title}"`,
      ref_id: request.id,
    });

    // Notify each matched seller: "🎯 وجدنا شخصًا يبحث عن منتجك"
    for (const m of matchesToInsert) {
      const product = candidateProducts!.find((p) => p.id === m.product_id)!;
      notifications.push({
        user_id: product.user_id,
        type: "new_match",
        title: "🎯 وجدنا مشتريًا محتملًا لمنتجك!",
        body: `شخص يبحث عن "${title}" بميزانية ${max_budget} دج`,
        ref_id: product.id,
      });
    }

    await supabase.from("notifications").insert(notifications);
  }

  return NextResponse.json({ request, matches_found: matchesToInsert.length });
}
