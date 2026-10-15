"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";

type CheckResult = "PASS" | "REVIEW" | "BLOCK";
type BatchStatus = "Đã tạo" | "Đã thu mua" | "Đang vận chuyển" | "Đã bàn giao";

type Batch = {
  id: string;
  gtin: string;
  lot: string;
  plotCode: string;
  crop: string;
  quantityKg: string;
  operationalStatus: BatchStatus;
  custodian: string;
  pcieStatus: CheckResult;
  updatedAt: string;
};

const batches: Batch[] = [
  { id: "BATS-2026-0001", gtin: "08938500000011", lot: "LOT-2026-0718", plotCode: "VN-DLK-PA-0001", crop: "Sầu riêng Ri6", quantityKg: "1.250", operationalStatus: "Đã thu mua", custodian: "Trần Quốc Toàn", pcieStatus: "PASS", updatedAt: "18/07/2026 08:15" },
  { id: "BATS-2026-0002", gtin: "08938500000011", lot: "LOT-2026-0719", plotCode: "VN-DLK-PA-0001", crop: "Sầu riêng Ri6", quantityKg: "1.230", operationalStatus: "Đã thu mua", custodian: "Trần Quốc Toàn", pcieStatus: "REVIEW", updatedAt: "19/07/2026 14:30" },
  { id: "BATS-2026-0003", gtin: "08938500000011", lot: "LOT-2026-0720", plotCode: "VN-DLK-PA-9999", crop: "Sầu riêng Monthong", quantityKg: "800", operationalStatus: "Đã tạo", custodian: "Nguyễn Văn Minh", pcieStatus: "BLOCK", updatedAt: "20/07/2026 09:00" },
  { id: "BATS-2026-0004", gtin: "08938500000012", lot: "LOT-2026-0721", plotCode: "VN-DLK-PA-0001", crop: "Sầu riêng Ri6", quantityKg: "970", operationalStatus: "Đang vận chuyển", custodian: "Hợp tác xã Ea Yông", pcieStatus: "PASS", updatedAt: "20/07/2026 15:20" },
  { id: "BATS-2026-0005", gtin: "08938500000012", lot: "LOT-2026-0722", plotCode: "VN-DLK-PA-0001", crop: "Sầu riêng Ri6", quantityKg: "1.100", operationalStatus: "Đang vận chuyển", custodian: "Hợp tác xã Ea Yông", pcieStatus: "REVIEW", updatedAt: "21/07/2026 10:45" },
  { id: "BATS-2026-0006", gtin: "08938500000013", lot: "LOT-2026-0723", plotCode: "VN-DLK-PA-0001", crop: "Sầu riêng Ri6", quantityKg: "1.050", operationalStatus: "Đã bàn giao", custodian: "Công ty Xuất khẩu BATS", pcieStatus: "PASS", updatedAt: "21/07/2026 16:10" }
];

const checkResultLabels: Record<CheckResult, string> = {
  PASS: "Đạt yêu cầu",
  REVIEW: "Cần kiểm tra lại",
  BLOCK: "Tạm khóa"
};

const checkResultStyles: Record<CheckResult, { background: string; color: string; marker: string }> = {
  PASS: { background: "#E8F4EA", color: "#157347", marker: "●" },
  REVIEW: { background: "#FFF6E6", color: "#A76B10", marker: "▲" },
  BLOCK: { background: "#FFF0EF", color: "#B54745", marker: "■" }
};

const batchStatuses: Array<"ALL" | BatchStatus> = ["ALL", "Đã tạo", "Đã thu mua", "Đang vận chuyển", "Đã bàn giao"];
const results: Array<"ALL" | CheckResult> = ["ALL", "PASS", "REVIEW", "BLOCK"];
const pageSize = 10;

export default function BatchesPage() {
  const [batchList, setBatchList] = useState<Batch[]>(batches);
  const [checkResult, setCheckResult] = useState<"ALL" | CheckResult>("ALL");
  const [batchStatus, setBatchStatus] = useState<"ALL" | BatchStatus>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New batch form state
  const [newBatch, setNewBatch] = useState({
    id: `BATS-2026-000${batchList.length + 1}`,
    gtin: "08938500000013",
    lot: `LOT-2026-072${batchList.length + 4}`,
    plotCode: "VN-DLK-PA-0001",
    crop: "Sầu riêng Ri6",
    quantityKg: "1200",
    custodian: "Hợp tác xã Ea Yông",
    notes: ""
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("vi-VN");
    return batchList.filter((batch) => {
      const matchesResult = checkResult === "ALL" || batch.pcieStatus === checkResult;
      const matchesStatus = batchStatus === "ALL" || batch.operationalStatus === batchStatus;
      const matchesSearch = !term || [batch.id, batch.gtin, batch.lot, batch.plotCode].join(" ").toLocaleLowerCase("vi-VN").includes(term);
      return matchesResult && matchesStatus && matchesSearch;
    });
  }, [batchList, batchStatus, checkResult, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const displayedBatches = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function resetPageAndSetResult(value: "ALL" | CheckResult) {
    setCheckResult(value);
    setPage(1);
  }
  function resetPageAndSetStatus(value: "ALL" | BatchStatus) {
    setBatchStatus(value);
    setPage(1);
  }

  function handleCreateBatch(e: React.FormEvent) {
    e.preventDefault();
    const created: Batch = {
      id: newBatch.id.trim(),
      gtin: newBatch.gtin.trim(),
      lot: newBatch.lot.trim(),
      plotCode: newBatch.plotCode.trim(),
      crop: newBatch.crop.trim(),
      quantityKg: Number(newBatch.quantityKg).toLocaleString("vi-VN"),
      operationalStatus: "Đã tạo",
      custodian: newBatch.custodian.trim(),
      pcieStatus: "PASS",
      updatedAt: new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date())
    };

    setBatchList([created, ...batchList]);
    setIsCreateModalOpen(false);
    setToastMessage(`Đã tạo thành công lô hàng ${created.id}`);
    setTimeout(() => setToastMessage(null), 4000);

    // Reset form for next batch
    setNewBatch({
      id: `BATS-2026-000${batchList.length + 2}`,
      gtin: "08938500000013",
      lot: `LOT-2026-072${batchList.length + 5}`,
      plotCode: "VN-DLK-PA-0001",
      crop: "Sầu riêng Ri6",
      quantityKg: "1200",
      custodian: "Hợp tác xã Ea Yông",
      notes: ""
    });
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {toastMessage && (
        <div style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 3000,
          backgroundColor: "#E8F4EA",
          border: "1px solid #169B52",
          color: "#0D4E35",
          padding: "12px 20px",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: 650,
          boxShadow: "0 8px 24px rgba(13, 78, 53, 0.15)",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "25px", fontWeight: 800, textTransform: "uppercase", color: "#0A3827", margin: "0 0 6px" }}>Quản lý lô hàng nông sản</h1>
        <div className="batchesHeaderActions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "nowrap" }}>
          <p style={{ flex: "1 1 auto", minWidth: 0, alignSelf: "flex-start", fontSize: "14px", lineHeight: 1.55, color: "#68766C", margin: 0 }}>Theo dõi thông tin, khối lượng, quá trình vận chuyển và kết quả kiểm tra của từng lô nông sản</p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              backgroundColor: "#0D4E35",
              color: "#FFFFFF",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "background-color 0.15s ease",
              boxShadow: "0 2px 6px rgba(13, 78, 53, 0.2)"
            }}
          >
            + Tạo lô hàng
          </button>
        </div>
      </header>

      <section aria-label="Bộ lọc lô hàng" style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8DF", padding: "16px", marginBottom: "20px" }}>
        <div className="batchFilterBar" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px 16px" }}>
            <div className="batchFilterGroup" style={{ display: "flex", flexWrap: "wrap", gap: "7px", alignItems: "center" }}>
              <span style={{ minWidth: "128px", fontSize: "13px", fontWeight: 650, color: "#526159" }}>Kết quả kiểm tra:</span>
              {results.map((status) => {
                const isActive = checkResult === status;
                const style = status === "ALL" ? { background: "#0D4E35", color: "#FFFFFF" } : checkResultStyles[status];
                return <button key={status} type="button" onClick={() => resetPageAndSetResult(status)} style={{ padding: "5px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 650, cursor: "pointer", border: `1px solid ${isActive ? "transparent" : "#DDE6DD"}`, background: isActive ? style.background : "#FFFFFF", color: isActive ? style.color : "#46574D" }}>{status === "ALL" ? "Tất cả" : checkResultLabels[status]}</button>;
              })}
            </div>
            <div className="batchFilterGroup" style={{ display: "flex", flexWrap: "wrap", gap: "7px", alignItems: "center" }}>
              <span style={{ minWidth: "128px", fontSize: "13px", fontWeight: 650, color: "#526159" }}>Trạng thái lô hàng:</span>
              {batchStatuses.map((status) => {
                const isActive = batchStatus === status;
                return <button key={status} type="button" onClick={() => resetPageAndSetStatus(status)} style={{ padding: "5px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 650, cursor: "pointer", border: `1px solid ${isActive ? "#0D4E35" : "#DDE6DD"}`, background: isActive ? "#EAF5ED" : "#FFFFFF", color: isActive ? "#0D4E35" : "#46574D" }}>{status === "ALL" ? "Tất cả" : status}</button>;
              })}
            </div>
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8DF", padding: "16px" }}>
        <div style={{ width: "100%", position: "relative", marginBottom: "16px" }}>
          <Search size={18} color="#68766C" style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <label htmlFor="batch-search" className="srOnly">Tìm lô hàng</label>
          <input id="batch-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Tìm theo mã lô hàng, mã sản phẩm hoặc mã vùng trồng..." style={{ width: "100%", padding: "11px 14px 11px 42px", borderRadius: "9px", border: "1px solid #D9E3DA", fontSize: "13px", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "10px" }}>
          <p style={{ margin: 0, color: "#68766C", fontSize: "12px" }}>Hiển thị {filtered.length ? (safePage - 1) * pageSize + 1 : 0}–{Math.min(safePage * pageSize, filtered.length)} trong tổng số {filtered.length} lô hàng.</p>
          <p style={{ margin: 0, color: "#68766C", fontSize: "12px", whiteSpace: "nowrap" }}>Cập nhật gần nhất: 21/07/2026 16:10</p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="batchesTable" style={{ width: "100%", minWidth: "950px", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead><tr style={{ borderBottom: "1px solid #E2E8DF", color: "#68766C", textAlign: "center" }}>
              <th style={{ padding: "10px 8px", textAlign: "left" }}>Mã lô hàng</th><th style={{ padding: "10px 8px" }}>Nông sản / Mã vùng trồng</th><th style={{ padding: "10px 8px" }}>Khối lượng</th><th style={{ padding: "10px 8px" }}>Đơn vị đang quản lý</th><th style={{ padding: "10px 8px" }}>Trạng thái lô hàng</th><th style={{ padding: "10px 8px" }}>Kết quả kiểm tra</th><th style={{ padding: "10px 8px" }}>Cập nhật gần nhất</th>
            </tr></thead>
            <tbody>{displayedBatches.map((batch) => {
              const resultStyle = checkResultStyles[batch.pcieStatus];
              return <tr key={batch.id} style={{ borderBottom: "1px solid #F3F4EE", textAlign: "center" }}>
                <td style={{ padding: "12px 8px", textAlign: "left" }}><Link href={`/app/batches/${batch.id}`} style={{ fontWeight: 700, color: "#0D4E35", fontFamily: "monospace", textDecoration: "none" }}>{batch.id}</Link><div style={{ fontSize: "11px", color: "#68766C", marginTop: "3px" }}>GTIN: {batch.gtin} · {batch.lot}</div></td>
                <td style={{ padding: "12px 8px" }}><div style={{ fontWeight: 600 }}>{batch.crop}</div><div style={{ fontSize: "11px", color: "#68766C" }}>{batch.plotCode}</div></td>
                <td style={{ padding: "12px 8px", fontWeight: 700, whiteSpace: "nowrap" }}>{batch.quantityKg} kg</td>
                <td style={{ padding: "12px 8px", fontSize: "12px", color: "#23322B" }}>{batch.custodian}</td>
                <td style={{ padding: "12px 8px", fontSize: "12px" }}><span style={{ padding: "3px 8px", borderRadius: "999px", backgroundColor: "#F6F8F4", color: "#33483A", border: "1px solid #E2E8DF", whiteSpace: "nowrap", fontWeight: 650 }}>{batch.operationalStatus}</span></td>
                <td style={{ padding: "12px 8px" }}><span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, backgroundColor: resultStyle.background, color: resultStyle.color, whiteSpace: "nowrap" }}>{resultStyle.marker} {checkResultLabels[batch.pcieStatus]}</span></td>
                <td style={{ padding: "12px 8px", color: "#55665C", fontSize: "12px", whiteSpace: "nowrap" }}>{batch.updatedAt}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>
        {displayedBatches.length === 0 && <p style={{ margin: "18px 0 0", padding: "20px", background: "#F8FAF8", borderRadius: "8px", color: "#68766C", textAlign: "center", fontSize: "13px" }}>Không tìm thấy lô hàng phù hợp với điều kiện đã chọn.</p>}
        {totalPages > 1 && <nav aria-label="Phân trang lô hàng" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", marginTop: "16px" }}>
          <button type="button" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} style={{ padding: "7px 10px", borderRadius: "7px", border: "1px solid #D9E3DA", background: "#FFFFFF", color: safePage === 1 ? "#A6B1A8" : "#0D4E35", cursor: safePage === 1 ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center" }} aria-label="Trang trước"><ArrowLeft size={15} /></button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <button key={number} type="button" onClick={() => setPage(number)} style={{ minWidth: "32px", height: "32px", borderRadius: "7px", border: `1px solid ${safePage === number ? "#0D4E35" : "#D9E3DA"}`, background: safePage === number ? "#0D4E35" : "#FFFFFF", color: safePage === number ? "#FFFFFF" : "#46574D", fontWeight: 650, cursor: "pointer" }}>{number}</button>)}
          <button type="button" disabled={safePage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} style={{ padding: "7px 10px", borderRadius: "7px", border: "1px solid #D9E3DA", background: "#FFFFFF", color: safePage === totalPages ? "#A6B1A8" : "#0D4E35", cursor: safePage === totalPages ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center" }} aria-label="Trang sau"><ArrowRight size={15} /></button>
        </nav>}
      </section>

      {/* Modal Tạo Lô Hàng Mới */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-batch-title"
          onClick={() => setIsCreateModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            display: "grid",
            placeItems: "center",
            padding: "20px",
            background: "rgba(9, 34, 24, 0.48)",
            overflowY: "auto"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(100%, 640px)",
              maxHeight: "calc(100vh - 40px)",
              overflowY: "auto",
              background: "#FFFFFF",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 22px 70px rgba(8, 35, 24, 0.26)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h2 id="create-batch-title" style={{ margin: 0, fontSize: "19px", fontWeight: 750, color: "#0A3827" }}>
                  Tạo lô hàng nông sản mới
                </h2>
                <p style={{ margin: "5px 0 0", color: "#68766C", fontSize: "13px" }}>
                  Đăng ký thông tin thu hoạch, khối lượng và vùng trồng để kích hoạt quy trình truy xuất nguồn gốc GS1
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Đóng hộp thoại"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  border: "1px solid #DDE6DD",
                  background: "#F6F8F4",
                  color: "#526159",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "16px",
                  fontWeight: 600
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 700, color: "#34443A" }}>
                  Mã lô hàng (Batch ID) <span style={{ color: "#B54745" }}>*</span>
                  <input
                    required
                    value={newBatch.id}
                    onChange={(e) => setNewBatch({ ...newBatch, id: e.target.value })}
                    placeholder="Ví dụ: BATS-2026-0007"
                    style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #CAD7CC", fontSize: "13px", fontFamily: "monospace", fontWeight: 600 }}
                  />
                </label>

                <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 700, color: "#34443A" }}>
                  Mã GTIN sản phẩm <span style={{ color: "#B54745" }}>*</span>
                  <input
                    required
                    value={newBatch.gtin}
                    onChange={(e) => setNewBatch({ ...newBatch, gtin: e.target.value })}
                    placeholder="08938500000013"
                    style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #CAD7CC", fontSize: "13px", fontFamily: "monospace" }}
                  />
                </label>

                <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 700, color: "#34443A" }}>
                  Mã số lô thu hoạch (Lot) <span style={{ color: "#B54745" }}>*</span>
                  <input
                    required
                    value={newBatch.lot}
                    onChange={(e) => setNewBatch({ ...newBatch, lot: e.target.value })}
                    placeholder="LOT-2026-0724"
                    style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #CAD7CC", fontSize: "13px", fontFamily: "monospace" }}
                  />
                </label>

                <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 700, color: "#34443A" }}>
                  Nông sản & Giống <span style={{ color: "#B54745" }}>*</span>
                  <input
                    required
                    value={newBatch.crop}
                    onChange={(e) => setNewBatch({ ...newBatch, crop: e.target.value })}
                    placeholder="Ví dụ: Sầu riêng Ri6"
                    style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #CAD7CC", fontSize: "13px" }}
                  />
                </label>

                <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 700, color: "#34443A" }}>
                  Mã số vùng trồng <span style={{ color: "#B54745" }}>*</span>
                  <select
                    value={newBatch.plotCode}
                    onChange={(e) => setNewBatch({ ...newBatch, plotCode: e.target.value })}
                    style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #CAD7CC", fontSize: "13px", backgroundColor: "#FFFFFF" }}
                  >
                    <option value="VN-DLK-PA-0001">VN-DLK-PA-0001 (Ea Yông - Còn hiệu lực)</option>
                    <option value="VN-DLK-PA-0002">VN-DLK-PA-0002 (Krông Pắc - Còn hiệu lực)</option>
                    <option value="VN-DLK-PA-9999">VN-DLK-PA-9999 (Vườn Tạm Ngừng)</option>
                  </select>
                </label>

                <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 700, color: "#34443A" }}>
                  Khối lượng khai báo (kg) <span style={{ color: "#B54745" }}>*</span>
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={newBatch.quantityKg}
                    onChange={(e) => setNewBatch({ ...newBatch, quantityKg: e.target.value })}
                    placeholder="1200"
                    style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #CAD7CC", fontSize: "13px", fontWeight: 650 }}
                  />
                </label>

                <label style={{ gridColumn: "1 / -1", display: "grid", gap: "5px", fontSize: "12px", fontWeight: 700, color: "#34443A" }}>
                  Đơn vị / Người đang giữ (Custodian) <span style={{ color: "#B54745" }}>*</span>
                  <input
                    required
                    value={newBatch.custodian}
                    onChange={(e) => setNewBatch({ ...newBatch, custodian: e.target.value })}
                    placeholder="Ví dụ: Hợp tác xã Ea Yông hoặc Trần Quốc Toàn"
                    style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #CAD7CC", fontSize: "13px" }}
                  />
                </label>

                <label style={{ gridColumn: "1 / -1", display: "grid", gap: "5px", fontSize: "12px", fontWeight: 700, color: "#34443A" }}>
                  Ghi chú lô hàng
                  <textarea
                    rows={2}
                    value={newBatch.notes}
                    onChange={(e) => setNewBatch({ ...newBatch, notes: e.target.value })}
                    placeholder="Ghi chú về thu hoạch, chất lượng hoặc yêu cầu vận chuyển..."
                    style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #CAD7CC", fontSize: "13px", resize: "vertical" }}
                  />
                </label>
              </div>

              <div style={{ marginTop: "16px", padding: "12px 14px", borderRadius: "8px", backgroundColor: "#F6F8F4", fontSize: "12px", color: "#526159", lineHeight: 1.5 }}>
                ℹ Lô hàng sau khi tạo sẽ được kích hoạt quy tắc đối soát PCIE 8 Invariants và sẵn sàng để tạo sự kiện tiếp nhận tại trạm thu mua.
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: "8px",
                    border: "1px solid #CAD7CC",
                    background: "#FFFFFF",
                    color: "#44554B",
                    fontSize: "13px",
                    fontWeight: 650,
                    cursor: "pointer"
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "9px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#0D4E35",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 650,
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(13, 78, 53, 0.2)"
                  }}
                >
                  Xác nhận tạo lô hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .srOnly { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
        .batchesTable th, .batchesTable td { text-align: center; }
        @media (max-width: 760px) { .batchFilterBar { align-items: stretch !important; flex-direction: column; } }
        @media (max-width: 700px) { .batchesHeaderActions { flex-wrap: wrap !important; } }
      `}</style>
    </div>
  );
}
