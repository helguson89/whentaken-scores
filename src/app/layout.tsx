import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WhenTaken Scores",
  description: "Del og sammenlign WhenTaken-resultater med venner",
};

const NAV_LINKS = [
  { href: "/", label: "I dag" },
  { href: "/add", label: "Legg til" },
  { href: "/stats", label: "Statistikk" },
  { href: "/history", label: "Historikk" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="no"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <nav className="border-b sticky top-0 bg-white z-10">
          <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3 text-sm font-medium">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-gray-500"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
