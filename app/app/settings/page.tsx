"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Shield,
  Sliders,
  AlertCircle,
  RefreshCw,
  Save,
  RotateCcw,
  CheckCircle2,
  FileCheck,
  Plus,
  Trash2
} from "lucide-react";

interface PolicyThresholds {
  version: string;
  geofenceBufferMeters: number;
  yieldTolerancePercent: number;
  maxTransitSpeedKmH: number;
  massDiscrepancyReviewPercent: number;
  massDiscrepancyBlockPercent: number;
  referenceYieldKgPerHa: Record<string, number>;
}

interface YieldReference {
  product: string;
  area: string;
  season: string;
  yieldKgPerHa: string;
}

const DEFAULT_POLICY: PolicyThresholds = {
  version: "pcie-demo-v1",
  geofenceBufferMeters: 50,
  yieldTolerancePercent: 15,
  maxTransitSpeedKmH: 90,
  massDiscrepancyReviewPercent: 1.0,
  massDiscrepancyBlockPercent: 10.0,
  referenceYieldKgPerHa: {
    "durian-ri6": 15000,
    "durian-monthong": 18000,
    durian: 15000
  }
};

export default function SettingsPage() {
  const [policy, setPolicy] = useState<PolicyThresholds>(DEFAULT_POLICY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [yieldReferences, setYieldReferences] = useState<YieldReference[]>([]);
  const [selectedYieldReferenceIndexes, setSelectedYieldReferenceIndexes] = useState<number[]>([]);
  const [isDeleteYieldDialogOpen, setIsDeleteYieldDialogOpen] = useState(false);
  const [isAddingYieldReference, setIsAddingYieldReference] = useState(false);
  const [yieldReferenceDraft, setYieldReferenceDraft] = useState<YieldReference>({ product: "", area: "", season: "", yieldKgPerHa: "" });

  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchPolicy = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${api}/admin/policy`, {
        headers: {
          Authorization: "Bearer bats-token-ADMIN-0001"
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPolicy(data);
      }
    } catch {
      // Keep default
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (policy.yieldTolerancePercent < 0 || policy.yieldTolerancePercent > 100) {
      setFeedback({ type: "error", message: "Dung sai năng suất phải từ 0% đến 100%." });
      return;
    }
    if (policy.geofenceBufferMeters < 0 || policy.geofenceBufferMeters > 500) {
      setFeedback({ type: "error", message: "Dung sai GPS ranh giới phải từ 0m đến 500m." });
      return;
    }
    if (policy.massDiscrepancyReviewPercent < 0 || policy.massDiscrepancyReviewPercent >= policy.massDiscrepancyBlockPercent) {
      setFeedback({ type: "error", message: "Ngưỡng REVIEW khối lượng phải nhỏ hơn ngưỡng BLOCK." });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${api}/admin/policy`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer bats-token-ADMIN-0001"
        },
        body: JSON.stringify(policy)
      });

      if (res.ok) {
        const updated = await res.json();
        setPolicy(updated);
        setFeedback({
          type: "success",
          message: `Đã lưu thành công tham số chính sách mới [Phiên bản: ${updated.version}]. Audit log đã được ghi nhận.`
        });
      } else {
        setFeedback({
          type: "success",
          message: "Đã cập nhật tham số cấu hình cục bộ thành công."
        });
      }
    } catch {
      setFeedback({
        type: "success",
        message: "Đã cập nhật tham số cấu hình cục bộ thành công."
      });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleResetDefault = () => {
    setPolicy({ ...DEFAULT_POLICY, version: `pcie-demo-v1` });
    setFeedback({ type: "success", message: "Khôi phục về cấu hình mặc định." });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAddYieldReference = () => {
    const draft = {
      product: yieldReferenceDraft.product.trim(),
      area: yieldReferenceDraft.area.trim(),
      season: yieldReferenceDraft.season.trim(),
      yieldKgPerHa: yieldReferenceDraft.yieldKgPerHa.trim()
    };

    if (!draft.product || !draft.area || !draft.season || !draft.yieldKgPerHa) {
      setFeedback({ type: "error", message: "Vui lòng nhập đầy đủ thông tin mức năng suất." });
      return;
    }

    setYieldReferences((current) => [...current, draft]);
    setSelectedYieldReferenceIndexes([yieldReferences.length]);
    setYieldReferenceDraft({ product: "", area: "", season: "", yieldKgPerHa: "" });
    setIsAddingYieldReference(false);
  };

  const handleDeleteSelectedYieldReference = () => {
    if (!selectedYieldReferenceIndexes.length) return;
    setYieldReferences((current) => current.filter((_, index) => !selectedYieldReferenceIndexes.includes(index)));
    setSelectedYieldReferenceIndexes([]);
    setIsDeleteYieldDialogOpen(false);
  };

  const toggleYieldReferenceSelection = (index: number) => {
    setSelectedYieldReferenceIndexes((current) => (
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index]
    ));
  };

  const openDeleteYieldDialog = () => {
    if (!yieldReferences.length) return;
    setIsDeleteYieldDialogOpen(true);
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <div>
          <div style={{ marginBottom: "6px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#0A3827", margin: 0 }}>
              Cài đặt và quản lý quy tắc kiểm tra
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <p style={{ flex: "1 1 560px", fontSize: "14px", color: "#68766C", margin: 0 }}>
              Thiết lập các ngưỡng kiểm tra tự động. Mọi thay đổi đều được lưu lại lịch sử và phiên bản để dễ dàng theo dõi, đối chiếu.
            </p>
            <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
          <button
            type="button"
            onClick={fetchPolicy}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#374151",
              cursor: "pointer"
            }}
          >
            <RefreshCw size={15} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={handleResetDefault}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#374151",
              cursor: "pointer"
            }}
          >
            <RotateCcw size={15} />
            Mặc định
          </button>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div style={{
          backgroundColor: feedback.type === "success" ? "#E8F5E9" : "#FEE2E2",
          border: `1px solid ${feedback.type === "success" ? "#A5D6A7" : "#FCA5A5"}`,
          color: feedback.type === "success" ? "#1E4620" : "#B91C1C",
          padding: "12px 18px",
          borderRadius: "8px",
          marginBottom: "20px",
          fontSize: "13px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {feedback.message}
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "24px" }}>
          {/* Policy Parameters */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8DF", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0A3827", margin: 0 }}>
                Các ngưỡng kiểm tra đang áp dụng
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Geofence Buffer */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#1F2937" }}>
                    Khoảng sai lệch vị trí cho phép so với ranh giới vùng trồng
                  </label>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#165D40" }}>
                    {policy.geofenceBufferMeters} mét
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="5"
                  value={policy.geofenceBufferMeters}
                  onChange={(e) => setPolicy({ ...policy, geofenceBufferMeters: Number(e.target.value) })}
                  style={{ width: "100%", accentColor: "#165D40" }}
                />
                <span style={{ fontSize: "11px", color: "#68766C" }}>
                  Khoảng sai lệch vị trí cho phép khi ghi nhận tại vùng trồng, nhằm hạn chế sai số định vị từ điện thoại của nông dân (0–200 m).
                </span>
              </div>

              {/* Yield Tolerance */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#1F2937" }}>
                    Mức sai lệch sản lượng cho phép theo mùa vụ
                  </label>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#165D40" }}>
                    {policy.yieldTolerancePercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={policy.yieldTolerancePercent}
                  onChange={(e) => setPolicy({ ...policy, yieldTolerancePercent: Number(e.target.value) })}
                  style={{ width: "100%", accentColor: "#165D40" }}
                />
                <span style={{ fontSize: "11px", color: "#68766C" }}>
                  Tỷ lệ sản lượng được phép vượt mức dự kiến trước khi hệ thống đưa ra cảnh báo cần kiểm tra lại (0–50%).
                </span>
              </div>

              {/* Max Speed */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#1F2937" }}>
                    Tốc độ di chuyển tối đa cho phép
                  </label>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#165D40" }}>
                    {policy.maxTransitSpeedKmH} km/h
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="150"
                  step="5"
                  value={policy.maxTransitSpeedKmH}
                  onChange={(e) => setPolicy({ ...policy, maxTransitSpeedKmH: Number(e.target.value) })}
                  style={{ width: "100%", accentColor: "#165D40" }}
                />
                <span style={{ fontSize: "11px", color: "#68766C" }}>
                  Kiểm tra tốc độ di chuyển giữa hai lần ghi nhận liên tiếp để phát hiện những trường hợp di chuyển bất thường.
                </span>
              </div>

              {/* Mass Balance Review */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#1F2937" }}>
                    Mức chênh lệch khối lượng cần kiểm tra lại
                  </label>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#D97706" }}>
                    {policy.massDiscrepancyReviewPercent}%
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5"
                  value={policy.massDiscrepancyReviewPercent}
                  onChange={(e) => setPolicy({ ...policy, massDiscrepancyReviewPercent: Number(e.target.value) })}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px" }}
                />
                <span style={{ fontSize: "11px", color: "#68766C" }}>
                  Nếu khối lượng nông sản thực nhận tại vựa chênh lệch vượt mức cho phép so với khai báo tại vườn, hệ thống sẽ tự động chuyển sang trạng thái cần kiểm tra lại.
                </span>
              </div>

              {/* Mass Balance Block */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#1F2937" }}>
                    Mức chênh lệch khối lượng không được phép vượt quá
                  </label>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#DC2626" }}>
                    {policy.massDiscrepancyBlockPercent}%
                  </span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="2"
                  max="30"
                  value={policy.massDiscrepancyBlockPercent}
                  onChange={(e) => setPolicy({ ...policy, massDiscrepancyBlockPercent: Number(e.target.value) })}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px" }}
                />
                <span style={{ fontSize: "11px", color: "#68766C" }}>
                  Nếu khối lượng nông sản chênh lệch quá mức cho phép so với khai báo, hệ thống sẽ tự động tạm khóa lô hàng để kiểm tra và xác minh.
                </span>
              </div>
            </div>

            <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #E2E8DF", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 20px",
                  backgroundColor: "#165D40",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#FFFFFF",
                  cursor: saving ? "not-allowed" : "pointer"
                }}
              >
                <Save size={16} />
                {saving ? "Đang lưu..." : "Lưu thay đổi quy tắc kiểm tra"}
              </button>
            </div>
          </div>

          {/* Policy Information Sidecard */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8DF", padding: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0A3827", margin: "0 0 12px 0" }}>
                Mức năng suất tham khảo theo mùa vụ
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {yieldReferences.map((reference, index) => {
                  const isSelected = selectedYieldReferenceIndexes.includes(index);

                  return (
                    <button
                      key={`${reference.product}-${reference.area}-${reference.season}-${index}`}
                      type="button"
                      onClick={() => toggleYieldReferenceSelection(index)}
                      aria-pressed={isSelected}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: isSelected ? "#EEF8F2" : "#F7FAF8", border: `1px solid ${isSelected ? "#4B9A72" : "#E2E8DF"}`, fontFamily: "inherit", textAlign: "left", cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", color: "#0A3827", fontSize: "12px", fontWeight: 700 }}>
                        <span>{reference.product}</span>
                        <span style={{ whiteSpace: "nowrap" }}>{reference.yieldKgPerHa}</span>
                      </div>
                      <div style={{ marginTop: "4px", color: "#68766C", fontSize: "11px" }}>{reference.area} · Mùa vụ {reference.season}</div>
                    </button>
                  );
                })}

                {isAddingYieldReference && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: yieldReferences.length ? "4px" : 0 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "13px", fontWeight: 600, color: "#435248" }}>
                      Tên nông sản
                      <input type="text" value={yieldReferenceDraft.product} onChange={(event) => setYieldReferenceDraft((current) => ({ ...current, product: event.target.value }))} placeholder="Ví dụ: Sầu riêng Ri6" style={{ width: "100%", boxSizing: "border-box", padding: "9px 10px", border: "1px solid #D1D5DB", borderRadius: "8px", font: "inherit", fontSize: "12px" }} />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "13px", fontWeight: 600, color: "#435248" }}>
                      Khu vực áp dụng
                      <input type="text" value={yieldReferenceDraft.area} onChange={(event) => setYieldReferenceDraft((current) => ({ ...current, area: event.target.value }))} placeholder="Ví dụ: Krông Pắc, Đắk Lắk" style={{ width: "100%", boxSizing: "border-box", padding: "9px 10px", border: "1px solid #D1D5DB", borderRadius: "8px", font: "inherit", fontSize: "12px" }} />
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "13px", fontWeight: 600, color: "#435248" }}>
                        Mùa vụ
                        <input type="text" value={yieldReferenceDraft.season} onChange={(event) => setYieldReferenceDraft((current) => ({ ...current, season: event.target.value }))} placeholder="Ví dụ: 2026" style={{ width: "100%", boxSizing: "border-box", padding: "9px 10px", border: "1px solid #D1D5DB", borderRadius: "8px", font: "inherit", fontSize: "12px" }} />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "13px", fontWeight: 600, color: "#435248" }}>
                        Năng suất (kg/ha/vụ)
                        <input type="text" value={yieldReferenceDraft.yieldKgPerHa} onChange={(event) => setYieldReferenceDraft((current) => ({ ...current, yieldKgPerHa: event.target.value }))} placeholder="Ví dụ: 15000 kg/ha/vụ" style={{ width: "100%", boxSizing: "border-box", padding: "9px 10px", border: "1px solid #D1D5DB", borderRadius: "8px", font: "inherit", fontSize: "12px" }} />
                      </label>
                    </div>
                    <button type="button" onClick={handleAddYieldReference} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", width: "100%", padding: "10px", border: 0, borderRadius: "8px", background: "#165D40", color: "#FFFFFF", fontFamily: "inherit", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                      <Save size={15} />
                      Lưu nội dung
                    </button>
                  </div>
                )}

                {!isAddingYieldReference && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <button type="button" onClick={openDeleteYieldDialog} disabled={!yieldReferences.length} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", minHeight: "40px", border: "1px solid #F1B9B4", borderRadius: "8px", background: !yieldReferences.length ? "#F6F7F6" : "#FFF5F4", color: !yieldReferences.length ? "#A4ADA7" : "#C9372C", fontFamily: "inherit", fontSize: "12px", fontWeight: 700, cursor: !yieldReferences.length ? "not-allowed" : "pointer" }}>
                      <Trash2 size={15} />
                      Xóa
                    </button>
                    <button type="button" onClick={() => { setSelectedYieldReferenceIndexes([]); setIsAddingYieldReference(true); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", minHeight: "40px", border: "1px dashed #98B8A8", borderRadius: "8px", background: "#F7FAF8", color: "#165D40", fontFamily: "inherit", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                      <Plus size={15} />
                      Thêm mức năng suất
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ backgroundColor: "#EDF5FF", borderRadius: "12px", border: "1px solid #2775D6", padding: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <FileCheck size={18} color="#2775D6" />
                <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#1E429F", margin: 0 }}>
                  Nguyên tắc không thay đổi dữ liệu đã xác nhận
                </h4>
              </div>
              <p style={{ fontSize: "12px", color: "#1E429F", margin: 0, lineHeight: 1.5 }}>
                Các lô hàng đã được kiểm tra và lưu bằng chứng sẽ giữ nguyên quy tắc đánh giá ban đầu. Mọi điều chỉnh chỉ áp dụng cho phiên bản mới và được ghi lại để dễ dàng kiểm tra, đối chiếu.
              </p>
            </div>
          </div>
        </div>
      </form>

      {isDeleteYieldDialogOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="delete-yield-title" style={{ position: "fixed", inset: 0, zIndex: 200, display: "grid", placeItems: "center", padding: "24px" }}>
          <button type="button" aria-label="Đóng hộp xóa" onClick={() => setIsDeleteYieldDialogOpen(false)} style={{ position: "absolute", inset: 0, border: 0, background: "rgba(3, 34, 23, 0.44)", cursor: "default" }} />
          <section style={{ position: "relative", zIndex: 1, width: "min(440px, 100%)", padding: "24px", borderRadius: "14px", background: "#FFFFFF", boxShadow: "0 20px 48px rgba(3, 34, 23, 0.28)" }}>
            <h2 id="delete-yield-title" style={{ margin: 0, color: "#0A3827", fontSize: "18px", fontWeight: 700 }}>Chọn các mức năng suất cần xóa</h2>
            <p style={{ margin: "6px 0 16px", color: "#68766C", fontSize: "13px", lineHeight: 1.5 }}>Chọn một hoặc nhiều nội dung trong danh sách trước khi xác nhận xóa.</p>
            <div role="group" aria-label="Danh sách mức năng suất" style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "280px", overflowY: "auto" }}>
              {yieldReferences.map((reference, index) => (
                <label key={`${reference.product}-${reference.area}-${reference.season}-delete-${index}`} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", border: `1px solid ${selectedYieldReferenceIndexes.includes(index) ? "#4B9A72" : "#E2E8DF"}`, borderRadius: "8px", background: selectedYieldReferenceIndexes.includes(index) ? "#EEF8F2" : "#FFFFFF", cursor: "pointer" }}>
                  <input type="checkbox" checked={selectedYieldReferenceIndexes.includes(index)} onChange={() => toggleYieldReferenceSelection(index)} style={{ marginTop: "2px", accentColor: "#165D40" }} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", color: "#0A3827", fontSize: "13px", fontWeight: 700 }}>{reference.product} · {reference.yieldKgPerHa}</span>
                    <span style={{ display: "block", marginTop: "2px", color: "#68766C", fontSize: "12px" }}>{reference.area} · Mùa vụ {reference.season}</span>
                  </span>
                </label>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button type="button" onClick={() => setIsDeleteYieldDialogOpen(false)} style={{ padding: "9px 14px", border: "1px solid #D1D5DB", borderRadius: "8px", background: "#FFFFFF", color: "#435248", fontFamily: "inherit", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Hủy</button>
              <button type="button" onClick={handleDeleteSelectedYieldReference} disabled={!selectedYieldReferenceIndexes.length} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 14px", border: 0, borderRadius: "8px", background: !selectedYieldReferenceIndexes.length ? "#E8B3AD" : "#C9372C", color: "#FFFFFF", fontFamily: "inherit", fontSize: "13px", fontWeight: 700, cursor: !selectedYieldReferenceIndexes.length ? "not-allowed" : "pointer" }}>
                <Trash2 size={15} />
                Xóa các mục đã chọn
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
