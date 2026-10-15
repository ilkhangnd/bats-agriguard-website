import { describe, expect, it } from "vitest";
import { TransfersService } from "./transfers.service.js";

describe("TransfersService Unit Tests (Two-step Custody Transfer)", () => {
  const service = new TransfersService(); // memory mode

  it("initiates a transfer with status PENDING_RECEIPT", async () => {
    const t = await service.initiateTransfer({
      batchId: "batch-transfer-001",
      senderActorId: "FARMER-0001",
      receiverActorId: "COLLECTOR-0001",
      quantityKg: 1250,
      notes: "Bàn giao lô sầu riêng Ri6 đợt 1"
    });

    expect(t.status).toBe("PENDING_RECEIPT");
    expect(t.batchId).toBe("batch-transfer-001");
    expect(t.senderActorId).toBe("FARMER-0001");
    expect(t.receiverActorId).toBe("COLLECTOR-0001");
    expect(t.quantityKg).toBe(1250);
  });

  it("prevents double-initiation while a transfer is already PENDING_RECEIPT", async () => {
    await expect(
      service.initiateTransfer({
        batchId: "batch-transfer-001", // same batch
        senderActorId: "FARMER-0001",
        receiverActorId: "COLLECTOR-0002",
        quantityKg: 500
      })
    ).rejects.toThrow("đang có giao dịch chuyển giao chờ xử lý");
  });

  it("rejects invalid transfers (zero quantity or sender identical to receiver)", async () => {
    await expect(
      service.initiateTransfer({
        batchId: "batch-transfer-002",
        senderActorId: "FARMER-0001",
        receiverActorId: "FARMER-0001",
        quantityKg: 500
      })
    ).rejects.toThrow("không được trùng nhau");

    await expect(
      service.initiateTransfer({
        batchId: "batch-transfer-002",
        senderActorId: "FARMER-0001",
        receiverActorId: "COLLECTOR-0001",
        quantityKg: -10
      })
    ).rejects.toThrow("phải lớn hơn 0 kg");
  });

  it("prevents unauthorized actor from accepting the transfer", async () => {
    const t = await service.initiateTransfer({
      batchId: "batch-transfer-003",
      senderActorId: "FARMER-0001",
      receiverActorId: "COLLECTOR-0001",
      quantityKg: 800
    });

    await expect(
      service.acceptTransfer({
        transferId: t.id,
        receiverActorId: "ATTACKER-9999" // Not the designated receiver!
      })
    ).rejects.toThrow("Unauthorized receiver");
  });

  it("allows designated receiver to accept the transfer and records decision time", async () => {
    const t = await service.initiateTransfer({
      batchId: "batch-transfer-004",
      senderActorId: "FARMER-0001",
      receiverActorId: "COLLECTOR-0001",
      quantityKg: 1000
    });

    const accepted = await service.acceptTransfer({
      transferId: t.id,
      receiverActorId: "COLLECTOR-0001",
      notes: "Đã kiểm đếm đủ 1.000 kg nguyên vẹn"
    });

    expect(accepted.status).toBe("ACCEPTED");
    expect(accepted.decidedAt).toBeDefined();
  });

  it("allows designated receiver to reject the transfer with reason, leaving custody intact", async () => {
    const t = await service.initiateTransfer({
      batchId: "batch-transfer-005",
      senderActorId: "FARMER-0001",
      receiverActorId: "COLLECTOR-0001",
      quantityKg: 600
    });

    const rejected = await service.rejectTransfer({
      transferId: t.id,
      receiverActorId: "COLLECTOR-0001",
      reason: "Hàng bị dập nát quá 20%, không đúng phẩm cấp thu mua"
    });

    expect(rejected.status).toBe("REJECTED");
    expect(rejected.rejectionReason).toBe("Hàng bị dập nát quá 20%, không đúng phẩm cấp thu mua");
    expect(rejected.decidedAt).toBeDefined();
  });
});
