"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Package,
  MapPin,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from "lucide-react";
import {
  ALERTS_CHANGE_EVENT,
  getOpenAlertsCount,
  syncWithBackendAlerts
} from "../alerts/alertsStore";

export default function DashboardPage() {
  const [activityRange, setActivityRange] = useState<"7" | "30">("7");
  const [isCriteriaExpanded, setIsCriteriaExpanded] = useState(false);
  const [openAlertCount, setOpenAlertCount] = useState(3);

  useEffect(() => {
    let active = true;
    const updateOpenAlertCount = () => setOpenAlertCount(getOpenAlertsCount());

    updateOpenAlertCount();
    window.addEventListener(ALERTS_CHANGE_EVENT, updateOpenAlertCount);
    window.addEventListener("storage", updateOpenAlertCount);

    syncWithBackendAlerts().then((count) => {
      if (active) setOpenAlertCount(count);
    }).catch(() => {});

    return () => {
      active = false;
      window.removeEventListener(ALERTS_CHANGE_EVENT, updateOpenAlertCount);
      window.removeEventListener("storage", updateOpenAlertCount);
    };
  }, []);

  const kpis = [
    { title: "Vùng trồng còn hiệu lực", value: "24", change: "+2", changeColor: "#5B625D", sub: "24 vùng trồng có mã còn hiệu lực", icon: MapPin, color: "#00A63E" },
    { title: "Lô hàng đang xử lý", value: "12", change: "+3", changeColor: "#5B625D", sub: "8 đã thu hoạch · 4 đang vận chuyển", icon: Package, color: "#00A63E" },
    { title: "Tỷ lệ lô hàng đạt yêu cầu", value: "85,2%", change: "+2,4%", changeColor: "#5B625D", sub: "Trong số lô đã được kiểm tra", icon: ShieldCheck, color: "#00A63E" },
    { title: "Trường hợp cần kiểm tra lại", value: String(openAlertCount), change: "−1", changeColor: "#00A63E", sub: "2 chênh lệch khối lượng · 1 mã hết hạn", icon: AlertTriangle, color: "#F05B00" }
  ];

  const recentBatches = [
    { id: "BATS-2026-D01", crop: "Sầu riêng Ri6", plot: "VN-DLK-PA-0001", qty: "1.250 kg", pcie: "PASS", updatedAt: "18/07/2026 08:15" },
    { id: "BATS-2026-D02", crop: "Sầu riêng Ri6", plot: "VN-DLK-PA-0001", qty: "1.230 kg", pcie: "REVIEW", updatedAt: "19/07/2026 14:30" },
    { id: "BATS-2026-D03", crop: "Sầu riêng Monthong", plot: "VN-DLK-PA-9999", qty: "800 kg", pcie: "BLOCK", updatedAt: "20/07/2026 09:00" }
  ];

  const criteria = [
    { code: "G", name: "Kiểm tra vị trí vùng trồng", desc: "Xác minh vị trí ghi nhận có nằm trong ranh giới vùng trồng đã đăng ký" },
    { code: "I", name: "Kiểm tra quyền sử dụng mã số", desc: "Xác minh người thực hiện có được phép sử dụng mã số vùng trồng" },
    { code: "S", name: "Kiểm tra hiệu lực mã số", desc: "Xác minh mã số vùng trồng còn hiệu lực tại thời điểm ghi nhận" },
    { code: "Y", name: "Kiểm tra sản lượng", desc: "Đối chiếu sản lượng thu hoạch với diện tích và mức năng suất cho phép" },
    { code: "D", name: "Kiểm tra thông tin trùng lặp", desc: "Phát hiện hình ảnh hoặc chứng từ đã được sử dụng trước đó" },
    { code: "T", name: "Kiểm tra quá trình di chuyển", desc: "Đối chiếu thời gian, khoảng cách và tốc độ di chuyển giữa các lần ghi nhận" },
    { code: "M", name: "Đối chiếu khối lượng", desc: "Kiểm tra chênh lệch giữa khối lượng khai báo và khối lượng thực nhận" },
    { code: "C", name: "Kiểm tra quá trình bàn giao", desc: "Xác minh việc chuyển giao và tiếp nhận lô hàng được ghi nhận đầy đủ, liên tục" }
  ];
  const visibleCriteria = isCriteriaExpanded ? criteria : criteria.slice(0, 3);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Page Title */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "25px", fontWeight: 800, textTransform: "uppercase", color: "#0A3827", margin: "0 0 6px 0" }}>
          Tổng quan hoạt động chuỗi cung ứng
        </h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <p style={{ flex: "1 1 560px", alignSelf: "flex-start", fontSize: "14px", lineHeight: 1.55, color: "#68766C", margin: 0 }}>
            Theo dõi vùng trồng, lô hàng và kết quả kiểm tra, giúp phát hiện sớm những bất thường trong quá trình sản xuất và vận chuyển nông sản
          </p>
          <Link
            href="/app/alerts"
            style={{
              display: "flex",
              alignSelf: "flex-start",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              backgroundColor: "#FFF6E6",
              color: "#A76B10",
              border: "1px solid #A76B10",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap"
            }}
          >
            <ShieldAlert size={15} />
            <span>Xem cảnh báo cần kiểm tra ({openAlertCount})</span>
          </Link>
        </div>
      </div>

      {/* Activity overview */}
      <section style={{ marginBottom: "24px", padding: "22px", background: "#FFFFFF", border: "1px solid #E2E8DF", borderRadius: "16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "18px", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, color: "#15251C", fontSize: "20px", fontWeight: 700 }}>Tình hình hoạt động</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "5px", color: "#68766C", fontSize: "13px" }}>
              <RefreshCw size={15} />
              Dữ liệu được đồng bộ tự động
            </div>
          </div>
          <div role="group" aria-label="Khoảng thời gian thống kê" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px", background: "#F6F6F6", borderRadius: "999px" }}>
            {([
              { value: "7", label: "7 ngày" },
              { value: "30", label: "30 ngày" }
            ] as const).map((range) => {
              const isActive = activityRange === range.value;
              return (
                <button
                  key={range.value}
                  type="button"
                  onClick={() => setActivityRange(range.value)}
                  aria-pressed={isActive}
                  style={{ padding: "7px 14px", border: 0, borderRadius: "999px", background: isActive ? "#FFFFFF" : "transparent", color: isActive ? "#15251C" : "#7C857F", fontFamily: "inherit", fontSize: "13px", fontWeight: isActive ? 700 : 500, boxShadow: isActive ? "0 1px 3px rgba(21, 37, 28, 0.08)" : "none", cursor: "pointer" }}
                >
                  {range.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px" }}>
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <article key={kpi.title} style={{ minHeight: "142px", padding: "16px", border: "1px solid #DCE2DE", borderRadius: "12px", background: "#FFFFFF", boxSizing: "border-box", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "8px" }}>
                  <Icon size={21} color={kpi.color} strokeWidth={2.25} />
                  <h3 style={{ margin: 0, color: "#5B625D", fontSize: "14px", fontWeight: 600 }}>{kpi.title}</h3>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "8px", marginTop: "28px" }}>
                  <span style={{ color: "#101914", fontSize: "30px", lineHeight: 1, fontWeight: 750, letterSpacing: "-0.8px" }}>{kpi.value}</span>
                  <span style={{ color: kpi.changeColor, fontSize: "14px", fontWeight: 600 }}>{kpi.change}</span>
                </div>
                <p style={{ margin: "16px 0 0", color: "#5B625D", fontSize: "12px", lineHeight: 1.4, textAlign: "center" }}>{kpi.sub}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Grid 2 Cột */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 3.2fr) minmax(280px, 1fr)", gap: "24px", alignItems: "start" }}>
        {/* Cột trái: Lô hàng mới nhất */}
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8DF", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0A3827", margin: 0 }}>
              Lô hàng gần đây và kết quả kiểm tra
            </h2>
            <Link href="/app/batches" style={{ fontSize: "13px", color: "#165D40", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
              Xem tất cả <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: "870px", borderCollapse: "collapse", fontSize: "13px", whiteSpace: "nowrap" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E2E8DF", color: "#68766C", textAlign: "center" }}>
                  <th style={{ padding: "10px 8px", textAlign: "center" }}>Mã lô hàng</th>
                  <th style={{ padding: "10px 8px", textAlign: "center" }}>Nông sản</th>
                  <th style={{ padding: "10px 8px", textAlign: "center" }}>Mã vùng trồng</th>
                  <th style={{ padding: "10px 8px", textAlign: "center" }}>Khối lượng</th>
                  <th style={{ padding: "10px 8px", textAlign: "center" }}>Kết quả kiểm tra</th>
                  <th style={{ padding: "10px 8px", textAlign: "center" }}>Lịch sử</th>
                </tr>
              </thead>
              <tbody>
                {recentBatches.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid #F3F4EE", textAlign: "center" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 600, fontFamily: "monospace", textAlign: "center" }}><Link href={`/app/batches/${b.id}`} style={{ color: "#165D40", textDecoration: "none" }}>{b.id}</Link></td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>{b.crop}</td>
                    <td style={{ padding: "12px 8px", color: "#68766C", textAlign: "center" }}>{b.plot}</td>
                    <td style={{ padding: "12px 8px", fontWeight: 600, textAlign: "center" }}>{b.qty}</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        backgroundColor: b.pcie === "PASS" ? "#E8F4EA" : b.pcie === "REVIEW" ? "#FFF6E6" : "#FFF0EF",
                        color: b.pcie === "PASS" ? "#169B52" : b.pcie === "REVIEW" ? "#A76B10" : "#B54745"
                      }}>
                        {b.pcie === "PASS" ? "● Đạt yêu cầu" : b.pcie === "REVIEW" ? "▲ Cần kiểm tra lại" : "■ Tạm khóa"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 8px", color: "#68766C", fontSize: "12px", whiteSpace: "nowrap", textAlign: "center" }}>{b.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cột phải: 8 Nhóm Bất biến PCIE Summary */}
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8DF", padding: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0A3827", margin: "0 0 12px 0", whiteSpace: "nowrap" }}>
            Các tiêu chí kiểm tra tự động
          </h2>
          <p style={{ fontSize: "12px", color: "#68766C", margin: "0 0 16px 0", lineHeight: 1.5 }}>
            Mọi hoạt động đều được tự động kiểm tra tính nhất quán của thông tin trước khi lưu giữ bằng chứng an toàn
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {visibleCriteria.map((r) => (
              <div key={r.code} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", padding: "6px 8px", borderRadius: "6px", backgroundColor: "#F6F6F0" }}>
                <span style={{ fontWeight: 800, width: "22px", height: "22px", borderRadius: "4px", backgroundColor: "#0D4E35", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" }}>
                  {r.code}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#15251C" }}>{r.name}</div>
                  <div style={{ fontSize: "11px", color: "#68766C" }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIsCriteriaExpanded((expanded) => !expanded)}
            aria-expanded={isCriteriaExpanded}
            style={{
              width: "100%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              marginTop: "12px",
              minHeight: "36px",
              padding: "8px 12px",
              border: "1px solid #B9D9C8",
              borderRadius: "8px",
              background: "#FFFFFF",
              color: "#165D40",
              fontFamily: "inherit",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {isCriteriaExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            {isCriteriaExpanded ? "Thu gọn tiêu chí" : "Xem tất cả 8 tiêu chí"}
          </button>
        </div>
      </div>
    </div>
  );
}
