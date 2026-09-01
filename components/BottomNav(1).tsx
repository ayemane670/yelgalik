"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Bell, MessageCircle, User } from "lucide-react";

const TABS = [
  { href: "/home", label: "الرئيسية", icon: Home },
  { href: "/post-request", label: "انشر", icon: PlusCircle },
  { href: "/notifications", label: "الإشعارات", icon: Bell },
  { href: "/chat", label: "الدردشة", icon: MessageCircle },
  { href: "/profile", label: "حسابي", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (["/login", "/signup", "/onboarding", "/"].includes(pathname)) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 mx-auto max-w-md bg-paper/95 backdrop-blur border-t border-line">
      <ul className="grid grid-cols-5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${
                  active ? "text-teal" : "text-inkSoft"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
