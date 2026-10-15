"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LeafletMap } from "../../../components/LeafletMap";
import {
  Package,
  Calendar,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ArrowLeft,
  ArrowRight,
  FileText,
  User,
  GitBranch,
  Layers
} from "lucide-react";

export default function BatchDetailPage() {
  const params = useParams();
  const batchId = (params?.id as string) || "BATS-2026-0001";
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "evidence" | "integrity" | "lineage" | "alerts">("overview");

  // Determine scenario data based on batchId
  const isD02 = batchId.includes("0002") || batchId.includes("0005") || batchId.includes("D02") || batchId.includes("REVIEW");
  const isD03 = batchId.includes("0003") || batchId.includes("D03") || batchId.includes("BLOCK");

  const batchInfo = {
    id: batchId,
    gtin: "08938500000011",
    lot: isD02 ? "LOT-2026-0719" : isD03 ? "LOT-2026-0720" : "LOT-2026-0718",
    serial: isD02 ? "SR-0002" : isD03 ? "SR-0003" : "SR-0001",
    crop: isD03 ? "Sầu riêng Monthong" : "Sầu riêng Ri6",
    quantityDeclared: 1250,
    quantityReceived: isD02 ? 1230 : isD03 ? 0 : 1250,
    plotCode: isD03 ? "VN-DLK-PA-9999" : "VN-DLK-PA-0001",
    farmer: "Nguyễn Văn Minh (FARMER-0001)",
    collector: isD03 ? "Chưa tiếp nhận" : "Trần Quốc Toàn (COLLECTOR-0001)",
    custodian: isD03 ? "FARMER-0001" : "COLLECTOR-0001",
    pcieStatus: isD03 ? "BLOCK" : isD02 ? "REVIEW" : "PASS",
    createdAt: "18/07/2026 06:30",
    harvestGps: [108.1233, 12.6788] as [number, number],
    polygon: [
      [108.122675, 12.678175],
      [108.124125, 12.678175],
      [108.124125, 12.679625],
      [108.122675, 12.679625],
      [108.122675, 12.678175]
    ] as [number, number][]
  };
  const checkResultLabel = batchInfo.pcieStatus === "PASS" ? "Đạt yêu cầu" : batchInfo.pcieStatus === "REVIEW" ? "Cần kiểm tra lại" : "Tạm khóa";

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Top back & actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <Link href="/app/batches" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#165D40", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
          <ArrowLeft size={16} />
          <span>Quay lại danh sách lô hàng</span>
        </Link>
        <Link
          href={`/verify?id=${batchInfo.id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "8px",
            backgroundColor: "#0D4E35",
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: 650,
            textDecoration: "none"
          }}
        >
          <span>Xem chứng thư QR công khai</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Header banner */}
      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8DF", padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#15251C", margin: 0, fontFamily: "monospace" }}>
                {batchInfo.id}
              </h1>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 700,
                backgroundColor: batchInfo.pcieStatus === "PASS" ? "#E8F4EA" : batchInfo.pcieStatus === "REVIEW" ? "#FFF6E6" : "#FFF0EF",
                color: batchInfo.pcieStatus === "PASS" ? "#169B52" : batchInfo.pcieStatus === "REVIEW" ? "#A76B10" : "#B54745"
              }}>
                {batchInfo.pcieStatus === "PASS" ? "● Đạt yêu cầu" : batchInfo.pcieStatus === "REVIEW" ? "▲ Cần kiểm tra lại" : "■ Tạm khóa"}
              </span>
            </div>
            <div style={{ fontSize: "13px", color: "#68766C" }}>
              Nông sản: <b>{batchInfo.crop}</b> · Mã vùng trồng: <b>{batchInfo.plotCode}</b> · GTIN: <span style={{ fontFamily: "monospace" }}>{batchInfo.gtin}</span>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: "#68766C" }}>Người đang giữ (Custodian)</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0D4E35" }}>{batchInfo.custodian}</div>
          </div>
        </div>

        {/* Tab navigation */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #E2E8DF", marginTop: "20px", overflowX: "auto", whiteSpace: "nowrap", scrollbarWidth: "none" }}>
          {[
            { id: "overview", label: "Tổng Quan" },
            { id: "timeline", label: "Dòng Sự Kiện (EPCIS)" },
            { id: "evidence", label: "Bằng Chứng (Evidence)" },
            { id: "integrity", label: "Toàn Vẹn & Blockchain" },
            { id: "lineage", label: "Phả Hệ (Lineage - P1)" },
            { id: "alerts", label: "Cảnh Báo & Hậu Kiểm" }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                padding: "10px 16px",
                fontSize: "13px",
                fontWeight: 600,
                color: activeTab === t.id ? "#0D4E35" : "#68766C",
                border: "none",
                borderBottom: activeTab === t.id ? "2px solid #0D4E35" : "2px solid transparent",
                backgroundColor: "transparent",
                cursor: "pointer",
                marginBottom: "-1px",
                whiteSpace: "nowrap",
                flexShrink: 0
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="batchDetailOverview" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
          {/* Left card */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8DF", padding: "20px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#0A3827", margin: "0 0 16px 0" }}>
              Thông Số Kỹ Thuật Lô Hàng
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "#68766C", fontSize: "12px" }}>Khối lượng khai báo:</span>
                <div style={{ fontWeight: 700, fontSize: "16px", color: "#15251C" }}>{batchInfo.quantityDeclared} kg</div>
              </div>
              <div>
                <span style={{ color: "#68766C", fontSize: "12px" }}>Khối lượng thực nhận:</span>
                <div style={{ fontWeight: 700, fontSize: "16px", color: isD02 ? "#A76B10" : "#15251C" }}>
                  {batchInfo.quantityReceived} kg {isD02 && <span style={{ fontSize: "12px", color: "#A76B10" }}>(-20 kg)</span>}
                </div>
              </div>
              <div>
                <span style={{ color: "#68766C", fontSize: "12px" }}>Nông hộ thu hoạch:</span>
                <div style={{ fontWeight: 600 }}>{batchInfo.farmer}</div>
              </div>
              <div>
                <span style={{ color: "#68766C", fontSize: "12px" }}>Thương lái tiếp nhận:</span>
                <div style={{ fontWeight: 600 }}>{batchInfo.collector}</div>
              </div>
              <div>
                <span style={{ color: "#68766C", fontSize: "12px" }}>Thời điểm khởi tạo:</span>
                <div>{batchInfo.createdAt}</div>
              </div>
              <div>
                <span style={{ color: "#68766C", fontSize: "12px" }}>Mã vùng trồng:</span>
                <div style={{ fontWeight: 600, color: "#0D4E35" }}>{batchInfo.plotCode}</div>
              </div>
            </div>

            {isD02 && (
              <div style={{ marginTop: "20px", padding: "12px 16px", borderRadius: "8px", backgroundColor: "#FFF6E6", border: "1px solid #A76B10" }}>
                <div style={{ fontWeight: 700, color: "#A76B10", fontSize: "13px", marginBottom: "4px" }}>
                  ▲ Cảnh Báo Đối Soát Khối Lượng (Rule M - Mass Balance)
                </div>
                <div style={{ fontSize: "12px", color: "#23322B" }}>
                  Phát hiện chênh lệch -20 kg giữa khai báo vườn và cân thu mua (-1.6%). Hồ sơ đang trong hàng chờ Review Queue để bổ sung biên nhận đối soát.
                </div>
              </div>
            )}
          </div>

          {/* Right map card */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8DF", padding: "20px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#0A3827", margin: "0 0 12px 0" }}>
              Vị Trí Thu Hoạch & Ranh Giới Vùng Trồng
            </h2>
            <LeafletMap
              polygonCoordinates={batchInfo.polygon}
              markerPosition={batchInfo.harvestGps}
              height="300px"
              zoom={16}
            />
            <div style={{ marginTop: "10px", fontSize: "11px", color: "#68766C" }}>
              Marker đỏ thể hiện tọa độ GPS lúc bấm chốt lô tại vườn; viền đứt nét xanh thể hiện ranh giới polygon được cấp mã.
            </div>
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8DF", padding: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0A3827", margin: "0 0 16px 0" }}>
            Dòng Sự Kiện Truy Xuất (GS1 EPCIS 2.0 Timeline)
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", borderLeft: "2px solid #E8F4EA", marginLeft: "12px", paddingLeft: "20px" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-27px", top: "0", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#169B52" }} />
              <div style={{ fontSize: "12px", color: "#68766C" }}>18/07/2026 · 06:30 (UTC+7)</div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#15251C" }}>Sự kiện Thu hoạch (ObjectEvent: harvesting)</div>
              <div style={{ fontSize: "13px", color: "#23322B" }}>Nông dân Nguyễn Văn Minh thu hoạch 1.250 kg tại rẫy Krông Pắc. Tọa độ GPS đã xác minh.</div>
            </div>

            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-27px", top: "0", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: isD02 ? "#A76B10" : "#169B52" }} />
              <div style={{ fontSize: "12px", color: "#68766C" }}>18/07/2026 · 08:15 (UTC+7)</div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#15251C" }}>Sự kiện Tiếp nhận (ObjectEvent: collecting)</div>
              <div style={{ fontSize: "13px", color: "#23322B" }}>
                Thương lái Trần Quốc Toàn tiếp nhận lô hàng tại điểm thu mua Ea Yông. Khối lượng thực cân: {batchInfo.quantityReceived} kg.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "evidence" && (
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8DF", padding: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0A3827", margin: "0 0 16px 0" }}>
            Thư Viện Bằng Chứng (Evidence Files & Hashes)
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            <div style={{ border: "1px solid #E2E8DF", borderRadius: "8px", padding: "12px" }}>
              <div style={{ height: "140px", backgroundColor: "#F6F6F0", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#68766C", fontSize: "12px", marginBottom: "8px" }}>
                [Ảnh chụp vườn sầu riêng tại rẫy]
              </div>
              <div style={{ fontWeight: 600, fontSize: "12px" }}>Ảnh cây & trái trước thu hoạch</div>
              <div style={{ fontSize: "10px", color: "#68766C", fontFamily: "monospace" }}>SHA-256: 4f3a...89bc</div>
            </div>

            <div style={{ border: "1px solid #E2E8DF", borderRadius: "8px", padding: "12px" }}>
              <div style={{ height: "140px", backgroundColor: "#F6F6F0", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#68766C", fontSize: "12px", marginBottom: "8px" }}>
                [Ảnh phiếu cân điện tử điểm thu mua]
              </div>
              <div style={{ fontWeight: 600, fontSize: "12px" }}>Phiếu cân tiếp nhận</div>
              <div style={{ fontSize: "10px", color: "#68766C", fontFamily: "monospace" }}>SHA-256: 7d1e...91ab</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "integrity" && (
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8DF", padding: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0A3827", margin: "0 0 16px 0" }}>
            Trạng Thái Cam Kết Mật Mã (Validation Before Anchoring)
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", fontSize: "13px" }}>
            <div style={{ padding: "16px", backgroundColor: "#F6F6F0", borderRadius: "8px" }}>
              <div style={{ fontWeight: 700, marginBottom: "8px" }}>Kiểm Tra Tính Toàn Vẹn Đầu Vào:</div>
              <div>Engine: <b>PCIE (8 Invariant Groups)</b></div>
              <div>Kết quả: <b style={{ color: batchInfo.pcieStatus === "PASS" ? "#169B52" : batchInfo.pcieStatus === "REVIEW" ? "#A76B10" : "#B54745" }}>{checkResultLabel}</b></div>
              <div>Phiên bản chính sách: <b>pcie-demo-v1</b></div>
            </div>
            <div style={{ padding: "16px", backgroundColor: "#F6F6F0", borderRadius: "8px" }}>
              <div style={{ fontWeight: 700, marginBottom: "8px" }}>Cam Kết Blockchain (Anvil Local):</div>
              <div>Trạng thái neo: <b>ANCHORED (Đã cam kết Merkle)</b></div>
              <div style={{ fontSize: "11px", fontFamily: "monospace", wordBreak: "break-all" }}>
                Root: 0x4a9f82...38db9
              </div>
              <div style={{ fontSize: "11px", color: "#68766C", marginTop: "4px" }}>
                *Merkle proof bảo toàn tính bất biến sau cam kết, không chứng minh tính chân thực của dữ liệu đầu vào.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "lineage" && (
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8DF", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0A3827", margin: 0 }}>
              Phả Hệ Lô Hàng (Batch Lineage / Split & Merge)
            </h2>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", backgroundColor: "#FFF6E6", color: "#A76B10", fontWeight: 700 }}>
              P1 — Bản Dựng Xem Trước (Preview)
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "#68766C" }}>
            Module quản lý quan hệ cha-con khi chia lô hoặc gộp lô tại cơ sở đóng gói (Packer). Đảm bảo bảo toàn tổng khối lượng theo nguyên tắc Mass Balance.
          </p>
          <div style={{ padding: "30px", border: "2px dashed #E2E8DF", borderRadius: "8px", textAlign: "center", color: "#68766C", fontSize: "13px" }}>
            Lô hiện tại là lô gốc nguyên bản (Single Root Batch). Chưa phát sinh thao tác chia tách lô.
          </div>
        </div>
      )}

      {activeTab === "alerts" && (
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8DF", padding: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0A3827", margin: "0 0 16px 0" }}>
            Hồ Sơ Cảnh Báo & Quyết Định Hậu Kiểm
          </h2>
          {isD02 ? (
            <div style={{ border: "1px solid #A76B10", borderRadius: "8px", padding: "16px", backgroundColor: "#FFF6E6" }}>
              <div style={{ fontWeight: 700, color: "#A76B10", fontSize: "14px", marginBottom: "6px" }}>
                Hồ sơ #CASE-D02-001: Lệch khối lượng thực nhận (-20 kg)
              </div>
              <div style={{ fontSize: "13px", color: "#23322B", marginBottom: "12px" }}>
                Trạng thái: <b>OPEN (Đang chờ Reviewer kiểm tra)</b> · Mức độ: <b>WARNING</b>
              </div>
              <Link
                href="/app/alerts"
                style={{
                  display: "inline-block",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  backgroundColor: "#A76B10",
                  color: "#FFFFFF",
                  fontSize: "12px",
                  fontWeight: 600,
                  textDecoration: "none"
                }}
              >
                Mở trong Review Queue để giải quyết →
              </Link>
            </div>
          ) : (
            <div style={{ color: "#169B52", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={18} />
              <span>Không có cảnh báo tồn đọng cho lô hàng này.</span>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 860px) {
          .batchDetailOverview {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
