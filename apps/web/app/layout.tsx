import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import Link from "next/link";
import { RootShell } from "./components/RootShell";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "AgriGuard",
  description: "BATS-AgriGuard: truy xuất nông sản, kiểm tra tính nhất quán vùng trồng (PCIE) và neo bằng chứng phục vụ kiểm toán.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/bats-logo.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={beVietnamPro.variable}>
      <body className={beVietnamPro.className}>
        <RootShell>{children}</RootShell>
      </body>
    </html>
  );
}

