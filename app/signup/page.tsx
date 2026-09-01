"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });
    setLoading(false);
    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "فشل إنشاء الحساب");
      return;
    }
    router.push("/home");
  }

  return (
    <main className="px-6 pt-16">
      <h1 className="text-2xl font-extrabold mb-1">إنشاء حساب</h1>
      <p className="text-inkSoft text-sm mb-8">انضم إلى يلقالك في أقل من دقيقة.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="الاسم الكامل"
          className="w-full bg-paperDim rounded-card px-4 py-3.5 outline-none focus:ring-2 focus:ring-teal"
        />
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="رقم الهاتف (0555 xx xx xx)"
          className="w-full bg-paperDim rounded-card px-4 py-3.5 outline-none focus:ring-2 focus:ring-teal"
        />
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
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="كلمة المرور"
          className="w-full bg-paperDim rounded-card px-4 py-3.5 outline-none focus:ring-2 focus:ring-teal"
        />

        {error && <p className="text-danger text-sm">{error}</p>}

        <button disabled={loading} className="w-full bg-teal text-paper font-bold py-3.5 rounded-pill disabled:opacity-60">
          {loading ? "جارِ الإنشاء..." : "إنشاء حساب"}
        </button>
      </form>

      <p className="text-center text-sm text-inkSoft mt-6">
        لديك حساب؟ <Link href="/login" className="text-teal font-semibold">تسجيل الدخول</Link>
      </p>
    </main>
  );
}
