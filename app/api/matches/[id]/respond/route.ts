import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/matches/[id]/respond — accept or decline a contact_request.
// On accept: creates (or reuses) a conversation so both sides can chat — this is the
// moment contact info effectively becomes reachable (via in-app chat, not raw phone number).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { action } = await req.json(); // 'accept' | 'decline'
  const contactRequestId = params.id;

  const { data: cr, error: crError } = await supabase
    .from("contact_requests")
    .select("*")
    .eq("id", contactRequestId)
    .single();

  if (crError || !cr) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  if (cr.to_user_id !== user.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const status = action === "accept" ? "accepted" : "declined";
  await supabase.from("contact_requests").update({ status }).eq("id", contactRequestId);

  if (status !== "accepted") {
    return NextResponse.json({ status });
  }

  const [userA, userB] = [cr.from_user_id, cr.to_user_id].sort();
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("match_id", cr.match_id)
    .eq("user_a", userA)
    .eq("user_b", userB)
    .maybeSingle();

  let conversation = existing;
  if (!conversation) {
    const { data: created, error: convError } = await supabase
      .from("conversations")
      .insert({ match_id: cr.match_id, user_a: userA, user_b: userB })
      .select()
      .single();
    if (convError) return NextResponse.json({ error: convError.message }, { status: 400 });
    conversation = created;
  }

  await supabase.from("notifications").insert({
    user_id: cr.from_user_id,
    type: "contact_accepted",
    title: "✅ تم قبول طلب التواصل",
    body: "يمكنك الآن الدردشة معه داخل التطبيق",
    ref_id: conversation.id,
  });

  return NextResponse.json({ status, conversation });
}
