"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ChatListPage() {
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("conversations")
        .select("*, messages(content, created_at)")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order("created_at", { ascending: false });
      setConversations(data ?? []);
    })();
  }, []);

  return (
    <main className="px-5 pt-8">
      <h1 className="text-xl font-extrabold mb-6">الدردشة</h1>
      <ul className="space-y-2">
        {conversations.map((c) => (
          <Link
            key={c.id}
            href={`/chat/${c.id}`}
            className="block p-3.5 rounded-card border border-line"
          >
            <p className="font-semibold text-sm">محادثة</p>
            <p className="text-xs text-inkSoft mt-0.5 truncate">
              {c.messages?.[c.messages.length - 1]?.content ?? "ابدأ المحادثة"}
            </p>
          </Link>
        ))}
        {conversations.length === 0 && (
          <p className="text-inkSoft text-sm text-center py-16">
            لا توجد محادثات بعد. اقبل طلب تواصل لبدء الدردشة.
          </p>
        )}
      </ul>
    </main>
  );
}
