"use client";

export type Severity = "WARNING" | "CRITICAL";
export type CaseStatus = "OPEN" | "RESOLVED";

export interface AlertCase {
  id: string;
  batchId: string;
  rule: "M" | "S" | "D";
  title: string;
  severity: Severity;
  status: CaseStatus;
  openedAt: string;
  explanation: string;
  technicalData: string;
  evidence: string[];
  history: string[];
}

export const INITIAL_CASES: AlertCase[] = [
  {
    id: "CB-2026-0002",
    batchId: "BATS-2026-0002",
    rule: "M",
    title: "Cảnh báo khối lượng",
    severity: "WARNING",
    status: "OPEN",
    openedAt: "30/03/2026 · 09:18",
    explanation: "Khối lượng thực nhận thấp hơn khai báo và vượt ngưỡng chênh lệch cho phép. Cần đối chiếu phiếu cân cùng thông tin giao nhận trước khi quyết định.",
    technicalData: '{\n  "declaredKg": 1250,\n  "receivedKg": 1230,\n  "deltaKg": -20,\n  "percentDiff": -1.6\n}',
    evidence: ["Ảnh chụp phiếu cân vựa", "Ảnh cây trước thu hoạch"],
    history: ["30/03/2026 · 09:18 — Hệ thống tạo cảnh báo khối lượng."]
  },
  {
    id: "CB-2026-0003",
    batchId: "BATS-2026-0003",
    rule: "S",
    title: "Cảnh báo nghiêm trọng · Hiệu lực mã số",
    severity: "CRITICAL",
    status: "OPEN",
    openedAt: "30/03/2026 · 10:02",
    explanation: "Mã số vùng trồng VN-DLK-PA-9999 đang tạm đình chỉ tại thời điểm ghi nhận thu hoạch. Lô hàng bị tạm khóa và không thể được chấp thuận tại bước này.",
    technicalData: '{\n  "requiredStatus": "ACTIVE",\n  "currentStatus": "SUSPENDED",\n  "plotCode": "VN-DLK-PA-9999"\n}',
    evidence: ["Biên bản thanh tra số 12/BB-TT"],
    history: ["30/03/2026 · 10:02 — Hệ thống tạm khóa lô hàng do mã số vùng trồng không còn hiệu lực."]
  },
  {
    id: "CB-2026-0005",
    batchId: "BATS-2026-0005",
    rule: "D",
    title: "Cảnh báo trùng lặp bằng chứng",
    severity: "WARNING",
    status: "OPEN",
    openedAt: "30/03/2026 · 10:45",
    explanation: "Hình ảnh chứng từ thu hoạch có chữ ký số hoặc hàm băm hình ảnh trùng lặp với lô hàng đã thu hoạch trước đó. Cần kiểm tra lại tệp ảnh gốc.",
    technicalData: '{\n  "duplicateHash": "sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",\n  "matchedBatch": "BATS-2026-0001"\n}',
    evidence: ["Ảnh chụp chứng từ thu hoạch tại vườn"],
    history: ["30/03/2026 · 10:45 — Hệ thống phát hiện dấu hiệu trùng lặp bằng chứng và tạo cảnh báo."]
  }
];

export const ALERTS_STORAGE_KEY = "bats_alert_cases";
export const ALERTS_CHANGE_EVENT = "bats-alerts-change";

export function getStoredAlerts(): AlertCase[] {
  if (typeof window === "undefined") {
    return INITIAL_CASES;
  }
  try {
    const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(INITIAL_CASES));
      return INITIAL_CASES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // fallback
  }
  return INITIAL_CASES;
}

export function saveStoredAlerts(cases: AlertCase[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(cases));
  } catch {
    // ignore
  }
  const openCount = cases.filter((c) => c.status === "OPEN").length;
  window.dispatchEvent(new CustomEvent(ALERTS_CHANGE_EVENT, { detail: openCount }));
  window.dispatchEvent(new Event(ALERTS_CHANGE_EVENT));
}

export function getOpenAlertsCount(cases?: AlertCase[]): number {
  const list = cases ?? getStoredAlerts();
  return list.filter((c) => c.status === "OPEN").length;
}

export async function syncWithBackendAlerts(): Promise<number> {
  if (typeof window === "undefined") return 3;
  try {
    const res = await fetch("http://localhost:4000/alerts", { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const backendCases = await res.json();
      if (Array.isArray(backendCases) && backendCases.length > 0) {
        const stored = getStoredAlerts();
        // Update statuses if matching
        let modified = false;
        const updated = stored.map((item) => {
          const remote = backendCases.find((b: { batchId?: string; id?: string }) => b.batchId === item.batchId || b.id === item.id);
          if (remote && remote.status && remote.status !== item.status) {
            modified = true;
            return { ...item, status: remote.status as CaseStatus };
          }
          return item;
        });
        if (modified) {
          saveStoredAlerts(updated);
          return getOpenAlertsCount(updated);
        }
      }
    }
  } catch {
    // Backend offline or timeout; keep local state
  }
  return getOpenAlertsCount();
}
