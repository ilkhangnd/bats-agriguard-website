import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { TransfersService } from "./transfers.service.js";
import { AccessGuard, type ActorRequest, Roles } from "../access.guard.js";
import { PrismaService } from "../database/prisma.service.js";

export class InitiateTransferBody {
  batchId!: string;
  receiverActorId!: string;
  quantityKg!: number;
  notes?: string;
  evidenceIds?: string[];
}

export class AcceptTransferBody {
  receivedQuantityKg?: number;
  notes?: string;
}

export class RejectTransferBody {
  reason!: string;
}

@Controller("transfers")
@ApiTags("Custody Transfers")
export class TransfersController {
  constructor(
    @Inject(TransfersService) private readonly transfers: TransfersService,
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  @Get()
  @ApiOperation({ summary: "Danh sách các giao dịch chuyển giao quyền lưu giữ" })
  async listTransfers(
    @Query("batchId") batchId?: string,
    @Query("status") status?: string,
    @Query("actorId") actorId?: string
  ) {
    const where: Record<string, unknown> = {};
    if (batchId) where.batchId = batchId;
    if (status) where.status = status;
    if (actorId) {
      where.OR = [
        { senderActorId: actorId },
        { receiverActorId: actorId }
      ];
    }

    const items = await this.prisma.transfer.findMany({
      where,
      orderBy: { initiatedAt: "desc" }
    });

    return items.map((t) => ({
      id: t.id,
      batchId: t.batchId,
      senderActorId: t.senderActorId,
      receiverActorId: t.receiverActorId,
      quantityKg: Number(t.quantityKg),
      status: t.status,
      notes: t.notes ?? undefined,
      initiatedAt: t.initiatedAt.toISOString(),
      decidedAt: t.decidedAt?.toISOString()
    }));
  }

  @Post("initiate")
  @ApiBearerAuth("actor-token")
  @ApiOperation({ summary: "Khởi tạo chuyển giao quyền lưu giữ (TRANSFER_INITIATED)" })
  @UseGuards(AccessGuard)
  @Roles("FARMER", "COLLECTOR", "COOPERATIVE", "PACKING", "ADMIN")
  initiate(
    @Body() body: InitiateTransferBody,
    @Req() request: ActorRequest
  ) {
    return this.transfers.initiateTransfer({
      batchId: body.batchId,
      senderActorId: request.actor!.id,
      receiverActorId: body.receiverActorId,
      quantityKg: body.quantityKg,
      notes: body.notes,
      evidenceIds: body.evidenceIds
    });
  }

  @Post(":id/accept")
  @ApiBearerAuth("actor-token")
  @ApiOperation({ summary: "Bên tiếp nhận xác thực và chấp thuận lưu kho (TRANSFER_ACCEPTED)" })
  @UseGuards(AccessGuard)
  @Roles("COLLECTOR", "COOPERATIVE", "PACKING", "EXPORTER", "ADMIN")
  accept(
    @Param("id") id: string,
    @Body() body: AcceptTransferBody,
    @Req() request: ActorRequest
  ) {
    return this.transfers.acceptTransfer({
      transferId: id,
      receiverActorId: request.actor!.id,
      receivedQuantityKg: body.receivedQuantityKg,
      notes: body.notes
    });
  }

  @Post(":id/reject")
  @ApiBearerAuth("actor-token")
  @ApiOperation({ summary: "Bên tiếp nhận từ chối giao nhận lô hàng (TRANSFER_REJECTED)" })
  @UseGuards(AccessGuard)
  @Roles("COLLECTOR", "COOPERATIVE", "PACKING", "EXPORTER", "ADMIN")
  reject(
    @Param("id") id: string,
    @Body() body: RejectTransferBody,
    @Req() request: ActorRequest
  ) {
    return this.transfers.rejectTransfer({
      transferId: id,
      receiverActorId: request.actor!.id,
      reason: body.reason
    });
  }
}
