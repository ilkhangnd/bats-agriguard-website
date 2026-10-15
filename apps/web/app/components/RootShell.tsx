"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthNavigation } from "./AuthNavigation";

export function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isApp =
    pathname?.startsWith("/app") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/portal") ||
    pathname?.startsWith("/connect");
  const isAuth = pathname === "/login" || pathname === "/register";

  // App routes own their navigation, so don't render the public topbar or footer there.
  const showRootChrome = !isLanding && !isApp && !isAuth;

  return (
    <>
      {showRootChrome && (
        <header className="topbar">
          <Link className="brand" href="/">
            <img
              src="/bats-logo.png"
              alt="BATS Traceability"
              style={{ width: "42px", height: "42px", objectFit: "contain" }}
            />
            <span className="brandText">
              <strong>BATS</strong> <span className="brandSub">Truy xuất nông sản</span>
            </span>
          </Link>
          <nav>
            <Link href="/#trace-lookup">Tra cứu QR / mã lô</Link>
            <Link href="/connect">Kết nối chuỗi</Link>
            <Link href="/portal">Dữ liệu đồng bộ</Link>
            <AuthNavigation />
          </nav>
        </header>
      )}

      {children}

      {showRootChrome && (
        <footer className="siteFooter">
          <Link className="brand footerBrand" href="/">
            <img
              src="/bats-logo.png"
              alt="BATS Traceability"
              style={{ width: "42px", height: "42px", objectFit: "contain" }}
            />
            <span className="brandText">
              <strong>BATS</strong> <span className="brandSub">Truy xuất nông sản</span>
            </span>
          </Link>
          <div className="footerLinks">
            <Link href="/#trace-lookup">Tra cứu QR / mã lô</Link>
            <Link href="/connect">Kết nối chuỗi</Link>
            <Link href="/portal">Dữ liệu đồng bộ</Link>
            <AuthNavigation footer />
          </div>
        </footer>
      )}
    </>
  );
}
