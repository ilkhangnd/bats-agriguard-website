/**
 * BATS-AgriGuard — Core Domain Data Models & Transfer/Review Contracts
 */

import type { PcieOverallStatus } from "./pcie.js";

export type OperationalStatus =
  | "CREATED"
  | "PENDING_RECEIPT"
  | "RECEIVED"
  | "IN_TRANSIT"
  | "PACKED"
  | "CLOSED"
  | "DISPUTED";

export type TransferStatus =
  | "PENDING_RECEIPT"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED";

export type ReviewCaseStatus =
  | "OPEN"
  | "IN_REVIEW"
  | "NEED_EVIDENCE"
  | "RESOLVED"
  | "ESCALATED";

export type SyncStatus = "QUEUED" | "SYNCING" | "SYNCED" | "FAILED";

export type AnchorStatus =
  | "NOT_ANCHORED"
  | "PENDING"
  | "ANCHORED"
  | "VERIFY_FAILED";

export type PlantationStatus = "ACTIVE" | "PENDING" | "SUSPENDED" | "EXPIRED";

export interface GeoPolygon {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
}

export interface PlantationVersionRecord {
  id: string;
  plantationId: string;
  version: number;
  polygon: GeoPolygon;
  areaHa: number;
  crop: string;
  variety?: string;
  validFrom: string;
  validTo: string;
  status: PlantationStatus;
  createdAt: string;
}

export interface PlantationRecord {
  id: string;
  code: string;
  organizationId: string;
  organizationName?: string;
  farmerId: string;
  farmerName: string;
  crop: string;
  variety: string;
  areaHa: number;
  province: string;
  district: string;
  commune: string;
  status: PlantationStatus;
  currentVersionId?: string;
  polygon: GeoPolygon;
  authorizedActorIds: string[];
}

export interface TransferRecord {
  id: string;
  batchId: string;
  senderActorId: string;
  senderName?: string;
  receiverActorId: string;
  receiverName?: string;
  quantityKg: number;
  declaredQuantityKg?: number;
  receivedQuantityKg?: number;
  status: TransferStatus;
  evidenceIds: string[];
  notes?: string;
  initiatedAt: string;
  decidedAt?: string;
  rejectionReason?: string;
}

export interface ReviewActionRecord {
  id: string;
  caseId: string;
  reviewerId: string;
  reviewerName: string;
  action: "REQUEST_EVIDENCE" | "RESOLVE" | "ESCALATE" | "COMMENT";
  reason: string;
  supplementalEvidenceIds?: string[];
  createdAt: string;
}

export interface ReviewCaseRecord {
  id: string;
  batchId: string;
  eventId?: string;
  ruleCode: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  status: ReviewCaseStatus;
  assignedTo?: string;
  assignedToName?: string;
  title: string;
  explanation: string;
  expected?: Record<string, unknown>;
  observed?: Record<string, unknown>;
  openedAt: string;
  resolvedAt?: string;
  disposition?: string;
  actions: ReviewActionRecord[];
}

export interface PublicProvenanceStep {
  step: "HARVEST" | "COLLECT" | "PACK" | "SHIP";
  stepName: string;
  occurredAt: string;
  locationGeneral: string;
  organizationGeneral: string;
  statusBadge: "VERIFIED" | "REVIEW_CLEARED" | "PENDING";
}

export interface PublicProjection {
  publicId: string;
  batchCode: string;
  cropName: string;
  variety: string;
  quantityKg: number;
  originRegion: string; // e.g. "Krông Pắc, Đắk Lắk" (General, PII-free)
  plantationCode: string;
  harvestDate: string;
  integrityStatus: "INTEGRITY_ANCHORED" | "VERIFIED_INTERNAL" | "PENDING_ANCHOR";
  merkleRootHash?: string;
  anchorBlockNumber?: string;
  anchorTxHash?: string;
  timeline: PublicProvenanceStep[];
  disclaimer: string;
}
