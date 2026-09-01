import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/matches?request_id=xxx  OR  ?product_id=xxx
// Returns ranked matches with the counterpart's full listing info (buyers-found or sellers-found view)
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get("request_id");
  const productId = searchParams.get("product_id");

  if (!requestId && !productId) {
    return NextResponse.json({ error: "request_id أو product_id مطلوب" }, { status: 400 });
  }

  let query = supabase
    .from("matches")
    .select(`
      id, score, status, created_at,
      request:requests(id, title, max_budget, city_id, user_id, cities(name_ar)),
      product:products(id, title, price, city_id, images, user_id, cities(name_ar), users(full_name, avatar_url, rating_avg, deals_count))
    `)
    .order("score", { ascending: false });

  if (requestId) query = query.eq("request_id", requestId);
  if (productId) query = query.eq("product_id", productId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ matches: data });
}

// POST /api/matches — request contact (respects privacy: no phone number shown until accepted)
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { match_id, to_user_id } = await req.json();
  if (!match_id || !to_user_id) {
    return NextResponse.json({ error: "match_id و to_user_id مطلوبان" }, { status: 400 });
  }

  const { data: contactReq, error } = await supabase
    .from("contact_requests")
    .insert({ match_id, from_user_id: user.id, to_user_id, status: "pending" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from("notifications").insert({
    user_id: to_user_id,
    type: "contact_request",
    title: "📩 طلب تواصل جديد",
    body: "شخص مهتم بمنتجك/طلبك يريد التواصل معك",
    ref_id: contactReq.id,
  });

  await supabase.from("matches").update({ status: "contacted" }).eq("id", match_id);

  return NextResponse.json({ contact_request: contactReq });
}
