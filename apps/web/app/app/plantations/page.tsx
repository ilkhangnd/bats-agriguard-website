"use client";

import React, { useMemo, useState } from "react";
import { LeafletMap } from "../../components/LeafletMap";
import { Eye, History, MapPin, Pencil, Save, ShieldCheck, Users, X } from "lucide-react";

type Plot = {
  id: string; code: string; name: string; farmer: string; crop: string; areaHa: number;
  location: string; status: "Còn hiệu lực" | "Tạm ngừng"; version: number;
  validFrom: string; validTo: string; polygon: [number, number][]; authorizedCount: number;
};

const initialPlots: Plot[] = [
  {
    id: "plot-dlk-0001", code: "VN-DLK-PA-0001", name: "Rẫy Sầu Riêng Ea Yông 01",
    farmer: "Nguyễn Văn Minh (FARMER-0001)", crop: "Sầu riêng (Ri6)", areaHa: 2.5265,
    location: "Ea Yông, Krông Pắc, Đắk Lắk", status: "Còn hiệu lực", version: 1,
    validFrom: "01/01/2026", validTo: "31/12/2026",
    polygon: [[108.122675, 12.678175], [108.124125, 12.678175], [108.124125, 12.679625], [108.122675, 12.679625], [108.122675, 12.678175]],
    authorizedCount: 3
  },
  {
    id: "plot-dlk-9999", code: "VN-DLK-PA-9999", name: "Vườn Sầu Riêng Tạm Ngưng 99",
    farmer: "Nguyễn Văn Minh (FARMER-0001)", crop: "Sầu riêng (Monthong)", areaHa: 1.5,
    location: "Ea Yông, Krông Pắc, Đắk Lắk", status: "Tạm ngừng", version: 1,
    validFrom: "01/01/2025", validTo: "31/12/2025",
    polygon: [[108.13, 12.68], [108.132, 12.68], [108.132, 12.682], [108.13, 12.682], [108.13, 12.68]],
    authorizedCount: 1
  }
];

type Draft = Pick<Plot, "farmer" | "validTo" | "authorizedCount">;
type CreateDraft = Pick<Plot, "code" | "name" | "farmer" | "crop" | "areaHa" | "location" | "validFrom" | "validTo" | "authorizedCount">;

const emptyCreateDraft: CreateDraft = {
  code: "", name: "", farmer: "", crop: "", areaHa: 0, location: "",
  validFrom: "", validTo: "", authorizedCount: 1
};

export default function PlantationsPage() {
  const [plots, setPlots] = useState<Plot[]>(initialPlots);
  const [selectedId, setSelectedId] = useState("plot-dlk-0001");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<"details" | "edit" | "create" | null>(null);
  const [draft, setDraft] = useState<Draft>({ farmer: initialPlots[0].farmer, validTo: initialPlots[0].validTo, authorizedCount: initialPlots[0].authorizedCount });
  const [createDraft, setCreateDraft] = useState<CreateDraft>(emptyCreateDraft);
  const currentPlot = plots.find((plot) => plot.id === selectedId) ?? plots[0]!;
  const filteredPlots = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("vi-VN");
    return term ? plots.filter((plot) => [plot.code, plot.name, plot.farmer, plot.crop, plot.location].join(" ").toLocaleLowerCase("vi-VN").includes(term)) : plots;
  }, [plots, query]);
  const farmerMatch = currentPlot.farmer.match(/^(.+?)\s*\(([^)]+)\)$/);
  const farmerName = farmerMatch?.[1] ?? currentPlot.farmer;
  const farmerAccount = farmerMatch?.[2] ?? null;

  const buttonBase: React.CSSProperties = { borderRadius: "8px", fontSize: "13px", fontWeight: 650, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "7px" };
  const formInput: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "9px 10px", borderRadius: "7px", border: "1px solid #CAD7CC", font: "inherit", fontWeight: 400, color: "#193427", background: "#FFFFFF" };
  const openEdit = () => {
    setDraft({ farmer: currentPlot.farmer, validTo: currentPlot.validTo, authorizedCount: currentPlot.authorizedCount });
    setDialog("edit");
  };
  function saveNewVersion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPlots((current) => current.map((plot) => plot.id === currentPlot.id ? {
      ...plot, farmer: draft.farmer.trim() || plot.farmer, validTo: draft.validTo.trim() || plot.validTo,
      authorizedCount: Math.max(0, Number(draft.authorizedCount) || 0), version: plot.version + 1
    } : plot));
    setDialog("details");
  }
  function openCreate() {
    setCreateDraft(emptyCreateDraft);
    setDialog("create");
  }
  function createPlot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCode = createDraft.code.trim().toUpperCase();
    const newPlot: Plot = {
      id: `plot-${Date.now()}`,
      code: normalizedCode,
      name: createDraft.name.trim(),
      farmer: createDraft.farmer.trim(),
      crop: createDraft.crop.trim(),
      areaHa: Number(createDraft.areaHa),
      location: createDraft.location.trim(),
      status: "Còn hiệu lực",
      version: 1,
      validFrom: createDraft.validFrom.trim(),
      validTo: createDraft.validTo.trim(),
      polygon: [],
      authorizedCount: Math.max(1, Number(createDraft.authorizedCount) || 1)
    };
    setPlots((current) => [newPlot, ...current]);
    setSelectedId(newPlot.id);
    setDialog(null);
  }

  return (
    <div className="plantationsPage" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "24px" }}>
      <h1 style={{ fontSize: "25px", fontWeight: 800, textTransform: "uppercase", color: "#0A3827", margin: "0 0 6px" }}>Quản lý mã số vùng trồng</h1>
        <div className="plantationsHeaderActions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "nowrap" }}>
          <p style={{ flex: "1 1 auto", minWidth: 0, alignSelf: "flex-start", fontSize: "14px", lineHeight: 1.55, color: "#68766C", margin: 0 }}>Quản lý thông tin, ranh giới, thời hạn hiệu lực và danh sách cá nhân, tổ chức được phép sử dụng mã số vùng trồng</p>
          <button type="button" onClick={openCreate} style={{ ...buttonBase, padding: "8px 16px", backgroundColor: "#0D4E35", color: "#FFFFFF", border: "none", whiteSpace: "nowrap" }}>+ Thêm vùng trồng</button>
        </div>
      </header>

      <div className="plantationsGrid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(470px, 1fr)", gap: "20px", alignItems: "start" }}>
        <section aria-label="Danh sách vùng trồng" style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8DF", padding: "16px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="plot-search" className="srOnly">Tìm vùng trồng</label>
            <input id="plot-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo mã số, vùng trồng hoặc người đại diện..." style={{ width: "100%", padding: "9px 12px", borderRadius: "7px", border: "1px solid #D9E3DA", fontSize: "13px", boxSizing: "border-box" }} />
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="plantationsTable" style={{ width: "100%", minWidth: "650px", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead><tr style={{ borderBottom: "1px solid #E2E8DF", color: "#68766C", textAlign: "left" }}>
                <th style={{ padding: "8px", fontWeight: 650 }}>Mã số vùng trồng</th><th style={{ padding: "8px", fontWeight: 650 }}>Loại cây trồng</th><th style={{ padding: "8px", fontWeight: 650 }}>Diện tích</th><th style={{ padding: "8px", fontWeight: 650 }}>Trạng thái</th><th style={{ padding: "8px", fontWeight: 650 }}>Xem vị trí</th>
              </tr></thead>
              <tbody>{filteredPlots.map((plot) => {
                const isSelected = plot.id === selectedId;
                return <tr key={plot.id} onClick={() => setSelectedId(plot.id)} style={{ borderBottom: "1px solid #F0F3EE", backgroundColor: isSelected ? "#F3F9F3" : "transparent", cursor: "pointer" }}>
                  <td style={{ padding: "12px 8px" }}><div style={{ fontWeight: 700, color: "#15251C", fontFamily: "monospace" }}>{plot.code}</div><div style={{ fontSize: "11px", color: "#68766C", marginTop: "2px" }}>{plot.name}</div></td>
                  <td style={{ padding: "12px 8px" }}>{plot.crop}</td><td style={{ padding: "12px 8px", fontWeight: 600 }}>{plot.areaHa.toLocaleString("vi-VN")} ha</td>
                  <td style={{ padding: "12px 8px" }}><span style={{ padding: "3px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, backgroundColor: plot.status === "Còn hiệu lực" ? "#E8F4EA" : "#FFF0EF", color: plot.status === "Còn hiệu lực" ? "#157347" : "#B54745", whiteSpace: "nowrap" }}>{plot.status}</span></td>
                  <td style={{ padding: "12px 8px" }}><button type="button" aria-label={`Xem vị trí của ${plot.code}`} onClick={(event) => { event.stopPropagation(); setSelectedId(plot.id); }} style={{ ...buttonBase, padding: "5px 9px", borderRadius: "6px", backgroundColor: isSelected ? "#0D4E35" : "#F6F8F4", color: isSelected ? "#FFFFFF" : "#23322B", border: "1px solid #DDE6DD", fontSize: "11px" }}><MapPin size={13} />{isSelected ? "Đang xem" : "Xem"}</button></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
          {filteredPlots.length === 0 && <p style={{ margin: "18px 0 0", padding: "16px", color: "#68766C", background: "#F8FAF8", borderRadius: "8px", fontSize: "13px" }}>Không tìm thấy vùng trồng phù hợp.</p>}

          <section aria-labelledby="selected-plot-title" style={{ marginTop: "20px", padding: "16px", backgroundColor: "#F6F8F4", borderRadius: "10px", border: "1px solid #E2E8DF" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h2 id="selected-plot-title" style={{ fontSize: "15px", fontWeight: 750, color: "#0A3827", margin: 0 }}>Thông tin vùng trồng</h2>
                <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#68766C" }}>{currentPlot.code} · Phiên bản {currentPlot.version}</p>
              </div>
              <span style={{ padding: "4px 8px", borderRadius: "999px", background: currentPlot.status === "Còn hiệu lực" ? "#E8F4EA" : "#FFF0EF", fontSize: "11px", color: currentPlot.status === "Còn hiệu lực" ? "#157347" : "#B54745", fontWeight: 700, whiteSpace: "nowrap" }}>{currentPlot.status}</span>
            </div>
            <div className="plantationDetailsGrid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: "20px", rowGap: "15px" }}>
              <div className="plantationQuickField"><small>Chủ vùng trồng / Người đại diện</small><strong>{farmerName}</strong>{farmerAccount && <span>Mã tài khoản: {farmerAccount}</span>}</div>
              <div className="plantationQuickField"><small>Khu vực</small><strong>{currentPlot.location}</strong></div>
              <div className="plantationQuickField"><small>Loại cây trồng</small><strong>{currentPlot.crop}</strong></div>
              <div className="plantationQuickField"><small>Diện tích</small><strong>{currentPlot.areaHa.toLocaleString("vi-VN")} ha</strong></div>
              <div className="plantationQuickField"><small>Thời hạn hiệu lực</small><strong>{currentPlot.validFrom} – {currentPlot.validTo}</strong></div>
              <div className="plantationQuickField"><small>Tài khoản được cấp quyền</small><strong>{currentPlot.authorizedCount} tài khoản</strong></div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: "8px", marginTop: "18px" }}>
              <button type="button" onClick={() => setDialog("details")} style={{ ...buttonBase, height: "36px", padding: "0 12px", color: "#0D4E35", background: "#FFFFFF", border: "1px solid #BFD7C5" }}><Eye size={15} />Xem chi tiết</button>
              <button type="button" onClick={openEdit} style={{ ...buttonBase, height: "36px", padding: "0 12px", color: "#FFFFFF", background: "#0D4E35", border: "1px solid #0D4E35" }}><Pencil size={15} />Chỉnh sửa</button>
            </div>
          </section>
        </section>

        <section aria-label="Bản đồ vùng trồng" style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8DF", padding: "16px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", fontWeight: 750, fontSize: "14px", color: "#0A3827" }}><MapPin size={16} color="#0D4E35" /><span>Ranh giới vùng trồng trên bản đồ</span></div>
          {currentPlot.polygon.length >= 3 ? <><div style={{ minHeight: "360px" }}><LeafletMap polygonCoordinates={currentPlot.polygon} polygonLabel={currentPlot.code} polygonDetails={`${currentPlot.areaHa.toLocaleString("vi-VN")} ha · ${currentPlot.crop}`} height="360px" zoom={16} /></div><div style={{ marginTop: "12px", padding: "10px 12px", borderRadius: "8px", background: "#F6F8F4", display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "center", gap: "10px", fontSize: "12px", color: "#435249" }}><span style={{ whiteSpace: "nowrap" }}><b>{currentPlot.code}</b> · {currentPlot.areaHa.toLocaleString("vi-VN")} ha</span><span title={currentPlot.location} style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>{currentPlot.location}</span></div><div style={{ marginTop: "10px", fontSize: "11px", lineHeight: 1.45, color: "#68766C", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}><ShieldCheck size={14} color="#169B52" style={{ flex: "none" }} /><span>Ranh giới vùng trồng đã được kiểm tra và ghi nhận hợp lệ trên hệ thống.</span></div></> : <div style={{ minHeight: "360px", display: "grid", placeItems: "center", padding: "24px", textAlign: "center", borderRadius: "10px", border: "1px dashed #B8C7BA", color: "#68766C", background: "#F8FAF8", fontSize: "13px" }}>Vùng trồng này chưa có dữ liệu ranh giới để hiển thị trên bản đồ.</div>}
        </section>
      </div>

      {dialog === "create" && <div role="dialog" aria-modal="true" aria-labelledby="create-plot-title" onClick={() => setDialog(null)} style={{ position: "fixed", inset: 0, zIndex: 2000, display: "grid", placeItems: "center", padding: "24px", background: "rgba(9, 34, 24, 0.48)" }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "min(100%, 700px)", maxHeight: "min(800px, calc(100vh - 48px))", overflowY: "auto", background: "#FFFFFF", borderRadius: "16px", padding: "24px", boxShadow: "0 22px 70px rgba(8, 35, 24, 0.26)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", marginBottom: "18px" }}>
            <div><h2 id="create-plot-title" style={{ margin: 0, fontSize: "20px", color: "#0A3827" }}>Thêm vùng trồng</h2><p style={{ margin: "5px 0 0", color: "#68766C", fontSize: "13px" }}>Nhập thông tin ban đầu để tạo mã số vùng trồng mới.</p></div>
            <button type="button" onClick={() => setDialog(null)} aria-label="Đóng" style={{ ...buttonBase, width: "34px", height: "34px", border: "1px solid #DDE6DD", background: "#FFFFFF", color: "#526159" }}><X size={18} /></button>
          </div>
          <form onSubmit={createPlot}>
            <div className="plantationCreateGrid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <label className="plantationField"><span>Mã số vùng trồng <span style={{ color: "#B54745" }}>*</span></span><input required value={createDraft.code} onChange={(event) => setCreateDraft((current) => ({ ...current, code: event.target.value }))} placeholder="Ví dụ: VN-DLK-PA-0002" style={formInput} /></label>
              <label className="plantationField"><span>Tên vùng trồng <span style={{ color: "#B54745" }}>*</span></span><input required value={createDraft.name} onChange={(event) => setCreateDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Ví dụ: Vườn Sầu Riêng Ea Yông 02" style={formInput} /></label>
              <label className="plantationField"><span>Loại cây trồng <span style={{ color: "#B54745" }}>*</span></span><input required value={createDraft.crop} onChange={(event) => setCreateDraft((current) => ({ ...current, crop: event.target.value }))} placeholder="Ví dụ: Sầu riêng (Ri6)" style={formInput} /></label>
              <label className="plantationField"><span>Diện tích (ha) <span style={{ color: "#B54745" }}>*</span></span><input required type="number" min="0.001" step="0.001" value={createDraft.areaHa || ""} onChange={(event) => setCreateDraft((current) => ({ ...current, areaHa: Number(event.target.value) }))} placeholder="Ví dụ: 2,5" style={formInput} /></label>
              <label className="plantationField" style={{ gridColumn: "1 / -1" }}><span>Vị trí địa lý <span style={{ color: "#B54745" }}>*</span></span><input required value={createDraft.location} onChange={(event) => setCreateDraft((current) => ({ ...current, location: event.target.value }))} placeholder="Ví dụ: Ea Yông, Krông Pắc, Đắk Lắk" style={formInput} /></label>
              <label className="plantationField" style={{ gridColumn: "1 / -1" }}><span>Chủ vùng trồng / Người đại diện <span style={{ color: "#B54745" }}>*</span></span><input required value={createDraft.farmer} onChange={(event) => setCreateDraft((current) => ({ ...current, farmer: event.target.value }))} placeholder="Họ và tên hoặc tổ chức đại diện" style={formInput} /></label>
              <label className="plantationField"><span>Hiệu lực từ <span style={{ color: "#B54745" }}>*</span></span><input required value={createDraft.validFrom} onChange={(event) => setCreateDraft((current) => ({ ...current, validFrom: event.target.value }))} placeholder="DD/MM/YYYY" style={formInput} /></label>
              <label className="plantationField"><span>Hiệu lực đến <span style={{ color: "#B54745" }}>*</span></span><input required value={createDraft.validTo} onChange={(event) => setCreateDraft((current) => ({ ...current, validTo: event.target.value }))} placeholder="DD/MM/YYYY" style={formInput} /></label>
              <label className="plantationField"><span>Số người được phép sử dụng <span style={{ color: "#B54745" }}>*</span></span><input required type="number" min="1" value={createDraft.authorizedCount} onChange={(event) => setCreateDraft((current) => ({ ...current, authorizedCount: Number(event.target.value) }))} style={formInput} /></label>
            </div>
            <p style={{ margin: "18px 0 0", padding: "11px 12px", borderRadius: "8px", background: "#F6F8F4", color: "#5A6A60", fontSize: "12px", lineHeight: 1.5 }}>Sau khi tạo, vùng trồng sẽ được thêm vào danh sách. Ranh giới trên bản đồ cần được cập nhật trong bước tiếp theo.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "22px" }}><button type="button" onClick={() => setDialog(null)} style={{ ...buttonBase, padding: "9px 13px", color: "#44554B", background: "#FFFFFF", border: "1px solid #CAD7CC" }}>Hủy</button><button type="submit" style={{ ...buttonBase, padding: "9px 13px", color: "#FFFFFF", background: "#0D4E35", border: "none" }}><Save size={16} />Tạo vùng trồng</button></div>
          </form>
        </div>
      </div>}

      {dialog !== "create" && dialog && <div role="dialog" aria-modal="true" aria-labelledby="plot-dialog-title" onClick={() => setDialog(null)} style={{ position: "fixed", inset: 0, zIndex: 2000, display: "grid", placeItems: "center", padding: "24px", background: "rgba(9, 34, 24, 0.48)" }}><div onClick={(e) => e.stopPropagation()} style={{ width: "min(100%, 620px)", maxHeight: "min(760px, calc(100vh - 48px))", overflowY: "auto", background: "#FFFFFF", borderRadius: "16px", padding: "24px", boxShadow: "0 22px 70px rgba(8, 35, 24, 0.26)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", marginBottom: "20px" }}><div><h2 id="plot-dialog-title" style={{ margin: 0, fontSize: "20px", color: "#0A3827" }}>{dialog === "edit" ? "Chỉnh sửa thông tin vùng trồng" : "Chi tiết vùng trồng"}</h2><p style={{ margin: "5px 0 0", color: "#68766C", fontSize: "13px" }}>{currentPlot.code} · Phiên bản {currentPlot.version}</p></div><button type="button" onClick={() => setDialog(null)} aria-label="Đóng" style={{ ...buttonBase, width: "34px", height: "34px", border: "1px solid #DDE6DD", background: "#FFFFFF", color: "#526159" }}><X size={18} /></button></div>
        {dialog === "details" ? <><div className="plantationModalGrid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", padding: "16px", border: "1px solid #E2E8DF", borderRadius: "10px", background: "#F8FAF8", fontSize: "13px" }}><div><small>Loại cây trồng</small><strong>{currentPlot.crop}</strong></div><div><small>Diện tích</small><strong>{currentPlot.areaHa.toLocaleString("vi-VN")} ha</strong></div><div><small>Chủ vùng trồng / Người đại diện</small><strong>{currentPlot.farmer}</strong></div><div><small>Thời hạn hiệu lực</small><strong>{currentPlot.validFrom} – {currentPlot.validTo}</strong></div><div><small>Người được phép sử dụng mã số</small><strong>{currentPlot.authorizedCount} tài khoản</strong></div><div><small>Trạng thái</small><strong style={{ color: currentPlot.status === "Còn hiệu lực" ? "#157347" : "#B54745" }}>{currentPlot.status}</strong></div></div>
          <section style={{ marginTop: "20px" }}><h3 style={{ margin: "0 0 10px", display: "flex", alignItems: "center", gap: "7px", fontSize: "15px", color: "#0A3827" }}><Users size={17} />Người được phép sử dụng mã số</h3><p style={{ margin: 0, padding: "12px", borderRadius: "8px", background: "#F6F8F4", color: "#55665C", fontSize: "13px" }}>Đang có {currentPlot.authorizedCount} tài khoản được phân quyền sử dụng mã số vùng trồng này.</p></section>
          <section style={{ marginTop: "18px" }}><h3 style={{ margin: "0 0 10px", display: "flex", alignItems: "center", gap: "7px", fontSize: "15px", color: "#0A3827" }}><History size={17} />Lịch sử thay đổi</h3><div style={{ borderLeft: "2px solid #B9D7C2", paddingLeft: "12px", color: "#55665C", fontSize: "13px", lineHeight: 1.5 }}><b>Phiên bản {currentPlot.version}</b> · Thông tin đang áp dụng cho các xác minh mới.<br />Phiên bản trước vẫn được lưu giữ để đối chiếu các lô hàng đã xác minh.</div></section>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}><button type="button" onClick={openEdit} style={{ ...buttonBase, padding: "9px 13px", background: "#0D4E35", color: "#FFFFFF", border: "none" }}><Pencil size={16} />Chỉnh sửa thông tin</button></div></> : <form onSubmit={saveNewVersion}><p style={{ margin: "0 0 16px", padding: "12px", color: "#1B5E3E", background: "#EAF5ED", borderRadius: "8px", fontSize: "13px", lineHeight: 1.5 }}>Các điều chỉnh sẽ được lưu thành phiên bản mới. Dữ liệu đã dùng để xác minh các lô hàng trước đó không bị ghi đè.</p><label style={{ display: "grid", gap: "6px", marginBottom: "14px", color: "#34443A", fontSize: "13px", fontWeight: 650 }}>Chủ vùng trồng / Người đại diện<input value={draft.farmer} onChange={(event) => setDraft((current) => ({ ...current, farmer: event.target.value }))} style={{ padding: "9px 10px", borderRadius: "7px", border: "1px solid #CAD7CC", font: "inherit", fontWeight: 400 }} /></label><div className="plantationModalGrid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}><label style={{ display: "grid", gap: "6px", color: "#34443A", fontSize: "13px", fontWeight: 650 }}>Thời hạn hiệu lực đến<input value={draft.validTo} onChange={(event) => setDraft((current) => ({ ...current, validTo: event.target.value }))} placeholder="DD/MM/YYYY" style={{ padding: "9px 10px", borderRadius: "7px", border: "1px solid #CAD7CC", font: "inherit", fontWeight: 400 }} /></label><label style={{ display: "grid", gap: "6px", color: "#34443A", fontSize: "13px", fontWeight: 650 }}>Số người được phép sử dụng<input type="number" min="0" value={draft.authorizedCount} onChange={(event) => setDraft((current) => ({ ...current, authorizedCount: Number(event.target.value) }))} style={{ padding: "9px 10px", borderRadius: "7px", border: "1px solid #CAD7CC", font: "inherit", fontWeight: 400 }} /></label></div><div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "24px" }}><button type="button" onClick={() => setDialog(null)} style={{ ...buttonBase, padding: "9px 13px", color: "#44554B", background: "#FFFFFF", border: "1px solid #CAD7CC" }}>Hủy</button><button type="submit" style={{ ...buttonBase, padding: "9px 13px", color: "#FFFFFF", background: "#0D4E35", border: "none" }}><Save size={16} />Lưu phiên bản mới</button></div></form>}
      </div></div>}
      <style jsx>{`
        .srOnly { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
        .plantationDetailsGrid b, .plantationModalGrid small { color: #68766c; font-weight: 650; }
        .plantationQuickField { display: grid; gap: 3px; min-width: 0; }
        .plantationQuickField small { color: #68766c; font-size: 11px; font-weight: 650; }
        .plantationQuickField strong { color: #193427; font-size: 13px; line-height: 1.35; }
        .plantationQuickField span { color: #68766c; font-size: 11px; line-height: 1.35; }
        .plantationModalGrid small { display: block; font-size: 11px; margin-bottom: 3px; }
        .plantationModalGrid strong { color: #193427; display: block; line-height: 1.4; }
        .plantationField { display: grid; gap: 6px; color: #34443a; font-size: 13px; font-weight: 650; }
        .plantationsTable th:not(:first-child), .plantationsTable td:not(:first-child) { text-align: center; }
        @media (max-width: 900px) { .plantationsGrid { grid-template-columns: minmax(0, 1fr) !important; } }
        @media (max-width: 700px) { .plantationsHeaderActions { flex-wrap: wrap !important; } }
        @media (max-width: 560px) { .plantationDetailsGrid, .plantationModalGrid, .plantationCreateGrid { grid-template-columns: minmax(0, 1fr) !important; } .plantationCreateGrid .plantationField { grid-column: auto !important; } }
      `}</style>
    </div>
  );
}
