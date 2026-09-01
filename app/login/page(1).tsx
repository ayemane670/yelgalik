"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      return;
    }
    router.push("/home");
  }

  return (
    <main className="px-6 pt-16">
      <h1 className="text-2xl font-extrabold mb-1">يلقالك</h1>
      <p className="text-inkSoft text-sm mb-8">سجّل الدخول لمتابعة طلباتك وعروضك.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="البريد الإلكتروني"
          className="w-full bg-paperDim rounded-card px-4 py-3.5 outline-none focus:ring-2 focus:ring-teal"
        />
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="كلمة المرور"
          className="w-full bg-paperDim rounded-card px-4 py-3.5 outline-none focus:ring-2 focus:ring-teal"
        />
        {error && <p className="text-danger text-sm">{error}</p>}
        <button disabled={loading} className="w-full bg-teal text-paper font-bold py-3.5 rounded-pill disabled:opacity-60">
          {loading ? "جارِ الدخول..." : "تسجيل الدخول"}
        </button>
      </form>

      <p className="text-center text-sm text-inkSoft mt-6">
        ليس لديك حساب؟ <Link href="/signup" className="text-teal font-semibold">إنشاء حساب</Link>
      </p>
    </main>
  );
}
