import { describe, expect, it } from "vitest";
import { AlertsService } from "./alerts.service.js";

describe("AlertsService Unit Tests (Review Queue & Audit Trail)", () => {
  const service = new AlertsService(); // memory mode

  const sampleCase = {
    id: "case-demo-001",
    batchId: "BATS-2026-D02-REVIEW",
    ruleCode: "M",
    severity: "WARNING" as const,
    status: "OPEN" as const,
    title: "Chênh lệch khối lượng thu hoạch và thực nhận (-20 kg)",
    explanation: "Khối lượng thực nhận 1.230 kg thấp hơn khai báo 1.250 kg (-20 kg / -1.6%).",
    openedAt: "2026-07-19T09:00:00Z",
    actions: []
  };

  service.seedMemoryCase(sampleCase);

  it("lists existing review cases", async () => {
    const list = await service.listCases();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]!.id).toBe("case-demo-001");
  });

  it("allows reviewer to request supplemental evidence, updating status to NEED_EVIDENCE", async () => {
    const updated = await service.requestEvidence({
      caseId: "case-demo-001",
      reviewerId: "REVIEWER-0001",
      reviewerName: "Lê Hoàng Yến",
      reason: "Yêu cầu thương lái cung cấp ảnh chụp phiếu cân gốc của điểm thu mua Ea Yông"
    });

    expect(updated.status).toBe("NEED_EVIDENCE");
    expect(updated.actions.length).toBe(1);
    expect(updated.actions[0]!.action).toBe("REQUEST_EVIDENCE");
    expect(updated.actions[0]!.reviewerId).toBe("REVIEWER-0001");
  });

  it("allows reviewer to resolve the case with documented reason and disposition", async () => {
    const resolved = await service.resolveCase({
      caseId: "case-demo-001",
      reviewerId: "REVIEWER-0001",
      reviewerName: "Lê Hoàng Yến",
      disposition: "APPROVED_WITH_TOLERANCE",
      reason: "Đã đối chiếu phiếu cân cơ sở và chấp thuận sai lệch hao hụt tự nhiên do vận chuyển (1.6%)."
    });

    expect(resolved.status).toBe("RESOLVED");
    expect(resolved.disposition).toBe("APPROVED_WITH_TOLERANCE");
    expect(resolved.resolvedAt).toBeDefined();
    expect(resolved.actions.length).toBe(2);
    expect(resolved.actions[1]!.action).toBe("RESOLVE");
  });
});
