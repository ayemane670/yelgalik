import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminTables from "./AdminTables";

export default async function AdminDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) redirect("/home");

  const admin = createAdminClient();
  const [{ count: usersCount }, { count: requestsCount }, { count: productsCount }, { count: matchesCount }, { data: reports }] =
    await Promise.all([
      admin.from("users").select("*", { count: "exact", head: true }),
      admin.from("requests").select("*", { count: "exact", head: true }).eq("status", "active"),
      admin.from("products").select("*", { count: "exact", head: true }).eq("status", "active"),
      admin.from("matches").select("*", { count: "exact", head: true }),
      admin.from("reports").select("*, reporter:users!reports_reporter_id_fkey(full_name)").eq("status", "open").order("created_at", { ascending: false }),
    ]);

  const stats = [
    { label: "المستخدمون", value: usersCount ?? 0 },
    { label: "طلبات نشطة", value: requestsCount ?? 0 },
    { label: "منتجات نشطة", value: productsCount ?? 0 },
    { label: "تطابقات", value: matchesCount ?? 0 },
  ];

  return (
    <main className="px-5 pt-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-extrabold mb-6">لوحة الإدارة</h1>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-paperDim rounded-card p-4">
            <p className="text-2xl font-extrabold">{s.value}</p>
            <p className="text-xs text-inkSoft mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <AdminTables initialReports={reports ?? []} />
    </main>
  );
}
