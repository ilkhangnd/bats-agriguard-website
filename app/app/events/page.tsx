"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, ChevronUp, Clock, Download, Filter, MapPin, Search, ShieldCheck, XCircle } from "lucide-react";

type Activity = "harvesting" | "collecting" | "shipping" | "receiving" | "packing";
type EvidenceStatus = "Đã lưu bằng chứng" | "Chờ kiểm tra" | "Không đạt yêu cầu";
type CheckStatus = "Đạt yêu cầu" | "Cần kiểm tra lại" | "Không đạt yêu cầu";
type TimeFilter = "all" | "day" | "week" | "month";

type SupplyEvent = {
  id: string; batchId: string; activity: Activity; eventTime: string; timeFilter: Exclude<TimeFilter, "all">;
  actorName: string; actorRole: string; location: string; coordinates: string;
  checkStatus: CheckStatus; evidenceStatus: EvidenceStatus; evidenceNote: string; hash: string; anchorBlock?: number;
};

const activityLabels: Record<Activity, string> = { harvesting: "Thu hoạch", collecting: "Thu mua", shipping: "Vận chuyển", receiving: "Tiếp nhận", packing: "Đóng gói" };
const evidenceStyle: Record<EvidenceStatus, { background: string; color: string; icon: typeof CheckCircle2 }> = {
  "Đã lưu bằng chứng": { background: "#E8F4EA", color: "#157347", icon: CheckCircle2 },
  "Chờ kiểm tra": { background: "#FFF6E6", color: "#A76B10", icon: Clock },
  "Không đạt yêu cầu": { background: "#FFF0EF", color: "#B54745", icon: XCircle }
};
const checkColor: Record<CheckStatus, string> = { "Đạt yêu cầu": "#157347", "Cần kiểm tra lại": "#A76B10", "Không đạt yêu cầu": "#B54745" };

const SAMPLE_EVENTS: SupplyEvent[] = [
  { id: "EVT-2026-0721-001", batchId: "BATS-2026-0001", activity: "harvesting", eventTime: "21/07/2026 06:15 (GMT+7)", timeFilter: "day", actorName: "Y Blôk Niê", actorRole: "Nông hộ", location: "Vùng trồng Ea Yông", coordinates: "12.6789, 108.1234", checkStatus: "Đạt yêu cầu", evidenceStatus: "Đã lưu bằng chứng", evidenceNote: "Đã ghi nhận bằng chứng tại khối #1842", anchorBlock: 1842, hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
  { id: "EVT-2026-0721-002", batchId: "BATS-2026-0001", activity: "collecting", eventTime: "21/07/2026 08:30 (GMT+7)", timeFilter: "day", actorName: "Vựa thu mua Tây Nguyên", actorRole: "Đơn vị thu mua", location: "Trạm thu mua Krông Pắc", coordinates: "12.6800, 108.1250", checkStatus: "Đạt yêu cầu", evidenceStatus: "Đã lưu bằng chứng", evidenceNote: "Đã ghi nhận bằng chứng tại khối #1845", anchorBlock: 1845, hash: "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945" },
  { id: "EVT-2026-0720-003", batchId: "BATS-2026-0002", activity: "harvesting", eventTime: "20/07/2026 07:00 (GMT+7)", timeFilter: "week", actorName: "Nguyễn Văn B", actorRole: "Nông hộ liên kết", location: "Vùng trồng Ea Yông", coordinates: "12.6845, 108.1310", checkStatus: "Cần kiểm tra lại", evidenceStatus: "Chờ kiểm tra", evidenceNote: "Đang chờ người phụ trách đánh giá", hash: "9a6e9a0f3d61b36952e42ef99e09d1b64d4b1a415ff672c2195f082e668a623f" },
  { id: "EVT-2026-0719-004", batchId: "BATS-2026-0003", activity: "harvesting", eventTime: "19/07/2026 05:45 (GMT+7)", timeFilter: "month", actorName: "Đối tượng chưa xác thực", actorRole: "Chưa xác định", location: "Vùng trồng Ea Yông", coordinates: "12.8500, 108.3200", checkStatus: "Không đạt yêu cầu", evidenceStatus: "Không đạt yêu cầu", evidenceNote: "Không vượt qua quy tắc kiểm tra vị trí", hash: "1b4f0e985197199f49ee08d5af7b2e14420a26e1766f62ecd10ed67716449229" }
];

const selectStyle: React.CSSProperties = { padding: "9px 14px", borderRadius: "8px", border: "1px solid #D9E3DA", background: "#FFFFFF", color: "#34443A", font: "inherit", fontSize: "13px", fontWeight: 650, cursor: "pointer" };

export default function EventsLedgerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<"all" | Activity>("all");
  const [selectedEvidence, setSelectedEvidence] = useState<"all" | EvidenceStatus>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase("vi-VN");
    return SAMPLE_EVENTS.filter((event) => {
      const matchesSearch = !term || [event.id, event.batchId, event.actorName].join(" ").toLocaleLowerCase("vi-VN").includes(term);
      const matchesActivity = selectedActivity === "all" || event.activity === selectedActivity;
      const matchesEvidence = selectedEvidence === "all" || event.evidenceStatus === selectedEvidence;
      const matchesTime = timeFilter === "all" || timeFilter === "month" || (timeFilter === "week" && (event.timeFilter === "day" || event.timeFilter === "week")) || (timeFilter === "day" && event.timeFilter === "day");
      return matchesSearch && matchesActivity && matchesEvidence && matchesTime;
    });
  }, [searchTerm, selectedActivity, selectedEvidence, timeFilter]);

  const eventStats = useMemo(() => {
    const total = SAMPLE_EVENTS.length;
    const evidenceSaved = SAMPLE_EVENTS.filter((event) => event.evidenceStatus === "Đã lưu bằng chứng");
    const needsReview = SAMPLE_EVENTS.filter((event) => event.checkStatus === "Cần kiểm tra lại");
    const failed = SAMPLE_EVENTS.filter((event) => event.checkStatus === "Không đạt yêu cầu");
    const evidenceRate = total ? Math.round((evidenceSaved.length / total) * 100) : 0;

    return [
      { label: "Tổng sự kiện đã ghi nhận", value: total.toLocaleString("vi-VN"), note: "Dữ liệu sự kiện trong hệ thống", color: "#1B2A21" },
      { label: "Tỷ lệ lưu bằng chứng thành công", value: `${evidenceRate}%`, note: evidenceSaved[0] ? `Áp dụng cho lô ${evidenceSaved[0].batchId}` : "Chưa có sự kiện lưu bằng chứng", color: "#157347" },
      { label: "Sự kiện cần kiểm tra lại", value: String(needsReview.length), note: needsReview[0] ? `Lô ${needsReview[0].batchId} đang chờ đánh giá` : "Không có lô đang chờ đánh giá", color: "#A76B10" },
      { label: "Sự kiện không đạt yêu cầu", value: String(failed.length), note: failed[0] ? `Lô ${failed[0].batchId} cần được xử lý` : "Không có lô cần xử lý", color: "#B54745" }
    ];
  }, []);

  function exportEvents() {
    const file = new Blob([JSON.stringify(SAMPLE_EVENTS, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "du-lieu-su-kien-bats.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
    <header style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "25px", fontWeight: 800, textTransform: "uppercase", color: "#1B2A21", margin: "0 0 6px" }}>Nhật ký hoạt động chuỗi cung ứng</h1>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <p style={{ flex: "1 1 680px", alignSelf: "flex-start", color: "#455449", fontSize: "14px", lineHeight: 1.55, margin: 0 }}>Theo dõi toàn bộ hoạt động thu hoạch, thu mua, vận chuyển và bàn giao nông sản.<br />Mỗi sự kiện được ghi nhận, kiểm tra và lưu giữ bằng chứng để dễ dàng tra cứu, đối chiếu</p>
        <button type="button" onClick={exportEvents} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 14px", borderRadius: "8px", border: "1px solid #165D40", backgroundColor: "#FFFFFF", color: "#165D40", fontFamily: "inherit", fontSize: "13px", fontWeight: 650, cursor: "pointer", whiteSpace: "nowrap" }}><Download size={15} />Xuất dữ liệu sự kiện</button>
      </div>
    </header>

    <section aria-label="Tổng quan sự kiện" className="eventStats" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "16px", marginBottom: "24px" }}>
      {eventStats.map((stat) => <article key={stat.label} style={{ padding: "16px", borderRadius: "10px", backgroundColor: "#FFFFFF", border: "1px solid #E2E8DF", textAlign: "center" }}><div style={{ minHeight: "31px", fontSize: "14px", lineHeight: 1.35, color: "#68766C", fontWeight: 600 }}>{stat.label}</div><div style={{ fontSize: "26px", fontWeight: 750, color: stat.color, marginTop: "4px" }}>{stat.value}</div><div style={{ fontSize: "12px", lineHeight: 1.4, color: "#68766C", marginTop: "5px" }}>{stat.note}</div></article>)}
    </section>

    <section aria-label="Bộ lọc sự kiện" style={{ padding: "16px", borderRadius: "10px", backgroundColor: "#FFFFFF", border: "1px solid #E2E8DF", marginBottom: "20px" }}>
      <div style={{ position: "relative", marginBottom: "12px" }}><Search size={17} color="#68766C" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} /><label htmlFor="event-search" className="srOnly">Tìm sự kiện</label><input id="event-search" type="search" placeholder="Tìm theo mã sự kiện, mã lô hàng hoặc người thực hiện..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} style={{ width: "100%", padding: "10px 12px 10px 39px", boxSizing: "border-box", borderRadius: "7px", border: "1px solid #D9E3DA", font: "inherit", fontSize: "13px", outline: "none" }} /></div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <Filter size={15} color="#68766C" />
        <select aria-label="Loại hoạt động" value={selectedActivity} onChange={(event) => setSelectedActivity(event.target.value as "all" | Activity)} style={selectStyle}><option value="all">Tất cả hoạt động</option>{(Object.keys(activityLabels) as Activity[]).map((activity) => <option key={activity} value={activity}>{activityLabels[activity]}</option>)}</select>
        <select aria-label="Trạng thái lưu bằng chứng" value={selectedEvidence} onChange={(event) => setSelectedEvidence(event.target.value as "all" | EvidenceStatus)} style={selectStyle}><option value="all">Tất cả trạng thái</option><option value="Đã lưu bằng chứng">Đã lưu bằng chứng</option><option value="Chờ kiểm tra">Chờ kiểm tra</option><option value="Không đạt yêu cầu">Không đạt yêu cầu</option></select>
        <select aria-label="Thời gian" value={timeFilter} onChange={(event) => setTimeFilter(event.target.value as TimeFilter)} style={selectStyle}><option value="all">Tất cả thời gian</option><option value="day">Ngày 21/07/2026</option><option value="week">7 ngày gần đây</option><option value="month">30 ngày gần đây</option></select>
        <span style={{ marginLeft: "auto", color: "#68766C", fontSize: "12px", whiteSpace: "nowrap" }}>Hiển thị <b>{filteredEvents.length}</b> / {SAMPLE_EVENTS.length} sự kiện</span>
      </div>
    </section>

    <section aria-label="Danh sách sự kiện" style={{ borderRadius: "10px", backgroundColor: "#FFFFFF", border: "1px solid #E2E8DF", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}><table className="eventsTable" style={{ width: "100%", minWidth: "1080px", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead><tr style={{ backgroundColor: "#F7F9F6", borderBottom: "1px solid #E2E8DF", color: "#455449", fontWeight: 650 }}><th>Mã sự kiện / Thời gian</th><th>Mã lô hàng</th><th>Loại hoạt động</th><th>Người thực hiện</th><th>Địa điểm ghi nhận</th><th>Trạng thái lưu bằng chứng</th><th>Chi tiết</th></tr></thead>
        <tbody>{filteredEvents.map((event) => {
          const isExpanded = expandedEventId === event.id;
          const status = evidenceStyle[event.evidenceStatus];
          const StatusIcon = status.icon;
          return <React.Fragment key={event.id}>
            <tr onClick={() => setExpandedEventId(isExpanded ? null : event.id)} style={{ borderBottom: "1px solid #E2E8DF", cursor: "pointer", backgroundColor: isExpanded ? "#F9FAF8" : "transparent" }}>
              <td><strong>{event.id}</strong><span className="eventSub"><Clock size={11} />{event.eventTime}</span></td>
              <td><Link href={`/app/batches/${event.batchId}`} onClick={(click) => click.stopPropagation()} style={{ color: "#165D40", fontWeight: 700, textDecoration: "none" }}>{event.batchId}</Link></td>
              <td><span style={{ display: "inline-flex", padding: "4px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, color: "#0D4E35", background: "#E8F4EA" }}>{activityLabels[event.activity]}</span></td>
              <td><div>{event.actorName}</div><span className="eventSub">{event.actorRole}</span></td>
              <td><div className="eventLocation" style={{ display: "flex", alignItems: "center", gap: "5px" }}><MapPin size={13} color="#68766C" />{event.location}</div><span className="eventSub">Tọa độ: {event.coordinates}</span></td>
              <td><span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, color: status.color, background: status.background, whiteSpace: "nowrap" }}><StatusIcon size={13} />{event.evidenceStatus}</span></td>
              <td style={{ textAlign: "center" }}>{isExpanded ? <ChevronUp size={17} color="#68766C" /> : <ChevronDown size={17} color="#68766C" />}</td>
            </tr>
            {isExpanded && <tr style={{ background: "#F7F9F6", borderBottom: "1px solid #E2E8DF" }}><td colSpan={7} style={{ padding: "16px" }}><div className="eventDetailsGrid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" }}>
              <div className="eventDetailCard"><span className="eventDetailIcon"><ShieldCheck size={18} color={checkColor[event.checkStatus]} /></span><small>Kết quả kiểm tra</small><strong style={{ color: checkColor[event.checkStatus] }}>{event.checkStatus}</strong></div>
              <div className="eventDetailCard"><span className="eventDetailIcon"><StatusIcon size={18} color={status.color} /></span><small>Tình trạng lưu bằng chứng</small><strong style={{ color: status.color }}>{event.evidenceStatus}</strong><span>{event.evidenceNote}</span></div>
              <div className="eventDetailCard"><span className="eventDetailIcon"><CheckCircle2 size={18} color="#165D40" /></span><small>Thông tin xác minh tính toàn vẹn</small><strong>{event.anchorBlock ? `Đã ghi nhận tại khối #${event.anchorBlock}` : "Chưa có khối lưu bằng chứng"}</strong><span>Mã băm: {event.hash.slice(0, 16)}…</span></div>
            </div></td></tr>}
          </React.Fragment>;
        })}</tbody>
      </table></div>
      {filteredEvents.length === 0 && <p style={{ padding: "24px", margin: 0, color: "#68766C", textAlign: "center", fontSize: "13px" }}>Không tìm thấy sự kiện phù hợp với điều kiện đã chọn.</p>}
    </section>

    <style jsx>{`
      .srOnly { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
      .eventsTable th { padding: 12px 14px; text-align: left; font-size: 11px; letter-spacing: .03em; text-transform: uppercase; }
      .eventsTable td { padding: 14px; color: #1b2a21; vertical-align: middle; text-align: center; }
      .eventSub, .eventLocation { justify-content: center; }
      .eventSub { display: flex; align-items: center; gap: 4px; margin-top: 3px; color: #68766c; font-size: 11px; line-height: 1.35; }
      .eventDetailCard { box-sizing: border-box; min-height: 158px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 16px; border: 1px solid #dfe8e0; border-radius: 12px; background: #ffffff; color: #455449; text-align: center; }
      .eventDetailIcon { width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 3px; border-radius: 999px; background: #f1f8f2; }
      .eventDetailCard small { color: #68766c; font-size: 12px; font-weight: 650; line-height: 1.35; }
      .eventDetailCard strong { font-size: 15px; line-height: 1.35; font-weight: 750; }
      .eventDetailCard > span:not(.eventDetailIcon) { max-width: 100%; color: #68766c; font-size: 12px; line-height: 1.4; overflow-wrap: anywhere; }
      @media (max-width: 900px) { .eventStats, .eventDetailsGrid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; } }
      @media (max-width: 560px) { .eventStats, .eventDetailsGrid { grid-template-columns: minmax(0, 1fr) !important; } }
    `}</style>
  </div>;
}
