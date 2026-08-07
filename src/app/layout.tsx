import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import Link from "next/link";
import { NotificationsBell } from "@/components/NotificationsBell";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "WhenTaken Scores",
  description: "Del og sammenlign WhenTaken-resultater med venner",
};

const NAV_LINKS = [
  { href: "/", label: "I dag", icon: "☀️" },
  { href: "/add", label: "Legg til", icon: "➕" },
  { href: "/stats", label: "Statistikk", icon: "📊" },
  { href: "/history", label: "Historikk", icon: "🗓️" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="no" className={`${fredoka.variable} h-full antialiased`}>
      <body className="bg-app-gradient flex min-h-full flex-col text-ink">
        <NotificationsBell />
        <div className="flex-1 pb-24">{children}</div>
        <nav className="fixed inset-x-0 bottom-0 border-t border-peach-dark bg-cream/95 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-xs font-medium text-ink-light hover:bg-peach hover:text-ink"
              >
                <span className="text-xl">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </body>
    </html>
  );
}
