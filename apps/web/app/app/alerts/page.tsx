"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clipboard, Clock3, FileText, Paperclip, Search, ShieldAlert, Upload, UserRound } from "lucide-react";

import {
  type AlertCase,
  type CaseStatus,
  type Severity,
  ALERTS_CHANGE_EVENT,
  INITIAL_CASES,
  getStoredAlerts,
  saveStoredAlerts
} from "./alertsStore";

const severityMeta: Record<Severity, { label: string; color: string; background: string; border: string }> = { WARNING: { label: "Cần xem xét", color: "#895A08", background: "#FFF6E6", border: "#F0CB80" }, CRITICAL: { label: "Nghiêm trọng", color: "#A13532", background: "#FFF0EF", border: "#EAB8B4" } };
const statusLabel: Record<CaseStatus, string> = { OPEN: "Chưa xử lý", RESOLVED: "Đã xử lý" };

export default function AlertsPage() {
  const [cases, setCases] = useState<AlertCase[]>(INITIAL_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState(INITIAL_CASES[0].id);
  const [severityFilter, setSeverityFilter] = useState<"ALL" | Severity>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CaseStatus>("OPEN");
  const [timeFilter, setTimeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [decision, setDecision] = useState("APPROVE_TOLERANCE");
  const [note, setNote] = useState("");
  const [attachedEvidence, setAttachedEvidence] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  React.useEffect(() => {
    setCases(getStoredAlerts());
    const onAlertsChange = () => {
      setCases(getStoredAlerts());
    };
    window.addEventListener(ALERTS_CHANGE_EVENT, onAlertsChange);
    window.addEventListener("storage", onAlertsChange);
    return () => {
      window.removeEventListener(ALERTS_CHANGE_EVENT, onAlertsChange);
      window.removeEventListener("storage", onAlertsChange);
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("vi-VN");
    return cases.filter((item) => (severityFilter === "ALL" || item.severity === severityFilter) && (statusFilter === "ALL" || item.status === statusFilter) && (timeFilter === "ALL" || item.openedAt.includes("30/03/2026")) && (!term || [item.id, item.batchId, item.title].join(" ").toLocaleLowerCase("vi-VN").includes(term)));
  }, [cases, severityFilter, statusFilter, timeFilter, search]);

  const current = cases.find((item) => item.id === selectedCaseId) ?? filtered[0] ?? cases[0];
  const isMass = current.rule === "M";
  const meta = severityMeta[current.severity];

  const chooseCase = (id: string) => {
    const item = cases.find((caseItem) => caseItem.id === id);
    setSelectedCaseId(id);
    setDecision(item?.rule === "S" ? "REQUEST_EVIDENCE" : "APPROVE_TOLERANCE");
    setNote("");
    setAttachedEvidence([]);
    setFeedback(null);
  };

  const saveDecision = () => {
    if (current.status === "RESOLVED") return;
    if (!note.trim()) return setFeedback("Vui lòng nêu lý do và bằng chứng xác minh trước khi lưu kết quả xử lý.");
    const decisionText = decision === "APPROVE_TOLERANCE" ? "Chấp thuận chênh lệch có căn cứ" : decision === "REQUEST_EVIDENCE" ? "Yêu cầu bổ sung bằng chứng" : "Không chấp thuận và chuyển xử lý";
    const nextStatus: CaseStatus = decision === "REQUEST_EVIDENCE" ? "OPEN" : "RESOLVED";
    const updated = cases.map((item) => item.id === current.id ? {
      ...item,
      status: nextStatus,
      evidence: [...item.evidence, ...attachedEvidence],
      history: [...item.history, `30/03/2026 · 10:30 — Nguyễn Thị Lan: ${decisionText}. ${note.trim()}`]
    } : item);
    setCases(updated);
    saveStoredAlerts(updated);
    setFeedback(decision === "REQUEST_EVIDENCE" ? "Đã gửi yêu cầu bổ sung bằng chứng. Cảnh báo vẫn ở trạng thái chưa xử lý." : "Đã lưu kết quả xử lý, người xử lý, thời gian và căn cứ xác minh vào lịch sử cảnh báo.");
  };

  const copySummary = async () => {
    const summary = `${current.id} — ${current.title}\nLô hàng: ${current.batchId}\nHướng xử lý: ${decision}\nLý do: ${note || "Chưa nhập"}`;
    try {
      await navigator.clipboard.writeText(summary);
      setFeedback("Đã sao chép nội dung kết quả xử lý.");
    } catch {
      setFeedback("Không thể sao chép tự động. Vui lòng chọn và sao chép nội dung thủ công.");
    }
  };
  return <div className="alertsPage" style={{ maxWidth: "1200px", margin: "0 auto" }}>
    <header><h1>Cảnh báo &amp; Kiểm tra lại</h1><p>Theo dõi và xử lý các trường hợp bất thường được hệ thống phát hiện, đối chiếu thông tin, bổ sung bằng chứng và ghi nhận kết quả xử lý để đảm bảo tính minh bạch.</p></header>
    <main className="alertsLayout"><aside className="caseList"><div className="listHeader"><h2>Danh sách cảnh báo cần xử lý</h2><span>{filtered.length}</span></div><div className="filterGrid"><label><span>Mức độ</span><select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value as "ALL" | Severity)}><option value="ALL">Tất cả mức độ</option><option value="WARNING">Cần xem xét</option><option value="CRITICAL">Nghiêm trọng</option></select></label><label><span>Trạng thái</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "ALL" | CaseStatus)}><option value="ALL">Tất cả trạng thái</option><option value="OPEN">Chưa xử lý</option><option value="RESOLVED">Đã xử lý</option></select></label><label><span>Thời gian</span><select value={timeFilter} onChange={(event) => setTimeFilter(event.target.value)}><option value="ALL">Tất cả thời gian</option><option value="TODAY">Hôm nay</option></select></label></div><label className="caseSearch"><Search size={16} aria-hidden="true" /><span className="srOnly">Tìm cảnh báo</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã cảnh báo hoặc lô hàng" /></label><div className="caseItems">{filtered.length ? filtered.map((item) => <button key={item.id} type="button" onClick={() => chooseCase(item.id)} className={`caseItem ${item.id === current.id ? "selected" : ""}`}><div><span className={`severity ${item.severity.toLowerCase()}`}>{item.severity === "WARNING" ? "Cảnh báo khối lượng" : "Cảnh báo nghiêm trọng · Hiệu lực mã số"}</span><span className={`caseStatus ${item.status.toLowerCase()}`}>{statusLabel[item.status]}</span></div><strong>{item.title}</strong><span className="caseBatch">{item.id} · {item.batchId}</span><span className="caseTime"><Clock3 size={13} aria-hidden="true" />{item.openedAt}</span></button>) : <p className="emptyList">Không có cảnh báo phù hợp với bộ lọc.</p>}</div></aside>
    <section className="caseDetail" aria-live="polite"><div className="detailHeader"><div><span>Mã cảnh báo · {current.id}</span><h2>{current.title}</h2><Link href={`/app/batches/${current.batchId}`}>{current.batchId}</Link></div><div className="detailBadges"><span style={{ color: meta.color, background: meta.background, borderColor: meta.border }}>{meta.label}</span><span className={current.status === "RESOLVED" ? "resolved" : "open"}>{statusLabel[current.status]}</span></div></div><section className="automaticResult"><h3><ShieldAlert size={18} aria-hidden="true" />Kết quả kiểm tra tự động</h3><p>{current.explanation}</p></section>{current.rule === "M" ? <MassComparison /> : current.rule === "S" ? <StatusComparison /> : <DuplicateComparison />}
      <details className="technicalDetails"><summary>Xem dữ liệu kỹ thuật <Chevron /></summary><pre>{current.technicalData}</pre></details>
      <section className="evidenceSection"><div><h3><FileText size={17} aria-hidden="true" />Bằng chứng liên quan</h3><p>Xem các chứng từ hiện có hoặc đính kèm tài liệu xác minh mới.</p></div><ul>{[...current.evidence, ...attachedEvidence].map((file) => <li key={file}><FileText size={14} aria-hidden="true" />{file}</li>)}</ul><label className="uploadEvidence"><Upload size={16} aria-hidden="true" />Đính kèm bằng chứng<input type="file" multiple accept="image/*,.pdf" disabled={current.status === "RESOLVED"} onChange={(event) => event.target.files && setAttachedEvidence(Array.from(event.target.files).map((file) => file.name))} /></label></section>
      <section className="resolution"><div className="resolutionHeading"><div><h3>Kết quả xem xét &amp; xử lý</h3><p>Quyết định sẽ được lưu cùng người xử lý, thời gian, lý do và bằng chứng; không làm thay đổi kết quả kiểm tra ban đầu.</p></div>{current.status === "RESOLVED" && <span><CheckCircle2 size={15} aria-hidden="true" />Đã lưu kết quả</span>}</div><label><span>Hướng xử lý</span><select value={decision} onChange={(event) => setDecision(event.target.value)} disabled={current.status === "RESOLVED"}>{isMass ? <><option value="APPROVE_TOLERANCE">Chấp thuận chênh lệch có căn cứ</option><option value="REQUEST_EVIDENCE">Yêu cầu bổ sung bằng chứng</option><option value="REJECT_ESCALATE">Không chấp thuận và chuyển xử lý</option></> : <><option value="REQUEST_EVIDENCE">Yêu cầu bổ sung bằng chứng</option><option value="REJECT_ESCALATE">Không chấp thuận và chuyển xử lý</option></>}</select></label><label><span>Lý do và bằng chứng xác minh <em>*</em></span><textarea rows={4} value={note} onChange={(event) => setNote(event.target.value)} disabled={current.status === "RESOLVED"} placeholder="Nêu thông tin đã đối chiếu, căn cứ quyết định và bằng chứng liên quan..." /></label><div className="resolutionActions"><button type="button" className="copyButton" onClick={copySummary}><Clipboard size={16} aria-hidden="true" />Sao chép kết quả xử lý</button><button type="button" className="saveButton" onClick={saveDecision} disabled={current.status === "RESOLVED"}><CheckCircle2 size={16} aria-hidden="true" />{current.status === "RESOLVED" ? "Đã lưu kết quả xử lý" : "Lưu kết quả xử lý"}</button></div>{feedback && <p className="feedback" role="status"><CheckCircle2 size={16} aria-hidden="true" />{feedback}</p>}</section>
      <section className="history"><h3><Clock3 size={17} aria-hidden="true" />Lịch sử xử lý</h3>{current.history.map((event) => <p key={event}><UserRound size={14} aria-hidden="true" />{event}</p>)}</section>
    </section></main><style jsx>{`
      header h1{font-size:25px!important;font-weight:800!important;text-transform:uppercase;margin-bottom:6px!important}
      header{margin-bottom:24px!important}
      header>p,header>p::before,header>p::after{padding-left:0!important;text-indent:0!important}
      header>p{margin:0!important;font-size:0!important}header>p::before,header>p::after{display:block;font-size:14px!important}header>p::before{content:"Theo dõi và xử lý các trường hợp bất thường được hệ thống phát hiện,"}header>p::after{content:"đối chiếu thông tin, bổ sung bằng chứng và ghi nhận kết quả xử lý để đảm bảo tính minh bạch."}
      header{margin-bottom:20px}header h1{margin:0;color:#0A3827;font-size:24px;font-weight:750}header>p{max-width:770px;margin:8px 0 0;color:#59695F;font-size:14px;line-height:1.55}.alertsLayout{display:grid;grid-template-columns:minmax(290px,.9fr) minmax(0,1.5fr);gap:20px;align-items:start}.caseList,.caseDetail{border:1px solid #E2E8DF;border-radius:12px;background:#fff}.caseList{padding:16px}.listHeader{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.listHeader h2{margin:0;color:#0A3827;font-size:14px}.listHeader>span{display:grid;place-items:center;min-width:23px;height:23px;border-radius:999px;background:#E8F4EA;color:#116B3C;font-size:12px;font-weight:700}.filterGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.filterGrid label:last-child{grid-column:span 2}.filterGrid label,.resolution label{display:grid;gap:5px;color:#526159;font-size:11px;font-weight:700}.filterGrid select,.resolution select,.resolution textarea{width:100%;min-height:36px;box-sizing:border-box;border:1px solid #CDDACF;border-radius:7px;background:#fff;color:#294235;font:inherit;font-size:12px}.filterGrid select,.resolution select{padding:6px 8px}.caseSearch{position:relative;display:block;margin:10px 0}.caseSearch svg{position:absolute;left:9px;top:50%;transform:translateY(-50%);color:#68766C}.caseSearch input{width:100%;min-height:38px;box-sizing:border-box;padding:8px 10px 8px 31px;border:1px solid #CDDACF;border-radius:7px;font-size:12px}.caseItems{display:grid;gap:9px}.caseItem{width:100%;padding:12px;border:1px solid #E2E8DF;border-radius:8px;background:#fff;text-align:left;cursor:pointer}.caseItem.selected{border-color:#1B6B45;background:#F3F9F3;box-shadow:0 0 0 1px #1B6B45}.caseItem>div{display:flex;justify-content:space-between;gap:6px;margin-bottom:7px}.severity,.caseStatus{padding:3px 6px;border-radius:999px;font-size:10px;font-weight:750}.severity.warning{background:#FFF6E6;color:#895A08}.severity.critical{background:#FFF0EF;color:#A13532}.caseStatus.open{background:#F1F4F1;color:#526159}.caseStatus.resolved{background:#E8F4EA;color:#116B3C}.caseItem strong{display:block;color:#263C2E;font-size:13px;line-height:1.4}.caseBatch{display:block;margin-top:5px;color:#526159;font-family:ui-monospace,monospace;font-size:10px}.caseTime{display:flex;align-items:center;gap:4px;margin-top:6px;color:#75837A;font-size:10px}.emptyList{margin:20px 0;color:#68766C;font-size:12px;text-align:center}.caseDetail{padding:20px}.detailHeader{display:flex;justify-content:space-between;gap:16px;margin-bottom:16px}.detailHeader>div:first-child>span{color:#637269;font-size:11px;font-weight:700}.detailHeader h2{margin:4px 0;color:#1A3325;font-size:18px;line-height:1.3}.detailHeader a{color:#165D40;font-family:ui-monospace,monospace;font-size:12px;font-weight:700;text-decoration:none}.detailBadges{display:flex;flex-wrap:wrap;justify-content:flex-end;align-content:flex-start;gap:6px}.detailBadges span{padding:4px 8px;border:1px solid;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap}.detailBadges .open{border-color:#DCE5DC;background:#F3F6F3;color:#405247}.detailBadges .resolved{border-color:#B9DFC2;background:#E8F4EA;color:#116B3C}.automaticResult{padding:13px 14px;border:1px solid #E2E8DF;border-radius:9px;background:#F8FAF7}.automaticResult h3,.evidenceSection h3,.resolution h3,.history h3{display:flex;align-items:center;gap:7px;margin:0;color:#254533;font-size:14px}.automaticResult p{margin:7px 0 0;color:#45574B;font-size:13px;line-height:1.5}.comparison{margin-top:16px;border:1px solid #E2E8DF;border-radius:10px;overflow:hidden}.comparisonHeader{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 14px;border-bottom:1px solid #E2E8DF;background:#FCFDFB}.comparisonHeader h3{margin:0;color:#254533;font-size:14px}.comparisonHeader span{padding:4px 8px;border-radius:999px;background:#FFF6E6;color:#895A08;font-size:11px;font-weight:700}.comparisonGrid{display:grid;grid-template-columns:repeat(4,1fr)}.comparisonGrid>div{padding:13px;border-right:1px solid #E9EEEA}.comparisonGrid>div:last-child{border:0}.comparisonGrid span{display:block;color:#6B796F;font-size:11px;font-weight:650}.comparisonGrid strong{display:block;margin-top:5px;color:#243B2E;font-size:19px;font-variant-numeric:tabular-nums}.comparisonGrid .warningValue strong{color:#895A08}.comparisonFoot{margin:0;padding:11px 13px;border-top:1px solid #E9EEEA;background:#FFF9ED;color:#74500B;font-size:12px;line-height:1.45}.technicalDetails{margin-top:12px;border:1px solid #E2E8DF;border-radius:8px}.technicalDetails summary{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;color:#28553B;font-size:12px;font-weight:700;cursor:pointer;list-style:none}.technicalDetails summary::-webkit-details-marker{display:none}.technicalDetails[open] summary svg{transform:rotate(180deg)}.technicalDetails pre{margin:0;padding:0 12px 12px;color:#405247;font-size:11px;white-space:pre-wrap}.evidenceSection{display:grid;grid-template-columns:1fr auto;gap:12px;margin-top:16px;padding:14px;border:1px solid #E2E8DF;border-radius:9px}.evidenceSection p{margin:5px 0 0;color:#6B796F;font-size:12px}.evidenceSection ul{grid-column:span 2;display:grid;gap:5px;margin:0;padding:0;list-style:none;color:#405247;font-size:12px}.evidenceSection li{display:flex;align-items:center;gap:6px}.uploadEvidence{display:inline-flex;align-items:center;align-self:start;gap:6px;min-height:35px;padding:0 9px;border:1px dashed #82A98C;border-radius:7px;color:#28553B;font-size:12px;font-weight:700;cursor:pointer}.uploadEvidence input{position:absolute;width:1px;height:1px;opacity:0}.resolution{margin-top:16px;padding-top:16px;border-top:1px solid #E2E8DF}.resolutionHeading{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}.resolutionHeading p{max-width:570px;margin:5px 0 0;color:#6B796F;font-size:12px;line-height:1.45}.resolutionHeading>span{display:flex;align-items:center;gap:5px;height:fit-content;padding:4px 7px;border-radius:999px;background:#E8F4EA;color:#116B3C;font-size:11px;font-weight:700}.resolution label+label{margin-top:12px}.resolution textarea{min-height:92px;padding:9px;resize:vertical;line-height:1.45}.resolution textarea:focus,.resolution select:focus,.filterGrid select:focus,.caseSearch input:focus{outline:3px solid #CBE6D1;border-color:#43835D}.resolutionActions{display:flex;justify-content:flex-end;gap:9px;margin-top:14px}.copyButton,.saveButton{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:40px;padding:8px 12px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer}.copyButton{border:1px solid #BCD2C1;background:#fff;color:#28553B}.saveButton{border:0;background:#165D40;color:#fff}.saveButton:disabled{background:#DCE5DC;color:#68766C;cursor:not-allowed}.feedback{display:flex;align-items:flex-start;gap:6px;margin:12px 0 0;padding:10px;border-radius:7px;background:#E8F4EA;color:#116B3C;font-size:12px;line-height:1.4}.history{margin-top:16px;padding-top:16px;border-top:1px solid #E2E8DF}.history p{display:flex;align-items:flex-start;gap:6px;margin:8px 0 0;color:#65756B;font-size:12px;line-height:1.45}.srOnly{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:860px){.alertsLayout{grid-template-columns:1fr}.caseList{order:2}.comparisonGrid{grid-template-columns:repeat(2,1fr)}.comparisonGrid>div:nth-child(2){border-right:0}.comparisonGrid>div:nth-child(-n+2){border-bottom:1px solid #E9EEEA}}@media(max-width:500px){.alertsPage{padding-left:16px;padding-right:16px}.detailHeader,.resolutionHeading{flex-direction:column}.detailBadges{justify-content:flex-start}.evidenceSection{grid-template-columns:1fr}.evidenceSection ul{grid-column:auto}.comparisonGrid{grid-template-columns:1fr}.comparisonGrid>div{border-right:0;border-bottom:1px solid #E9EEEA}.resolutionActions{flex-direction:column}.copyButton,.saveButton{width:100%}}
    `}</style></div>;
}

function MassComparison() {
  return (
    <section className="comparison" aria-label="Đối chiếu khối lượng">
      <div className="comparisonHeader">
        <h3>Đối chiếu khối lượng (Rule M)</h3>
        <span>Cần kiểm tra lại</span>
      </div>
      <div className="comparisonGrid">
        <div>
          <span>Khối lượng khai báo:</span>
          <strong>1.250 kg</strong>
        </div>
        <div>
          <span>Khối lượng thực nhận:</span>
          <strong>1.230 kg</strong>
        </div>
        <div className="warningValue">
          <span>Khối lượng thiếu hụt:</span>
          <strong>-20 kg</strong>
        </div>
        <div className="warningValue">
          <span>Tỷ lệ chênh lệch:</span>
          <strong>-1,6%</strong>
        </div>
      </div>
      <p className="comparisonFoot">Chênh lệch -20 kg (-1,6%) vượt ngưỡng tự động cho phép 1,0%. Cần đối chiếu phiếu cân điện tử và xác nhận giải trình trước khi phê duyệt.</p>
    </section>
  );
}

function StatusComparison() {
  return (
    <section className="comparison" aria-label="Đối chiếu hiệu lực mã số">
      <div className="comparisonHeader">
        <h3>Đối chiếu hiệu lực mã số (Rule S)</h3>
        <span style={{ background: "#FFF0EF", color: "#A13532" }}>Tạm khóa</span>
      </div>
      <div className="comparisonGrid">
        <div style={{ gridColumn: "span 2" }}>
          <span>Trạng thái khai báo:</span>
          <strong>ACTIVE (Còn hiệu lực)</strong>
        </div>
        <div className="warningValue" style={{ gridColumn: "span 2" }}>
          <span>Trạng thái kiểm tra thực tế:</span>
          <strong>SUSPENDED (Tạm đình chỉ)</strong>
        </div>
      </div>
      <p className="comparisonFoot" style={{ background: "#FFF4F3", color: "#8A3530" }}>
        Mã số vùng trồng đã bị tạm đình chỉ tại thời điểm thu hoạch. Trường hợp này bị tạm khóa tự động và không được chấp thuận như sai số thông thường.
      </p>
    </section>
  );
}
function DuplicateComparison() {
  return (
    <section className="comparison" aria-label="Đối chiếu tính duy nhất bằng chứng">
      <div className="comparisonHeader">
        <h3>Đối chiếu tính duy nhất bằng chứng (Rule D)</h3>
        <span>Cần xem xét</span>
      </div>
      <div className="comparisonGrid">
        <div style={{ gridColumn: "span 2" }}>
          <span>Mã nhận diện hình ảnh khai báo:</span>
          <strong style={{ fontSize: "14px", fontFamily: "monospace" }}>sha256-e3b0c442...</strong>
        </div>
        <div className="warningValue" style={{ gridColumn: "span 2" }}>
          <span>Lô hàng trùng lặp trước đó:</span>
          <strong>BATS-2026-0001 (LOT-2026-0718)</strong>
        </div>
      </div>
      <p className="comparisonFoot">
        Phát hiện chứng từ có chữ ký hoặc hình ảnh trùng lặp với lô hàng đã thu hoạch. Cần kiểm tra lại tài liệu gốc trước khi phê duyệt.
      </p>
    </section>
  );
}

function Chevron() { return <span aria-hidden="true" style={{ display: "inline-flex" }}>⌄</span>; }
