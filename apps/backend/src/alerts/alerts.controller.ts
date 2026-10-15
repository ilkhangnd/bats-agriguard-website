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
import { AlertsService } from "./alerts.service.js";
import { AccessGuard, type ActorRequest, Roles } from "../access.guard.js";

export class RequestEvidenceBody {
  reason!: string;
}

export class ResolveCaseBody {
  disposition!: string;
  reason!: string;
}

export class SubmitEvidenceBody {
  evidenceIds!: string[];
  notes?: string;
}

@Controller("alerts")
@ApiTags("Review Queue & Alerts")
export class AlertsController {
  constructor(@Inject(AlertsService) private readonly alerts: AlertsService) {}

  @Get()
  @ApiOperation({ summary: "Danh sách hồ sơ cảnh báo & Review Queue" })
  listCases(
    @Query("status") status?: string,
    @Query("ruleCode") ruleCode?: string
  ) {
    return this.alerts.listCases({ status, ruleCode });
  }

  @Get(":id")
  @ApiOperation({ summary: "Chi tiết hồ sơ cảnh báo kèm nhật ký kiểm toán hành động" })
  getCase(@Param("id") id: string) {
    return this.alerts.getCase(id);
  }

  @Post(":id/request-evidence")
  @ApiBearerAuth("actor-token")
  @ApiOperation({ summary: "Thẩm tra viên yêu cầu nộp bổ sung bằng chứng (REQUEST_EVIDENCE)" })
  @UseGuards(AccessGuard)
  @Roles("COOPERATIVE", "ADMIN")
  requestEvidence(
    @Param("id") id: string,
    @Body() body: RequestEvidenceBody,
    @Req() request: ActorRequest
  ) {
    return this.alerts.requestEvidence({
      caseId: id,
      reviewerId: request.actor!.id,
      reviewerName: request.actor!.name,
      reason: body.reason
    });
  }

  @Post(":id/submit-evidence")
  @ApiBearerAuth("actor-token")
  @ApiOperation({ summary: "Chủ thể nộp bổ sung bằng chứng giải trình" })
  @UseGuards(AccessGuard)
  submitEvidence(
    @Param("id") id: string,
    @Body() body: SubmitEvidenceBody,
    @Req() request: ActorRequest
  ) {
    return this.alerts.requestEvidence({
      caseId: id,
      reviewerId: request.actor!.id,
      reviewerName: request.actor!.name,
      reason: `[Bổ sung bằng chứng từ ${request.actor!.name}]: ${body.notes ?? ""}`.trim()
    });
  }

  @Post(":id/resolve")
  @ApiBearerAuth("actor-token")
  @ApiOperation({ summary: "Thẩm tra viên đưa ra quyết định giải quyết hồ sơ (RESOLVE)" })
  @UseGuards(AccessGuard)
  @Roles("COOPERATIVE", "ADMIN")
  resolveCase(
    @Param("id") id: string,
    @Body() body: ResolveCaseBody,
    @Req() request: ActorRequest
  ) {
    return this.alerts.resolveCase({
      caseId: id,
      reviewerId: request.actor!.id,
      reviewerName: request.actor!.name,
      disposition: body.disposition,
      reason: body.reason
    });
  }
}
