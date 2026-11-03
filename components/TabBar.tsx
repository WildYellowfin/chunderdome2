"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const I = {
  trip: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M2 20h20" /><path d="M4 20 12 5l8 15" /><path d="M10 20l2-4 2 4" /></svg>,
  pack: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="4" y="7" width="16" height="14" /><path d="M9 7V4h6v3" /><path d="M4 12h16" /></svg>,
  me: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg>,
  admin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>,
};

export default function TabBar({ admin }: { admin?: boolean }) {
  const path = usePathname();
  const tabs = [
    { href: "/", label: "Trip", icon: I.trip },
    { href: "/packing", label: "Pack", icon: I.pack },
    { href: "/me", label: "Profile", icon: I.me },
    ...(admin ? [{ href: "/admin", label: "Admin", icon: I.admin }] : []),
  ];
  return (
    <div className="tabbar">
      <nav aria-label="Main">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} aria-current={path === t.href ? "page" : undefined}>
            {t.icon}
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
