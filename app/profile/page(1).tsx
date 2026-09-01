"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { List, Package, Bookmark, Settings, LogOut, ShieldCheck } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
      setProfile(data);
    })();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const links = [
    { href: "/my-requests", label: "طلباتي", icon: List },
    { href: "/my-products", label: "منتجاتي", icon: Package },
    { href: "/saved", label: "المحفوظات", icon: Bookmark },
    { href: "/settings", label: "الإعدادات", icon: Settings },
  ];

  return (
    <main className="px-5 pt-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-14 h-14 rounded-full bg-teal-light flex items-center justify-center text-teal font-bold text-lg">
          {profile?.full_name?.[0] ?? "؟"}
        </div>
        <div>
          <p className="font-bold flex items-center gap-1">
            {profile?.full_name}
            {profile?.is_verified && <ShieldCheck size={15} className="text-teal" />}
          </p>
          <p className="text-xs text-inkSoft">
            {profile?.deals_count ?? 0} صفقة · تقييم {profile?.rating_avg ?? 0}⭐
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="flex items-center gap-3 p-3.5 rounded-card border border-line">
              <Icon size={18} className="text-inkSoft" />
              <span className="text-sm font-semibold">{label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-danger text-sm font-semibold mt-8 px-1"
      >
        <LogOut size={16} /> تسجيل الخروج
      </button>
    </main>
  );
}
