import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PcieService, type PcieEvaluationContext } from "./pcie.service.js";
import { PrismaService } from "../database/prisma.service.js";
import { StoreService } from "../store.service.js";
import { DEFAULT_DEMO_POLICY } from "@bats/shared-types";

@Controller("pcie")
@ApiTags("PCIE Engine")
export class PcieController {
  constructor(
    @Inject(PcieService) private readonly pcie: PcieService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StoreService) private readonly store: StoreService
  ) {}

  @Post("evaluate")
  @ApiOperation({ summary: "Chạy kiểm định 8 nhóm quy tắc PCIE cho ngữ cảnh sự kiện" })
  evaluateContext(@Body() ctx: PcieEvaluationContext) {
    return this.pcie.evaluate(ctx, DEFAULT_DEMO_POLICY);
  }

  @Get("batch/:id")
  @ApiOperation({ summary: "Thẩm định toàn diện 8 quy tắc cho một lô hàng cụ thể" })
  async evaluateBatch(@Param("id") id: string) {
    // 1. Kiểm tra batch trong Prisma hoặc Store
    const batchPrisma = await this.prisma.batch.findUnique({
      where: { id },
      include: {
        events: { orderBy: { eventTime: "asc" } }
      }
    });

    if (batchPrisma) {
      const plot = await this.prisma.farmPlot.findUnique({
        where: { id: batchPrisma.farmPlotId }
      });

      const firstEvent = batchPrisma.events[0];
      const payload = (firstEvent?.payload as Record<string, unknown>) ?? {};
      const readPoint = (payload.readPoint as { id?: string })?.id ?? "";
      let gps: { latitude: number; longitude: number } | undefined;
      if (readPoint.startsWith("geo:")) {
        const parts = readPoint.slice(4).split(",");
        const lat = parseFloat(parts[0] ?? "0");
        const lng = parseFloat(parts[1] ?? "0");
        if (!isNaN(lat) && !isNaN(lng)) {
          gps = { latitude: lat, longitude: lng };
        }
      }

      const polygonCoords = (plot?.polygonGeoJson as unknown as number[][]) ?? [
        [108.120, 12.675],
        [108.128, 12.675],
        [108.128, 12.682],
        [108.120, 12.682]
      ];

      const ctx: PcieEvaluationContext = {
        batchId: batchPrisma.id,
        eventId: firstEvent?.id,
        eventTime: batchPrisma.createdAt,
        actor: {
          id: batchPrisma.farmerId,
          role: "FARMER",
          name: plot?.farmerName ?? batchPrisma.farmerId
        },
        farmPlot: {
          id: plot?.id ?? batchPrisma.farmPlotId,
          plantingAreaCode: plot?.plantingAreaCode ?? "VN-DLK-PA-0001",
          status: plot?.status ?? "active",
          crop: plot?.crop ?? batchPrisma.crop,
          variety: plot?.variety ?? batchPrisma.variety,
          areaHa: Number(plot?.areaHa ?? 2.5),
          polygonGeoJson: {
            type: "Polygon",
            coordinates: [polygonCoords]
          }
        },
        gps,
        declaredQuantityKg: Number(batchPrisma.quantityKg),
        currentCustodianId: batchPrisma.custodianId ?? batchPrisma.farmerId
      };

      return this.pcie.evaluate(ctx, DEFAULT_DEMO_POLICY);
    }

    // 2. Fallback sang in-memory store
    const memBatch = this.store.batches.get(id);
    if (!memBatch) {
      throw new NotFoundException(`Không tìm thấy lô hàng ${id} để kiểm định PCIE.`);
    }

    const memPlot = this.store.plots.get(memBatch.farmPlotId);
    const ctx: PcieEvaluationContext = {
      batchId: memBatch.id,
      eventTime: memBatch.createdAt,
      actor: {
        id: memBatch.farmerId,
        role: "FARMER",
        name: memPlot?.farmerName ?? memBatch.farmerId
      },
      farmPlot: {
        id: memPlot?.id ?? memBatch.farmPlotId,
        plantingAreaCode: memPlot?.plantingAreaCode ?? "VN-DLK-PA-0001",
        status: memPlot?.status ?? "active",
        crop: memPlot?.crop ?? memBatch.crop,
        variety: memPlot?.variety ?? memBatch.variety,
        areaHa: Number(memPlot?.areaHa ?? 2.0)
      },
      gps: { latitude: 12.6789, longitude: 108.1234 },
      declaredQuantityKg: memBatch.quantityKg
    };

    return this.pcie.evaluate(ctx, DEFAULT_DEMO_POLICY);
  }
}
