import { describe, expect, it, beforeEach } from "vitest";
import { PcieController } from "./pcie/pcie.controller.js";
import { AlertsController } from "./alerts/alerts.controller.js";
import { TransfersController } from "./transfers/transfers.controller.js";
import { PcieService } from "./pcie/pcie.service.js";
import { AlertsService } from "./alerts/alerts.service.js";
import { TransfersService } from "./transfers/transfers.service.js";

describe("Phase 2 — MVP Controllers Test Suite", () => {
  let pcieController: PcieController;
  let alertsController: AlertsController;
  let transfersController: TransfersController;
  let pcieService: PcieService;
  let alertsService: AlertsService;
  let transfersService: TransfersService;

  beforeEach(() => {
    pcieService = new PcieService();
    alertsService = new AlertsService();
    transfersService = new TransfersService();

    // Mock prisma/store dependencies for controller unit test
    const mockPrisma = {
      batch: { findUnique: async () => null, findMany: async () => [] },
      farmPlot: { findUnique: async () => null, count: async () => 8 },
      transfer: { findMany: async () => [] },
      reviewCase: { findMany: async () => [], count: async () => 1 }
    } as any;

    const mockStore = {
      batches: new Map([
        [
          "BATS-2026-D01-PASS",
          {
            id: "BATS-2026-D01-PASS",
            farmerId: "FARMER-0001",
            farmPlotId: "plot-dlk-0001",
            crop: "durian",
            variety: "Ri6",
            quantityKg: 1250,
            status: "harvested",
            riskBand: "green",
            createdAt: new Date().toISOString()
          }
        ]
      ]),
      plots: new Map([
        [
          "plot-dlk-0001",
          {
            id: "plot-dlk-0001",
            plantingAreaCode: "VN-DLK-PA-0001",
            status: "active",
            crop: "durian",
            variety: "Ri6",
            areaHa: 2.5
          }
        ]
      ])
    } as any;

    pcieController = new PcieController(pcieService, mockPrisma, mockStore);
    alertsController = new AlertsController(alertsService);
    transfersController = new TransfersController(transfersService, mockPrisma);
  });

  it("PcieController: evaluates batch from store returning 8 rules", async () => {
    const res = await pcieController.evaluateBatch("BATS-2026-D01-PASS");
    expect(res).toBeDefined();
    expect(res.batchId).toBe("BATS-2026-D01-PASS");
    expect(res.rules).toHaveLength(8);
  });

  it("AlertsController: requests evidence and resolves case with actor token info", async () => {
    alertsService.seedMemoryCase({
      id: "case-ctrl-01",
      batchId: "BATS-2026-D02-REVIEW",
      ruleCode: "M",
      severity: "WARNING",
      status: "OPEN",
      title: "Chênh lệch đối soát khối lượng",
      explanation: "Lệch 20kg",
      openedAt: new Date().toISOString(),
      actions: []
    });

    const mockRequest = {
      actor: { id: "REVIEWER-0001", role: "COOPERATIVE", name: "Nguyễn Văn Thanh" }
    } as any;

    // 1. Request evidence
    const requested = await alertsController.requestEvidence(
      "case-ctrl-01",
      { reason: "Cần phiếu cân đối soát vựa" },
      mockRequest
    );
    expect(requested.status).toBe("NEED_EVIDENCE");
    expect(requested.actions[0]?.reviewerId).toBe("REVIEWER-0001");

    // 2. Resolve
    const resolved = await alertsController.resolveCase(
      "case-ctrl-01",
      { disposition: "APPROVED_WITH_TOLERANCE", reason: "Khớp phiếu cân 1230kg" },
      mockRequest
    );
    expect(resolved.status).toBe("RESOLVED");
    expect(resolved.disposition).toBe("APPROVED_WITH_TOLERANCE");
  });

  it("TransfersController: initiates and accepts custody transfer with actor token info", async () => {
    const mockSenderReq = {
      actor: { id: "FARMER-0001", role: "FARMER", name: "Y Blôk Niê" }
    } as any;

    const mockReceiverReq = {
      actor: { id: "COLLECTOR-0001", role: "COLLECTOR", name: "Vựa Tây Nguyên" }
    } as any;

    // Initiate
    const initiated = await transfersController.initiate(
      {
        batchId: "BATS-CTRL-01",
        receiverActorId: "COLLECTOR-0001",
        quantityKg: 1000,
        notes: "Chuyển giao sầu riêng vườn"
      },
      mockSenderReq
    );
    expect(initiated.senderActorId).toBe("FARMER-0001");
    expect(initiated.receiverActorId).toBe("COLLECTOR-0001");
    expect(initiated.status).toBe("PENDING_RECEIPT");

    // Accept
    const accepted = await transfersController.accept(
      initiated.id,
      { receivedQuantityKg: 1000, notes: "Đã cân chuẩn 1000kg" },
      mockReceiverReq
    );
    expect(accepted.status).toBe("ACCEPTED");
  });
});
