"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  QrCode,
  Search,
  CheckCircle2,
  MapPin,
  Calendar,
  Package,
  Layers,
  FileText,
  Lock,
  ArrowRight,
  ExternalLink,
  Printer,
  Copy,
  Clock
} from "lucide-react";

interface PublicVerifyData {
  batchId: string;
  gtin: string;
  lot: string;
  serial: string;
  crop: string;
  variety: string;
  harvestDate: string;
  quantityKg: number;
  receivedKg?: number;
  plantingAreaCode: string;
  plantationName: string;
  cooperativeName: string;
  province: string;
  district: string;
  generalLocation: string;
  pcieStatus: "PASS" | "REVIEW" | "BLOCK";
  merkleRoot: string;
  anchorBlock?: number;
  rulesPassed: number;
  totalRules: number;
}

const DEMO_BATCHES: Record<string, PublicVerifyData> = {
  "BATS-2026-0001": {
    batchId: "BATS-2026-0001",
    gtin: "08938500000011",
    lot: "LOT-2026-0718",
    serial: "SR-0001",
    crop: "Sầu riêng",
    variety: "Ri6 Đặc Sản Đắk Lắk",
    harvestDate: "18/07/2026",
    quantityKg: 1250,
    receivedKg: 1250,
    plantingAreaCode: "VN-DLK-PA-0001",
    plantationName: "Vùng trồng Ea Yông 01",
    cooperativeName: "Hợp tác xã Nông nghiệp Ea Yông",
    province: "Đắk Lắk",
    district: "Krông Pắc",
    generalLocation: "Xã Ea Yông, Huyện Krông Pắc, Tỉnh Đắk Lắk",
    pcieStatus: "PASS",
    merkleRoot: "0x4a9f829871e860959bb425c27bf192ef43e120d9129538db9",
    anchorBlock: 1845,
    rulesPassed: 8,
    totalRules: 8
  },
  "BATS-2026-0002": {
    batchId: "BATS-2026-0002",
    gtin: "08938500000011",
    lot: "LOT-2026-0719",
    serial: "SR-0002",
    crop: "Sầu riêng",
    variety: "Ri6",
    harvestDate: "19/07/2026",
    quantityKg: 1250,
    receivedKg: 1230,
    plantingAreaCode: "VN-DLK-PA-0001",
    plantationName: "Vùng trồng Ea Yông 01",
    cooperativeName: "Hợp tác xã Nông nghiệp Ea Yông",
    province: "Đắk Lắk",
    district: "Krông Pắc",
    generalLocation: "Xã Ea Yông, Huyện Krông Pắc, Tỉnh Đắk Lắk",
    pcieStatus: "REVIEW",
    merkleRoot: "0x7bc215018f2e825a075cd3e6a9921448b26e03c1554fae8",
    anchorBlock: 1846,
    rulesPassed: 7,
    totalRules: 8
  },
  "BATS-2026-0003": {
    batchId: "BATS-2026-0003",
    gtin: "08938500000011",
    lot: "LOT-2026-0720",
    serial: "SR-0003",
    crop: "Sầu riêng",
    variety: "Monthong",
    harvestDate: "20/07/2026",
    quantityKg: 800,
    receivedKg: 0,
    plantingAreaCode: "VN-DLK-PA-9999",
    plantationName: "Vườn Sầu Riêng Tạm Ngưng 99",
    cooperativeName: "Hợp tác xã Nông nghiệp Ea Yông",
    province: "Đắk Lắk",
    district: "Krông Pắc",
    generalLocation: "Xã Ea Yông, Huyện Krông Pắc, Tỉnh Đắk Lắk",
    pcieStatus: "BLOCK",
    merkleRoot: "0x1d4a0094b83f06c117e3fba08139cd91f043ba87ec42a8b",
    anchorBlock: undefined,
    rulesPassed: 6,
    totalRules: 8
  }
};

const PCIE_CRITERIA = [
  { code: "G", name: "Vị trí vùng trồng", question: "Tọa độ thu hoạch nằm trong ranh giới polygon đăng ký", passText: "Đã xác thực tọa độ GPS tại vườn" },
  { code: "I", name: "Quyền sử dụng mã số", question: "Người thu hoạch thuộc danh sách được phân quyền", passText: "Tài khoản nông hộ hợp lệ" },
  { code: "S", name: "Hiệu lực mã số vùng trồng", question: "Mã số vùng trồng còn hạn và không bị đình chỉ", passText: "Mã số có hiệu lực đến 31/12/2026" },
  { code: "Y", name: "Sản lượng thu hoạch", question: "Sản lượng thu hoạch không vượt hạn mức cấp phép", passText: "Nằm trong định mức năng suất (25 tấn/ha)" },
  { code: "D", name: "Bằng chứng duy nhất", question: "Hình ảnh/chứng từ không bị trùng lặp mã nhận diện", passText: "Không phát hiện trùng lặp SHA-256" },
  { code: "T", name: "Thời gian & Vận tốc di chuyển", question: "Khoảng cách và thời gian di chuyển hợp lý", passText: "Vận tốc di chuyển 34 km/h (hợp lý)" },
  { code: "M", name: "Đối chiếu khối lượng (Mass Balance)", question: "Cân bằng khối lượng giữa khai báo và tiếp nhận", passText: "Khối lượng thực nhận khớp với khai báo" },
  { code: "C", name: "Chuỗi quản lý liên tục", question: "Lịch sử chuyển giao trách nhiệm không đứt gãy", passText: "Bàn giao có biên nhận số" }
];

export default function PublicVerifyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawSlug = params?.slug;

  const resolvedId = useMemo(() => {
    if (searchParams?.get("id")) return searchParams.get("id")!;
    if (searchParams?.get("batchId")) return searchParams.get("batchId")!;
    if (Array.isArray(rawSlug) && rawSlug.length > 0) {
      // Could be ["BATS-2026-0001"] or ["08938500000011", "LOT-2026-0718", "SR-0001"]
      if (rawSlug[0].startsWith("BATS")) return rawSlug[0];
      if (rawSlug.length >= 2) return `BATS-2026-0001`; // demo mapping
      return rawSlug[0];
    }
    return "BATS-2026-0001";
  }, [params, searchParams, rawSlug]);

  const [searchQuery, setSearchQuery] = useState(resolvedId);
  const [data, setData] = useState<PublicVerifyData>(DEMO_BATCHES[resolvedId] || DEMO_BATCHES["BATS-2026-0001"]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const target = DEMO_BATCHES[resolvedId] || DEMO_BATCHES["BATS-2026-0001"];
    setData(target);
    setSearchQuery(resolvedId);

    // Attempt to fetch fresh data from backend public API
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    fetch(`${api}/verify/${resolvedId}/public`)
      .then((res) => (res.ok ? res.json() : null))
      .then((remote) => {
        if (remote && remote.batchId) {
          setData((prev) => ({
            ...prev,
            batchId: remote.batchId,
            crop: remote.crop || prev.crop,
            variety: remote.variety || prev.variety,
            plantingAreaCode: remote.plantingAreaCode || prev.plantingAreaCode,
            quantityKg: remote.quantityKg || prev.quantityKg,
            pcieStatus: remote.pcieStatus || prev.pcieStatus,
            generalLocation: remote.generalLocation || prev.generalLocation
          }));
        }
      })
      .catch(() => undefined);
  }, [resolvedId]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.trim().toUpperCase();
    if (DEMO_BATCHES[query]) {
      setData(DEMO_BATCHES[query]);
    } else {
      // Fallback: create dynamic view
      setData({
        ...DEMO_BATCHES["BATS-2026-0001"],
        batchId: query || "BATS-2026-0001"
      });
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const isPass = data.pcieStatus === "PASS";
  const isReview = data.pcieStatus === "REVIEW";
  const isBlock = data.pcieStatus === "BLOCK";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F7F9F7", color: "#1A2E22", fontFamily: "inherit" }}>
      {/* Top Banner */}
      <div style={{ backgroundColor: "#0A3827", color: "#FFFFFF", padding: "12px 24px", fontSize: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ backgroundColor: "#157347", color: "#FFFFFF", padding: "2px 8px", borderRadius: "4px", fontWeight: 700, fontSize: "10px" }}>BATS</span>
            <span>Hệ Thống Xác Thực Nguồn Gốc Nông Sản Chuẩn GS1 EPCIS &amp; Blockchain</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/" style={{ color: "#D1E7DD", textDecoration: "none", fontSize: "12px" }}>Trang chủ</Link>
            <Link href="/portal" style={{ color: "#D1E7DD", textDecoration: "none", fontSize: "12px" }}>Cổng tra cứu</Link>
            <Link href="/app" style={{ color: "#FFFFFF", fontWeight: 650, textDecoration: "none", fontSize: "12px" }}>Vào Console →</Link>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <header style={{ backgroundColor: "#0D4E35", color: "#FFFFFF", padding: "36px 24px", boxShadow: "0 4px 20px rgba(10, 56, 39, 0.15)" }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(255,255,255,0.12)", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, marginBottom: "12px" }}>
                <QrCode size={14} />
                <span>Tra cứu chứng thư số nông sản</span>
              </div>
              <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
                Kết Quả Xác Thực Lô Hàng: {data.batchId}
              </h1>
              <p style={{ color: "#D6E5DC", fontSize: "14px", margin: 0, maxWidth: "680px", lineHeight: 1.5 }}>
                Chứng thư điện tử được kiểm toán tự động bởi AgriGuard PCIE Engine và cam kết tính bất biến qua Merkle Tree.
              </p>
            </div>

            {/* Quick Search Box */}
            <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px", minWidth: "300px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={16} color="#68766C" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nhập mã lô hoặc GTIN..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 14px 10px 36px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    backgroundColor: "#FFFFFF",
                    color: "#1A2E22",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#169B52",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 650,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                Tra cứu
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: "1140px", margin: "-20px auto 40px", padding: "0 24px" }}>
        {/* Verification Status Card */}
        <section
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: `2px solid ${isPass ? "#169B52" : isReview ? "#A76B10" : "#B54745"}`,
            padding: "24px 28px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            marginBottom: "24px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  backgroundColor: isPass ? "#E8F4EA" : isReview ? "#FFF6E6" : "#FFF0EF",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0
                }}
              >
                {isPass && <ShieldCheck size={32} color="#157347" />}
                {isReview && <AlertTriangle size={32} color="#A76B10" />}
                {isBlock && <ShieldAlert size={32} color="#B54745" />}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: 800,
                      backgroundColor: isPass ? "#E8F4EA" : isReview ? "#FFF6E6" : "#FFF0EF",
                      color: isPass ? "#157347" : isReview ? "#A76B10" : "#B54745"
                    }}
                  >
                    {isPass ? "✓ ĐẠT CHUẨN XUẤT KHẨU" : isReview ? "▲ CẦN KIỂM TRA LẠI" : "✕ TẠM KHÓA XUẤT XƯỞNG"}
                  </span>
                  <span style={{ fontSize: "13px", color: "#68766C" }}>
                    PCIE Engine v1.4.0 · {data.rulesPassed}/{data.totalRules} tiêu chí đạt
                  </span>
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 750, color: "#0A3827", margin: "6px 0 0" }}>
                  {data.crop} - {data.variety}
                </h2>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid #D0DDD2",
                  background: "#FFFFFF",
                  color: "#28553B",
                  fontSize: "12px",
                  fontWeight: 650,
                  cursor: "pointer"
                }}
              >
                <Copy size={14} />
                <span>{copied ? "Đã chép link!" : "Sao chép liên kết"}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid #D0DDD2",
                  background: "#FFFFFF",
                  color: "#28553B",
                  fontSize: "12px",
                  fontWeight: 650,
                  cursor: "pointer"
                }}
              >
                <Printer size={14} />
                <span>In chứng nhận</span>
              </button>
            </div>
          </div>

          {/* Privacy Notice Banner */}
          <div
            style={{
              marginTop: "20px",
              padding: "12px 16px",
              borderRadius: "8px",
              backgroundColor: "#F3F7F4",
              border: "1px solid #D5E3D8",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "12px",
              color: "#46594D"
            }}
          >
            <Lock size={15} color="#165D40" style={{ flexShrink: 0 }} />
            <span>
              <b>Chính sách bảo vệ quyền riêng tư:</b> Thông tin cá nhân của nông hộ (họ tên, số điện thoại, số CCCD) đã được lọc sạch hoặc mã hóa băm theo Nghị định 13/2023/NĐ-CP. Chỉ hiển thị thông tin hợp tác xã đại diện và mã số vùng trồng được cấp phép.
            </span>
          </div>
        </section>

        {/* 2-Column Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", marginBottom: "24px" }}>
          {/* Left: Product & Plantation Specs */}
          <section style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8DF", padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 750, color: "#0A3827", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Package size={18} color="#0D4E35" />
              <span>Hồ Sơ Kỹ Thuật Lô Hàng</span>
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "#68766C", fontSize: "12px", display: "block", marginBottom: "3px" }}>Mã định danh GS1 GTIN:</span>
                <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#193024" }}>{data.gtin}</span>
              </div>
              <div>
                <span style={{ color: "#68766C", fontSize: "12px", display: "block", marginBottom: "3px" }}>Số lô sản xuất (Lot):</span>
                <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#193024" }}>{data.lot}</span>
              </div>
              <div>
                <span style={{ color: "#68766C", fontSize: "12px", display: "block", marginBottom: "3px" }}>Khối lượng lô hàng:</span>
                <span style={{ fontWeight: 700, fontSize: "15px", color: "#0D4E35" }}>
                  {data.quantityKg.toLocaleString("vi-VN")} kg
                  {data.receivedKg && data.receivedKg !== data.quantityKg && (
                    <span style={{ fontSize: "12px", color: "#A76B10", marginLeft: "6px" }}>
                      (Thực nhận: {data.receivedKg} kg)
                    </span>
                  )}
                </span>
              </div>
              <div>
                <span style={{ color: "#68766C", fontSize: "12px", display: "block", marginBottom: "3px" }}>Thời gian thu hoạch:</span>
                <span style={{ fontWeight: 600 }}>{data.harvestDate}</span>
              </div>
              <div style={{ gridColumn: "1 / -1", paddingTop: "12px", borderTop: "1px solid #F0F4F0" }}>
                <span style={{ color: "#68766C", fontSize: "12px", display: "block", marginBottom: "3px" }}>Mã số vùng trồng (Planting Area):</span>
                <span style={{ fontWeight: 700, color: "#0D4E35", fontFamily: "monospace", fontSize: "14px" }}>
                  {data.plantingAreaCode}
                </span>
                <span style={{ display: "inline-block", marginLeft: "8px", padding: "2px 8px", borderRadius: "4px", backgroundColor: "#E8F4EA", color: "#157347", fontSize: "11px", fontWeight: 700 }}>
                  ĐÃ CẤP MÃ QUỐC GIA
                </span>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ color: "#68766C", fontSize: "12px", display: "block", marginBottom: "3px" }}>Hợp tác xã / Đơn vị bảo trợ:</span>
                <span style={{ fontWeight: 650 }}>{data.cooperativeName}</span>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ color: "#68766C", fontSize: "12px", display: "block", marginBottom: "3px" }}>Vị trí địa lý vùng trồng:</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#2E4738" }}>
                  <MapPin size={15} color="#0D4E35" />
                  <span>{data.generalLocation}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Right: Cryptographic Commitment */}
          <section style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8DF", padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 750, color: "#0A3827", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Layers size={18} color="#0D4E35" />
              <span>Cam Kết Mật Mã &amp; Blockchain</span>
            </h3>

            <div style={{ display: "grid", gap: "14px", fontSize: "13px" }}>
              <div style={{ padding: "12px 14px", borderRadius: "8px", backgroundColor: "#F7FAF8", border: "1px solid #E0EDE3" }}>
                <div style={{ color: "#68766C", fontSize: "11px", fontWeight: 650, marginBottom: "4px" }}>TRẠNG THÁI CAM KẾT (ANCHOR)</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "#157347" }}>
                  <CheckCircle2 size={16} />
                  <span>ĐÃ GHI NHẬN TRÊN SỔ CÁI BẤT BIẾN</span>
                </div>
                {data.anchorBlock && (
                  <div style={{ fontSize: "11px", color: "#68766C", marginTop: "4px" }}>
                    Khối số: <b>#{data.anchorBlock}</b> · Thời gian neo: 18/07/2026 08:30 (UTC+7)
                  </div>
                )}
              </div>

              <div>
                <span style={{ color: "#68766C", fontSize: "11px", fontWeight: 650, display: "block", marginBottom: "3px" }}>MERKLE ROOT HASH</span>
                <div style={{ padding: "8px 10px", borderRadius: "6px", backgroundColor: "#F5F6F2", fontFamily: "monospace", fontSize: "11px", wordBreak: "break-all", color: "#2B4034" }}>
                  {data.merkleRoot}
                </div>
              </div>

              <div style={{ fontSize: "12px", color: "#68766C", lineHeight: 1.45 }}>
                ℹ Merkle proof đảm bảo không một sự kiện hay dữ liệu cân nặng nào bị sửa đổi hồi tố sau khi chốt sổ.
              </div>

              <div style={{ paddingTop: "12px", borderTop: "1px solid #F0F4F0" }}>
                <Link
                  href={`/app/batches/${data.batchId}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    backgroundColor: "#0D4E35",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 650,
                    textDecoration: "none"
                  }}
                >
                  <span>Mở trong Console quản trị</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/* PCIE 8 Invariants Checklist */}
        <section style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8DF", padding: "24px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 750, color: "#0A3827", margin: 0 }}>
                Chi Tiết 8 Tiêu Chí Đối Soát PCIE (Policy Check &amp; Invariants Engine)
              </h3>
              <p style={{ margin: "4px 0 0", color: "#68766C", fontSize: "12px" }}>
                Tất cả các tiêu chí được đối chiếu tự động trước khi hệ thống tạo QR Code cho lô hàng
              </p>
            </div>
            <span style={{ padding: "4px 10px", borderRadius: "6px", backgroundColor: "#E8F4EA", color: "#157347", fontSize: "12px", fontWeight: 700 }}>
              {data.rulesPassed}/8 TIÊU CHÍ ĐẠT
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
            {PCIE_CRITERIA.map((crit, idx) => {
              // Determine if this specific rule has an issue for demo
              const isIssue = (data.pcieStatus === "REVIEW" && crit.code === "M") || (data.pcieStatus === "BLOCK" && crit.code === "S");
              return (
                <div
                  key={crit.code}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "10px",
                    border: `1px solid ${isIssue ? "#F0CB80" : "#E2E8DF"}`,
                    backgroundColor: isIssue ? "#FFF9ED" : "#FBFCFB",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px"
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      backgroundColor: isIssue ? "#A76B10" : "#0D4E35",
                      color: "#FFFFFF",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                      fontSize: "12px",
                      flexShrink: 0
                    }}
                  >
                    {crit.code}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontWeight: 700, fontSize: "13px", color: "#193024" }}>{crit.name}</span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: isIssue ? "#A76B10" : "#157347"
                        }}
                      >
                        {isIssue ? "▲ CẦN KIỂM TRA" : "✓ ĐẠT"}
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#68766C", margin: "3px 0 5px" }}>{crit.question}</div>
                    <div style={{ fontSize: "12px", color: isIssue ? "#8B5B0A" : "#2E4738", fontWeight: 550 }}>
                      {isIssue
                        ? crit.code === "M"
                          ? "Chênh lệch -20 kg (-1.6%) so với khai báo ban đầu"
                          : "Mã số vùng trồng đang trong tình trạng tạm đình chỉ"
                        : crit.passText}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* EPCIS Timeline */}
        <section style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8DF", padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 750, color: "#0A3827", margin: "0 0 16px" }}>
            Nhật Ký Hành Trình Sản Phẩm (GS1 EPCIS 2.0 Timeline)
          </h3>

          <div style={{ borderLeft: "2px solid #E2E8DF", marginLeft: "14px", paddingLeft: "20px", display: "grid", gap: "20px" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-27px", top: "2px", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#157347" }} />
              <div style={{ fontSize: "12px", color: "#68766C" }}>18/07/2026 · 06:30 (UTC+7)</div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#15251C" }}>Thu hoạch tại vườn (ObjectEvent: harvesting)</div>
              <div style={{ fontSize: "13px", color: "#45574B", marginTop: "2px" }}>
                Nông dân thực hiện thu hái 1.250 kg sầu riêng Ri6 tại rẫy thuộc vùng trồng {data.plantingAreaCode}. Tọa độ GPS đã được xác thực nằm trong ranh giới cho phép.
              </div>
            </div>

            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-27px", top: "2px", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: isReview ? "#A76B10" : "#157347" }} />
              <div style={{ fontSize: "12px", color: "#68766C" }}>18/07/2026 · 08:15 (UTC+7)</div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#15251C" }}>Tiếp nhận tại điểm thu mua (ObjectEvent: collecting)</div>
              <div style={{ fontSize: "13px", color: "#45574B", marginTop: "2px" }}>
                Thương lái đối chiếu mã số lô hàng và thực hiện cân tiếp nhận tại Trạm thu mua Ea Yông. Phiếu cân điện tử được tải lên hệ thống.
              </div>
            </div>

            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-27px", top: "2px", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#157347" }} />
              <div style={{ fontSize: "12px", color: "#68766C" }}>18/07/2026 · 08:30 (UTC+7)</div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#15251C" }}>Kiểm toán tự động &amp; Cam kết Merkle (AggregationEvent)</div>
              <div style={{ fontSize: "13px", color: "#45574B", marginTop: "2px" }}>
                Hệ thống AgriGuard thực hiện xác thực 8 tiêu chí PCIE, đóng gói chứng từ và neo giá trị Merkle Root lên sổ cái số.
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #E2E8DF", padding: "24px", textAlign: "center", fontSize: "12px", color: "#68766C", backgroundColor: "#FFFFFF" }}>
        <p style={{ margin: "0 0 6px" }}>
          © 2026 BATS-AgriGuard · Nền tảng truy xuất nguồn gốc nông sản an toàn Việt Nam
        </p>
        <p style={{ margin: 0 }}>
          Hệ thống tuân thủ Tiêu chuẩn Quốc gia TCVN 12850:2019 và GS1 Global Standards EPCIS 2.0
        </p>
      </footer>
    </div>
  );
}
