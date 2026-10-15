/**
 * BATS-AgriGuard — Plantation Code Integrity Engine (PCIE) Type Definitions
 * 8 Invariant Groups: G, I, S, Y, D, T, M, C
 * Evaluation Output: PASS | REVIEW | BLOCK
 */

export type PcieRuleCode = "G" | "I" | "S" | "Y" | "D" | "T" | "M" | "C";

export type PcieRuleStatus = "PASS" | "REVIEW" | "FAIL" | "NOT_EVALUATED";

export type PcieOverallStatus = "PASS" | "REVIEW" | "BLOCK";

export interface PcieRuleMeta {
  code: PcieRuleCode;
  name: string;
  vietnameseName: string;
  description: string;
}

export const PCIE_RULE_METADATA: Record<PcieRuleCode, PcieRuleMeta> = {
  G: {
    code: "G",
    name: "Geospatial Integrity",
    vietnameseName: "Tính toàn vẹn Không gian / Geofence",
    description: "Kiểm tra tọa độ GPS hiện trường nằm trong ranh giới polygon của mã số vùng trồng được cấp phép."
  },
  I: {
    code: "I",
    name: "Identity & Authorization",
    vietnameseName: "Chủ thể & Phân quyền Ủy quyền",
    description: "Kiểm tra tài khoản thực hiện sự kiện có được ủy quyền hợp lệ trên mã vùng trồng tại thời điểm sự kiện."
  },
  S: {
    code: "S",
    name: "Status & Validity",
    vietnameseName: "Hiệu lực & Trạng thái Mã vùng",
    description: "Kiểm tra trạng thái mã số vùng trồng (ACTIVE/SUSPENDED/EXPIRED) tại thời điểm diễn ra sự kiện."
  },
  Y: {
    code: "Y",
    name: "Seasonal Yield",
    vietnameseName: "Hạn mức Năng suất Mùa vụ",
    description: "Đối soát sản lượng thu hoạch lũy kế không vượt quá công suất định mức theo diện tích và giống cây trồng."
  },
  D: {
    code: "D",
    name: "Evidence Duplication",
    vietnameseName: "Chống Trùng lặp Bằng chứng",
    description: "Phát hiện việc tái sử dụng trái phép ảnh chụp hiện trường hoặc phiếu cân thông qua đối chiếu mã băm SHA-256."
  },
  T: {
    code: "T",
    name: "Spatio-temporal Feasibility",
    vietnameseName: "Tính khả thi Không - Thời gian",
    description: "Kiểm tra tính logic về khoảng cách và vận tốc di chuyển giữa hai sự kiện liên tiếp của cùng chủ thể."
  },
  M: {
    code: "M",
    name: "Mass Balance",
    vietnameseName: "Cân bằng Khối lượng",
    description: "Đối soát chênh lệch khối lượng giữa khai báo thu hoạch và biên nhận thực cân của thương lái/cơ sở thu mua."
  },
  C: {
    code: "C",
    name: "Chain of Custody",
    vietnameseName: "Quyền Lưu giữ & Chuỗi Hành trình",
    description: "Kiểm tra tính liên tục của quyền lưu giữ, đảm bảo sự kiện có tiền nhiệm hợp lệ và chuyển giao đúng thẩm quyền."
  }
};

export interface PcieRuleResult {
  code: PcieRuleCode;
  ruleName: string;
  status: PcieRuleStatus;
  reasonCode: string;
  explanation: string;
  expected?: Record<string, unknown> | null;
  observed?: Record<string, unknown> | null;
  appliedThreshold?: Record<string, unknown> | null;
  evidenceIds?: string[];
}

export interface PcieValidationRun {
  validationRunId: string;
  policyVersion: string;
  eventId?: string;
  batchId?: string;
  overallStatus: PcieOverallStatus;
  evaluatedAt: string;
  rules: PcieRuleResult[];
  summary: string;
  suggestedAction?: string;
}

export interface PciePolicyThresholds {
  version: string;
  geofenceBufferMeters: number;
  yieldTolerancePercent: number;
  maxTransitSpeedKmH: number;
  massDiscrepancyReviewPercent: number;
  massDiscrepancyBlockPercent: number;
  referenceYieldKgPerHa: Record<string, number>;
}

export const DEFAULT_DEMO_POLICY: PciePolicyThresholds = {
  version: "pcie-demo-v1",
  geofenceBufferMeters: 50,
  yieldTolerancePercent: 15,
  maxTransitSpeedKmH: 90,
  massDiscrepancyReviewPercent: 1.0,
  massDiscrepancyBlockPercent: 10.0,
  referenceYieldKgPerHa: {
    "durian-ri6": 15000,
    "durian-monthong": 18000,
    "durian": 15000
  }
};
