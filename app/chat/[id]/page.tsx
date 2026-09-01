"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Send } from "lucide-react";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));

    fetch(`/api/messages?conversation_id=${id}`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []));

    // Realtime subscription for new incoming messages
    const channel = supabase
      .channel(`conversation-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!text.trim()) return;
    const content = text;
    setText("");
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: id, content }),
    });
  }

  return (
    <main className="flex flex-col h-screen">
      <header className="px-5 py-4 border-b border-line flex items-center gap-3">
        <button onClick={() => router.back()}><ArrowRight size={20} /></button>
        <h1 className="font-bold">المحادثة</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] px-3.5 py-2 rounded-card text-sm ${
              m.sender_id === userId ? "bg-teal text-paper mr-auto" : "bg-paperDim ml-auto"
            }`}
          >
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-line flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="اكتب رسالة..."
          className="flex-1 bg-paperDim rounded-pill px-4 py-2.5 text-sm outline-none"
        />
        <button onClick={send} className="bg-teal text-paper w-10 h-10 rounded-full flex items-center justify-center">
          <Send size={16} />
        </button>
      </div>
    </main>
  );
}
