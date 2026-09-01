"use client";
import { useEffect, useState } from "react";
import { Flame, MessageCircle, UserCheck, Bell } from "lucide-react";

const ICONS: Record<string, any> = {
  new_match: Flame,
  new_message: MessageCircle,
  contact_request: UserCheck,
  contact_accepted: UserCheck,
  system: Bell,
};

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setItems(d.notifications ?? []));
  }, []);

  return (
    <main className="px-5 pt-8">
      <h1 className="text-xl font-extrabold mb-6">الإشعارات</h1>
      <ul className="space-y-2.5">
        {items.map((n) => {
          const Icon = ICONS[n.type] ?? Bell;
          return (
            <li
              key={n.id}
              className={`flex gap-3 p-3.5 rounded-card border ${
                n.is_read ? "border-line" : "border-flame/40 bg-flame-light bg-flame/5"
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-teal-light flex items-center justify-center shrink-0">
                <Icon size={16} className="text-teal" />
              </div>
              <div>
                <p className="font-semibold text-sm">{n.title}</p>
                <p className="text-xs text-inkSoft mt-0.5">{n.body}</p>
              </div>
            </li>
          );
        })}
        {items.length === 0 && (
          <p className="text-inkSoft text-sm text-center py-16">لا توجد إشعارات بعد.</p>
        )}
      </ul>
    </main>
  );
}
