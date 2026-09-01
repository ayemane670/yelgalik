import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { blocked_id } = await req.json();
  if (!blocked_id) return NextResponse.json({ error: "blocked_id مطلوب" }, { status: 400 });

  const { data, error } = await supabase
    .from("blocks")
    .insert({ blocker_id: user.id, blocked_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ block: data });
}
