import { describe, expect, it } from "vitest";
import { PcieService, type PcieEvaluationContext } from "./pcie.service.js";

const polygonCoords = [
  [
    [108.122675, 12.678175],
    [108.124125, 12.678175],
    [108.124125, 12.679625],
    [108.122675, 12.679625],
    [108.122675, 12.678175]
  ]
];

describe("PcieService Unit Tests (8 Invariant Groups)", () => {
  const service = new PcieService();

  const baseContext: PcieEvaluationContext = {
    batchId: "BATS-2026-D01-PASS",
    eventId: "evt-001",
    eventTime: "2026-07-18T06:30:00Z",
    actor: {
      id: "FARMER-0001",
      role: "FARMER",
      name: "Nguyễn Văn Minh"
    },
    farmPlot: {
      id: "plot-dlk-0001",
      plantingAreaCode: "VN-DLK-PA-0001",
      status: "active",
      crop: "durian-ri6",
      variety: "Ri6",
      areaHa: 2.5265,
      authorizedActorIds: ["FARMER-0001"],
      polygonGeoJson: {
        type: "Polygon",
        coordinates: polygonCoords
      }
    },
    gps: {
      latitude: 12.6788,
      longitude: 108.1233,
      accuracyM: 5
    },
    declaredQuantityKg: 1250.000,
    receivedQuantityKg: 1250.000,
    cumulativeYieldKg: 0,
    evidenceSha256List: ["sha256-evidence-001"],
    knownEvidenceFingerprints: new Set()
  };

  it("Scenario D01: evaluates legitimate harvest and receive as overall PASS", () => {
    const run = service.evaluate(baseContext);

    expect(run.overallStatus).toBe("PASS");
    expect(run.rules.length).toBe(8);
    for (const rule of run.rules) {
      expect(rule.status).toBe("PASS");
    }
    expect(run.rules.find((r) => r.code === "G")?.reasonCode).toBe("G_WITHIN_POLYGON");
    expect(run.rules.find((r) => r.code === "M")?.reasonCode).toBe("M_MASS_BALANCED");
    expect(run.rules.find((r) => r.code === "S")?.reasonCode).toBe("S_DPI_ACTIVE");
  });

  it("Scenario D02: detects mass balance discrepancy (1250 kg vs 1230 kg) as REVIEW", () => {
    const ctx: PcieEvaluationContext = {
      ...baseContext,
      batchId: "BATS-2026-D02-REVIEW",
      receivedQuantityKg: 1230.000 // -20kg (-1.6%) > 1.0% tolerance
    };

    const run = service.evaluate(ctx);

    expect(run.overallStatus).toBe("REVIEW");
    const ruleM = run.rules.find((r) => r.code === "M");
    expect(ruleM?.status).toBe("REVIEW");
    expect(ruleM?.reasonCode).toBe("M_QUANTITY_DISCREPANCY");
    expect(ruleM?.observed?.diffKg).toBe(-20);
  });

  it("Scenario D03: blocks event when FarmPlot is SUSPENDED or EXPIRED", () => {
    const ctx: PcieEvaluationContext = {
      ...baseContext,
      batchId: "BATS-2026-D03-BLOCK",
      farmPlot: {
        ...baseContext.farmPlot,
        status: "suspended",
        plantingAreaCode: "VN-DLK-PA-9999"
      }
    };

    const run = service.evaluate(ctx);

    expect(run.overallStatus).toBe("BLOCK");
    const ruleS = run.rules.find((r) => r.code === "S");
    expect(ruleS?.status).toBe("FAIL");
    expect(ruleS?.reasonCode).toBe("S_DPI_SUSPENDED");
  });

  it("Rule G: flags GPS coordinates outside the farm polygon as REVIEW", () => {
    const ctx: PcieEvaluationContext = {
      ...baseContext,
      gps: {
        latitude: 12.999999, // Way outside Dak Lak plot
        longitude: 108.999999,
        accuracyM: 8
      }
    };

    const run = service.evaluate(ctx);

    const ruleG = run.rules.find((r) => r.code === "G");
    expect(ruleG?.status).toBe("REVIEW");
    expect(ruleG?.reasonCode).toBe("G_OUTSIDE_POLYGON");
  });

  it("Rule I: blocks unauthorized actor attempting to record harvest", () => {
    const ctx: PcieEvaluationContext = {
      ...baseContext,
      actor: {
        id: "UNKNOWN-ACTOR",
        role: "FARMER",
        name: "Người Lạ"
      }
    };

    const run = service.evaluate(ctx);

    expect(run.overallStatus).toBe("BLOCK");
    const ruleI = run.rules.find((r) => r.code === "I");
    expect(ruleI?.status).toBe("FAIL");
    expect(ruleI?.reasonCode).toBe("I_UNAUTHORIZED_ACTOR");
  });

  it("Rule T: detects impossible travel speed / reverse timestamps", () => {
    const ctx: PcieEvaluationContext = {
      ...baseContext,
      eventTime: "2026-07-18T06:30:00Z",
      predecessorEvent: {
        id: "evt-pred-01",
        eventTime: "2026-07-18T07:30:00Z", // Predecessor in the FUTURE!
        latitude: 12.6788,
        longitude: 108.1233
      }
    };

    const run = service.evaluate(ctx);

    expect(run.overallStatus).toBe("BLOCK");
    const ruleT = run.rules.find((r) => r.code === "T");
    expect(ruleT?.status).toBe("FAIL");
    expect(ruleT?.reasonCode).toBe("T_TIME_REVERSED");
  });

  it("Rule Y: flags cumulative yield exceeding farm capacity as REVIEW", () => {
    // 2.5265 ha * 15,000 kg/ha * 1.15 = 43,582 kg max allowed
    const ctx: PcieEvaluationContext = {
      ...baseContext,
      declaredQuantityKg: 50000.000, // Exceeds single or cumulative capacity
      receivedQuantityKg: 50000.000,
      cumulativeYieldKg: 0
    };

    const run = service.evaluate(ctx);

    expect(run.overallStatus).toBe("REVIEW");
    const ruleY = run.rules.find((r) => r.code === "Y");
    expect(ruleY?.status).toBe("REVIEW");
    expect(ruleY?.reasonCode).toBe("Y_EXCEEDED_CAPACITY");
  });

  it("Rule D: detects reused/duplicate evidence hash as REVIEW", () => {
    const knownHashes = new Set(["sha256-evidence-001"]);
    const ctx: PcieEvaluationContext = {
      ...baseContext,
      evidenceSha256List: ["sha256-evidence-001"],
      knownEvidenceFingerprints: knownHashes
    };

    const run = service.evaluate(ctx);

    expect(run.overallStatus).toBe("REVIEW");
    const ruleD = run.rules.find((r) => r.code === "D");
    expect(ruleD?.status).toBe("REVIEW");
    expect(ruleD?.reasonCode).toBe("D_DUPLICATE_FOUND");
  });

  it("Rule C: tracks initial custodian and custody transitions", () => {
    // Initial custodian
    const runInitial = service.evaluate(baseContext);
    const ruleCInitial = runInitial.rules.find((r) => r.code === "C");
    expect(ruleCInitial?.status).toBe("PASS");
    expect(ruleCInitial?.reasonCode).toBe("C_INITIAL_CUSTODIAN");

    // Existing custody maintained
    const ctxWithCustodian: PcieEvaluationContext = {
      ...baseContext,
      currentCustodianId: "FARMER-0001"
    };
    const runValid = service.evaluate(ctxWithCustodian);
    const ruleCValid = runValid.rules.find((r) => r.code === "C");
    expect(ruleCValid?.status).toBe("PASS");
    expect(ruleCValid?.reasonCode).toBe("C_VALID_CUSTODY");

    // Custody transition to new actor
    const ctxTransition: PcieEvaluationContext = {
      ...baseContext,
      currentCustodianId: "FARMER-0001",
      actor: {
        id: "COLLECTOR-0001",
        role: "COLLECTOR",
        name: "Trần Thu Mua"
      }
    };
    const runTransition = service.evaluate(ctxTransition);
    const ruleCTransition = runTransition.rules.find((r) => r.code === "C");
    expect(ruleCTransition?.status).toBe("PASS");
    expect(ruleCTransition?.reasonCode).toBe("C_TRANSFER_TRANSITION");
  });
});

