import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/messages?conversation_id=xxx
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const conversationId = new URL(req.url).searchParams.get("conversation_id");
  if (!conversationId) return NextResponse.json({ error: "conversation_id مطلوب" }, { status: 400 });

  const { data, error } = await supabase
    .from("messages")
    .select("*, users(full_name, avatar_url)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ messages: data });
}

// POST /api/messages — send a message. Content is scanned for raw phone numbers as a light
// privacy nudge (full enforcement should be done via a Postgres trigger / Edge Function in prod).
const PHONE_REGEX = /(\+?213|0)[0-9\s\-]{8,}/;

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { conversation_id, content } = await req.json();
  if (!conversation_id || !content) {
    return NextResponse.json({ error: "conversation_id و content مطلوبان" }, { status: 400 });
  }

  const { data: conv } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversation_id)
    .single();

  if (!conv || ![conv.user_a, conv.user_b].includes(user.id)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const flagged = PHONE_REGEX.test(content);

  const { data: message, error } = await supabase
    .from("messages")
    .insert({ conversation_id, sender_id: user.id, content })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const otherUser = conv.user_a === user.id ? conv.user_b : conv.user_a;
  await supabase.from("notifications").insert({
    user_id: otherUser,
    type: "new_message",
    title: "💬 رسالة جديدة",
    body: content.slice(0, 60),
    ref_id: conversation_id,
  });

  return NextResponse.json({ message, phone_number_detected: flagged });
}
