import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeMatchScore, normalizeTitle, MATCH_THRESHOLD } from "@/lib/matching";

// GET /api/products — list active products
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const category = searchParams.get("category");

  let query = supabase
    .from("products")
    .select("*, users(full_name, avatar_url, rating_avg), cities(name_ar), categories(name_ar)")
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (city) query = query.eq("city_id", city);
  if (category) query = query.eq("category_id", category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ products: data });
}

// POST /api/products — "أبيع" — this is where the REVERSE SEARCH magic happens:
// as soon as a seller posts a product, we search all existing buyer requests for matches.
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await req.json();
  const { title, category_id, price, city_id, condition, quantity, specs, description, images } = body;

  if (!title || !price) {
    return NextResponse.json({ error: "العنوان والسعر مطلوبان" }, { status: 400 });
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      user_id: user.id,
      title,
      normalized_title: normalizeTitle(title),
      category_id,
      price,
      city_id,
      condition: condition ?? "good",
      quantity: quantity ?? 1,
      specs: specs ?? {},
      description,
      images: images ?? [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // ---- REVERSE SEARCH: "37 person are looking for PC Gaming" ----
  const { data: candidateRequests } = await supabase
    .from("requests")
    .select("*")
    .eq("status", "active")
    .eq("category_id", category_id ?? -1);

  const matchesToInsert: any[] = [];
  const notifications: any[] = [];

  for (const request of candidateRequests ?? []) {
    const score = computeMatchScore({
      requestTitle: request.title,
      requestCategoryId: request.category_id,
      requestMaxBudget: request.max_budget,
      requestCityId: request.city_id,
      requestCondition: request.accepted_condition,
      requestSpecs: request.specs ?? {},
      productTitle: title,
      productCategoryId: category_id,
      productPrice: price,
      productCityId: city_id,
      productCondition: condition ?? "good",
      productSpecs: specs ?? {},
    });

    if (score >= MATCH_THRESHOLD) {
      matchesToInsert.push({ request_id: request.id, product_id: product.id, score });
    }
  }

  if (matchesToInsert.length > 0) {
    await supabase.from("matches").upsert(matchesToInsert, { onConflict: "request_id,product_id" });

    // Notify the seller with the headline feature: "🎯 وجدنا 8 أشخاص يبحثون عن منتجك"
    notifications.push({
      user_id: user.id,
      type: "new_match",
      title: `🎯 وجدنا ${matchesToInsert.length} أشخاص يبحثون عن منتجك!`,
      body: `اشخاص يبحثون عن "${title}" الآن`,
      ref_id: product.id,
    });

    for (const m of matchesToInsert) {
      const request = candidateRequests!.find((r) => r.id === m.request_id)!;
      notifications.push({
        user_id: request.user_id,
        type: "new_match",
        title: "🔥 وجدنا عرضًا قد يناسب طلبك!",
        body: `"${title}" متاح بسعر ${price} دج`,
        ref_id: request.id,
      });
    }

    await supabase.from("notifications").insert(notifications);
  }

  return NextResponse.json({ product, buyers_found: matchesToInsert.length });
}
