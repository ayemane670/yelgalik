import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/reports — report a user, request, or product
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { reported_user_id, reported_request_id, reported_product_id, reason, details } = await req.json();
  if (!reason) return NextResponse.json({ error: "السبب مطلوب" }, { status: 400 });

  const { data, error } = await supabase
    .from("reports")
    .insert({
      reporter_id: user.id,
      reported_user_id,
      reported_request_id,
      reported_product_id,
      reason,
      details,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ report: data });
}

// POST /api/reports/block — separate lightweight helper could live at /api/blocks;
// kept here as a note: block logic lives in app/api/blocks/route.ts
