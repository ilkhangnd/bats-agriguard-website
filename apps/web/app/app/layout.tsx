"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SettingsPage from "./settings/page";
import {
  ALERTS_CHANGE_EVENT,
  getOpenAlertsCount,
  syncWithBackendAlerts
} from "./alerts/alertsStore";
import {
  LayoutDashboard,
  MapPin,
  Package,
  Layers,
  Inbox,
  ShieldAlert,
  GitBranch,
  BarChart3,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  Lock,
  Clock,
  ArrowLeft,
  ChevronDown,
  X,
  Camera,
  Mail,
  Phone,
  UserRound,
  KeyRound,
  Save,
  Menu
} from "lucide-react";

interface UserProfile {
  name: string;
  role: string;
  org?: string;
  actorId?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  token?: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

function getRoleLabel(role?: string): string {
  switch (role) {
    case "ADMIN": return "Quản trị viên (Admin)";
    case "COOPERATIVE":
    case "COOP_MANAGER": return "Hợp tác xã (Manager)";
    case "FARMER": return "Nông hộ (Farmer)";
    case "COLLECTOR": return "Thương lái (Collector)";
    case "REVIEWER": return "Hậu kiểm (Reviewer)";
    case "PACKING": return "Xưởng đóng gói";
    case "EXPORTER": return "Xuất khẩu";
    case "MEMBER": return "Thành viên tiêu chuẩn (Chờ phê duyệt)";
    default: return role || "Chưa xác thực";
  }
}

function getHomeRouteForRole(role?: string): string {
  switch (role) {
    case "ADMIN": return "/app/dashboard";
    case "FARMER": return "/app/plantations";
    case "COLLECTOR": return "/app/receive";
    case "REVIEWER": return "/app/alerts";
    case "COOPERATIVE":
    case "COOP_MANAGER": return "/app/dashboard";
    default: return "/portal";
  }
}

const ROUTE_PERMISSIONS: { pathPrefix: string; allowedRoles: string[]; label: string }[] = [
  { pathPrefix: "/app/plantations", allowedRoles: ["ADMIN", "FARMER", "COOPERATIVE", "COOP_MANAGER"], label: "Quản lý vùng trồng" },
  { pathPrefix: "/app/receive", allowedRoles: ["ADMIN", "COLLECTOR", "COOPERATIVE"], label: "Tiếp nhận lô hàng" },
  { pathPrefix: "/app/alerts", allowedRoles: ["ADMIN", "REVIEWER"], label: "Cảnh báo & Kiểm tra lại" },
  { pathPrefix: "/app/pcie", allowedRoles: ["ADMIN", "REVIEWER", "COOPERATIVE", "COOP_MANAGER"], label: "Kiểm tra & Xác minh" },
  { pathPrefix: "/app/actors", allowedRoles: ["ADMIN", "COOPERATIVE"], label: "Quản lý người dùng" },
  { pathPrefix: "/app/settings", allowedRoles: ["ADMIN", "COOPERATIVE"], label: "Cài đặt & Quy tắc" },
  { pathPrefix: "/app/reports", allowedRoles: ["ADMIN", "COOPERATIVE", "COOP_MANAGER", "REVIEWER"], label: "Báo cáo & Đối chiếu" },
  { pathPrefix: "/app/events", allowedRoles: ["ADMIN", "COOPERATIVE", "COOP_MANAGER", "REVIEWER"], label: "Nhật ký hoạt động" },
  { pathPrefix: "/app/batches", allowedRoles: ["ADMIN", "FARMER", "COLLECTOR", "COOPERATIVE", "COOP_MANAGER", "REVIEWER", "PACKING", "EXPORTER"], label: "Quản lý Lô hàng" },
  { pathPrefix: "/app/dashboard", allowedRoles: ["ADMIN", "COOPERATIVE", "COOP_MANAGER", "REVIEWER"], label: "Tổng quan Quản trị" },
  { pathPrefix: "/app/traceability", allowedRoles: ["ADMIN", "FARMER", "COLLECTOR", "COOPERATIVE", "COOP_MANAGER", "REVIEWER", "PACKING", "EXPORTER"], label: "Hành trình lô hàng" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isPolicySettingsOpen, setIsPolicySettingsOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [accountDraft, setAccountDraft] = useState({ name: "", email: "", phone: "", avatar: "" });
  const [accountFeedback, setAccountFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [alertCount, setAlertCount] = useState<number>(3);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAlertCount(getOpenAlertsCount());
    const onAlertsChange = () => {
      setAlertCount(getOpenAlertsCount());
    };
    window.addEventListener(ALERTS_CHANGE_EVENT, onAlertsChange);
    window.addEventListener("storage", onAlertsChange);
    syncWithBackendAlerts().then((count) => {
      if (typeof count === "number") setAlertCount(count);
    }).catch(() => {});
    return () => {
      window.removeEventListener(ALERTS_CHANGE_EVENT, onAlertsChange);
      window.removeEventListener("storage", onAlertsChange);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    const syncUser = () => {
      try {
        const raw = localStorage.getItem("bats_current_user");
        setUser(raw ? JSON.parse(raw) : null);
      } catch {
        setUser(null);
      }
    };
    syncUser();
    window.addEventListener("bats-auth-change", syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener("bats-auth-change", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, [pathname]);

  // Handle Escape key to close any open modal or drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsAccountMenuOpen(false);
        setIsPolicySettingsOpen(false);
        setIsAccountSettingsOpen(false);
        setIsMobileNavOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("bats_current_user");
    localStorage.removeItem("bats_current_role");
    window.dispatchEvent(new Event("bats-auth-change"));
    router.push("/login");
  };

  const openAccountSettings = () => {
    if (!user) return;
    setAccountDraft({ name: user.name || "", email: user.email || "", phone: user.phone || "", avatar: user.avatar || "" });
    setAccountFeedback(null);
    setIsAccountMenuOpen(false);
    setIsAccountSettingsOpen(true);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAccountFeedback({ type: "error", message: "Vui lòng chọn một tệp hình ảnh hợp lệ." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAccountDraft((current) => ({ ...current, avatar: String(reader.result || "") }));
      setAccountFeedback(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAccount = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const name = accountDraft.name.trim();
    const email = accountDraft.email.trim();
    const phone = accountDraft.phone.trim();

    if (!name || !email) {
      setAccountFeedback({ type: "error", message: "Vui lòng nhập tên hiển thị và email." });
      return;
    }

    const nextUser = { ...user, name, email, phone, avatar: accountDraft.avatar };
    localStorage.setItem("bats_current_user", JSON.stringify(nextUser));
    setUser(nextUser);
    window.dispatchEvent(new Event("bats-auth-change"));
    setAccountFeedback({ type: "success", message: "Đã lưu thông tin tài khoản." });
  };

  const navigationGroups: { label: string | null; items: NavigationItem[] }[] = [
    {
      label: null,
      items: [
        { name: "Tổng quan", href: "/app/dashboard", icon: LayoutDashboard }
      ]
    },
    {
      label: "Quản lý sản xuất",
      items: [
        { name: "Quản lý vùng trồng", href: "/app/plantations", icon: MapPin },
        { name: "Quản lý lô hàng", href: "/app/batches", icon: Package },
        { name: "Nhật ký hoạt động", href: "/app/events", icon: Layers },
        { name: "Tiếp nhận lô hàng", href: "/app/receive", icon: Inbox }
      ]
    },
    {
      label: "Kiểm tra & giám sát",
      items: [
        { name: "Kiểm tra & Xác minh", href: "/app/pcie", icon: ShieldCheck },
        { name: "Cảnh báo & Kiểm tra lại", href: "/app/alerts", icon: ShieldAlert, badge: alertCount > 0 ? String(alertCount) : undefined },
        { name: "Hành trình lô hàng", href: "/app/traceability", icon: GitBranch }
      ]
    },
    {
      label: "Quản trị hệ thống",
      items: [
        { name: "Báo cáo & Đối chiếu", href: "/app/reports", icon: BarChart3 },
        { name: "Quản lý người dùng", href: "/app/actors", icon: Users }
      ]
    }
  ];

  // Route rule check
  const matchedRule = ROUTE_PERMISSIONS.find((r) => pathname.startsWith(r.pathPrefix));
  const hasAccess = user
    ? !matchedRule || matchedRule.allowedRoles.includes(user.role)
    : false;
  const canManagePolicy = Boolean(user && ["ADMIN", "COOPERATIVE"].includes(user.role));

  if (!mounted) {
    return (
      <div className="operationsConsole" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F6F6F0" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", color: "#0A3827" }}>
          <Image src="/bats-logo.png" alt="BATS-AgriGuard Logo" width={48} height={48} style={{ objectFit: "contain" }} priority />
          <div style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.2px" }}>BATS-AgriGuard</div>
          <div style={{ fontSize: "12px", color: "#52736A" }}>Đang khởi tạo không gian làm việc...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="operationsConsole" style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F6F6F0", fontFamily: "var(--font-sans, system-ui, sans-serif)", width: "100%" }}>
      {/* Mobile Backdrop */}
      <div
        className={`operationsBackdrop ${isMobileNavOpen ? "mobileOpen" : ""}`}
        onClick={() => setIsMobileNavOpen(false)}
        aria-hidden="true"
      />

      {/* SIDEBAR */}
      <aside
        className={`operationsSidebar ${isMobileNavOpen ? "mobileOpen" : ""}`}
        style={{
          width: "260px",
          backgroundColor: "#0A3827",
          color: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #165D40",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          height: "100vh",
          overflow: "hidden"
        }}
      >
        {/* Brand header */}
        <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#FFFFFF", display: "flex", alignItems: "center", gap: "10px" }}>
            <Image
              src="/bats-logo.png"
              alt="BATS-AgriGuard Logo"
              width={36}
              height={36}
              style={{ objectFit: "contain" }}
              priority
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "0.5px" }}>BATS-AgriGuard</div>
              <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.7)" }}>Quản lý và giám sát</div>
            </div>
          </Link>
          {isMobileNavOpen && (
            <button
              type="button"
              aria-label="Đóng thanh điều hướng"
              onClick={() => setIsMobileNavOpen(false)}
              style={{ border: 0, background: "transparent", color: "#FFFFFF", cursor: "pointer", display: "grid", placeItems: "center" }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav aria-label="Điều hướng chính" style={{ flex: 1, width: "100%", boxSizing: "border-box", padding: "16px 8px", display: "flex", flexDirection: "column", alignItems: "stretch", gap: "16px", overflowY: "auto", fontFamily: "inherit" }}>
          {navigationGroups.map((group, groupIndex) => (
            <div key={group.label ?? "overview"} style={{ display: "flex", width: "100%", boxSizing: "border-box", flexDirection: "column", alignItems: "stretch", gap: "4px", paddingTop: groupIndex > 1 ? "16px" : 0, borderTop: groupIndex > 1 ? "1px solid rgba(190, 219, 204, 0.28)" : "none" }}>
              {group.label && (
                <div style={{ padding: "0 12px 6px", color: "rgba(214, 233, 222, 0.74)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", textAlign: "left" }}>
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                const itemRule = ROUTE_PERMISSIONS.find((rule) => item.href.startsWith(rule.pathPrefix));
                const isItemAllowed = Boolean(user && (!itemRule || itemRule.allowedRoles.includes(user.role)));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "flex",
                      width: "100%",
                      boxSizing: "border-box",
                      alignSelf: "stretch",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontSize: "13px",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#FFFFFF" : isItemAllowed ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.4)",
                      backgroundColor: isActive ? "#165D40" : "transparent",
                      transition: "all 0.15s ease",
                      opacity: isItemAllowed ? 1 : 0.65
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Icon size={16} color={isActive ? "#FFFFFF" : isItemAllowed ? "rgba(255, 255, 255, 0.7)" : "rgba(255, 255, 255, 0.35)"} />
                      <span>{item.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
                      {!isItemAllowed && <Lock size={12} color="rgba(255, 255, 255, 0.4)" />}
                      {isItemAllowed && item.badge && (
                        <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "10px", backgroundColor: "#B54745", color: "#FFFFFF", fontWeight: 700 }}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {user && (
          <div style={{ position: "relative", padding: "12px 8px 16px", borderTop: "1px solid rgba(255, 255, 255, 0.14)" }}>
            {isAccountMenuOpen && (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  left: "8px",
                  right: "8px",
                  bottom: "calc(100% + 8px)",
                  zIndex: 20,
                  padding: "16px",
                  background: "#FFFFFF",
                  border: "1px solid #D7E0DA",
                  borderRadius: "14px",
                  boxShadow: "0 16px 32px rgba(3, 34, 23, 0.28)"
                }}
              >
                <div style={{ color: "#17251E", fontSize: "13px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name}
                </div>
                <div style={{ color: "#68766C", fontSize: "11px", marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email || getRoleLabel(user.role)}
                </div>
                <div style={{ height: "1px", background: "#E5EDE7", margin: "14px 0 8px" }} />
                {canManagePolicy && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      setIsPolicySettingsOpen(true);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 0", border: 0, background: "transparent", color: "#435248", fontFamily: "inherit", fontSize: "13px", fontWeight: 500, textAlign: "left", cursor: "pointer" }}
                  >
                    <Settings size={16} />
                    <span>Quy tắc kiểm tra</span>
                  </button>
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={openAccountSettings}
                  style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 0", border: 0, background: "transparent", color: "#435248", fontFamily: "inherit", fontSize: "13px", fontWeight: 500, textAlign: "left", cursor: "pointer" }}
                >
                  <UserRound size={16} />
                  <span>Cài đặt tài khoản</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 0", border: 0, background: "transparent", color: "#C9372C", fontFamily: "inherit", fontSize: "13px", fontWeight: 600, textAlign: "left", cursor: "pointer" }}
                >
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
              aria-expanded={isAccountMenuOpen}
              aria-haspopup="menu"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "10px 12px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "10px",
                background: isAccountMenuOpen ? "#165D40" : "rgba(255, 255, 255, 0.05)",
                color: "#FFFFFF",
                fontFamily: "inherit",
                textAlign: "left",
                cursor: "pointer"
              }}
            >
              <div style={{ width: "30px", height: "30px", overflow: "hidden", borderRadius: "50%", background: "#2B8A63", display: "grid", placeItems: "center", flexShrink: 0, fontSize: "13px", fontWeight: 700 }}>
                {user.avatar ? <img src={user.avatar} alt="Ảnh đại diện" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : user.name.trim().charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
                <div style={{ color: "rgba(255, 255, 255, 0.62)", fontSize: "10.5px", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getRoleLabel(user.role)}</div>
              </div>
              <ChevronDown size={16} style={{ flexShrink: 0, transform: isAccountMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }} />
            </button>
          </div>
        )}


      </aside>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, width: "100%" }}>
        {/* MOBILE TOPBAR (Shown only on small screens < 1024px) */}
        <header className="operationsMobileHeader">
          <button
            type="button"
            aria-label={isMobileNavOpen ? "Đóng danh mục" : "Mở danh mục điều hướng"}
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            style={{
              border: 0,
              background: "transparent",
              color: "#FFFFFF",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              padding: "6px",
              borderRadius: "6px"
            }}
          >
            {isMobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "15px" }}>
            <Image src="/bats-logo.png" alt="Logo" width={26} height={26} style={{ objectFit: "contain" }} />
            <span>BATS-AgriGuard</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {user ? (
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: "#2B8A63",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#FFFFFF"
                }}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  user.name?.charAt(0) || "A"
                )}
              </div>
            ) : (
              <Link href="/login" style={{ fontSize: "12px", color: "#FFFFFF", background: "#165D40", padding: "5px 10px", borderRadius: "6px", textDecoration: "none", fontWeight: 650 }}>
                Đăng nhập
              </Link>
            )}
          </div>
        </header>
        {/* TOPBAR (only shown before authentication) */}
        {!user && (
        <header style={{
          height: "64px",
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E2E8DF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#DC2626", backgroundColor: "#FEF2F2", padding: "5px 12px", borderRadius: "8px" }}>
            <Lock size={15} />
            <span>Chưa xác thực phiên đăng nhập</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href="/login"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#FFFFFF",
                backgroundColor: "#08764C",
                padding: "6px 14px",
                borderRadius: "6px",
                textDecoration: "none"
              }}
            >
              <span>Đăng nhập</span>
            </Link>
          </div>
        </header>
        )}

        {/* PAGE CONTENT WITH ROUTE AUTHORIZATION ENFORCEMENT */}
        <main style={{ flex: 1, padding: "24px", minWidth: 0 }}>
          {loadingAuth ? (
            <div style={{ minHeight: "400px", display: "grid", placeItems: "center", color: "#52736A" }}>
              Đang xác minh quyền truy cập...
            </div>
          ) : !user ? (
            <div style={{
              maxWidth: "520px",
              margin: "60px auto",
              background: "#FFFFFF",
              border: "1px solid #D7E8DF",
              borderRadius: "20px",
              padding: "36px",
              textAlign: "center",
              boxShadow: "0 10px 30px rgba(8, 63, 48, 0.06)"
            }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#FEF2F2", margin: "0 auto 16px", display: "grid", placeItems: "center" }}>
                <Lock size={26} color="#DC2626" />
              </div>
              <h3 style={{ margin: "0 0 8px", color: "#083F30", fontSize: "18px", fontWeight: 700 }}>
                Yêu cầu đăng nhập BATS-AgriGuard
              </h3>
              <p style={{ fontSize: "13.5px", color: "#4A6B5D", lineHeight: 1.6, margin: "0 0 24px" }}>
                Bạn cần đăng nhập tài khoản có thẩm quyền để truy cập vào các không gian làm việc và dữ liệu vùng trồng.
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <Link
                  href="/"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 18px",
                    borderRadius: "8px",
                    border: "1px solid #D7E8DF",
                    color: "#083F30",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none"
                  }}
                >
                  <ArrowLeft size={15} />
                  <span>Về trang chủ</span>
                </Link>
                <Link
                  href="/login"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 22px",
                    borderRadius: "8px",
                    background: "#08764C",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 4px 12px rgba(8, 118, 76, 0.25)"
                  }}
                >
                  <span>Đăng nhập ngay</span>
                </Link>
              </div>
            </div>
          ) : user.role === "MEMBER" ? (
            <div style={{
              maxWidth: "540px",
              margin: "60px auto",
              background: "#FFFFFF",
              border: "1px solid #D7E8DF",
              borderRadius: "20px",
              padding: "36px",
              textAlign: "center",
              boxShadow: "0 10px 30px rgba(8, 63, 48, 0.06)"
            }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#FFFBEB", margin: "0 auto 16px", display: "grid", placeItems: "center" }}>
                <Clock size={26} color="#D97706" />
              </div>
              <h3 style={{ margin: "0 0 8px", color: "#083F30", fontSize: "18px", fontWeight: 700 }}>
                Tài khoản đang chờ phê duyệt
              </h3>
              <p style={{ fontSize: "13.5px", color: "#4A6B5D", lineHeight: 1.6, margin: "0 0 20px" }}>
                Tài khoản của bạn <strong>({user.name})</strong> đã được ghi nhận ở trạng thái thành viên tiêu chuẩn. Vui lòng chờ xác nhận từ Quản trị viên để được cấp quyền quản lý vùng trồng và lô hàng.
              </p>
              <div style={{ background: "#F0F7F4", border: "1px solid #D7E8DF", borderRadius: "10px", padding: "12px 14px", fontSize: "12.5px", color: "#2B5242", marginBottom: "24px" }}>
                Trong thời gian chờ duyệt, bạn vẫn có thể sử dụng tính năng Tra cứu QR công khai để xem hành trình nông sản.
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <Link
                  href="/"
                  style={{
                    padding: "9px 18px",
                    borderRadius: "8px",
                    border: "1px solid #D7E8DF",
                    color: "#083F30",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none"
                  }}
                >
                  Về trang chủ
                </Link>
                <Link
                  href="/#trace-lookup"
                  style={{
                    padding: "9px 20px",
                    borderRadius: "8px",
                    background: "#08764C",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 700,
                    textDecoration: "none"
                  }}
                >
                  Tra cứu QR / mã lô
                </Link>
              </div>
            </div>
          ) : !hasAccess && matchedRule ? (
            <div style={{
              maxWidth: "540px",
              margin: "60px auto",
              background: "#FFFFFF",
              border: "1px solid #FECACA",
              borderRadius: "20px",
              padding: "36px",
              textAlign: "center",
              boxShadow: "0 10px 30px rgba(185, 28, 28, 0.05)"
            }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#FEF2F2", margin: "0 auto 16px", display: "grid", placeItems: "center" }}>
                <ShieldAlert size={28} color="#DC2626" />
              </div>
              <h3 style={{ margin: "0 0 8px", color: "#991B1B", fontSize: "18px", fontWeight: 700 }}>
                Không đủ thẩm quyền truy cập
              </h3>
              <p style={{ fontSize: "13.5px", color: "#4A6B5D", lineHeight: 1.6, margin: "0 0 16px" }}>
                Chức năng <strong>&ldquo;{matchedRule.label}&rdquo;</strong> yêu cầu vai trò [{matchedRule.allowedRoles.join(", ")}].
              </p>
              <div style={{ background: "#F7FAF8", border: "1px solid #D7E8DF", borderRadius: "10px", padding: "12px 14px", fontSize: "12.5px", color: "#083F30", marginBottom: "24px" }}>
                Vai trò được xác thực của bạn: <strong>{getRoleLabel(user.role)}</strong> ({user.name})
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <Link
                  href={getHomeRouteForRole(user.role)}
                  style={{
                    padding: "9px 20px",
                    borderRadius: "8px",
                    background: "#08764C",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 700,
                    textDecoration: "none"
                  }}
                >
                  Về không gian làm việc của bạn
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {isPolicySettingsOpen && (
        <div role="dialog" aria-modal="true" aria-label="Cài đặt và quản lý quy tắc kiểm tra" style={{ position: "fixed", inset: 0, zIndex: 100, display: "grid", placeItems: "center", padding: "24px" }}>
          <button
            type="button"
            aria-label="Đóng cài đặt"
            onClick={() => setIsPolicySettingsOpen(false)}
            style={{ position: "absolute", inset: 0, border: 0, background: "rgba(3, 34, 23, 0.48)", cursor: "default" }}
          />
          <section style={{ position: "relative", zIndex: 1, width: "min(1280px, 100%)", maxHeight: "calc(100vh - 48px)", overflowY: "auto", padding: "28px", background: "#F6F6F0", borderRadius: "18px", boxShadow: "0 24px 64px rgba(3, 34, 23, 0.32)" }}>
            <button
              type="button"
              onClick={() => setIsPolicySettingsOpen(false)}
              aria-label="Đóng cài đặt"
              style={{ position: "absolute", top: "16px", right: "16px", zIndex: 2, display: "grid", width: "34px", height: "34px", placeItems: "center", border: "1px solid #D1D5DB", borderRadius: "50%", background: "#FFFFFF", color: "#435248", cursor: "pointer" }}
            >
              <X size={18} />
            </button>
            <SettingsPage />
          </section>
        </div>
      )}

      {isAccountSettingsOpen && user && (
        <div role="dialog" aria-modal="true" aria-labelledby="account-settings-title" style={{ position: "fixed", inset: 0, zIndex: 110, display: "grid", placeItems: "center", padding: "24px" }}>
          <button
            type="button"
            aria-label="Đóng cài đặt tài khoản"
            onClick={() => setIsAccountSettingsOpen(false)}
            style={{ position: "absolute", inset: 0, border: 0, background: "rgba(3, 34, 23, 0.48)", cursor: "default" }}
          />
          <section style={{ position: "relative", zIndex: 1, width: "min(600px, 100%)", maxHeight: "calc(100vh - 48px)", overflowY: "auto", padding: "28px", background: "#FFFFFF", borderRadius: "18px", boxShadow: "0 24px 64px rgba(3, 34, 23, 0.32)" }}>
            <button
              type="button"
              onClick={() => setIsAccountSettingsOpen(false)}
              aria-label="Đóng cài đặt tài khoản"
              style={{ position: "absolute", top: "16px", right: "16px", display: "grid", width: "34px", height: "34px", placeItems: "center", border: "1px solid #D1D5DB", borderRadius: "50%", background: "#FFFFFF", color: "#435248", cursor: "pointer" }}
            >
              <X size={18} />
            </button>

            <div style={{ paddingRight: "42px" }}>
              <h2 id="account-settings-title" style={{ margin: 0, color: "#0A3827", fontSize: "24px", fontWeight: 700 }}>Cài đặt tài khoản</h2>
              <p style={{ margin: "6px 0 22px", color: "#68766C", fontSize: "13px", lineHeight: 1.5 }}>Cập nhật thông tin hiển thị và thông tin liên hệ của bạn.</p>
            </div>

            <form onSubmit={handleSaveAccount} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px", border: "1px solid #E2E8DF", borderRadius: "12px", background: "#F7FAF8" }}>
                <div style={{ width: "68px", height: "68px", overflow: "hidden", borderRadius: "50%", background: "#165D40", color: "#FFFFFF", display: "grid", placeItems: "center", flexShrink: 0, fontSize: "24px", fontWeight: 700 }}>
                  {accountDraft.avatar ? <img src={accountDraft.avatar} alt="Ảnh đại diện mới" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : accountDraft.name.trim().charAt(0).toUpperCase() || "A"}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: "#17251E", fontSize: "14px", fontWeight: 700 }}>Ảnh đại diện</div>
                  <div style={{ marginTop: "3px", color: "#68766C", fontSize: "12px" }}>Chọn ảnh JPG, PNG hoặc WEBP.</div>
                  <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} style={{ display: "none" }} />
                  <button type="button" onClick={() => avatarInputRef.current?.click()} style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "10px", padding: "7px 10px", border: "1px solid #98B8A8", borderRadius: "7px", background: "#FFFFFF", color: "#165D40", fontFamily: "inherit", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                    <Camera size={14} />
                    Đổi ảnh đại diện
                  </button>
                </div>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: "6px", color: "#435248", fontSize: "13px", fontWeight: 700 }}>
                Tên hiển thị
                <span style={{ position: "relative" }}>
                  <UserRound size={16} color="#82938A" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                  <input type="text" value={accountDraft.name} onChange={(event) => setAccountDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Nhập tên hiển thị" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px 10px 38px", border: "1px solid #D1D5DB", borderRadius: "8px", color: "#17251E", font: "inherit", fontSize: "13px" }} />
                </span>
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", color: "#435248", fontSize: "13px", fontWeight: 700 }}>
                  Email
                  <span style={{ position: "relative" }}>
                    <Mail size={16} color="#82938A" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                    <input type="email" value={accountDraft.email} onChange={(event) => setAccountDraft((current) => ({ ...current, email: event.target.value }))} placeholder="email@bats.vn" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px 10px 38px", border: "1px solid #D1D5DB", borderRadius: "8px", color: "#17251E", font: "inherit", fontSize: "13px" }} />
                  </span>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", color: "#435248", fontSize: "13px", fontWeight: 700 }}>
                  Số điện thoại
                  <span style={{ position: "relative" }}>
                    <Phone size={16} color="#82938A" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                    <input type="tel" value={accountDraft.phone} onChange={(event) => setAccountDraft((current) => ({ ...current, phone: event.target.value }))} placeholder="Nhập số điện thoại" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px 10px 38px", border: "1px solid #D1D5DB", borderRadius: "8px", color: "#17251E", font: "inherit", fontSize: "13px" }} />
                  </span>
                </label>
              </div>

              {accountFeedback && (
                <div role="status" style={{ padding: "10px 12px", borderRadius: "8px", background: accountFeedback.type === "success" ? "#EAF7EF" : accountFeedback.type === "error" ? "#FEF0EF" : "#EDF5FF", border: `1px solid ${accountFeedback.type === "success" ? "#A7DDBB" : accountFeedback.type === "error" ? "#F1B9B4" : "#A9CBF7"}`, color: accountFeedback.type === "success" ? "#165D40" : accountFeedback.type === "error" ? "#B42318" : "#1E429F", fontSize: "12px", lineHeight: 1.45 }}>
                  {accountFeedback.message}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", paddingTop: "4px", borderTop: "1px solid #E5EDE7" }}>
                <button type="button" onClick={() => setAccountFeedback({ type: "info", message: "Để đổi mật khẩu, vui lòng dùng tính năng “Quên mật khẩu?” ở màn hình đăng nhập." })} style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "10px 0", border: 0, background: "transparent", color: "#165D40", fontFamily: "inherit", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                  <KeyRound size={16} />
                  Đổi mật khẩu
                </button>
                <button type="submit" style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "10px 14px", border: 0, borderRadius: "8px", background: "#165D40", color: "#FFFFFF", fontFamily: "inherit", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                  <Save size={16} />
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
