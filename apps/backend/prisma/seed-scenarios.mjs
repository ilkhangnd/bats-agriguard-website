import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const polygonValid = {
  type: "Polygon",
  coordinates: [
    [
      [108.122675, 12.678175],
      [108.124125, 12.678175],
      [108.124125, 12.679625],
      [108.122675, 12.679625],
      [108.122675, 12.678175]
    ]
  ]
};

const polygonSuspended = {
  type: "Polygon",
  coordinates: [
    [
      [108.130000, 12.680000],
      [108.132000, 12.680000],
      [108.132000, 12.682000],
      [108.130000, 12.682000],
      [108.130000, 12.680000]
    ]
  ]
};

async function main() {
  console.log("🌱 Bắt đầu nạp dữ liệu mẫu BATS-AgriGuard (Demo Scenarios Seed)...");

  // 1. Tổ chức (Organizations)
  await prisma.organization.upsert({
    where: { id: "org-ea-yong" },
    update: {},
    create: {
      id: "org-ea-yong",
      name: "HTX Nông Nghiệp Ea Yông",
      type: "COOPERATIVE",
      status: "active"
    }
  });

  await prisma.organization.upsert({
    where: { id: "org-vua-taynguyen" },
    update: {},
    create: {
      id: "org-vua-taynguyen",
      name: "Vựa Thu Mua Tây Nguyên",
      type: "BUYER",
      status: "active"
    }
  });

  // 2. Chủ thể (Actors)
  await prisma.actor.upsert({
    where: { id: "ADMIN-0001" },
    update: {},
    create: {
      id: "ADMIN-0001",
      name: "BATS Administrator",
      email: "admin@bats.vn",
      role: "ADMIN",
      organization: "BATS System Admin",
      status: "active"
    }
  });

  await prisma.actor.upsert({
    where: { id: "FARMER-0001" },
    update: {},
    create: {
      id: "FARMER-0001",
      name: "Nguyễn Văn Minh",
      phone: "0900000001",
      role: "FARMER",
      organization: "HTX Ea Yông",
      status: "active"
    }
  });

  await prisma.actor.upsert({
    where: { id: "COLLECTOR-0001" },
    update: {},
    create: {
      id: "COLLECTOR-0001",
      name: "Trần Quốc Toàn",
      phone: "0900000002",
      role: "COLLECTOR",
      organization: "Vựa Thu Mua Tây Nguyên",
      status: "active"
    }
  });

  await prisma.actor.upsert({
    where: { id: "REVIEWER-0001" },
    update: {},
    create: {
      id: "REVIEWER-0001",
      name: "Lê Hoàng Yến",
      email: "reviewer@bats.vn",
      phone: "0900000003",
      role: "REVIEWER",
      organization: "Chi cục Trồng trọt & BVTV Đắk Lắk",
      status: "active"
    }
  });

  // 3. Vùng trồng (FarmPlots)
  await prisma.$executeRaw`
    INSERT INTO farm_plots (
      id, farmer_id, farmer_name, planting_area_code, crop, variety, area_ha,
      province, district, commune, polygon_geojson, polygon, status, created_at, updated_at
    )
    VALUES (
      'plot-dlk-0001', 'FARMER-0001', 'Nguyễn Văn Minh', 'VN-DLK-PA-0001',
      'durian', 'Ri6', 2.5265, 'Đắk Lắk', 'Krông Pắc', 'Ea Yông',
      ${JSON.stringify(polygonValid)}::jsonb,
      ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(polygonValid)}), 4326),
      'active', now(), now()
    )
    ON CONFLICT (id) DO UPDATE SET
      area_ha = EXCLUDED.area_ha,
      polygon_geojson = EXCLUDED.polygon_geojson,
      polygon = EXCLUDED.polygon,
      status = 'active',
      updated_at = now()
  `;

  await prisma.$executeRaw`
    INSERT INTO farm_plots (
      id, farmer_id, farmer_name, planting_area_code, crop, variety, area_ha,
      province, district, commune, polygon_geojson, polygon, status, created_at, updated_at
    )
    VALUES (
      'plot-dlk-9999', 'FARMER-0001', 'Nguyễn Văn Minh', 'VN-DLK-PA-9999',
      'durian', 'Monthong', 1.5000, 'Đắk Lắk', 'Krông Pắc', 'Ea Yông',
      ${JSON.stringify(polygonSuspended)}::jsonb,
      ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(polygonSuspended)}), 4326),
      'suspended', now(), now()
    )
    ON CONFLICT (id) DO UPDATE SET
      status = 'suspended',
      updated_at = now()
  `;

  // 4. Phiên bản vùng trồng (PlantationVersion)
  await prisma.plantationVersion.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      farmPlotId: "plot-dlk-0001",
      version: 1,
      polygonGeoJson: polygonValid,
      areaHa: 2.5265,
      crop: "durian",
      variety: "Ri6",
      validFrom: new Date("2026-01-01T00:00:00Z"),
      validTo: new Date("2026-12-31T23:59:59Z"),
      status: "active"
    }
  });

  // 5. Kịch bản D01 (PASS): Thu hoạch Ri6 hợp lệ
  await prisma.batch.upsert({
    where: { id: "BATS-2026-D01-PASS" },
    update: {
      status: "collected",
      pcieStatus: "PASS",
      custodianId: "COLLECTOR-0001"
    },
    create: {
      id: "BATS-2026-D01-PASS",
      gtin: "08938500000011",
      lot: "LOT-2026-0718",
      serial: "SR-0001",
      farmPlotId: "plot-dlk-0001",
      farmerId: "FARMER-0001",
      crop: "durian",
      variety: "Ri6",
      quantityKg: 1250.000,
      status: "collected",
      riskScore: 0,
      riskBand: "green",
      pcieStatus: "PASS",
      custodianId: "COLLECTOR-0001",
      accepted: true,
      issues: []
    }
  });

  // 6. Kịch bản D02 (REVIEW): Lệch khối lượng đối soát
  await prisma.batch.upsert({
    where: { id: "BATS-2026-D02-REVIEW" },
    update: {
      status: "collected",
      pcieStatus: "REVIEW",
      custodianId: "COLLECTOR-0001"
    },
    create: {
      id: "BATS-2026-D02-REVIEW",
      gtin: "08938500000011",
      lot: "LOT-2026-0719",
      serial: "SR-0002",
      farmPlotId: "plot-dlk-0001",
      farmerId: "FARMER-0001",
      crop: "durian",
      variety: "Ri6",
      quantityKg: 1230.000,
      status: "collected",
      riskScore: 35,
      riskBand: "yellow",
      pcieStatus: "REVIEW",
      custodianId: "COLLECTOR-0001",
      accepted: true,
      issues: [
        {
          code: "M",
          severity: "warning",
          score: 30,
          message: "Khối lượng thực nhận 1.230 kg thấp hơn khai báo 1.250 kg (-20 kg)"
        }
      ]
    }
  });

  // Tạo ReviewCase cho D02
  await prisma.reviewCase.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      batchId: "BATS-2026-D02-REVIEW",
      ruleCode: "M",
      severity: "WARNING",
      status: "OPEN",
      title: "Chênh lệch khối lượng thu hoạch và thực nhận (-20 kg)",
      explanation: "Khối lượng thực nhận 1.230 kg thấp hơn khai báo 1.250 kg (-20 kg / -1.6%). Vượt ngưỡng kiểm tra tự động 1.0%, chuyển sang trạng thái REVIEW để đối soát chứng từ cân.",
      expected: { declaredKg: 1250.000, allowedToleranceKg: 12.500 },
      observed: { declaredKg: 1250.000, receivedKg: 1230.000, deltaKg: -20.000, percentDiff: -1.6 }
    }
  });

  // 7. Kịch bản D03 (BLOCK): Mã vùng trồng bị đình chỉ
  await prisma.batch.upsert({
    where: { id: "BATS-2026-D03-BLOCK" },
    update: {
      status: "created",
      pcieStatus: "BLOCK",
      custodianId: "FARMER-0001"
    },
    create: {
      id: "BATS-2026-D03-BLOCK",
      gtin: "08938500000011",
      lot: "LOT-2026-0720",
      serial: "SR-0003",
      farmPlotId: "plot-dlk-9999",
      farmerId: "FARMER-0001",
      crop: "durian",
      variety: "Monthong",
      quantityKg: 800.000,
      status: "created",
      riskScore: 100,
      riskBand: "red",
      pcieStatus: "BLOCK",
      custodianId: "FARMER-0001",
      accepted: false,
      issues: [
        {
          code: "S",
          severity: "block",
          score: 100,
          message: "Mã số vùng trồng VN-DLK-PA-9999 đã hết hạn hoặc bị đình chỉ (SUSPENDED)"
        }
      ]
    }
  });

  // Tạo ReviewCase cho D03
  await prisma.reviewCase.upsert({
    where: { id: "00000000-0000-0000-0000-000000000003" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000003",
      batchId: "BATS-2026-D03-BLOCK",
      ruleCode: "S",
      severity: "CRITICAL",
      status: "OPEN",
      title: "Mã số vùng trồng VN-DLK-PA-9999 bị đình chỉ",
      explanation: "Sự kiện thu hoạch ghi nhận trên mã số vùng trồng có trạng thái SUSPENDED tại thời điểm thực hiện. Quy tắc S kích hoạt trạng thái BLOCK, từ chối quyền tiếp nhận chuỗi cung ứng.",
      expected: { allowedStatus: "ACTIVE" },
      observed: { currentStatus: "SUSPENDED" }
    }
  });

  console.log("✅ Đã nạp thành công 3 kịch bản Demo: D01 (PASS), D02 (REVIEW), D03 (BLOCK).");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi nạp dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
