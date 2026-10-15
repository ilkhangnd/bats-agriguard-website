import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Optional
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import {
  type ReviewCaseRecord,
  type ReviewActionRecord,
  type ReviewCaseStatus
} from "@bats/shared-types";

export interface RequestEvidenceDto {
  caseId: string;
  reviewerId: string;
  reviewerName?: string;
  reason: string;
}

export interface ResolveCaseDto {
  caseId: string;
  reviewerId: string;
  reviewerName?: string;
  disposition: string; // e.g. "APPROVED_WITH_TOLERANCE" | "REJECTED_UNRESOLVED" | "DISMISSED"
  reason: string;
}

export interface SubmitEvidenceDto {
  caseId: string;
  actorId: string;
  actorName?: string;
  evidenceIds: string[];
  notes?: string;
}

@Injectable()
export class AlertsService {
  constructor(
    @Optional() @Inject(PrismaService) private readonly prisma?: PrismaService
  ) {}

  private readonly memoryCases = new Map<string, ReviewCaseRecord>();

  async listCases(query?: { status?: string; ruleCode?: string }): Promise<ReviewCaseRecord[]> {
    if (this.prisma) {
      const where: Record<string, unknown> = {};
      if (query?.status) where.status = query.status;
      if (query?.ruleCode) where.ruleCode = query.ruleCode;

      const cases = await this.prisma.reviewCase.findMany({
        where,
        include: {
          actions: {
            orderBy: { createdAt: "asc" }
          }
        },
        orderBy: { openedAt: "desc" }
      });

      return cases.map((c) => ({
        id: c.id,
        batchId: c.batchId,
        eventId: c.eventId ?? undefined,
        ruleCode: c.ruleCode,
        severity: c.severity as "INFO" | "WARNING" | "CRITICAL",
        status: c.status as ReviewCaseStatus,
        assignedTo: c.assignedTo ?? undefined,
        title: c.title,
        explanation: c.explanation,
        expected: (c.expected as Record<string, unknown>) ?? undefined,
        observed: (c.observed as Record<string, unknown>) ?? undefined,
        openedAt: c.openedAt.toISOString(),
        resolvedAt: c.resolvedAt?.toISOString(),
        disposition: c.disposition ?? undefined,
        actions: c.actions.map((a) => ({
          id: a.id,
          caseId: a.caseId,
          reviewerId: a.reviewerId,
          reviewerName: a.reviewerId,
          action: a.action as ReviewActionRecord["action"],
          reason: a.reason,
          supplementalEvidenceIds: (a.supplementalEvidenceIds as string[]) ?? [],
          createdAt: a.createdAt.toISOString()
        }))
      }));
    }

    let items = [...this.memoryCases.values()];
    if (query?.status) items = items.filter((c) => c.status === query.status);
    if (query?.ruleCode) items = items.filter((c) => c.ruleCode === query.ruleCode);
    return items;
  }

  async getCase(caseId: string): Promise<ReviewCaseRecord> {
    if (this.prisma) {
      const c = await this.prisma.reviewCase.findUnique({
        where: { id: caseId },
        include: {
          actions: {
            orderBy: { createdAt: "asc" }
          }
        }
      });

      if (!c) throw new NotFoundException(`Không tìm thấy hồ sơ cảnh báo ${caseId}.`);

      return {
        id: c.id,
        batchId: c.batchId,
        eventId: c.eventId ?? undefined,
        ruleCode: c.ruleCode,
        severity: c.severity as "INFO" | "WARNING" | "CRITICAL",
        status: c.status as ReviewCaseStatus,
        assignedTo: c.assignedTo ?? undefined,
        title: c.title,
        explanation: c.explanation,
        expected: (c.expected as Record<string, unknown>) ?? undefined,
        observed: (c.observed as Record<string, unknown>) ?? undefined,
        openedAt: c.openedAt.toISOString(),
        resolvedAt: c.resolvedAt?.toISOString(),
        disposition: c.disposition ?? undefined,
        actions: c.actions.map((a) => ({
          id: a.id,
          caseId: a.caseId,
          reviewerId: a.reviewerId,
          reviewerName: a.reviewerId,
          action: a.action as ReviewActionRecord["action"],
          reason: a.reason,
          supplementalEvidenceIds: (a.supplementalEvidenceIds as string[]) ?? [],
          createdAt: a.createdAt.toISOString()
        }))
      };
    }

    const c = this.memoryCases.get(caseId);
    if (!c) throw new NotFoundException("Case not found");
    return c;
  }

  async requestEvidence(dto: RequestEvidenceDto): Promise<ReviewCaseRecord> {
    if (!dto.reason || dto.reason.trim().length === 0) {
      throw new BadRequestException("Phải nêu rõ yêu cầu bổ sung bằng chứng.");
    }

    if (this.prisma) {
      const c = await this.prisma.reviewCase.findUnique({ where: { id: dto.caseId } });
      if (!c) throw new NotFoundException("Case not found");

      await this.prisma.reviewAction.create({
        data: {
          caseId: dto.caseId,
          reviewerId: dto.reviewerId,
          action: "REQUEST_EVIDENCE",
          reason: dto.reason
        }
      });

      const updated = await this.prisma.reviewCase.update({
        where: { id: dto.caseId },
        data: { status: "NEED_EVIDENCE" }
      });

      return this.getCase(updated.id);
    }

    const c = this.memoryCases.get(dto.caseId);
    if (!c) throw new NotFoundException("Case not found");

    c.status = "NEED_EVIDENCE";
    c.actions.push({
      id: `act-${Date.now()}`,
      caseId: c.id,
      reviewerId: dto.reviewerId,
      reviewerName: dto.reviewerName ?? dto.reviewerId,
      action: "REQUEST_EVIDENCE",
      reason: dto.reason,
      createdAt: new Date().toISOString()
    });
    return c;
  }

  async resolveCase(dto: ResolveCaseDto): Promise<ReviewCaseRecord> {
    if (!dto.reason || dto.reason.trim().length === 0) {
      throw new BadRequestException("Phải nêu rõ căn cứ và lý do quyết định giải quyết hồ sơ cảnh báo.");
    }

    if (this.prisma) {
      const c = await this.prisma.reviewCase.findUnique({ where: { id: dto.caseId } });
      if (!c) throw new NotFoundException("Case not found");

      await this.prisma.reviewAction.create({
        data: {
          caseId: dto.caseId,
          reviewerId: dto.reviewerId,
          action: "RESOLVE",
          reason: dto.reason
        }
      });

      const updated = await this.prisma.reviewCase.update({
        where: { id: dto.caseId },
        data: {
          status: "RESOLVED",
          resolvedAt: new Date(),
          disposition: dto.disposition
        }
      });

      return this.getCase(updated.id);
    }

    const c = this.memoryCases.get(dto.caseId);
    if (!c) throw new NotFoundException("Case not found");

    c.status = "RESOLVED";
    c.resolvedAt = new Date().toISOString();
    c.disposition = dto.disposition;
    c.actions.push({
      id: `act-${Date.now()}`,
      caseId: c.id,
      reviewerId: dto.reviewerId,
      reviewerName: dto.reviewerName ?? dto.reviewerId,
      action: "RESOLVE",
      reason: dto.reason,
      createdAt: new Date().toISOString()
    });
    return c;
  }

  // Memory fixture helper for testing
  seedMemoryCase(record: ReviewCaseRecord) {
    this.memoryCases.set(record.id, record);
  }
}
