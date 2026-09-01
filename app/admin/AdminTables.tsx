"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminTables({ initialReports }: { initialReports: any[] }) {
  const [reports, setReports] = useState(initialReports);

  async function resolveReport(reportId: string, banUser?: string) {
    const supabase = createClient();
    if (banUser) {
      await supabase.from("users").update({ is_banned: true }).eq("id", banUser);
    }
    await supabase.from("reports").update({ status: "resolved" }).eq("id", reportId);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  }

  async function dismissReport(reportId: string) {
    const supabase = createClient();
    await supabase.from("reports").update({ status: "dismissed" }).eq("id", reportId);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  }

  return (
    <section>
      <h2 className="font-bold text-sm mb-3">البلاغات المفتوحة ({reports.length})</h2>
      <ul className="space-y-2.5">
        {reports.map((r) => (
          <li key={r.id} className="p-3.5 rounded-card border border-line">
            <p className="text-sm font-semibold">{r.reason}</p>
            <p className="text-xs text-inkSoft mt-1">{r.details}</p>
            <p className="text-xs text-inkSoft mt-1">مُبلِّغ: {r.reporter?.full_name ?? "—"}</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => resolveReport(r.id, r.reported_user_id)}
                className="text-xs font-bold bg-danger text-paper px-3 py-1.5 rounded-pill"
              >
                حظر المستخدم
              </button>
              <button
                onClick={() => dismissReport(r.id)}
                className="text-xs font-bold bg-paperDim px-3 py-1.5 rounded-pill"
              >
                تجاهل
              </button>
            </div>
          </li>
        ))}
        {reports.length === 0 && <p className="text-inkSoft text-sm py-6 text-center">لا توجد بلاغات مفتوحة.</p>}
      </ul>
    </section>
  );
}
