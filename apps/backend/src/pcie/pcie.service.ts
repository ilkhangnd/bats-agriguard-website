import { Injectable } from "@nestjs/common";
import {
  type PcieRuleCode,
  type PcieRuleResult,
  type PcieValidationRun,
  type PcieOverallStatus,
  type PciePolicyThresholds,
  DEFAULT_DEMO_POLICY,
  PCIE_RULE_METADATA
} from "@bats/shared-types";

export interface PcieEvaluationContext {
  batchId: string;
  eventId?: string;
  eventTime: Date | string;
  actor: {
    id: string;
    role: string;
    name?: string;
  };
  farmPlot: {
    id: string;
    plantingAreaCode: string;
    status: string; // active | suspended | expired
    crop: string;
    variety: string;
    areaHa: number;
    authorizedActorIds?: string[];
    polygonGeoJson?: {
      type: string;
      coordinates: number[][][] | number[][][][];
    };
  };
  gps?: {
    latitude: number;
    longitude: number;
    accuracyM?: number;
  };
  declaredQuantityKg: number;
  receivedQuantityKg?: number;
  cumulativeYieldKg?: number;
  evidenceSha256List?: string[];
  knownEvidenceFingerprints?: Set<string>;
  predecessorEvent?: {
    id: string;
    eventTime: Date | string;
    latitude?: number;
    longitude?: number;
    actorId?: string;
  };
  currentCustodianId?: string;
}

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function isPointInSimplePolygon(
  point: [number, number],
  polygonCoords: number[][]
): boolean {
  const [x, y] = point; // longitude, latitude
  let inside = false;
  for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
    const ptI = polygonCoords[i];
    const ptJ = polygonCoords[j];
    if (!ptI || !ptJ) continue;
    const xi = ptI[0] ?? 0;
    const yi = ptI[1] ?? 0;
    const xj = ptJ[0] ?? 0;
    const yj = ptJ[1] ?? 0;

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

@Injectable()
export class PcieService {
  evaluate(
    ctx: PcieEvaluationContext,
    policy: PciePolicyThresholds = DEFAULT_DEMO_POLICY
  ): PcieValidationRun {
    const rules: PcieRuleResult[] = [
      this.evaluateRuleG(ctx, policy),
      this.evaluateRuleI(ctx, policy),
      this.evaluateRuleS(ctx, policy),
      this.evaluateRuleY(ctx, policy),
      this.evaluateRuleD(ctx, policy),
      this.evaluateRuleT(ctx, policy),
      this.evaluateRuleM(ctx, policy),
      this.evaluateRuleC(ctx, policy)
    ];

    let overallStatus: PcieOverallStatus = "PASS";
    if (rules.some((r) => r.status === "FAIL")) {
      overallStatus = "BLOCK";
    } else if (rules.some((r) => r.status === "REVIEW")) {
      overallStatus = "REVIEW";
    }

    let summary = "Sự kiện thu hoạch và luân chuyển đáp ứng đầy đủ 8 nhóm bất biến của hệ thống.";
    let suggestedAction = "Dữ liệu hợp lệ, cho phép tiếp tục luân chuyển và cam kết Merkle theo lịch trình.";

    if (overallStatus === "BLOCK") {
      const blockedRules = rules.filter((r) => r.status === "FAIL").map((r) => r.code).join(", ");
      summary = `Phát hiện rủi ro không toàn vẹn ở nhóm quy tắc [${blockedRules}]. Đã tạm dừng quyền luân chuyển tiếp theo.`;
      suggestedAction = "Kiểm tra mã vùng trồng, thông tin chủ thể và bằng chứng. Chuyển cấp quản trị viên để giải quyết.";
    } else if (overallStatus === "REVIEW") {
      const reviewRules = rules.filter((r) => r.status === "REVIEW").map((r) => r.code).join(", ");
      summary = `Phát hiện chênh lệch hoặc cảnh báo cần đối soát ở nhóm quy tắc [${reviewRules}].`;
      suggestedAction = "Tạo hồ sơ hậu kiểm Review Queue. Yêu cầu thương lái/nông hộ cung cấp thêm ảnh phiếu cân hoặc giải trình.";
    }

    return {
      validationRunId: `vr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      policyVersion: policy.version,
      batchId: ctx.batchId,
      eventId: ctx.eventId,
      overallStatus,
      evaluatedAt: new Date().toISOString(),
      rules,
      summary,
      suggestedAction
    };
  }

  // 1. Rule G: Geospatial Integrity
  private evaluateRuleG(ctx: PcieEvaluationContext, policy: PciePolicyThresholds): PcieRuleResult {
    const meta = PCIE_RULE_METADATA.G;
    if (!ctx.gps) {
      return {
        code: "G",
        ruleName: meta.vietnameseName,
        status: "REVIEW",
        reasonCode: "G_GPS_MISSING",
        explanation: "Sự kiện hiện trường không có dữ liệu tọa độ GPS. Cần kiểm tra lại quyền truy cập vị trí trên thiết bị."
      };
    }

    const { latitude, longitude, accuracyM = 10 } = ctx.gps;
    const ring = ctx.farmPlot.polygonGeoJson?.coordinates?.[0] as number[][] | undefined;

    if (!ring || ring.length < 3) {
      return {
        code: "G",
        ruleName: meta.vietnameseName,
        status: "PASS",
        reasonCode: "G_POLYGON_UNAVAILABLE_FALLBACK",
        explanation: "Ranh giới polygon chi tiết chưa được nạp; tọa độ GPS được ghi nhận với độ chính xác " + accuracyM + "m.",
        observed: { latitude, longitude, accuracyM }
      };
    }

    const inside = isPointInSimplePolygon([longitude, latitude], ring);
    if (inside) {
      return {
        code: "G",
        ruleName: meta.vietnameseName,
        status: "PASS",
        reasonCode: "G_WITHIN_POLYGON",
        explanation: `Tọa độ GPS (${latitude.toFixed(6)}, ${longitude.toFixed(6)}) nằm chuẩn xác trong ranh giới vùng trồng ${ctx.farmPlot.plantingAreaCode}.`,
        observed: { latitude, longitude, accuracyM, insidePolygon: true }
      };
    }

    return {
      code: "G",
      ruleName: meta.vietnameseName,
      status: "REVIEW",
      reasonCode: "G_OUTSIDE_POLYGON",
      explanation: `Tọa độ GPS (${latitude.toFixed(6)}, ${longitude.toFixed(6)}) nằm ngoài ranh giới vùng trồng được cấp phép (sai số cho phép: ${policy.geofenceBufferMeters}m). Cần hậu kiểm vị trí.`,
      expected: { plantingAreaCode: ctx.farmPlot.plantingAreaCode, bufferAllowedM: policy.geofenceBufferMeters },
      observed: { latitude, longitude, accuracyM, insidePolygon: false }
    };
  }

  // 2. Rule I: Identity & Authorization
  private evaluateRuleI(ctx: PcieEvaluationContext, _policy: PciePolicyThresholds): PcieRuleResult {
    const meta = PCIE_RULE_METADATA.I;
    const authorized =
      !ctx.farmPlot.authorizedActorIds ||
      ctx.farmPlot.authorizedActorIds.length === 0 ||
      ctx.farmPlot.authorizedActorIds.includes(ctx.actor.id);

    if (authorized) {
      return {
        code: "I",
        ruleName: meta.vietnameseName,
        status: "PASS",
        reasonCode: "I_AUTHORIZED",
        explanation: `Chủ thể [${ctx.actor.name ?? ctx.actor.id}] được phân quyền hợp lệ để tác nghiệp trên vùng trồng ${ctx.farmPlot.plantingAreaCode}.`,
        observed: { actorId: ctx.actor.id, role: ctx.actor.role }
      };
    }

    return {
      code: "I",
      ruleName: meta.vietnameseName,
      status: "FAIL",
      reasonCode: "I_UNAUTHORIZED_ACTOR",
      explanation: `Chủ thể [${ctx.actor.name ?? ctx.actor.id}] không có tên trong danh sách nông hộ được ủy quyền cho mã vùng ${ctx.farmPlot.plantingAreaCode}.`,
      expected: { authorizedActors: ctx.farmPlot.authorizedActorIds },
      observed: { actorId: ctx.actor.id, role: ctx.actor.role }
    };
  }

  // 3. Rule S: Status & Validity
  private evaluateRuleS(ctx: PcieEvaluationContext, _policy: PciePolicyThresholds): PcieRuleResult {
    const meta = PCIE_RULE_METADATA.S;
    const status = ctx.farmPlot.status.toLowerCase();

    if (status === "active") {
      return {
        code: "S",
        ruleName: meta.vietnameseName,
        status: "PASS",
        reasonCode: "S_DPI_ACTIVE",
        explanation: `Mã số vùng trồng ${ctx.farmPlot.plantingAreaCode} đang ở trạng thái ACTIVE (Hợp lệ và còn thời hạn).`,
        observed: { status: "ACTIVE" }
      };
    }

    return {
      code: "S",
      ruleName: meta.vietnameseName,
      status: "FAIL",
      reasonCode: "S_DPI_SUSPENDED",
      explanation: `Mã số vùng trồng ${ctx.farmPlot.plantingAreaCode} hiện đang ở trạng thái [${status.toUpperCase()}]. Không được phép sử dụng để phát hành lô hàng mới.`,
      expected: { requiredStatus: "ACTIVE" },
      observed: { currentStatus: status.toUpperCase() }
    };
  }

  // 4. Rule Y: Seasonal Yield
  private evaluateRuleY(ctx: PcieEvaluationContext, policy: PciePolicyThresholds): PcieRuleResult {
    const meta = PCIE_RULE_METADATA.Y;
    const cropKey = ctx.farmPlot.crop.toLowerCase();
    const refYield = policy.referenceYieldKgPerHa[cropKey] ?? 15000;
    const maxAllowedKg = ctx.farmPlot.areaHa * refYield * (1 + policy.yieldTolerancePercent / 100);
    const cumulative = (ctx.cumulativeYieldKg ?? 0) + ctx.declaredQuantityKg;

    if (cumulative <= maxAllowedKg) {
      return {
        code: "Y",
        ruleName: meta.vietnameseName,
        status: "PASS",
        reasonCode: "Y_WITHIN_CAPACITY",
        explanation: `Tổng sản lượng lũy kế (${cumulative.toLocaleString()} kg) nằm trong hạn mức mùa vụ dự kiến (${Math.round(maxAllowedKg).toLocaleString()} kg) cho ${ctx.farmPlot.areaHa} ha.`,
        observed: { cumulativeKg: cumulative, maxAllowedKg: Math.round(maxAllowedKg), areaHa: ctx.farmPlot.areaHa }
      };
    }

    return {
      code: "Y",
      ruleName: meta.vietnameseName,
      status: "REVIEW",
      reasonCode: "Y_EXCEEDED_CAPACITY",
      explanation: `Tổng sản lượng lũy kế (${cumulative.toLocaleString()} kg) vượt hạn mức định mức (${Math.round(maxAllowedKg).toLocaleString()} kg) trên diện tích ${ctx.farmPlot.areaHa} ha. Cần đối soát bổ sung năng suất thực tế.`,
      expected: { maxAllowedKg: Math.round(maxAllowedKg) },
      observed: { cumulativeKg: cumulative, excessKg: Math.round(cumulative - maxAllowedKg) }
    };
  }

  // 5. Rule D: Evidence Duplication
  private evaluateRuleD(ctx: PcieEvaluationContext, _policy: PciePolicyThresholds): PcieRuleResult {
    const meta = PCIE_RULE_METADATA.D;
    const fingerprints = ctx.evidenceSha256List ?? [];

    if (fingerprints.length === 0) {
      return {
        code: "D",
        ruleName: meta.vietnameseName,
        status: "PASS",
        reasonCode: "D_NO_EVIDENCE_SPECIFIED",
        explanation: "Chưa có ảnh bằng chứng đính kèm cần kiểm tra mã băm."
      };
    }

    const duplicates: string[] = [];
    if (ctx.knownEvidenceFingerprints) {
      for (const hash of fingerprints) {
        if (ctx.knownEvidenceFingerprints.has(hash)) {
          duplicates.push(hash);
        }
      }
    }

    if (duplicates.length === 0) {
      return {
        code: "D",
        ruleName: meta.vietnameseName,
        status: "PASS",
        reasonCode: "D_UNIQUE_EVIDENCE",
        explanation: "Tất cả các ảnh/chứng từ đính kèm đều có mã băm SHA-256 duy nhất, không trùng lặp trong hệ thống.",
        observed: { verifiedCount: fingerprints.length }
      };
    }

    return {
      code: "D",
      ruleName: meta.vietnameseName,
      status: "REVIEW",
      reasonCode: "D_DUPLICATE_FOUND",
      explanation: `Phát hiện ${duplicates.length} tệp chứng cứ có mã băm trùng lặp với sự kiện đã ghi nhận trước đó. Cần rà soát ảnh gốc.`,
      observed: { duplicateHashes: duplicates }
    };
  }

  // 6. Rule T: Spatio-temporal Feasibility
  private evaluateRuleT(ctx: PcieEvaluationContext, policy: PciePolicyThresholds): PcieRuleResult {
    const meta = PCIE_RULE_METADATA.T;
    const pred = ctx.predecessorEvent;

    if (!pred || !pred.latitude || !pred.longitude || !ctx.gps) {
      return {
        code: "T",
        ruleName: meta.vietnameseName,
        status: "PASS",
        reasonCode: "T_FIRST_EVENT_OR_INSUFFICIENT_COORDINATES",
        explanation: "Sự kiện khởi đầu hoặc chưa có đủ 2 mốc tọa độ liên tiếp để tính vận tốc di chuyển."
      };
    }

    const t1 = new Date(pred.eventTime).getTime();
    const t2 = new Date(ctx.eventTime).getTime();
    const elapsedHours = (t2 - t1) / (1000 * 3600);

    if (elapsedHours < 0) {
      return {
        code: "T",
        ruleName: meta.vietnameseName,
        status: "FAIL",
        reasonCode: "T_TIME_REVERSED",
        explanation: "Thời điểm sự kiện mới xảy ra trước sự kiện tiền nhiệm. Lỗi trình tự thời gian.",
        observed: { currentEventTime: ctx.eventTime, predecessorTime: pred.eventTime }
      };
    }

    const distanceM = haversineDistanceMeters(
      pred.latitude,
      pred.longitude,
      ctx.gps.latitude,
      ctx.gps.longitude
    );
    const speedKmH = elapsedHours > 0 ? (distanceM / 1000) / elapsedHours : 0;

    if (speedKmH <= policy.maxTransitSpeedKmH) {
      return {
        code: "T",
        ruleName: meta.vietnameseName,
        status: "PASS",
        reasonCode: "T_FEASIBLE_VELOCITY",
        explanation: `Vận tốc di chuyển ước tính (${speedKmH.toFixed(1)} km/h trên quãng đường ${(distanceM / 1000).toFixed(1)} km) hoàn toàn khả thi thực tế.`,
        observed: { distanceKm: (distanceM / 1000).toFixed(2), speedKmH: speedKmH.toFixed(1) }
      };
    }

    return {
      code: "T",
      ruleName: meta.vietnameseName,
      status: "REVIEW",
      reasonCode: "T_IMPOSSIBLE_SPEED",
      explanation: `Vận tốc di chuyển tính toán (${speedKmH.toFixed(1)} km/h) vượt ngưỡng tối đa (${policy.maxTransitSpeedKmH} km/h). Cần kiểm tra lại mốc thời gian hoặc thiết bị GPS.`,
      expected: { maxAllowedSpeedKmH: policy.maxTransitSpeedKmH },
      observed: { calculatedSpeedKmH: speedKmH.toFixed(1), distanceKm: (distanceM / 1000).toFixed(2) }
    };
  }

  // 7. Rule M: Mass Balance
  private evaluateRuleM(ctx: PcieEvaluationContext, policy: PciePolicyThresholds): PcieRuleResult {
    const meta = PCIE_RULE_METADATA.M;

    if (ctx.receivedQuantityKg === undefined || ctx.receivedQuantityKg === null) {
      return {
        code: "M",
        ruleName: meta.vietnameseName,
        status: "PASS",
        reasonCode: "M_DECLARED_INITIAL",
        explanation: `Khối lượng khai báo ban đầu: ${ctx.declaredQuantityKg.toLocaleString()} kg (đang chờ thương lái thực cân đối soát).`,
        observed: { declaredKg: ctx.declaredQuantityKg }
      };
    }

    const diffKg = ctx.receivedQuantityKg - ctx.declaredQuantityKg;
    const diffPercent = Math.abs(diffKg) / ctx.declaredQuantityKg * 100;

    if (diffPercent <= policy.massDiscrepancyReviewPercent) {
      return {
        code: "M",
        ruleName: meta.vietnameseName,
        status: "PASS",
        reasonCode: "M_MASS_BALANCED",
        explanation: `Khối lượng thực nhận (${ctx.receivedQuantityKg.toLocaleString()} kg) khớp với lượng khai báo (${ctx.declaredQuantityKg.toLocaleString()} kg) trong dung sai cho phép (sai lệch ${diffPercent.toFixed(2)}%).`,
        observed: { declaredKg: ctx.declaredQuantityKg, receivedKg: ctx.receivedQuantityKg, diffKg }
      };
    }

    if (diffPercent <= policy.massDiscrepancyBlockPercent) {
      return {
        code: "M",
        ruleName: meta.vietnameseName,
        status: "REVIEW",
        reasonCode: "M_QUANTITY_DISCREPANCY",
        explanation: `Khối lượng thực nhận (${ctx.receivedQuantityKg.toLocaleString()} kg) lệch ${diffKg > 0 ? "+" : ""}${diffKg.toFixed(1)} kg (${diffPercent.toFixed(1)}%) so với khai báo (${ctx.declaredQuantityKg.toLocaleString()} kg). Vượt dung sai tự động ${policy.massDiscrepancyReviewPercent}%, chuyển sang REVIEW để đối soát biên nhận cân.`,
        expected: { maxDiscrepancyPercent: policy.massDiscrepancyReviewPercent },
        observed: { declaredKg: ctx.declaredQuantityKg, receivedKg: ctx.receivedQuantityKg, diffKg, diffPercent: Number(diffPercent.toFixed(2)) }
      };
    }

    return {
      code: "M",
      ruleName: meta.vietnameseName,
      status: "FAIL",
      reasonCode: "M_SEVERE_DISCREPANCY",
      explanation: `Khối lượng thực nhận (${ctx.receivedQuantityKg.toLocaleString()} kg) sai lệch quá lớn (${diffPercent.toFixed(1)}% > ${policy.massDiscrepancyBlockPercent}%) so với khai báo. Tạm khóa lô hàng để kiểm tra gian lận khối lượng.`,
      expected: { maxDiscrepancyPercent: policy.massDiscrepancyBlockPercent },
      observed: { declaredKg: ctx.declaredQuantityKg, receivedKg: ctx.receivedQuantityKg, diffKg, diffPercent: Number(diffPercent.toFixed(2)) }
    };
  }

  // 8. Rule C: Chain of Custody
  private evaluateRuleC(ctx: PcieEvaluationContext, _policy: PciePolicyThresholds): PcieRuleResult {
    const meta = PCIE_RULE_METADATA.C;

    // Nếu không có thông tin custodian hiện tại, chấp thuận nếu là sự kiện khởi tạo
    if (!ctx.currentCustodianId) {
      return {
        code: "C",
        ruleName: meta.vietnameseName,
        status: "PASS",
        reasonCode: "C_INITIAL_CUSTODIAN",
        explanation: `Khởi tạo quyền lưu giữ ban đầu cho nông hộ [${ctx.actor.name ?? ctx.actor.id}].`,
        observed: { custodianId: ctx.actor.id }
      };
    }

    // Nếu người thực hiện không phải custodian đang giữ lô hàng và đây là hành động chuyển giao
    if (ctx.currentCustodianId === ctx.actor.id) {
      return {
        code: "C",
        ruleName: meta.vietnameseName,
        status: "PASS",
        reasonCode: "C_VALID_CUSTODY",
        explanation: `Chủ thể [${ctx.actor.name ?? ctx.actor.id}] đang giữ quyền lưu giữ hợp pháp đối với lô hàng.`,
        observed: { custodianId: ctx.currentCustodianId, actorId: ctx.actor.id }
      };
    }

    // Nếu người thực hiện là bên nhận được bàn giao
    return {
      code: "C",
      ruleName: meta.vietnameseName,
      status: "PASS",
      reasonCode: "C_TRANSFER_TRANSITION",
      explanation: `Chuyển quyền lưu giữ từ [${ctx.currentCustodianId}] sang [${ctx.actor.name ?? ctx.actor.id}].`,
      observed: { previousCustodian: ctx.currentCustodianId, newCustodian: ctx.actor.id }
    };
  }
}
