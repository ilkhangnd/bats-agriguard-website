import { describe, expect, it, beforeEach } from "vitest";
import { PcieService } from "./pcie/pcie.service.js";
import { TransfersService } from "./transfers/transfers.service.js";
import { AlertsService } from "./alerts/alerts.service.js";
import { DEFAULT_DEMO_POLICY } from "@bats/shared-types";

describe("Phase 2 — End-to-End MVP Integration Test Suite", () => {
  let pcie: PcieService;
  let transfers: TransfersService;
  let alerts: AlertsService;

  beforeEach(() => {
    pcie = new PcieService();
    transfers = new TransfersService();
    alerts = new AlertsService();
  });

  // 1. Scenario D01 PASS
  it("D01 PASS: Luồng thu hoạch chuẩn trong ranh giới, sản lượng đạt, chuyển giao hợp lệ", async () => {
    // A. Đánh giá PCIE
    const run = pcie.evaluate(
      {
        batchId: "BATS-2026-D01-PASS",
        eventTime: "2026-03-30T06:15:00.000Z",
        actor: { id: "ACT-001", role: "FARMER", name: "Y Blôk Niê" },
        farmPlot: {
          id: "plot-dlk-0001",
          plantingAreaCode: "VN-DLK-PA-0001",
          status: "active",
          crop: "durian",
          variety: "Ri6",
          areaHa: 2.5,
          authorizedActorIds: ["ACT-001"],
          polygonGeoJson: {
            type: "Polygon",
            coordinates: [
              [
                [108.120, 12.675],
                [108.128, 12.675],
                [108.128, 12.682],
                [108.120, 12.682]
              ]
            ]
          }
        },
        gps: { latitude: 12.6789, longitude: 108.1234 },
        declaredQuantityKg: 1250,
        currentCustodianId: "ACT-001"
      },
      DEFAULT_DEMO_POLICY
    );

    expect(run.overallStatus).toBe("PASS");
    expect(run.rules).toHaveLength(8);
    expect(run.rules.every((r) => r.status === "PASS")).toBe(true);

    // B. Chuyển giao quyền lưu giữ 2 bước
    const transferRecord = await transfers.initiateTransfer({
      batchId: "BATS-2026-D01-PASS",
      senderActorId: "ACT-001",
      receiverActorId: "ACT-002",
      quantityKg: 1250,
      notes: "Giao sầu riêng cắt sáng nay tại rẫy"
    });
    expect(transferRecord.status).toBe("PENDING_RECEIPT");

    const accepted = await transfers.acceptTransfer({
      transferId: transferRecord.id,
      receiverActorId: "ACT-002",
      receivedQuantityKg: 1250,
      notes: "Đã cân đối soát và nhập kho Krông Pắc Hub"
    });
    expect(accepted.status).toBe("ACCEPTED");
    expect(accepted.decidedAt).toBeDefined();
  });

  // 2. Scenario D02 REVIEW
  it("D02 REVIEW: Phát sinh cảnh báo M/Y01, tạo Review Queue, Reviewer yêu cầu bằng chứng và giải quyết", async () => {
    // A. Đánh giá PCIE sinh ra cảnh báo REVIEW do lệch đối soát khối lượng
    const run = pcie.evaluate(
      {
        batchId: "BATS-2026-D02-REVIEW",
        eventTime: "2026-03-30T09:15:00.000Z",
        actor: { id: "ACT-001", role: "FARMER", name: "Nguyễn Văn B" },
        farmPlot: {
          id: "plot-dlk-0001",
          plantingAreaCode: "VN-DLK-PA-0001",
          status: "active",
          crop: "durian",
          variety: "Ri6",
          areaHa: 2.5
        },
        gps: { latitude: 12.6795, longitude: 108.1245 },
        declaredQuantityKg: 1250,
        receivedQuantityKg: 1230 // -20kg (-1.6%) > 1.0% tolerance
      },
      DEFAULT_DEMO_POLICY
    );

    expect(run.overallStatus).toBe("REVIEW");
    const ruleM = run.rules.find((r) => r.code === "M");
    expect(ruleM?.status).toBe("REVIEW");
    expect(ruleM?.reasonCode).toBe("M_QUANTITY_DISCREPANCY");

    // B. Quy trình Review Queue: OPEN -> REQUEST_EVIDENCE -> RESOLVED
    alerts.seedMemoryCase({
      id: "case-d02",
      batchId: "BATS-2026-D02-REVIEW",
      ruleCode: "M",
      severity: "WARNING",
      status: "OPEN",
      title: "Chênh lệch khối lượng thu hoạch và thực nhận (-20 kg)",
      explanation: ruleM?.explanation ?? "",
      openedAt: new Date().toISOString(),
      actions: []
    });

    // Reviewer yêu cầu bổ sung bằng chứng
    const afterReq = await alerts.requestEvidence({
      caseId: "case-d02",
      reviewerId: "REVIEWER-01",
      reviewerName: "Ban Kiểm Soát HTX",
      reason: "Đề nghị cung cấp ảnh phiếu cân có chữ ký xác nhận của hộ liên kết."
    });
    expect(afterReq.status).toBe("NEED_EVIDENCE");
    expect(afterReq.actions).toHaveLength(1);
    expect(afterReq.actions[0]?.action).toBe("REQUEST_EVIDENCE");

    // Thẩm tra viên đưa ra phán quyết giải quyết
    const resolved = await alerts.resolveCase({
      caseId: "case-d02",
      reviewerId: "REVIEWER-01",
      reviewerName: "Ban Kiểm Soát HTX",
      disposition: "APPROVED_WITH_TOLERANCE",
      reason: "Đã đối soát phiếu cân 2 bên khớp 1,230 kg. Chấp thuận nhập kho."
    });
    expect(resolved.status).toBe("RESOLVED");
    expect(resolved.disposition).toBe("APPROVED_WITH_TOLERANCE");
    expect(resolved.actions).toHaveLength(2);
  });

  // 3. Scenario D03 BLOCK
  it("D03 BLOCK: Mã vùng trồng bị đình chỉ (S_DPI_SUSPENDED), kích hoạt BLOCK, từ chối giao nhận", async () => {
    const run = pcie.evaluate(
      {
        batchId: "BATS-2026-D03-BLOCK",
        eventTime: "2026-03-30T07:30:00.000Z",
        actor: { id: "ACT-UNKNOWN", role: "UNKNOWN", name: "Thương lái tự do" },
        farmPlot: {
          id: "plot-dlk-9999",
          plantingAreaCode: "VN-DLK-PA-9999",
          status: "suspended", // Đình chỉ -> HARD BLOCK Rule S
          crop: "durian",
          variety: "Ri6",
          areaHa: 2.5
        },
        gps: { latitude: 12.8500, longitude: 108.3200 },
        declaredQuantityKg: 4500
      },
      DEFAULT_DEMO_POLICY
    );

    expect(run.overallStatus).toBe("BLOCK");
    const ruleS = run.rules.find((r) => r.code === "S");
    expect(ruleS?.status).toBe("FAIL");
    expect(ruleS?.reasonCode).toBe("S_DPI_SUSPENDED");

    // Khởi tạo chuyển giao nhưng bên nhận từ chối ngay
    const transfer = await transfers.initiateTransfer({
      batchId: "BATS-2026-D03-BLOCK",
      senderActorId: "ACT-UNKNOWN",
      receiverActorId: "ACT-002",
      quantityKg: 4500
    });

    const rejected = await transfers.rejectTransfer({
      transferId: transfer.id,
      receiverActorId: "ACT-002",
      reason: "Từ chối tiếp nhận: Vi phạm quy tắc mã số vùng trồng bị đình chỉ S01."
    });

    expect(rejected.status).toBe("REJECTED");
    expect(rejected.rejectionReason).toContain("S01");
  });

  // 4. Custody Transfer Concurrency & Chống Xử Lý Trùng
  it("Custody Transfer: Ngăn chặn tạo 2 giao dịch đồng thời cho cùng 1 lô hàng", async () => {
    await transfers.initiateTransfer({
      batchId: "BATS-CONCURRENCY-01",
      senderActorId: "ACT-001",
      receiverActorId: "ACT-002",
      quantityKg: 500
    });

    // Cố gắng initiate lần 2 khi chưa accept/reject
    await expect(
      transfers.initiateTransfer({
        batchId: "BATS-CONCURRENCY-01",
        senderActorId: "ACT-001",
        receiverActorId: "ACT-003",
        quantityKg: 500
      })
    ).rejects.toThrow(/đang có/);
  });

  // 5. Phân Quyền Bên Nhận (RBAC / Custody Boundary)
  it("Custody Transfer: Chủ thể không được chỉ định không thể chấp thuận giao dịch", async () => {
    const transfer = await transfers.initiateTransfer({
      batchId: "BATS-RBAC-01",
      senderActorId: "ACT-001",
      receiverActorId: "ACT-COLLECTOR-CORRECT",
      quantityKg: 300
    });

    await expect(
      transfers.acceptTransfer({
        transferId: transfer.id,
        receiverActorId: "ACT-COLLECTOR-WRONG"
      })
    ).rejects.toThrow(/Unauthorized receiver|không phải bên tiếp nhận/);
  });
});
