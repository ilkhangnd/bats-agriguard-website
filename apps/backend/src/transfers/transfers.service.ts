import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import { type TransferRecord, type TransferStatus } from "@bats/shared-types";

export interface InitiateTransferDto {
  batchId: string;
  senderActorId: string;
  receiverActorId: string;
  quantityKg: number;
  notes?: string;
  evidenceIds?: string[];
}

export interface AcceptTransferDto {
  transferId: string;
  receiverActorId: string;
  receivedQuantityKg?: number;
  notes?: string;
}

export interface RejectTransferDto {
  transferId: string;
  receiverActorId: string;
  reason: string;
}

@Injectable()
export class TransfersService {
  constructor(
    @Optional() @Inject(PrismaService) private readonly prisma?: PrismaService
  ) {}

  // In-memory fallback map for test environments where prisma isn't active
  private readonly memoryTransfers = new Map<string, TransferRecord>();

  async initiateTransfer(dto: InitiateTransferDto): Promise<TransferRecord> {
    if (dto.quantityKg <= 0) {
      throw new BadRequestException("Khối lượng chuyển giao phải lớn hơn 0 kg.");
    }

    if (dto.senderActorId === dto.receiverActorId) {
      throw new BadRequestException("Bên chuyển giao và bên tiếp nhận không được trùng nhau.");
    }

    if (this.prisma) {
      const batch = await this.prisma.batch.findUnique({
        where: { id: dto.batchId }
      });

      if (!batch) {
        throw new NotFoundException(`Không tìm thấy lô hàng ${dto.batchId}.`);
      }

      // Kiểm tra người gửi có phải custodian hiện tại không
      const currentCustodian = batch.custodianId ?? batch.farmerId;
      if (currentCustodian !== dto.senderActorId) {
        throw new ForbiddenException(
          `Chủ thể ${dto.senderActorId} không có quyền chuyển giao lô hàng ${dto.batchId} (người đang giữ: ${currentCustodian}).`
        );
      }

      // Kiểm tra có transfer nào đang PENDING_RECEIPT không (chống double initiation)
      const pendingTransfer = await this.prisma.transfer.findFirst({
        where: { batchId: dto.batchId, status: "PENDING_RECEIPT" }
      });

      if (pendingTransfer) {
        throw new ConflictException(
          `Lô hàng ${dto.batchId} đang có một giao dịch chuyển giao chờ xác nhận (Mã: ${pendingTransfer.id}).`
        );
      }

      const created = await this.prisma.transfer.create({
        data: {
          batchId: dto.batchId,
          senderActorId: dto.senderActorId,
          receiverActorId: dto.receiverActorId,
          quantityKg: dto.quantityKg,
          status: "PENDING_RECEIPT",
          notes: dto.notes
        }
      });

      return {
        id: created.id,
        batchId: created.batchId,
        senderActorId: created.senderActorId,
        receiverActorId: created.receiverActorId,
        quantityKg: Number(created.quantityKg),
        status: created.status as TransferStatus,
        notes: created.notes ?? undefined,
        evidenceIds: dto.evidenceIds ?? [],
        initiatedAt: created.initiatedAt.toISOString()
      };
    }

    // In-memory fallback
    const existing = [...this.memoryTransfers.values()].find(
      (t) => t.batchId === dto.batchId && t.status === "PENDING_RECEIPT"
    );
    if (existing) {
      throw new ConflictException(`Lô hàng ${dto.batchId} đang có giao dịch chuyển giao chờ xử lý.`);
    }

    const record: TransferRecord = {
      id: `tr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      batchId: dto.batchId,
      senderActorId: dto.senderActorId,
      receiverActorId: dto.receiverActorId,
      quantityKg: dto.quantityKg,
      status: "PENDING_RECEIPT",
      notes: dto.notes,
      evidenceIds: dto.evidenceIds ?? [],
      initiatedAt: new Date().toISOString()
    };
    this.memoryTransfers.set(record.id, record);
    return record;
  }

  async acceptTransfer(dto: AcceptTransferDto): Promise<TransferRecord> {
    if (this.prisma) {
      const transfer = await this.prisma.transfer.findUnique({
        where: { id: dto.transferId }
      });

      if (!transfer) {
        throw new NotFoundException(`Không tìm thấy giao dịch chuyển giao ${dto.transferId}.`);
      }

      if (transfer.status !== "PENDING_RECEIPT") {
        throw new ConflictException(
          `Giao dịch chuyển giao ${dto.transferId} không ở trạng thái chờ xác nhận (trạng thái: ${transfer.status}).`
        );
      }

      if (transfer.receiverActorId !== dto.receiverActorId) {
        throw new ForbiddenException(
          `Chủ thể ${dto.receiverActorId} không phải bên tiếp nhận được chỉ định của giao dịch ${dto.transferId}.`
        );
      }

      // Cập nhật chuyển giao và chuyển custodian lô hàng nguyên tử
      const [updatedTransfer] = await this.prisma.$transaction([
        this.prisma.transfer.update({
          where: { id: dto.transferId },
          data: {
            status: "ACCEPTED",
            decidedAt: new Date(),
            notes: dto.notes ? `${transfer.notes ?? ""}\n[Nhận]: ${dto.notes}`.trim() : transfer.notes
          }
        }),
        this.prisma.batch.update({
          where: { id: transfer.batchId },
          data: {
            custodianId: dto.receiverActorId,
            status: "collected"
          }
        })
      ]);

      return {
        id: updatedTransfer.id,
        batchId: updatedTransfer.batchId,
        senderActorId: updatedTransfer.senderActorId,
        receiverActorId: updatedTransfer.receiverActorId,
        quantityKg: Number(updatedTransfer.quantityKg),
        status: "ACCEPTED",
        notes: updatedTransfer.notes ?? undefined,
        evidenceIds: [],
        initiatedAt: updatedTransfer.initiatedAt.toISOString(),
        decidedAt: updatedTransfer.decidedAt?.toISOString()
      };
    }

    // In-memory fallback
    const t = this.memoryTransfers.get(dto.transferId);
    if (!t) throw new NotFoundException("Transfer not found");
    if (t.status !== "PENDING_RECEIPT") throw new ConflictException("Transfer already decided");
    if (t.receiverActorId !== dto.receiverActorId) throw new ForbiddenException("Unauthorized receiver");

    t.status = "ACCEPTED";
    t.decidedAt = new Date().toISOString();
    return t;
  }

  async rejectTransfer(dto: RejectTransferDto): Promise<TransferRecord> {
    if (!dto.reason || dto.reason.trim().length === 0) {
      throw new BadRequestException("Phải nêu rõ lý do từ chối tiếp nhận lô hàng.");
    }

    if (this.prisma) {
      const transfer = await this.prisma.transfer.findUnique({
        where: { id: dto.transferId }
      });

      if (!transfer) {
        throw new NotFoundException(`Không tìm thấy giao dịch chuyển giao ${dto.transferId}.`);
      }

      if (transfer.status !== "PENDING_RECEIPT") {
        throw new ConflictException(
          `Giao dịch chuyển giao ${dto.transferId} đã được xử lý (trạng thái: ${transfer.status}).`
        );
      }

      if (transfer.receiverActorId !== dto.receiverActorId) {
        throw new ForbiddenException(
          `Chủ thể ${dto.receiverActorId} không có quyền từ chối giao dịch ${dto.transferId}.`
        );
      }

      // Từ chối: Cập nhật transfer thành REJECTED, custodian GIỮ NGUYÊN ở bên giao
      const updated = await this.prisma.transfer.update({
        where: { id: dto.transferId },
        data: {
          status: "REJECTED",
          decidedAt: new Date(),
          rejectionReason: dto.reason
        }
      });

      return {
        id: updated.id,
        batchId: updated.batchId,
        senderActorId: updated.senderActorId,
        receiverActorId: updated.receiverActorId,
        quantityKg: Number(updated.quantityKg),
        status: "REJECTED",
        rejectionReason: updated.rejectionReason ?? undefined,
        evidenceIds: [],
        initiatedAt: updated.initiatedAt.toISOString(),
        decidedAt: updated.decidedAt?.toISOString()
      };
    }

    // In-memory fallback
    const t = this.memoryTransfers.get(dto.transferId);
    if (!t) throw new NotFoundException("Transfer not found");
    if (t.status !== "PENDING_RECEIPT") throw new ConflictException("Transfer already decided");
    if (t.receiverActorId !== dto.receiverActorId) throw new ForbiddenException("Unauthorized receiver");

    t.status = "REJECTED";
    t.rejectionReason = dto.reason;
    t.decidedAt = new Date().toISOString();
    return t;
  }
}
