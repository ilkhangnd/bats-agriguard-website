"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin,
  Search,
  ArrowRight,
  QrCode,
  Layers,
  ChevronDown,
  TrendingUp,
  Users,
  Sprout,
  Info,
  X,
  ExternalLink
} from "lucide-react";
import { EditorialHeading } from "./components/EditorialHeading";

interface RuleItem {
  id: string;
  code: string;
  name: string;
  friendlyName: string;
  status: "PASS" | "REVIEW" | "BLOCK";
  statusText: string;
  isAlert: boolean;
  friendlyDetail: string;
  technicalCode: string;
  technicalDetail: string;
}

interface ScenarioConfig {
  id: "D01" | "D02" | "D03";
  name: string;
  selectLabel: string;
  badge: "PASS" | "REVIEW" | "BLOCK";
  badgeText: string;
  badgeColor: string;
  bgBadge: string;
  borderColor: string;
  desc: string;
  rules: RuleItem[];
}

export default function LandingPage() {
  // The reference experience opens with the fully valid sample lot.
  const [selectedScenario, setSelectedScenario] = useState<"D02" | "D01" | "D03">("D01");
  // Technical details modal toggle
  const [showTechModal, setShowTechModal] = useState(false);
  // Public QR Lookup modal state
  const [showQrModal, setShowQrModal] = useState(false);
  const [showLookupResult, setShowLookupResult] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Check URL hash on mount for direct anchor or lookup modal trigger
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.hash === "#lookup" || window.location.search.includes("lookup=1")) {
        setShowQrModal(true);
      }
    }
  }, []);

  const scenariosData: Record<"D01" | "D02" | "D03", ScenarioConfig> = {
    D02: {
      id: "D02",
      name: "Sản lượng vượt ngưỡng",
      selectLabel: "Sản lượng vượt ngưỡng",
      badge: "REVIEW",
      badgeText: "REVIEW",
      badgeColor: "#D97706",
      bgBadge: "#FEF3C7",
      borderColor: "#FCD34D",
      desc: "Khai báo khối lượng vượt năng suất dự kiến của vùng trồng. Cần đối soát thêm trước khi xuất kho.",
      rules: [
        {
          id: "G",
          code: "G01",
          name: "Không gian (G)",
          friendlyName: "Không gian (G)",
          status: "PASS",
          statusText: "Đạt",
          isAlert: false,
          friendlyDetail: "Thu hoạch đúng bên trong ranh giới vùng trồng",
          technicalCode: "Rule G01 (Geofence)",
          technicalDetail: "Tọa độ GPS (12.6789, 108.1234) nằm trọn trong polygon VN-TT-0012"
        },
        {
          id: "I",
          code: "I01",
          name: "Chủ thể (I)",
          friendlyName: "Chủ thể (I)",
          status: "PASS",
          statusText: "Đạt",
          isAlert: false,
          friendlyDetail: "Đúng nhà vườn và người thu mua đã đăng ký",
          technicalCode: "Rule I01 (Authorized Actor)",
          technicalDetail: "Chủ hộ: Nguyễn Văn A (ID: ACT-0012) có quyền hợp lệ"
        },
        {
          id: "Y",
          code: "Y01",
          name: "Sản lượng (Y)",
          friendlyName: "Sản lượng (Y)",
          status: "REVIEW",
          statusText: "Cảnh báo",
          isAlert: true,
          friendlyDetail: "Khối lượng vượt ngưỡng cho vùng trồng",
          technicalCode: "Rule Y01 (Yield Ceiling)",
          technicalDetail: "Khai báo 1,850 kg > trần dự kiến 1,200 kg cho đợt 1 (+54.2%)"
        },
        {
          id: "C",
          code: "C01",
          name: "Chuỗi chuyển giao (C)",
          friendlyName: "Chuỗi chuyển giao (C)",
          status: "PASS",
          statusText: "Đạt",
          isAlert: false,
          friendlyDetail: "Lịch sử giao nhận đầy đủ, không trùng lặp mã cân",
          technicalCode: "Rule C01 (Custody Chain)",
          technicalDetail: "Biên bản bàn giao số 2 bên hoàn tất, chữ ký số hợp lệ"
        }
      ]
    },
    D01: {
      id: "D01",
      name: "Hợp lệ toàn diện",
      selectLabel: "Hợp lệ toàn diện (Không phát hiện bất thường)",
      badge: "PASS",
      badgeText: "PASS",
      badgeColor: "#16A34A",
      bgBadge: "#DCFCE7",
      borderColor: "#86EFAC",
      desc: "Toàn bộ thông tin từ tọa độ hái, chủ vườn đến khối lượng và chuỗi giao nhận đều khớp hồ sơ.",
      rules: [
        {
          id: "G",
          code: "G01",
          name: "Không gian (G)",
          friendlyName: "Không gian (G)",
          status: "PASS",
          statusText: "Đạt",
          isAlert: false,
          friendlyDetail: "Tọa độ GPS khớp 100% với vùng trồng đã đăng ký",
          technicalCode: "Rule G01 (Geofence)",
          technicalDetail: "Điểm GPS cách tâm polygon 18m (< ngưỡng 50m)"
        },
        {
          id: "I",
          code: "I01",
          name: "Chủ thể (I)",
          friendlyName: "Chủ thể (I)",
          status: "PASS",
          statusText: "Đạt",
          isAlert: false,
          friendlyDetail: "Đúng người phụ trách và tài xế được cấp phép",
          technicalCode: "Rule I01 (Authorized Actor)",
          technicalDetail: "Xác thực danh tính số thành công qua khóa bí mật"
        },
        {
          id: "Y",
          code: "Y01",
          name: "Sản lượng (Y)",
          friendlyName: "Sản lượng (Y)",
          status: "PASS",
          statusText: "Đạt",
          isAlert: false,
          friendlyDetail: "Khối lượng 1,200 kg nằm trong hạn mức thu hoạch đợt 1",
          technicalCode: "Rule Y01 (Yield Ceiling)",
          technicalDetail: "Lũy kế 7.2 tấn / 15 tấn hạn mức cả vụ (48% công suất)"
        },
        {
          id: "C",
          code: "C01",
          name: "Chuỗi chuyển giao (C)",
          friendlyName: "Chuỗi chuyển giao (C)",
          status: "PASS",
          statusText: "Đạt",
          isAlert: false,
          friendlyDetail: "Bàn giao qua trạm sơ chế và cơ sở đóng gói đồng bộ",
          technicalCode: "Rule C01 (Custody Chain)",
          technicalDetail: "Xác nhận nhận hàng tại cơ sở đóng gói khớp mã lô"
        }
      ]
    },
    D03: {
      id: "D03",
      name: "Vị trí ngoài vùng trồng",
      selectLabel: "Vị trí ngoài vùng trồng (Không đạt kiểm tra)",
      badge: "BLOCK",
      badgeText: "BLOCK",
      badgeColor: "#DC2626",
      bgBadge: "#FEE2E2",
      borderColor: "#FCA5A5",
      desc: "Tọa độ thu hoạch lệch ngoài ranh giới vùng trồng được cấp phép. Hệ thống từ chối dán tem truy xuất.",
      rules: [
        {
          id: "G",
          code: "G01",
          name: "Không gian (G)",
          friendlyName: "Không gian (G)",
          status: "BLOCK",
          statusText: "Không đạt",
          isAlert: true,
          friendlyDetail: "Vị trí thu hoạch nằm ngoài ranh giới (cách 1.8 km)",
          technicalCode: "Rule G01 (Geofence)",
          technicalDetail: "Tọa độ GPS (12.6950, 108.1450) cách ranh giới 1,820 m (> ngưỡng 50 m)"
        },
        {
          id: "I",
          code: "I01",
          name: "Chủ thể (I)",
          friendlyName: "Chủ thể (I)",
          status: "PASS",
          statusText: "Đạt",
          isAlert: false,
          friendlyDetail: "Tài khoản người bán hợp lệ trong hệ thống",
          technicalCode: "Rule I01 (Authorized Actor)",
          technicalDetail: "Tài khoản nông dân khớp hồ sơ cấp phép"
        },
        {
          id: "Y",
          code: "Y01",
          name: "Sản lượng (Y)",
          friendlyName: "Sản lượng (Y)",
          status: "PASS",
          statusText: "Đạt",
          isAlert: false,
          friendlyDetail: "Khối lượng 1,100 kg nằm trong định mức",
          technicalCode: "Rule Y01 (Yield Ceiling)",
          technicalDetail: "Khối lượng khai báo hợp lệ"
        },
        {
          id: "C",
          code: "C01",
          name: "Chuỗi chuyển giao (C)",
          friendlyName: "Chuỗi chuyển giao (C)",
          status: "BLOCK",
          statusText: "Không đạt",
          isAlert: true,
          friendlyDetail: "Từ chối tiếp nhận vì vi phạm vị trí thu hoạch",
          technicalCode: "Rule C01 (Custody Chain)",
          technicalDetail: "Không cho phép xuất mã truy xuất công khai do vi phạm ranh giới"
        }
      ]
    }
  };

  const activeDemo = scenariosData[selectedScenario];
  const pcieInvariantGroups = [
    { code: "G", title: "Địa lý (Geofence)", detail: "Tọa độ thu hoạch (12.6789, 108.1234) nằm trọn trong polygon VN-TT-0012." },
    { code: "I", title: "Chủ thể (Identity)", detail: "Nông dân và thương lái đều có quyền hợp lệ trong registry." },
    { code: "S", title: "Trạng thái (Status)", detail: "Mã số vùng trồng đang trong thời hạn hiệu lực, không bị đình chỉ." },
    { code: "Y", title: "Năng suất (Yield)", detail: "Khối lượng 1,250 kg phù hợp với diện tích 2.5 ha và định mức mùa vụ." },
    { code: "D", title: "Chống trùng (Duplication)", detail: "Không có sự kiện hoặc hash bằng chứng nào bị trùng lặp." },
    { code: "T", title: "Thời gian - Không gian (Spatiotemporal)", detail: "Tốc độ di chuyển thực tế 32 km/h < ngưỡng tối đa 80 km/h." },
    { code: "M", title: "Cân bằng khối lượng (Mass Balance)", detail: "Khối lượng giao nhận khớp 100%, tỷ lệ chênh lệch 0%." },
    { code: "C", title: "Chuỗi lưu giữ (Custody Chain)", detail: "Chuỗi bàn giao liên tục: Nông hộ → Thương lái → Cơ sở đóng gói." }
  ].map((group) => {
    const status = selectedScenario === "D03" && ["G", "C"].includes(group.code)
      ? "BLOCK"
      : selectedScenario === "D02" && group.code === "M"
        ? "REVIEW"
        : "PASS";

    return { ...group, status };
  });

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = lookupQuery.trim();
    if (!query) {
      setLookupError("Vui lòng nhập mã lô hàng hoặc mã truy xuất nguồn gốc.");
      return;
    }
    setLookupError(null);
    setShowQrModal(false);
    setShowLookupResult(true);
  };

  return (
    <div className="batsLandingRoot legacyTheme">
      {/* ============================================================ */}
      {/* GLOBAL & SCOPED STYLES                                       */}
      {/* ============================================================ */}
      <style jsx global>{`
        :root {
          --bats-green-950: #063B2A;
          --bats-green-900: #075038;
          --bats-green-800: #086443;
          --bats-green-700: #087D4D;
          --bats-green-600: #10B981;
          --bats-mint-50: #F0FAF5;
          --bats-card-bg: #F9FAFB;
          --bats-border-subtle: #E5E7EB;
        }

        .batsLandingRoot {
          background-color: #FFFFFF;
          color: var(--color-text, #34594A);
          font-family: var(--font-sans), 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow-x: hidden;
          line-height: 1.5;
        }

        /* Original landing visual language restored from the supplied recording. */
        .legacyTheme {
          background: #FBFCF9;
          color: #193C2F;
        }
        .legacyTheme .batsContainer {
          max-width: 1440px;
          padding-left: 42px;
          padding-right: 42px;
        }
        .legacyHeader {
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 0 !important;
          background: rgba(255, 255, 255, 0.96) !important;
          border-bottom: 1px solid #E6EEE8 !important;
          backdrop-filter: blur(12px);
        }
        .legacyHeaderInner {
          width: 100%;
          max-width: 1440px;
          min-height: 58px;
          margin: 0 auto;
          padding: 0 42px;
          display: flex;
          align-items: center;
          gap: 28px;
        }
        .legacyBrand {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: max-content;
          text-decoration: none;
        }
        .legacyBrandText {
          display: grid;
          gap: 1px;
          color: #11442E;
        }
        .legacyBrandName {
          font-size: 14px;
          font-weight: 900;
          letter-spacing: -0.04em;
        }
        .legacyBrandSub {
          color: #789083;
          font-size: 8px;
          font-weight: 700;
        }
        .legacyNav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          flex: 1;
        }
        .legacyNav a {
          color: #3B5146;
          font-size: 11px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
        }
        .legacyNav a:hover { color: #0C7548; }
        .legacyHeaderActions {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: max-content;
        }
        .legacyHeader .navPillBtn {
          min-height: 32px;
          height: 32px;
          padding: 0 12px;
          border-radius: 8px;
          font-size: 10px;
          background: #0A4B33;
        }
        .legacyHero {
          padding: 44px 0 50px;
          background: #FFFFFF;
          border-bottom: 1px solid #EEF2EE;
        }
        .legacyHeroGrid {
          display: grid;
          grid-template-columns: minmax(0, 0.94fr) minmax(360px, 1.06fr);
          align-items: center;
          gap: clamp(34px, 5vw, 84px);
        }
        .legacyHeroCopy { max-width: 590px; }
        .legacyHero .editorialTitlePrimary { font-size: clamp(35px, 3.8vw, 59px); }
        .legacyHero .editorialTitleAccent {
          margin-top: 0;
          color: #1D8755;
          font-family: var(--font-sans), sans-serif !important;
          font-size: clamp(35px, 3.8vw, 59px);
          font-style: normal;
        }
        .legacyHero .editorialDescription { max-width: 520px; color: #60796D; }
        .legacyHeroActions { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; flex-wrap: wrap; }
        .legacyHeroTrust {
          display: flex;
          align-items: center;
          gap: 13px;
          flex-wrap: wrap;
          padding: 12px 14px;
          border-radius: 8px;
          background: #F4F7F2;
        }
        .legacyHeroTrust > div { font-size: 11px !important; }
        .legacyHeroVisual {
          min-height: 330px;
          overflow: hidden;
          border: 1px solid #D7E5DB;
          border-radius: 14px;
          background: #EDF5EF;
          box-shadow: 0 14px 32px rgba(20, 74, 48, 0.08);
        }
        .legacyHeroVisual img {
          width: 100%;
          height: 100%;
          min-height: 330px;
          display: block;
          object-fit: cover;
        }
        .legacyTheme #problems,
        .legacyTheme #workflow,
        .legacyTheme #research {
          background: #F5F8F4 !important;
          border-color: #E4ECE5 !important;
        }
        .legacyTheme #solution,
        .legacyTheme #products,
        .legacyTheme > section:not(#home):not(#demo):not(#problems):not(#workflow):not(#research) {
          background: #FFFFFF !important;
        }
        .legacyTheme .problemCardItem,
        .legacyTheme .solutionCardBox,
        .legacyTheme .workflowStepCard,
        .legacyTheme .valueCardItem,
        .legacyTheme .audienceCardItem,
        .legacyTheme .researchStripCard {
          border-color: #E3EBE5;
          border-radius: 10px;
          box-shadow: 0 5px 14px rgba(28, 75, 49, 0.035);
        }
        .legacyTheme .problemCardItem,
        .legacyTheme .workflowStepCard,
        .legacyTheme .valueCardItem {
          background: #FFFFFF;
        }
        .legacyTheme .sectionCenterHead { margin-bottom: 24px; }
        .legacyTheme .sectionCenterHead h2 { color: #174B33; }
        .legacyTheme .sectionCenterHead p { color: #74877B; }
        .legacyTheme .editorialEyebrow { margin-bottom: 8px; }
        .legacyTheme .editorialEyebrowPill {
          color: #397151;
          background: #EAF4E7;
          border-color: #D5E7CF;
        }
        .legacyTheme .editorialTitlePrimary { color: #174B33; }
        .legacyTheme .editorialTitleAccent { color: #1D8755; }
        .legacyTheme section:not(#home):not(#demo):not(#contact) .editorialEyebrow {
          display: none;
        }
        .legacyTheme section:not(#home):not(#demo):not(#contact) .editorialTitlePrimary,
        .legacyTheme section:not(#home):not(#demo):not(#contact) .editorialTitleAccent {
          display: inline;
          font-family: var(--font-sans), sans-serif !important;
          font-size: clamp(24px, 2.35vw, 34px) !important;
          font-style: normal;
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1.16;
        }
        .legacyTheme section:not(#home):not(#demo):not(#contact) .editorialTitleAccent::before {
          content: " ";
        }
        .legacyTheme section:not(#home):not(#demo):not(#contact) .editorialDescription,
        .legacyTheme .sectionCenterHead p {
          max-width: 620px;
          margin-top: 8px;
          color: #74877B;
          font-size: 12px !important;
          line-height: 1.55;
        }
        .legacyTheme .sectionCenterHead h2,
        .legacyTheme > section > .batsContainer > h2 {
          font-size: clamp(24px, 2.35vw, 34px) !important;
          letter-spacing: -0.035em;
        }
        .legacyTheme .workflowStepCard { min-height: 150px; }
        .legacyTheme .stepNumberCircle { background: #0E5B3D; }
        .legacyTheme .stepIconBox { background: #EAF5ED; color: #14734B; }
        .legacyTheme .solutionCardBox { padding: 18px; }
        .legacyTheme .solutionConnectorDot { color: #95CBAA; }
        .legacyTheme .problemCardsGrid,
        .legacyTheme .valueCardsGrid { gap: 14px; }
        .legacyTheme .problemCardItem { min-height: 178px; padding: 18px 16px; }
        .legacyTheme .problemCardItem > div:first-child {
          width: 36px !important;
          height: 36px !important;
          margin-bottom: 7px;
          padding: 7px;
          border-radius: 9px;
          background: #F7E7E8;
        }
        .legacyTheme .problemCardItem h3,
        .legacyTheme .solutionCardBox h3,
        .legacyTheme .workflowStepCard h4,
        .legacyTheme .valueCardItem h3,
        .legacyTheme .audienceCardItem h4 {
          font-size: 12px !important;
          line-height: 1.28;
        }
        .legacyTheme .problemCardItem p,
        .legacyTheme .solutionCardBox p,
        .legacyTheme .workflowStepCard p,
        .legacyTheme .valueCardItem p,
        .legacyTheme .audienceCardItem p {
          color: #748077 !important;
          font-size: 10px !important;
          line-height: 1.5;
        }
        .legacyTheme .workflowStepCard { padding: 14px 10px 12px; }
        .legacyTheme .workflowStepCard p { font-size: 9.5px !important; }
        .legacyTheme .valueCardItem { min-height: 142px; padding: 18px 14px; }
        .legacyTheme .valueCardItem > div:first-child { margin-bottom: 8px !important; }
        .legacyTheme .valueCardItem svg { width: 23px; height: 23px; }
        .legacyTheme .audienceCardsGrid { gap: 14px; }
        .legacyTheme .audienceCardItem > div:first-child { height: 116px !important; }
        .legacyTheme .audienceCardItem > div:nth-child(2) { padding: 10px 11px 12px !important; }
        .legacyProductHead { margin-bottom: 22px; }
        .legacyProductGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }
        .legacyProductCard {
          padding: 12px;
          border: 1px solid #E1EAE3;
          border-radius: 13px;
          background: #FFFFFF;
          box-shadow: 0 5px 14px rgba(28, 75, 49, 0.035);
        }
        .legacyProductCard figure {
          height: 230px;
          margin: 0 0 14px;
          overflow: hidden;
          border: 1px solid #E5ECE6;
          border-radius: 9px;
          background: #EEF4EF;
        }
        .legacyProductCard figure img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .legacyProductCard h3 { margin: 0 0 6px; color: #174B33; font-size: 13px; }
        .legacyTheme .legacyProductCard p { margin: 0; color: #748077; font-size: 11px !important; line-height: 1.55; }
        .legacyProductCard a { display: inline-flex; margin-top: 13px; color: #155D3B; font-size: 11px; font-weight: 800; text-decoration: none; }
        .legacyTheme .researchStripCard {
          gap: 14px;
          padding: 0;
          border: 0;
          background: transparent;
          box-shadow: none;
        }
        .legacyTheme .researchMetricCol {
          min-height: 94px;
          flex-direction: column;
          gap: 5px;
          padding: 17px 12px;
          border: 1px solid #E4ECE5 !important;
          border-radius: 9px;
          background: #FFFFFF;
          box-shadow: 0 3px 10px rgba(28, 75, 49, 0.025);
          text-align: center;
        }
        .legacyTheme .researchMetricCol > div:first-child { display: none; }
        .legacyTheme .researchMetricCol > div:last-child > div:first-child {
          color: #1B774B !important;
          font-size: 22px !important;
        }
        .legacyTheme .researchMetricCol > div:last-child > div:last-child {
          color: #718177 !important;
          font-size: 10px !important;
        }
        .legacyTheme .researchDataNote {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 14px;
          padding: 10px 13px;
          border: 1px solid #E4ECE5;
          border-radius: 8px;
          color: #78877E;
          background: #FFFFFF;
          font-size: 10px;
        }
        .legacyTheme .researchDataNote a {
          color: #174B33;
          font-weight: 800;
          text-decoration: none;
          white-space: nowrap;
        }
        .legacyTheme .finalCtaPhotoBanner {
          border-radius: 12px;
          padding: 52px 20px;
          background-image: linear-gradient(rgba(4, 61, 40, 0.93), rgba(4, 61, 40, 0.93));
        }
        .legacyTheme .finalCtaPhotoBanner .editorialEyebrow { display: none; }
        .legacyTheme .finalCtaPhotoBanner .editorialTitlePrimary,
        .legacyTheme .finalCtaPhotoBanner .editorialTitleAccent {
          display: inline;
          color: #FFFFFF !important;
          font-family: var(--font-sans), sans-serif !important;
          font-size: clamp(26px, 2.8vw, 38px) !important;
          font-style: normal !important;
          line-height: 1.15;
        }
        .legacyTheme .finalCtaPhotoBanner .editorialTitleAccent::before { content: " "; }
        .legacyTheme .finalCtaPhotoBanner .editorialTitleAccent {
          color: #FFFFFF !important;
          font-weight: 800;
          letter-spacing: -0.03em;
        }
        .legacyTheme .finalCtaPhotoBanner .editorialDescription {
          max-width: 540px;
          margin-top: 10px;
          color: #CAE3D2;
          font-size: 12px !important;
        }
        .legacyTheme .finalCtaPhotoBanner a { border-radius: 6px !important; font-size: 11px !important; }
        .legacyFooter {
          background: #FFFFFF !important;
          border-top-color: #E5ECE6 !important;
          padding: 30px 0 16px !important;
        }
        .legacyFooter p,
        .legacyFooter a,
        .legacyFooter div { font-size: 10px !important; }
        .legacyFooter .footerQuickLinks,
        .legacyFooter .footerQuickLinks a,
        .legacyFooter .footerContactTitle,
        .legacyFooter .footerContactDetail,
        .legacyFooter .footerBrandDescription,
        .legacyFooter .footerColumnTitle,
        .legacyFooter .footerColumnBody,
        .legacyFooter .footerSectionLinks a,
        .legacyFooter .footerQrLink span { font-size: 12px !important; }
        .legacyFooter .footerSectionLinks {
          display: grid;
          grid-template-columns: repeat(3, max-content);
          align-items: flex-start;
          column-gap: 72px;
          row-gap: 10px;
        }
        .legacyFooter .footerSectionLinks a {
          color: #4B5563;
          text-decoration: none;
        }
        .legacyFooter .footerQrLink {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: #087D4D;
          text-decoration: none;
        }
        .legacyFooter .footerQrLink span { color: #4B5563; }
        .legacyFooter span { font-size: 13px !important; }
        @media (max-width: 800px) {
          .legacyFooter .footerThreeColumnGrid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
        }
        @media (max-width: 1080px) {
          .legacyNav { gap: 14px; }
        }
        @media (max-width: 860px) {
          .legacyHeaderInner,
          .legacyTheme .batsContainer { padding-left: 20px; padding-right: 20px; }
          .legacyNav { display: none; }
          .legacyHeaderInner { justify-content: space-between; }
          .legacyHeroGrid { grid-template-columns: 1fr; }
          .legacyHeroVisual { min-height: 260px; }
          .legacyHeroVisual img { min-height: 260px; }
          .legacyTheme .researchDataNote { align-items: flex-start; flex-direction: column; }
          .legacyProductHead { align-items: flex-start; flex-direction: column; }
          .legacyProductGrid { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .legacyHeaderActions .navPillBtn:first-child { display: none; }
          .legacyHero { padding: 32px 0 38px; }
        }

        /* Keep explanatory copy consistent throughout the landing page. */
        .batsLandingRoot section p {
          font-size: clamp(15px, 1.2vw, 17px) !important;
          line-height: 1.55;
        }

        /* The closing CTA intentionally uses its smaller, dedicated scale. */
        .batsLandingRoot section .finalCtaPhotoBanner .editorialDescription {
          font-size: 14.5px !important;
        }

        .batsContainer {
          width: 100%;
          max-width: 1140px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* Header action buttons */
        .navPillBtn {
          background-color: #063B2A;
          color: #FFFFFF;
          border: none;
          height: 42px;
          padding: 0 19px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          text-decoration: none;
          white-space: nowrap;
          transition: background-color 0.15s ease;
        }
        .navPillBtn:hover {
          background-color: #086443;
        }

        /* Section Headings */
        .sectionCenterHead {
          text-align: center;
          margin-bottom: 28px;
        }
        .sectionCenterHead h2 {
          font-size: clamp(31px, 3.4vw, 49px);
          font-weight: 800;
          color: #063B2A;
          margin: 0 0 6px 0;
          letter-spacing: -0.015em;
        }
        .sectionCenterHead p {
          font-size: clamp(15px, 1.2vw, 17px);
          color: #61766D;
          margin: 0;
          max-width: 680px;
          margin-left: auto;
          margin-right: auto;
        }

        /* Problem Section Cards (4 columns) */
        .problemCardsGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 860px) {
          .problemCardsGrid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 500px) {
          .problemCardsGrid {
            grid-template-columns: 1fr;
          }
        }
        .problemCardItem {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 14px;
          padding: 16px 14px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .problemCardItem h3 {
          font-size: 15px;
          font-weight: 700;
          color: #063B2A;
          margin: 12px 0 6px;
        }
        .problemCardItem p {
          font-size: 15px;
          color: #4B5563;
          margin: 0;
          line-height: 1.45;
        }

        /* Feature-card type scale */
        .solutionCardBox h3,
        .workflowStepCard h4,
        .valueCardItem h3,
        .audienceCardItem h4 {
        }
        .solutionCardBox p {
          font-size: clamp(15px, 1.2vw, 17px) !important;
        }
        .workflowStepCard p,
        .valueCardItem p,
        .audienceCardItem p {
          font-size: 13px !important;
        }

        /* Final CTA has a more compact type scale than section headings. */
        .finalCtaPhotoBanner .editorialTitlePrimary,
        .finalCtaPhotoBanner .editorialTitleAccent {
          font-size: clamp(29.6px, 3.2vw, 41.6px);
        }
        .finalCtaPhotoBanner .editorialDescription {
          font-size: 14.5px;
        }

        /* Solution Section Cards (3 columns connected) */
        .solutionCardsRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        @media (max-width: 840px) {
          .solutionCardsRow {
            flex-direction: column;
            gap: 16px;
          }
        }
        .solutionCardBox {
          flex: 1;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 14px;
          padding: 20px 18px;
          box-shadow: 0 4px 14px rgba(7, 55, 37, 0.04);
        }
        .solutionConnectorDot {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #10B981;
          flex-shrink: 0;
        }
        @media (max-width: 840px) {
          .solutionConnectorDot {
            display: none;
          }
        }

        /* Workflow Step Cards (5 columns) */
        .workflowStepsGrid {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          position: relative;
        }
        @media (max-width: 860px) {
          .workflowStepsGrid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
        }
        @media (max-width: 500px) {
          .workflowStepsGrid {
            grid-template-columns: 1fr;
          }
        }
        .workflowStepCard {
          flex: 1;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 18px 12px 14px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
          min-height: 165px;
        }
        .workflowArrow {
          color: #10B981;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          flex-shrink: 0;
        }
        @media (max-width: 860px) {
          .workflowArrow {
            display: none;
          }
        }
        .stepNumberCircle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #063B2A;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 700;
          display: grid;
          place-items: center;
          margin-bottom: 8px;
        }
        .stepIconBox {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #ECFDF5;
          display: grid;
          place-items: center;
          color: #063B2A;
          margin-bottom: 8px;
        }

        /* Value Section (4 cards) */
        .valueCardsGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 860px) {
          .valueCardsGrid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 500px) {
          .valueCardsGrid {
            grid-template-columns: 1fr;
          }
        }
        .valueCardItem {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 14px;
          padding: 20px 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Research Horizontal Strip (4 items) */
        .researchStripCard {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 14px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.04);
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          padding: 18px 0;
        }
        @media (max-width: 768px) {
          .researchStripCard {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px 0;
          }
        }
        @media (max-width: 480px) {
          .researchStripCard {
            grid-template-columns: 1fr;
          }
        }
        .researchMetricCol {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 0 16px;
        }
        .researchMetricCol:not(:last-child) {
          border-right: 1px solid #E5E7EB;
        }
        @media (max-width: 768px) {
          .researchMetricCol:not(:last-child) {
            border-right: none;
          }
        }

        /* Restored PCIE interactive sandbox, matching the original single-table layout. */
        .pcieSandbox {
          background: #063B2A;
          color: #FFFFFF;
          padding: 54px 0 58px;
        }
        .pcieSandboxHead {
          max-width: 720px;
          margin: 0 auto 26px;
          text-align: center;
        }
        .pcieSandboxEyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 12px;
          border: 1px solid rgba(196, 239, 143, 0.38);
          border-radius: 999px;
          color: #D9F18E;
          background: rgba(217, 241, 142, 0.12);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.04em;
        }
        .pcieSandboxHead h2 {
          margin: 14px 0 8px;
          color: #FFFFFF;
          font-size: clamp(30px, 3.2vw, 42px);
          font-weight: 800;
          letter-spacing: -0.035em;
        }
        .batsLandingRoot section .pcieSandboxHead p {
          margin: 0 auto;
          max-width: 650px;
          color: #D1FAE5;
          font-size: 15px !important;
          line-height: 1.55;
        }
        .pcieScenarioTabs {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          max-width: 980px;
          margin: 0 auto 14px;
        }
        .pcieScenarioTab {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 38px;
          padding: 8px 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.05);
          color: #E7F7ED;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: 160ms ease;
        }
        .pcieScenarioTab:hover,
        .pcieScenarioTab[aria-pressed="true"] {
          transform: translateY(-1px);
          border-color: #D9F18E;
          background: rgba(217, 241, 142, 0.13);
          color: #FFFFFF;
        }
        .pcieScenarioState {
          display: inline-flex;
          align-items: center;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.04em;
        }
        .pcieScenarioState--PASS { color: #166534; background: #DCFCE7; }
        .pcieScenarioState--REVIEW { color: #92400E; background: #FEF3C7; }
        .pcieScenarioState--BLOCK { color: #991B1B; background: #FEE2E2; }
        .pcieResultTable {
          max-width: 980px;
          margin: 0 auto;
          padding: 20px;
          border-radius: 14px;
          color: #17352A;
          background: #FFFFFF;
          box-shadow: 0 18px 38px rgba(0, 0, 0, 0.2);
        }
        .pcieResultTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          padding-bottom: 15px;
          border-bottom: 1px solid #E7EEE9;
        }
        .pcieResultStatus {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #0D7A47;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.035em;
        }
        .pcieResultTitle {
          margin: 5px 0 0;
          color: #17352A;
          font-size: 14px;
          font-weight: 800;
        }
        .pcieResultMeta {
          display: flex;
          flex-wrap: wrap;
          gap: 5px 14px;
          margin-top: 5px;
          color: #748279;
          font-size: 11px;
        }
        .pcieResultActions {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-shrink: 0;
        }
        .pcieResultAction {
          min-height: 30px;
          padding: 0 10px;
          border: 1px solid #D6E6DB;
          border-radius: 6px;
          color: #155D3B;
          background: #F6FBF7;
          font: inherit;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }
        .pcieRulesCaption {
          margin: 16px 0 10px;
          color: #365B4C;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.025em;
        }
        .pcieRulesGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
        }
        .pcieRuleCell {
          min-height: 76px;
          padding: 10px;
          border: 1px solid #E3ECE6;
          border-radius: 8px;
          background: #FBFDFC;
        }
        .pcieRuleCellTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          color: #17352A;
          font-size: 10.5px;
          font-weight: 800;
        }
        .pcieRuleStatus {
          flex-shrink: 0;
          font-size: 9px;
          font-weight: 900;
        }
        .pcieRuleStatus--PASS { color: #07844D; }
        .pcieRuleStatus--REVIEW { color: #B05A00; }
        .pcieRuleStatus--BLOCK { color: #C12525; }
        .batsLandingRoot section .pcieRuleCell p {
          margin: 6px 0 0;
          color: #748279;
          font-size: 10px !important;
          line-height: 1.38;
        }
        .pcieResultFootnote {
          margin: 11px 0 0;
          color: #819087;
          font-size: 9.5px;
          line-height: 1.4;
        }
        @media (max-width: 760px) {
          .pcieSandbox { padding: 42px 0; }
          .pcieScenarioTabs { grid-template-columns: 1fr; }
          .pcieResultTop { flex-direction: column; }
          .pcieRulesGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 460px) {
          .pcieResultTable { padding: 14px; }
          .pcieResultActions { width: 100%; }
          .pcieResultAction { flex: 1; }
          .pcieRulesGrid { grid-template-columns: 1fr; }
        }

        /* Audience Cards (6 columns) */
        .audienceCardsGrid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }
        @media (max-width: 960px) {
          .audienceCardsGrid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 540px) {
          .audienceCardsGrid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .audienceCardItem {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
          display: flex;
          flex-direction: column;
        }

        /* Final CTA Banner */
        .finalCtaPhotoBanner {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          padding: 44px 20px;
          text-align: center;
          color: #FFFFFF;
          background-image:
            linear-gradient(rgba(6, 45, 32, 0.92), rgba(6, 45, 32, 0.95)),
            url('/images/hero-orchard.png');
          background-size: cover;
          background-position: center;
        }

        /* Video-reference fidelity: shared measurements, type, and colors. */
        .legacyTheme,
        .legacyTheme button,
        .legacyTheme input,
        .legacyTheme select {
          font-family: var(--font-sans), 'DM Sans', sans-serif;
        }
        .legacyTheme .batsContainer,
        .legacyHeaderInner {
          width: calc(100% - 96px);
          max-width: 1624px;
          padding-left: 0;
          padding-right: 0;
        }
        .legacyHeaderInner { min-height: 104px; gap: 42px; }
        .legacyBrand { gap: 12px; }
        .legacyBrandMark {
          display: grid;
          width: 52px;
          height: 52px;
          place-items: center;
          border-radius: 14px;
          color: #D9F18E;
          background: #063E2B;
          font-size: 23px;
          font-weight: 900;
        }
        .legacyBrandName { color: #073D2A; font-size: 21px; letter-spacing: -0.045em; }
        .legacyBrandSub { color: #6D7B73; font-size: 13px; }
        .legacyNav { gap: 34px; }
        .legacyNav a { color: #45514C; font-size: 16px; font-weight: 700; }
        .legacyNav a:first-child { color: #073D2A; }
        .legacyLanguage { color: #174B33; font-size: 14px; font-weight: 800; }
        .legacyHeader .navPillBtn {
          min-height: 44px;
          height: 44px;
          padding: 0 20px;
          border-radius: 10px;
          font-size: 15px;
          background: #063E2B;
        }
        .legacyHeader .navPillBtn--outline {
          color: #174B33;
          background: #F5FAF5;
          border: 1px solid #CBE8B9;
        }
        .legacyHero { padding: 70px 0 88px; }
        .legacyHeroGrid { grid-template-columns: 0.98fr 1.02fr; gap: 76px; }
        .legacyHero .editorialTitlePrimary,
        .legacyHero .editorialTitleAccent {
          font-size: clamp(48px, 3.55vw, 68px);
          font-weight: 800;
          letter-spacing: -0.055em;
          line-height: 1.06;
        }
        .legacyHero .editorialTitlePrimary { color: #003D2A; }
        .legacyHero .editorialTitleAccent { color: #168151; }
        .legacyHero .editorialDescription {
          max-width: 690px;
          margin-top: 28px;
          color: #56635E;
          font-size: 20px;
          line-height: 1.6;
        }
        .legacyHero .editorialEyebrow > div {
          padding: 8px 16px !important;
          border-color: #CBE8B9 !important;
          background: #F1F8EE !important;
          color: #174B33 !important;
          font-size: 15px !important;
          font-weight: 700 !important;
        }
        .legacyHeroActions { margin-top: 36px; margin-bottom: 42px; gap: 18px; }
        .legacyHeroActions a { min-height: 62px; padding: 0 30px !important; border-radius: 12px !important; font-size: 17px !important; }
        .legacyHeroTrust { gap: 30px; padding: 18px 24px; border-radius: 10px; background: #F5F7F3; }
        .legacyHeroTrust > div { font-size: 14px !important; }
        .legacyHeroVisual { min-height: 484px; border: 0; border-radius: 22px; box-shadow: none; }
        .legacyHeroVisual img { min-height: 484px; }
        .legacyPlotBoundary {
          position: absolute;
          inset: 21% 17% 25% 20%;
          display: flex;
          align-items: end;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          color: #FFFFFF;
          border: 2px dashed rgba(255, 255, 255, 0.96);
          border-radius: 12px;
          background: rgba(29, 169, 90, 0.20);
          clip-path: polygon(11% 18%, 68% 0, 100% 40%, 83% 100%, 20% 88%, 0 54%);
          font-size: 12px;
          font-weight: 800;
          text-shadow: 0 1px 3px rgba(0, 48, 29, 0.46);
        }
        .legacyPlotBoundary svg { flex: none; filter: drop-shadow(0 1px 2px rgba(0, 48, 29, .35)); }
        .legacyPlotCard {
          position: absolute;
          right: 20px;
          bottom: 20px;
          left: 20px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          column-gap: 12px;
          row-gap: 5px;
          padding: 13px 16px;
          color: #173F2D;
          background: rgba(255,255,255,.96);
          border-radius: 14px;
          box-shadow: 0 10px 22px rgba(0, 54, 34, 0.16);
        }
        .legacyPlotCardHead { display: flex; align-items: center; gap: 8px; }
        .legacyPlotCardHead strong { font-size: 17px; letter-spacing: -.02em; }
        .legacyDemoBadge { padding: 3px 7px; color: #147344; background: #E7F5E9; border-radius: 999px; font-size: 9px; font-weight: 800; }
        .legacyPlotPlace { grid-column: 1 / 3; overflow: hidden; color: #697B71; font-size: 11px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
        .legacyPlotStatus { grid-column: 3; grid-row: 1 / 3; display: inline-flex; align-items: center; gap: 5px; padding: 7px 10px; color: #087447; background: #EAF9EF; border: 1px solid #A3E3BB; border-radius: 8px; font-size: 11px; font-weight: 800; }
        .legacyTheme #problems { padding: 110px 0 104px !important; background: #F6F8F3 !important; }
        .legacyTheme #solution,
        .legacyTheme #products { padding: 108px 0 !important; }
        .legacyTheme #workflow { padding: 96px 0 !important; }
        .legacyTheme #research { padding: 88px 0 !important; }
        .legacyTheme section:not(#home):not(#demo):not(#contact) .editorialTitlePrimary,
        .legacyTheme section:not(#home):not(#demo):not(#contact) .editorialTitleAccent,
        .legacyTheme .sectionCenterHead h2,
        .legacyTheme > section > .batsContainer > h2 {
          font-size: clamp(30px, 2vw, 40px) !important;
          color: #073D2A;
          font-weight: 800;
        }
        .legacyTheme section:not(#home):not(#demo):not(#contact) .editorialDescription,
        .legacyTheme .sectionCenterHead p {
          max-width: 900px;
          margin-top: 18px;
          color: #5D6863;
          font-size: 17px !important;
          line-height: 1.55;
        }
        .legacyTheme .problemCardsGrid,
        .legacyTheme .valueCardsGrid { gap: 32px; }
        .legacyTheme .problemCardItem {
          min-height: 334px;
          padding: 36px 32px;
          align-items: flex-start;
          text-align: left;
          border: 1px solid #E2E8E2;
          border-radius: 18px;
          box-shadow: 0 7px 16px rgba(18, 65, 42, 0.025);
        }
        .legacyTheme .problemCardItem > div:first-child {
          width: 62px !important;
          height: 62px !important;
          margin-bottom: 21px;
          padding: 14px;
          border-radius: 14px;
        }
        .legacyTheme .legacyProblemIcon { display: grid; place-items: center; color: #BE3450; }
        .legacyTheme .legacyProblemIcon--rose { background: #FBE5E9 !important; color: #C5425E; }
        .legacyTheme .legacyProblemIcon--yellow { background: #FFF3D2 !important; color: #BE8314; }
        .legacyTheme .legacyProblemIcon--peach { background: #FFE9D8 !important; color: #D76A2C; }
        .legacyTheme .legacyProblemIcon--blue { background: #E7F0FD !important; color: #4E80C5; }
        .legacyTheme .problemCardItem h3,
        .legacyTheme .solutionCardBox h3,
        .legacyTheme .workflowStepCard h4,
        .legacyTheme .valueCardItem h3,
        .legacyTheme .audienceCardItem h4 { font-size: 20px !important; }
        .legacyTheme .problemCardItem p,
        .legacyTheme .solutionCardBox p,
        .legacyTheme .workflowStepCard p,
        .legacyTheme .valueCardItem p,
        .legacyTheme .audienceCardItem p { font-size: 16px !important; line-height: 1.55; }
        .legacyTheme .solutionCardsRow { gap: 28px; }
        .legacyTheme .solutionCardBox { min-height: 240px; padding: 30px; border-radius: 18px; }
        .legacyTheme .legacyProductGrid { gap: 44px; }
        .legacyTheme .legacyProductCard {
          padding: 28px;
          border: 1px solid #DDE6DF;
          border-radius: 20px;
          box-shadow: 0 6px 18px rgba(22, 69, 43, .035);
        }
        .legacyTheme .legacyProductCard--featured { border: 2px solid #0A4A34; }
        .legacyTheme .legacyProductCardTop { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-bottom: 20px; }
        .legacyTheme .legacyProductCard h3 { display: inline-flex; align-items: center; gap: 13px; margin: 0; color: #0A3E2D; font-size: 20px; font-weight: 800; }
        .legacyTheme .legacyProductCardTop > span { flex: none; padding: 5px 10px; color: #197044; background: #EEF8EE; border-radius: 7px; font-size: 11px; font-weight: 800; }
        .legacyTheme .legacyProductCard figure { height: 310px; margin: 0 0 20px; border-radius: 12px; }
        .legacyTheme .legacyProductCard p { font-size: 16px !important; }
        .legacyTheme .legacyProductCard a { margin-top: 16px; font-size: 15px; }
        .legacyTheme .workflowStepCard { min-height: 205px; padding: 26px 16px; border-radius: 14px; }
        .legacyTheme .workflowStepCard p { font-size: 13px !important; }
        .legacyTheme .stepNumberCircle { width: 28px; height: 28px; font-size: 13px; }
        .legacyTheme .stepIconBox { width: 42px; height: 42px; }
        .legacyTheme .stepIconBox svg { width: 21px; height: 21px; }
        .legacyTheme .valueCardItem { min-height: 214px; padding: 28px 20px; border-radius: 16px; }
        .legacyTheme .valueCardItem svg { width: 32px; height: 32px; }
        .legacyTheme .audienceCardsGrid { gap: 24px; }
        .legacyTheme .audienceCardItem { border-radius: 14px; }
        .legacyTheme .audienceCardItem > div:first-child { height: 156px !important; }
        .legacyTheme .audienceCardItem > div:nth-child(2) { padding: 16px !important; }
        .legacyTheme .audienceCardItem h4 { margin-bottom: 7px !important; font-size: 16px !important; }
        .legacyTheme .audienceCardItem p { font-size: 13px !important; }
        .pcieScenarioTabs,
        .pcieResultTable { max-width: 1460px; }
        .pcieSandbox { padding: 66px 0 110px; background: #003F2A; }
        .pcieSandboxHead { max-width: 900px; margin-bottom: 42px; }
        .pcieSandboxHead h2 { font-size: 42px; }
        .pcieScenarioTabs { gap: 16px; margin-bottom: 46px; }
        .pcieScenarioTab { min-height: 60px; border-radius: 14px; font-size: 17px; }
        .pcieResultTable { padding: 46px; border-radius: 26px; }
        .pcieResultTop { padding-bottom: 30px; }
        .pcieResultStatus { padding: 7px 11px; border-radius: 7px; font-size: 18px; }
        .pcieResultStatus.pcieRuleStatus--PASS { color: #13844D; background: #E3FAEC; }
        .pcieResultStatus.pcieRuleStatus--REVIEW { color: #A45A00; background: #FFF3D7; }
        .pcieResultStatus.pcieRuleStatus--BLOCK { color: #B22525; background: #FFE7E7; }
        .pcieResultTitle { display: inline-block; margin: 0 0 0 18px; font-size: 18px; }
        .pcieResultSummary { max-width: 690px; margin: 14px 0 0; color: #59675F; font-size: 14px !important; line-height: 1.55; }
        .pcieDataChip { display: inline-flex; margin-left: 10px; padding: 4px 8px; color: #147345; background: #EAF8ED; border-radius: 5px; font-size: 10px; font-weight: 800; vertical-align: middle; }
        .pcieResultMeta { display: none; }
        .pcieResultAction { display: inline-flex; align-items: center; gap: 6px; min-height: 52px; padding: 0 20px; border-radius: 9px; font-size: 14px; }
        .pcieRulesCaption { margin: 32px 0 20px; font-size: 17px; }
        .pcieRulesGrid { gap: 18px; }
        .pcieRuleCell { min-height: 132px; padding: 18px; border-radius: 14px; }
        .pcieRuleCellTop { font-size: 16px; }
        .pcieRuleStatus { padding: 4px 7px; border-radius: 5px; background: #E8FFF0; font-size: 13px; }
        .batsLandingRoot section .pcieRuleCell p { margin-top: 12px; font-size: 15px !important; line-height: 1.42; }
        .pcieResultFootnote { margin-top: 28px; padding: 16px; border: 1px solid #E3EAE5; border-radius: 12px; background: #F8FAF9; font-size: 13px; }
        .legacyTheme .researchMetricCol { min-height: 148px; padding: 26px 18px; border-radius: 14px; }
        .legacyTheme .researchMetricCol > div:last-child > div:first-child { font-size: 32px !important; }
        .legacyTheme .researchMetricCol > div:last-child > div:last-child { font-size: 13px !important; }
        .legacyTheme .researchDataNote { padding: 16px 20px; border-radius: 10px; font-size: 13px; }
        .legacyTheme .finalCtaPhotoBanner { padding: 88px 20px; border-radius: 0; }
        .legacyTheme .finalCtaPhotoBanner .editorialTitlePrimary,
        .legacyTheme .finalCtaPhotoBanner .editorialTitleAccent { font-size: clamp(34px, 2.8vw, 48px) !important; }
        .legacyTheme .finalCtaPhotoBanner .editorialDescription { font-size: 16px !important; }
        .legacyTheme .finalCtaPhotoBanner a { min-height: 48px; padding: 0 24px !important; border-radius: 8px !important; font-size: 14px !important; }

        /* Prototype reference restore: compact, centered layout with breathing room at both edges. */
        .legacyTheme .batsContainer,
        .legacyHeaderInner {
          width: min(1280px, calc(100% - 80px));
          max-width: none;
        }
        .legacyHeaderInner { min-height: 72px; gap: 24px; }
        .batsLandingRoot { position: relative; }
        .legacyHeader {
          position: fixed;
          inset: 0 0 auto;
          z-index: 10;
          width: 100%;
          background: rgba(255, 255, 255, 0.62) !important;
          border-bottom: 0 !important;
          backdrop-filter: blur(12px);
        }
        .legacyBrandLogo {
          display: block;
          width: 38px;
          height: 38px;
          object-fit: contain;
        }
        .legacyBrandMark { width: 38px; height: 38px; border-radius: 10px; font-size: 18px; }
        .legacyBrandName { font-size: 16px; }
        .legacyBrandSub { font-size: 10px; }
        .legacyNav { gap: 56px; }
        .legacyNav a { font-size: 15px; }
        .legacyLanguage { font-size: 11px; }
        .legacyHeader .navPillBtn { min-height: 34px; height: 34px; padding: 0 14px; border-radius: 8px; font-size: 15px; }
        .legacyHeaderActions > .navPillBtn {
          box-sizing: border-box !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: auto;
          min-height: 40px !important;
          height: 40px !important;
          margin: 0;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          align-self: center;
          font-size: 15px;
          line-height: 1;
        }
        .legacyHeader .legacyBrandName { font-size: 17px !important; }
        .legacyHeader .legacyNav a,
        .legacyHeaderActions > .navPillBtn { font-size: 14px !important; }
        .legacyHero {
          position: relative;
          min-height: 0;
          padding: 0;
          background: #FFFFFF;
        }
        .legacyHero .batsContainer { width: 100%; max-width: none; padding: 0; }
        .legacyHeroGrid { position: relative; display: block; min-height: 0; height: auto; }
        .legacyHeroVisual {
          position: relative;
          inset: auto;
          width: 100%;
          min-height: 0;
          height: auto;
          overflow: visible;
          border-radius: 0;
        }
        .legacyHeroVisual::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, #FFFFFF 0%, rgba(255,255,255,.97) 27%, rgba(255,255,255,.66) 46%, rgba(255,255,255,.08) 68%, rgba(255,255,255,0) 100%); }
        .legacyHeroVisual img {
          display: block;
          width: 100%;
          height: auto;
          min-height: 0;
          object-fit: contain;
          object-position: center;
        }
        @media (min-width: 861px) {
          .legacyHeroVisual {
            aspect-ratio: 1672 / 760;
            overflow: hidden;
          }
          .legacyHeroVisual img {
            height: 100%;
            object-fit: cover;
            object-position: center;
          }
        }
        .legacyHeroCopy {
          position: absolute;
          z-index: 2;
          top: 50%;
          left: max(24px, 7.7vw);
          width: min(650px, 39vw);
          max-width: none;
          margin: 0;
          padding: 0;
          transform: translateY(-50%);
        }
        .legacyHero .editorialHeadingWrap { width: 100%; margin-bottom: 35px !important; }
        .legacyHero .editorialTitlePrimary,
        .legacyHero .editorialTitleAccent {
          color: #003D2A;
          font-family: var(--font-sans), sans-serif !important;
          font-size: clamp(31px, 3vw, 47px);
          font-style: normal !important;
          font-weight: 800;
          letter-spacing: -.05em;
          line-height: 1.07;
        }
        .legacyHero .editorialTitleAccent { margin-top: 10px !important; }
        .legacyHero .editorialEyebrow { margin-bottom: 35px; }
        .batsLandingRoot #home .editorialDescription { max-width: 640px; margin-top: 28px; font-size: 14px !important; line-height: 1.6; }
        @media (min-width: 1280px) {
          .legacyHero .editorialDescription { white-space: nowrap; }
        }
        .batsLandingRoot #home .editorialEyebrow > div { padding: 6px 10px !important; font-size: 12px !important; }
        .legacyHeroActions { margin: 0 0 30px; gap: 14px; }
        .legacyHeroActions a { min-height: 44px; padding: 0 20px !important; border-radius: 7px !important; font-size: 14px !important; }
        .legacyHeroHighlights {
          width: min(100%, 520px);
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 10px;
          color: #003D2A;
        }
        .legacyHeroHighlights li {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 22px;
          padding: 0;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.35;
        }
        .legacyHeroHighlights svg { flex: 0 0 auto; color: #168151; }
        .legacyHeroTrust {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          width: 100%;
          gap: 16px 28px;
          padding: 20px 22px;
          background: rgba(248, 248, 243, 0.84);
          border-radius: 18px;
          backdrop-filter: blur(4px);
        }
        .legacyHeroTrust > div {
          flex-direction: row !important;
          align-items: center !important;
          gap: 10px !important;
          font-size: 13px !important;
          line-height: 1.35;
        }
        .legacyHeroTrust svg { flex: 0 0 auto; width: 21px; height: 21px; }
        .legacyPlotBoundary,
        .legacyPlotCard { display: none; }
        .legacyPlotCardHead strong { font-size: 14px; }
        .legacyPlotPlace { grid-column: 1 / -1; font-size: 10px; }
        .legacyPlotStatus { grid-column: 1 / -1; grid-row: auto; justify-content: center; padding: 6px 8px; font-size: 10px; }
        .legacyTheme #problems { padding: 34px 0 36px !important; background: #FFFFFF !important; }
        .legacyTheme #solution { padding: 30px 0 !important; }
        .legacyTheme #workflow { padding: 36px 0 !important; background: #F1FBF4 !important; }
        .legacyTheme #products { padding: 38px 0 46px !important; }
        .legacyTheme #research { padding: 34px 0 !important; }
        .legacyTheme section:not(#home):not(#demo):not(#contact) .editorialTitlePrimary,
        .legacyTheme section:not(#home):not(#demo):not(#contact) .editorialTitleAccent,
        .legacyTheme .sectionCenterHead h2,
        .legacyTheme > section > .batsContainer > h2 { font-size: clamp(23px, 2.1vw, 32px) !important; }
        .legacyTheme section:not(#home):not(#demo):not(#contact) .editorialDescription,
        .legacyTheme .sectionCenterHead p { margin-top: 8px; font-size: 11px !important; }
        .legacyTheme .problemCardsGrid,
        .legacyTheme .valueCardsGrid { gap: 16px; }
        .legacyTheme .problemCardItem { min-height: 178px; padding: 18px 16px; border-radius: 10px; }
        .legacyTheme .problemCardItem > div:first-child { width: 48px !important; height: 48px !important; margin-bottom: 10px; padding: 10px; border-radius: 10px; }
        .legacyTheme .problemCardItem h3,
        .legacyTheme .solutionCardBox h3,
        .legacyTheme .workflowStepCard h4,
        .legacyTheme .valueCardItem h3 { font-size: 13px !important; }
        .legacyTheme .problemCardItem p,
        .legacyTheme .solutionCardBox p,
        .legacyTheme .workflowStepCard p,
        .legacyTheme .valueCardItem p { font-size: 10px !important; line-height: 1.5; }
        .legacyTheme section#problems:not(#home):not(#demo):not(#contact) .problemIntroHeading .editorialDescription,
        .legacyTheme section#solution:not(#home):not(#demo):not(#contact) .solutionIntroHeading .editorialDescription,
        .legacyTheme section#workflow:not(#home):not(#demo):not(#contact) .workflowIntroHeading .editorialDescription,
        .legacyTheme section#products:not(#home):not(#demo):not(#contact) .productIntroHeading .editorialDescription,
        .legacyTheme section.valueSection:not(#home):not(#demo):not(#contact) .valueIntroHeading .editorialDescription {
          font-size: 14px !important;
          line-height: 1.6;
        }
        .legacyTheme section.valueSection:not(#home):not(#demo):not(#contact) .valueIntroHeading .editorialTitlePrimary {
          font-size: clamp(23px, 2.1vw, 32px) !important;
        }
        .legacyTheme section.valueSection:not(#home):not(#demo):not(#contact) .valueIntroHeading,
        .legacyTheme section.valueSection:not(#home):not(#demo):not(#contact) .valueIntroHeading .editorialDescription {
          text-align: center;
        }
        .legacyTheme section.valueSection:not(#home):not(#demo):not(#contact) .valueIntroHeading .editorialTitle {
          align-items: center;
        }
        .legacyTheme section.valueSection:not(#home):not(#demo):not(#contact) .valueIntroHeading .editorialDescription {
          margin-left: auto;
          margin-right: auto;
        }
        .legacyTheme .valueSection .valueCardItem h3 {
          width: 100%;
          font-size: 15px !important;
          text-align: center;
        }
        .legacyTheme .valueSection .valueCardItem p {
          width: 100%;
          font-size: 13px !important;
          line-height: 1.5;
          text-align: justify;
          text-align-last: left;
        }
        .legacyTheme .audienceSection .audienceCardItem h4 {
          text-align: center;
          font-size: 15px !important;
        }
        .legacyTheme .audienceSection .audienceCardItem p {
          font-size: 13px !important;
          line-height: 1.5;
        }
        .legacyTheme section.audienceSection:not(#home):not(#demo):not(#contact) .sectionCenterHead,
        .legacyTheme section.audienceSection:not(#home):not(#demo):not(#contact) .sectionCenterHead h2,
        .legacyTheme section.audienceSection:not(#home):not(#demo):not(#contact) .sectionCenterHead p {
          text-align: left;
        }
        .legacyTheme section.audienceSection:not(#home):not(#demo):not(#contact) .sectionCenterHead p {
          font-size: 14px !important;
          line-height: 1.6;
          margin-left: 0;
          margin-right: auto;
        }
        .legacyTheme .traceLookupSection {
          padding: 52px 0 34px;
          background: #FFFFFF;
        }
        .legacyTheme .traceLookupBanner {
          position: relative;
          isolation: isolate;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          align-items: center;
          min-height: 230px;
          overflow: hidden;
          padding: 28px 34px;
          border: 1px solid #D7E9DE;
          border-radius: 16px;
          background: linear-gradient(100deg, #F2FCF6 0%, rgba(234, 248, 238, 0.92) 54%, rgba(226, 245, 224, 0.72) 100%);
          box-shadow: 0 10px 28px rgba(10, 76, 44, 0.06);
        }
        .legacyTheme .traceLookupBanner::before {
          position: absolute;
          z-index: -2;
          inset: 0;
          content: "";
          background: url('/images/traceability-fruit-orchard-banner.png') right center / cover no-repeat;
          opacity: 0.78;
        }
        .legacyTheme .traceLookupBanner::after {
          position: absolute;
          z-index: -1;
          inset: 0;
          content: "";
          background: linear-gradient(90deg, #F5FDF8 0%, rgba(245, 253, 248, 0.96) 38%, rgba(245, 253, 248, 0.58) 62%, rgba(245, 253, 248, 0.08) 100%);
        }
        .legacyTheme .traceLookupCopy {
          max-width: 620px;
        }
        .legacyTheme .traceLookupCopy h2 {
          margin: 0 0 8px;
          color: #063B2A;
          font-size: clamp(21px, 2vw, 28px) !important;
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1.2;
          text-align: left;
        }
        .legacyTheme .traceLookupCopy > p {
          max-width: 505px;
          margin: 0 0 16px;
          color: #526B5D;
          font-size: 13px !important;
          line-height: 1.5;
          text-align: left;
        }
        .legacyTheme .traceLookupForm {
          display: flex;
          gap: 10px;
        }
        .legacyTheme .traceLookupForm input {
          min-width: 0;
          flex: 1;
          height: 48px;
          padding: 0 15px;
          color: #063B2A;
          border: 1px solid #D6E5DB;
          border-radius: 9px;
          outline: none;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 2px 8px rgba(8, 63, 48, 0.05);
          font: inherit;
          font-size: 13px;
        }
        .legacyTheme .traceLookupForm input:focus {
          border-color: #168151;
          box-shadow: 0 0 0 3px rgba(22, 129, 81, 0.14);
        }
        .legacyTheme .traceLookupForm button {
          display: inline-flex;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-width: 132px;
          height: 48px;
          padding: 0 18px;
          color: #FFFFFF;
          border: 0;
          border-radius: 9px;
          background: #087D4D;
          box-shadow: 0 5px 12px rgba(8, 125, 77, 0.2);
          cursor: pointer;
          font: inherit;
          font-size: 14px;
          font-weight: 800;
        }
        .legacyTheme .traceLookupForm button:hover { background: #066B41; }
        .legacyTheme .traceLookupCopy > p.traceLookupError {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          max-width: none;
          width: calc(100% - 142px);
          margin: 15px 142px 0 0;
          color: #C0392B;
          font-size: 12px;
          text-align: center;
        }
        @media (max-width: 860px) {
          .legacyTheme .traceLookupBanner {
            padding: 26px 24px;
          }
          .legacyTheme .traceLookupBanner::before { background-size: auto 100%; opacity: 0.58; }
        }
        @media (max-width: 560px) {
          .legacyTheme .traceLookupSection { padding-bottom: 24px; }
          .legacyTheme .traceLookupBanner { padding: 22px 18px; border-radius: 12px; }
          .legacyTheme .traceLookupForm { flex-direction: column; }
          .legacyTheme .traceLookupForm button { width: 100%; }
          .legacyTheme .traceLookupCopy > p.traceLookupError { width: 100%; margin: 15px 0 0; }
        }
        .legacyTheme section#solution:not(#home):not(#demo):not(#contact) .solutionCardDetailList {
          display: grid;
          gap: 6px;
          margin: 12px 0 0;
          padding: 0;
          list-style: none;
          color: #4B5563;
          font-size: 13px !important;
          line-height: 1.5;
          text-align: justify;
          text-align-last: left;
        }
        .legacyTheme section#solution:not(#home):not(#demo):not(#contact) .solutionCardDetailList li {
          position: relative;
          padding-left: 12px;
        }
        .legacyTheme section#solution:not(#home):not(#demo):not(#contact) .solutionCardDetailList strong {
          color: #003D2A;
        }
        .legacyTheme section#solution:not(#home):not(#demo):not(#contact) .solutionCardDetailList li::before {
          position: absolute;
          top: 0.55em;
          left: 0;
          width: 4px;
          height: 4px;
          content: "";
          background: #168151;
          border-radius: 999px;
        }
        .legacyTheme section#solution:not(#home):not(#demo):not(#contact) .solutionCardBox > div:first-child {
          position: relative;
          justify-content: center !important;
        }
        .legacyTheme section#solution:not(#home):not(#demo):not(#contact) .solutionCardBox > div:first-child > div {
          position: absolute;
          left: 0;
        }
        .legacyTheme section#solution:not(#home):not(#demo):not(#contact) .solutionCardBox h3 {
          width: 100%;
          font-size: 15px !important;
          text-align: center;
        }
        .legacyTheme section#solution:not(#home):not(#demo):not(#contact) .solutionCardBox p {
          width: 100%;
          font-size: 13px !important;
          line-height: 1.5;
          text-align: justify;
          text-align-last: left;
        }
        .legacyTheme section#solution:not(#home):not(#demo):not(#contact) .solutionCardBox {
          display: flex;
          flex-direction: column;
          align-self: stretch;
        }
        .legacyTheme section#solution:not(#home):not(#demo):not(#contact) .solutionCardBanner {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 7;
          flex: 0 0 auto;
          margin: 0 0 16px;
          overflow: hidden;
          border-radius: 10px;
        }
        .legacyTheme section#solution:not(#home):not(#demo):not(#contact) .solutionCardBanner img {
          object-fit: cover;
        }
        .legacyTheme section#solution:not(#home):not(#demo):not(#contact) .solutionCardBox h3 {
          margin: 0 0 12px !important;
        }
        .legacyTheme section#problems:not(#home):not(#demo):not(#contact) .legacyProblemImage {
          position: relative;
          width: 120px !important;
          height: 120px !important;
          min-height: 120px;
          margin: 0 0 14px !important;
          padding: 0 !important;
          align-self: center;
          overflow: hidden;
          background: transparent !important;
          border-radius: 12px !important;
        }
        .legacyTheme section#problems:not(#home):not(#demo):not(#contact) .legacyProblemImage img {
          object-fit: cover;
        }
        .legacyTheme section#problems:not(#home):not(#demo):not(#contact) .legacyProblemImage--cutout img {
          object-fit: contain;
        }
        .legacyTheme #problems .problemCardItem h3 {
          width: 100%;
          font-size: 15px !important;
          text-align: center;
        }
        .legacyTheme #problems .problemCardItem p {
          width: 100%;
          font-size: 13px !important;
          line-height: 1.5;
          text-align: justify;
          text-align-last: left;
        }
        .legacyTheme #problems .problemCardItem--balancedCopy h3 {
          margin-bottom: 12px !important;
        }
        .legacyTheme #problems .problemCardItem--balancedCopy p {
          margin-top: 0 !important;
          margin-bottom: 0 !important;
        }
        .legacyTheme .solutionCardsRow { gap: 18px; }
        .legacyTheme .solutionCardBox { min-height: 166px; padding: 18px; border-radius: 10px; }
        .legacyTheme .workflowStepCard { min-height: 155px; padding: 18px 12px; border-radius: 10px; }
        .legacyTheme .stepNumberCircle { width: 22px; height: 22px; font-size: 10px; }
        .legacyTheme .stepIconBox { width: 34px; height: 34px; }
        .legacyTheme .stepIconBox svg { width: 17px; height: 17px; }
        .legacyTheme section#workflow:not(#home):not(#demo):not(#contact) .workflowStepCard {
          align-items: center;
          align-self: stretch;
          min-width: 0;
        }
        .legacyTheme section#workflow:not(#home):not(#demo):not(#contact) .workflowStepsGrid {
          align-items: stretch;
        }
        .legacyTheme section#workflow:not(#home):not(#demo):not(#contact) .stepNumberCircle {
          width: 30px;
          height: 30px;
          font-size: 15px;
          margin-bottom: 14px;
        }
        .legacyTheme section#workflow:not(#home):not(#demo):not(#contact) .workflowStepCard h4 {
          width: 100%;
          font-size: 15px !important;
          line-height: 1.35;
          letter-spacing: -0.035em;
          text-align: center;
          white-space: nowrap;
          margin: 0 0 12px !important;
        }
        .legacyTheme section#workflow:not(#home):not(#demo):not(#contact) .workflowStepCard p {
          width: 100%;
          font-size: 13px !important;
          line-height: 1.5;
          text-align: justify;
          text-align-last: left;
        }
        @media (max-width: 1200px) {
          .legacyTheme section#workflow:not(#home):not(#demo):not(#contact) .workflowStepCard h4 {
            white-space: normal;
          }
        }
        .legacyTheme .legacyProductGrid { display: block; }
        .legacyTheme .legacyProductShowcase { overflow: hidden; border-radius: 14px; }
        .legacyTheme .legacyProductShowcase img { display: block; width: 100%; height: auto; }
        .pcieSandbox { padding: 52px 0 58px; }
        .pcieSandboxHead { margin-bottom: 28px; }
        .pcieSandboxHead h2 { font-size: 30px; }
        .pcieScenarioTabs { gap: 10px; margin-bottom: 26px; }
        .pcieScenarioTab { min-height: 42px; padding: 0 14px; border-radius: 9px; font-size: 12px; }
        .pcieResultTable { max-width: 1040px; padding: 28px; border-radius: 16px; }
        .pcieResultStatus { padding: 5px 8px; font-size: 12px; }
        .pcieResultTitle { font-size: 14px; }
        .pcieResultSummary { font-size: 11px !important; }
        .pcieResultAction { min-height: 36px; padding: 0 12px; font-size: 11px; }
        .pcieRulesCaption { margin: 20px 0 12px; font-size: 12px; }
        .pcieRulesGrid { gap: 10px; }
        .pcieRuleCell { min-height: 92px; padding: 12px; border-radius: 9px; }
        .pcieRuleCellTop { font-size: 11px; }
        .batsLandingRoot section .pcieRuleCell p { font-size: 10px !important; }
        .pcieResultFootnote { margin-top: 16px; padding: 10px; font-size: 10px; }
        .legacyTheme .valueCardItem { min-height: 150px; padding: 18px 14px; border-radius: 10px; }
        .legacyTheme .valueCardItem svg { width: 25px; height: 25px; }
        .legacyTheme .audienceCardsGrid { gap: 12px; }
        .legacyTheme .audienceCardItem > div:first-child { height: 112px !important; }
        .legacyTheme .audienceCardItem > div:nth-child(2) { padding: 11px !important; }
        .legacyTheme .audienceCardItem h4 { font-size: 11px !important; }
        .legacyTheme .audienceCardItem p { font-size: 9px !important; }
        .legacyTheme .finalCtaPhotoBanner { padding: 54px 20px; }
        .legacyTheme .finalCtaPhotoBanner .editorialTitlePrimary,
        .legacyTheme .finalCtaPhotoBanner .editorialTitleAccent { font-size: clamp(25px, 2.5vw, 34px) !important; }
        .legacyTheme .finalCtaPhotoBanner .editorialDescription { font-size: 14px !important; }
        .legacyTheme .finalCtaPhotoBanner a { min-height: 38px; padding: 0 16px !important; font-size: 12px !important; }
        @media (max-width: 1280px) {
          .legacyTheme .batsContainer,
          .legacyHeaderInner { width: calc(100% - 56px); }
          .legacyNav { gap: 40px; }
          .legacyNav a { font-size: 15px; }
          .legacyHeaderInner { gap: 25px; }
          .legacyHeroGrid { gap: 44px; }
          .legacyTheme .problemCardItem { padding: 28px 24px; }
        }
        @media (max-width: 1080px) {
          .legacyNav { gap: 26px; }
        }
        @media (max-width: 860px) {
          .legacyHeaderInner { min-height: 72px; }
          .legacyBrandMark { width: 38px; height: 38px; border-radius: 10px; font-size: 17px; }
          .legacyBrandName { font-size: 16px; }
          .legacyBrandSub { font-size: 10px; }
          .legacyHero { padding: 46px 0 58px; }
          .legacyHero .editorialTitlePrimary,
          .legacyHero .editorialTitleAccent { font-size: clamp(40px, 10vw, 56px); }
          .legacyHero .editorialDescription { font-size: 10px; }
          .legacyHeroVisual, .legacyHeroVisual img { min-height: 320px; }
          .legacyPlotBoundary { inset: 17% 12% 28% 13%; font-size: 10px; }
          .legacyPlotCard { right: 14px; bottom: 14px; left: 14px; padding: 10px 12px; }
          .legacyPlotPlace { font-size: 9px; }
          .legacyPlotStatus { padding: 5px 7px; font-size: 9px; }
          .legacyTheme #problems, .legacyTheme #solution, .legacyTheme #products, .legacyTheme #workflow, .legacyTheme #research { padding: 66px 0 !important; }
          .legacyTheme .problemCardsGrid, .legacyTheme .valueCardsGrid { gap: 18px; }
          .legacyTheme .problemCardItem { min-height: 260px; padding: 24px; }
          .legacyTheme .legacyProductGrid { gap: 20px; }
          .legacyTheme .legacyProductCard { padding: 18px; }
          .legacyTheme .legacyProductCardTop { align-items: flex-start; flex-direction: column; gap: 10px; }
          .legacyTheme .legacyProductCard figure { height: 230px; }
          .pcieResultTable { padding: 25px; }
          .pcieScenarioTabs { margin-bottom: 24px; }
          .pcieRuleCell { min-height: 108px; }
        }
        @media (max-width: 1280px) {
          .legacyTheme .batsContainer,
          .legacyHeaderInner { width: calc(100% - 64px); }
          .legacyNav a { font-size: 15px; }
          .legacyTheme .problemCardItem { padding: 18px 16px; }
        }
        @media (max-width: 860px) {
          .legacyTheme .batsContainer,
          .legacyHeaderInner { width: calc(100% - 40px); }
          .legacyHero { padding: 36px 0 0; }
          .legacyHero .batsContainer { width: 100%; }
          .legacyHeroGrid { display: flex; min-height: 0; height: auto; flex-direction: column; }
          .legacyHeroCopy {
            position: relative;
            top: auto;
            left: auto;
            width: calc(100% - 40px);
            margin: 0 auto;
            padding: 0;
            transform: none;
          }
          .legacyHero .editorialHeadingWrap,
          .legacyHeroTrust { width: 100%; }
          .legacyHeroTrust { grid-template-columns: minmax(0, 1fr); gap: 14px; padding: 18px; }
          .legacyHero .editorialTitlePrimary,
          .legacyHero .editorialTitleAccent { font-size: clamp(32px, 9vw, 45px); }
          .legacyHero .editorialDescription { font-size: 10px; }
          .legacyHeroVisual { position: relative; inset: auto; width: 100%; margin-top: 24px; }
          .legacyHeroVisual::after { display: none; }
          .legacyHeroVisual img { width: 100%; height: auto; min-height: 0; object-fit: contain; }
          .legacyTheme #problems, .legacyTheme #solution, .legacyTheme #products, .legacyTheme #workflow, .legacyTheme #research { padding: 44px 0 !important; }
          .legacyTheme .problemCardItem { min-height: auto; }
        }
        .lookupResultDescription {
          font-family: var(--font-sans), sans-serif !important;
          font-weight: 400 !important;
          line-height: 1.5 !important;
        }
        #lookup-result-status-description {
          font-size: 15px !important;
        }
      `}</style>

      {/* ============================================================ */}
      {/* S00: STICKY HEADER / NAVBAR (Exact Mockup Match)             */}
      {/* ============================================================ */}
      <header className="legacyHeader">
        <div className="legacyHeaderInner">
          <Link href="/" className="legacyBrand">
            <Image
              src="/bats-logo.png"
              alt="BATS-AgriGuard"
              width={45}
              height={45}
              className="legacyBrandLogo"
              priority
            />
            <span className="legacyBrandText">
              <span className="legacyBrandName">BATS-AgriGuard</span>
            </span>
          </Link>

          <nav className="legacyNav" aria-label="Điều hướng chính">
            <a href="#home">Trang chủ</a>
            <a href="#solution">Giải pháp</a>
            <a href="#products">Sản phẩm</a>
            <a href="#contact">Liên hệ</a>
          </nav>

          <div className="legacyHeaderActions">
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="navPillBtn navPillBtn--outline"
              title="Tra cứu nguồn gốc nông sản không cần đăng nhập"
            >
              Truy xuất nguồn gốc
            </button>

            <Link href="/login" className="navPillBtn">
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* S01: HERO SECTION */}
      {/* ============================================================ */}
      <section id="home" className="legacyHero">
        <div className="batsContainer">
          <div className="legacyHeroGrid">
            <div className="legacyHeroCopy">
            <EditorialHeading
              level="h1"
              size="hero"
              align="left"
              theme="light"
              eyebrow={
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#ECFDF5",
                  border: "1px solid #A7F3D0",
                  color: "#065F46",
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "5px 12px",
                  borderRadius: "9999px"
                }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981" }} />
                  Hệ thống truy xuất nguồn gốc &amp; kiểm tra tính toàn vẹn vùng trồng
                </div>
              }
              primary="Minh bạch nguồn gốc"
              accent="Bảo vệ mã số vùng trồng"
              description={
                <>
                  BATS-AgriGuard giúp bảo vệ mã số vùng trồng, phát hiện thông tin bất thường<br />
                  và hỗ trợ người tiêu dùng dễ dàng tra cứu nguồn gốc nông sản Việt Nam
                </>
              }
            />

            <div className="legacyHeroActions">
              <a
                href="#solution"
                style={{
                  backgroundColor: "#075038",
                  color: "#FFFFFF",
                  padding: "10px 22px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "15px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  textDecoration: "none",
                  boxShadow: "0 3px 10px rgba(7, 80, 56, 0.2)"
                }}
              >
                Khám phá giải pháp <ArrowRight size={17} aria-hidden="true" />
              </a>
              <a
                href="#products"
                style={{
                  backgroundColor: "#FFFFFF",
                  color: "#075038",
                  border: "1.5px solid #075038",
                  padding: "9px 20px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "15px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none"
                }}
              >
                Trải nghiệm sản phẩm
              </a>
            </div>

            </div>
            <div className="legacyHeroVisual" aria-label="Nông sản được kết nối trong hệ sinh thái truy xuất">
              <img
                src="/images/connected-harvest-valley.png"
                alt="Nông dân, doanh nghiệp và cán bộ cùng kết nối trong chuỗi truy xuất nông sản"
                fetchPriority="high"
              />
              <div className="legacyPlotBoundary" aria-hidden="true">
                <MapPin size={30} fill="currentColor" />
                <span>Ranh giới Polygon DPI (12.5 ha)</span>
              </div>
              <div className="legacyPlotCard">
                <div className="legacyPlotCardHead">
                  <strong>VN-TT-0012</strong>
                  <span className="legacyDemoBadge">DEMO</span>
                </div>
                <span className="legacyPlotPlace">Sầu riêng Ri6 · Ea Yông, Krông Pắc, Đắk Lắk · 12.5 ha</span>
                <span className="legacyPlotStatus"><CheckCircle2 size={14} /> Hợp lệ (DPI Active)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* S02: PROBLEM SECTION (4 Equal Illustrated Cards)             */}
      {/* ============================================================ */}
      <section style={{ padding: "40px 0 32px", backgroundColor: "#FFFFFF" }} id="problems">
        <div className="batsContainer">
          <EditorialHeading
            level="h2"
            size="section"
            align="center"
            eyebrow="Thách thức"
            primary="Vấn đề hiện nay trong truy xuất nông sản"
            accent=""
            description={
              <>
                Mã số vùng trồng có thể bị sử dụng sai mà khó phát hiện, đặc biệt khi thông tin chỉ được ghi chép<br />
                trên giấy hoặc lưu trong tem truy xuất nguồn gốc thông thường
              </>
            }
            className="problemIntroHeading"
            style={{ marginBottom: "28px" }}
          />


          <div className="problemCardsGrid">
            {/* Card 1 */}
            <div className="problemCardItem problemCardItem--balancedCopy">
              <div className="legacyProblemImage">
                <Image src="/images/problem_1_map-sharp.png" alt="Minh họa sai lệch vị trí vùng trồng" fill sizes="120px" />
              </div>
              <h3>Sai lệch vị trí vùng trồng</h3>
              <p>Vị trí được ghi nhận khi thu hoạch không trùng khớp với khu vực vùng trồng đã đăng ký chính thức với cơ quan quản lý</p>
            </div>

            {/* Card 2 */}
            <div className="problemCardItem">
              <div className="legacyProblemImage legacyProblemImage--cutout">
                <Image src="/images/problem_2_farmer-cutout.png" alt="Minh họa sai chủ thể được ủy quyền" fill sizes="120px" />
              </div>
              <h3>Sai chủ thể được ủy quyền</h3>
              <p>Mã số vùng trồng bị mượn hoặc tự ý sử dụng bởi cá nhân, thương lái hoặc tổ chức không nằm trong danh sách được phép sử dụng mã số vùng trồng đã đăng ký với cơ quan quản lý</p>
            </div>

            {/* Card 3 */}
            <div className="problemCardItem">
              <div className="legacyProblemImage legacyProblemImage--cutout">
                <Image src="/images/problem_3_box-cutout.png" alt="Minh họa sản lượng bất thường" fill sizes="120px" />
              </div>
              <h3>Sản lượng bất thường</h3>
              <p>Sản lượng nông sản thu hoạch vượt quá khả năng sản xuất của diện tích vùng trồng đã đăng ký, hoặc có sự chênh lệch lớn về số lượng nông sản giữa các khâu thu mua và đóng gói</p>
            </div>

            {/* Card 4 */}
            <div className="problemCardItem">
              <div className="legacyProblemImage legacyProblemImage--cutout">
                <Image src="/images/problem_4_chain-cutout.png" alt="Minh họa thiếu bằng chứng chuỗi" fill sizes="120px" />
              </div>
              <h3>Thiếu bằng chứng chuỗi</h3>
              <p>Thiếu hình ảnh thực tế tại vùng trồng, giấy tờ xác nhận việc giao nhận nông sản hoặc thông tin bị gián đoạn giữa các khâu, khiến số liệu dễ bị thay đổi hoặc chỉnh sửa sau khi đã ghi nhận</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* S03: SOLUTION SECTION (3 Horizontally Connected Cards)        */}
      {/* ============================================================ */}
      <section style={{ padding: "48px 0 72px", backgroundColor: "#FFFFFF" }} id="solution">
        <div className="batsContainer">
          <EditorialHeading
            level="h2"
            size="section"
            align="center"
            eyebrow="Giải pháp toàn diện"
            primary="Giải pháp BATS-AgriGuard"
            description={
              <>
                Kết hợp việc ghi nhận thông tin, tự động kiểm tra những điểm bất thường và lưu giữ bằng chứng an toàn,<br />
                giúp ngăn ngừa việc chỉnh sửa dữ liệu và bảo vệ uy tín mã số vùng trồng
              </>
            }
            className="solutionIntroHeading"
            style={{ marginBottom: "44px" }}
          />


          <div className="solutionCardsRow">
            {/* Card 1: DPI */}
            <div className="solutionCardBox">
              <figure className="solutionCardBanner">
                <Image src="/images/solution-planting-info-banner.png" alt="Vùng trồng được đánh dấu trên bản đồ" fill sizes="(max-width: 840px) 100vw, 30vw" />
              </figure>
              <h3 style={{ fontSize: "14.5px", fontWeight: 700, color: "#063B2A", margin: 0 }}>
                Thông tin vùng trồng
              </h3>
              <p style={{ fontSize: "12px", color: "#4B5563", margin: 0, lineHeight: 1.5 }}>
                Lưu trữ và quản lý toàn bộ thông tin của từng vùng trồng, bao gồm vị trí, diện tích, loại cây trồng, người được phép sử dụng mã số và thời hạn hiệu lực, giúp việc quản lý và kiểm tra nguồn gốc trở nên dễ dàng hơn.
              </p>
              <ul className="solutionCardDetailList">
                <li><strong>Quản lý vị trí vùng trồng:</strong> Xác định rõ vị trí và ranh giới của từng vùng trồng trên bản đồ.</li>
                <li><strong>Quản lý người được phép sử dụng:</strong> Theo dõi các nông hộ, xã viên và tổ chức được quyền sử dụng mã số vùng trồng.</li>
                <li><strong>Theo dõi sản lượng theo mùa vụ:</strong> Ghi nhận và đối chiếu sản lượng nông sản với mức sản lượng dự kiến của từng mùa vụ.</li>
              </ul>
            </div>

            {/* Connector Dots 1 */}
            <div className="solutionConnectorDot">
              <span>●</span><span>●</span><span>●</span>
            </div>

            {/* Card 2: PCIE */}
            <div className="solutionCardBox">
              <figure className="solutionCardBanner">
                <Image src="/images/solution-anomaly-alert-banner.png" alt="Cảnh báo bất thường trong chuỗi nông sản" fill sizes="(max-width: 840px) 100vw, 30vw" />
              </figure>
              <h3 style={{ fontSize: "14.5px", fontWeight: 700, color: "#063B2A", margin: 0 }}>
                Kiểm tra và cảnh báo bất thường
              </h3>
              <p style={{ fontSize: "12px", color: "#4B5563", margin: 0, lineHeight: 1.5 }}>
                Hệ thống tự động kiểm tra thông tin vùng trồng, sản lượng và quá trình vận chuyển dựa trên 8 nhóm tiêu chí, giúp phát hiện những dấu hiệu bất thường và đưa ra cảnh báo kèm lý do rõ ràng.
              </p>
              <ul className="solutionCardDetailList">
                <li><strong>Kiểm tra thông tin toàn diện:</strong> Đối chiếu dữ liệu dựa trên 8 nhóm tiêu chí khác nhau.</li>
                <li><strong>Tự động phát hiện bất thường:</strong> Cảnh báo những thông tin đáng ngờ và chuyển đến người phụ trách để kiểm tra lại.</li>
                <li><strong>Kiểm tra trước khi lưu trữ:</strong> Đánh giá thông tin trước khi ghi nhận và lưu giữ bằng chứng lâu dài.</li>
              </ul>
            </div>

            {/* Connector Dots 2 */}
            <div className="solutionConnectorDot">
              <span>●</span><span>●</span><span>●</span>
            </div>

            {/* Card 3: Blockchain Anchoring */}
            <div className="solutionCardBox">
              <figure className="solutionCardBanner">
                <Image src="/images/solution-secure-record-banner.png" alt="Hồ sơ nông sản được bảo vệ an toàn" fill sizes="(max-width: 840px) 100vw, 30vw" />
              </figure>
              <h3 style={{ fontSize: "14.5px", fontWeight: 700, color: "#063B2A", margin: 0 }}>
                Lưu giữ và bảo vệ thông tin
              </h3>
              <p style={{ fontSize: "12px", color: "#4B5563", margin: 0, lineHeight: 1.5 }}>
                Sau khi được kiểm tra, thông tin về quá trình sản xuất và vận chuyển nông sản sẽ được lưu giữ bằng công nghệ bảo mật, giúp phát hiện những thay đổi về sau và tạo bằng chứng đáng tin cậy khi cần kiểm tra, đối chiếu.
              </p>
              <ul className="solutionCardDetailList">
                <li><strong>Bảo vệ thông tin đã ghi nhận:</strong> Tạo dấu xác nhận riêng cho từng hoạt động trong quá trình sản xuất và vận chuyển.</li>
                <li><strong>Dễ dàng kiểm tra và đối chiếu:</strong> Cung cấp bằng chứng để các bên liên quan có thể kiểm tra tính toàn vẹn của thông tin.</li>
                <li><strong>Thống nhất cách lưu trữ:</strong> Ghi nhận thông tin theo một tiêu chuẩn chung, giúp dễ dàng theo dõi hành trình nông sản.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* S04: WORKFLOW SECTION (5 Steps on Mint Band)                 */}
      {/* ============================================================ */}
      <section
        id="workflow"
        style={{
          padding: "36px 0 40px",
          background: "linear-gradient(180deg, #F0FAF5 0%, #FFFFFF 100%)",
          borderTop: "1px solid #E5E7EB",
          borderBottom: "1px solid #E5E7EB"
        }}
      >
        <div className="batsContainer">
          <EditorialHeading
            level="h2"
            size="section"
            align="center"
            eyebrow="Quy trình 6 bước"
            primary="Từ vùng trồng đến tay người tiêu dùng"
            description="Từ vùng trồng đến tay người tiêu dùng, mọi thông tin đều được ghi nhận, kiểm tra và có thể tra cứu rõ ràng"
            className="workflowIntroHeading"
            style={{ marginBottom: "28px" }}
          />

          <div className="workflowStepsGrid">
            {/* Step 1 */}
            <div className="workflowStepCard">
              <div className="stepNumberCircle">1</div>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#063B2A", margin: "0 0 6px" }}>
                Đăng ký vùng trồng
              </h4>
              <p style={{ fontSize: "11px", color: "#6B7280", margin: 0 }}>
                Ghi nhận và xác minh mã số vùng trồng, vị trí, diện tích và danh sách cá nhân, tổ chức được phép sử dụng mã số
              </p>
            </div>

            {/* Arrow 1 */}
            <div className="workflowArrow">→</div>

            {/* Step 2 */}
            <div className="workflowStepCard">
              <div className="stepNumberCircle">2</div>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#063B2A", margin: "0 0 6px" }}>
                Ghi nhận hoạt động thực tế
              </h4>
              <p style={{ fontSize: "11px", color: "#6B7280", margin: 0 }}>
                Nông dân và thương lái ghi lại thông tin thu hoạch, khối lượng, vị trí và hình ảnh thực tế thông qua ứng dụng Zalo
              </p>
            </div>

            {/* Arrow 2 */}
            <div className="workflowArrow">→</div>

            {/* Step 3 */}
            <div className="workflowStepCard">
              <div className="stepNumberCircle">3</div>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#063B2A", margin: "0 0 6px" }}>
                Kiểm tra thông tin tự động
              </h4>
              <p style={{ fontSize: "11px", color: "#6B7280", margin: 0 }}>
                Hệ thống tự động đối chiếu thông tin theo 8 nhóm tiêu chí để phát hiện những điểm bất thường và giải thích rõ nguyên nhân
              </p>
            </div>

            {/* Arrow 3 */}
            <div className="workflowArrow">→</div>

            {/* Step 4 */}
            <div className="workflowStepCard">
              <div className="stepNumberCircle">4</div>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#063B2A", margin: "0 0 6px" }}>
                Đánh giá và cảnh báo
              </h4>
              <p style={{ fontSize: "11px", color: "#6B7280", margin: 0 }}>
                Phân loại thông tin thành ba mức: Hợp lệ, Cần kiểm tra lại hoặc Không đạt yêu cầu. Những trường hợp nghi vấn được chuyển đến hợp tác xã để xem xét
              </p>
            </div>

            {/* Arrow 4 */}
            <div className="workflowArrow">→</div>

            {/* Step 5 */}
            <div className="workflowStepCard">
              <div className="stepNumberCircle">5</div>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#063B2A", margin: "0 0 6px" }}>
                Lưu giữ và tra cứu nguồn gốc
              </h4>
              <p style={{ fontSize: "11px", color: "#6B7280", margin: 0 }}>
                Thông tin sau khi được kiểm tra sẽ được lưu giữ an toàn, giúp phát hiện những thay đổi về sau. Người tiêu dùng và đối tác có thể quét mã trên sản phẩm để tra cứu nguồn gốc
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* S05: PRODUCT SHOWCASE SECTION (Laptop + 2 Phones)            */}
      {/* ============================================================ */}
      <section style={{ padding: "36px 0 44px", backgroundColor: "#FFFFFF" }} id="products">
        <div className="batsContainer">
          <div className="legacyProductHead">
            <EditorialHeading
              level="h2"
              size="section"
              align="left"
              primary="Sản phẩm của chúng tôi"
              accent=""
              description={
                <>
                  Cung cấp các ứng dụng dễ sử dụng, giúp nông dân, hợp tác xã, doanh nghiệp<br />
                  và người tiêu dùng cùng tham gia quản lý, theo dõi và tra cứu nguồn gốc nông sản
                </>
              }
              className="productIntroHeading"
              style={{ maxWidth: "560px" }}
            />

          </div>

          <div className="legacyProductGrid">
            <div className="legacyProductShowcase">
              <Image
                src="/images/devices_showcase.png"
                alt="Web Application và Zalo Mini App của BATS-AgriGuard"
                width={2560}
                height={972}
                sizes="(max-width: 1280px) 92vw, 1280px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* S07: VALUE PROPOSITION SECTION (4 Equal Cards)               */}
      {/* ============================================================ */}
      <section className="valueSection" style={{ padding: "36px 0 28px", backgroundColor: "#FFFFFF" }}>
        <div className="batsContainer">
          <EditorialHeading
            level="h2"
            size="section"
            align="center"
            eyebrow="Giá trị cốt lõi"
            primary="Minh bạch thông tin, xây dựng niềm tin"
            description={
              <>
                BATS-AgriGuard giúp bảo vệ mã số vùng trồng, nâng cao độ tin cậy của nông sản<br />
                và mang lại lợi ích thiết thực cho các bên tham gia từ sản xuất đến tiêu dùng
              </>
            }
            className="valueIntroHeading"
            style={{ marginBottom: "28px" }}
          />


          <div className="valueCardsGrid">
            {/* Card 1 */}
            <div className="valueCardItem">
              <div style={{ color: "#063B2A", marginBottom: "12px" }}>
                <ShieldCheck size={30} />
              </div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#063B2A", margin: "0 0 6px" }}>
                Phát hiện sớm những bất thường
              </h3>
              <p style={{ fontSize: "12px", color: "#4B5563", margin: 0, lineHeight: 1.45 }}>
                Phát hiện các dấu hiệu sử dụng sai mã số vùng trồng, thu hoạch không đúng khu vực hoặc khai báo sản lượng bất thường, giúp kịp thời kiểm tra trước khi xuất khẩu.
              </p>
            </div>

            {/* Card 2 */}
            <div className="valueCardItem">
              <div style={{ color: "#063B2A", marginBottom: "12px" }}>
                <TrendingUp size={30} />
              </div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#063B2A", margin: "0 0 6px" }}>
                Thông tin rõ ràng, đáng tin cậy
              </h3>
              <p style={{ fontSize: "12px", color: "#4B5563", margin: 0, lineHeight: 1.45 }}>
                Ghi nhận vị trí, hình ảnh thực tế và lưu giữ bằng chứng an toàn, giúp dễ dàng kiểm tra nguồn gốc và phát hiện những thay đổi thông tin về sau.
              </p>
            </div>

            {/* Card 3 */}
            <div className="valueCardItem">
              <div style={{ color: "#063B2A", marginBottom: "12px" }}>
                <Sprout size={30} />
              </div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#063B2A", margin: "0 0 6px" }}>
                Quản lý dễ dàng, hiệu quả
              </h3>
              <p style={{ fontSize: "12px", color: "#4B5563", margin: 0, lineHeight: 1.45 }}>
                Giúp hợp tác xã và cơ quan quản lý theo dõi vùng trồng, sản lượng, người tham gia sản xuất và tổng hợp báo cáo nhanh chóng, thuận tiện hơn.
              </p>
            </div>

            {/* Card 4 */}
            <div className="valueCardItem">
              <div style={{ color: "#063B2A", marginBottom: "12px" }}>
                <Users size={30} />
              </div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#063B2A", margin: "0 0 6px" }}>
                Nâng cao giá trị nông sản
              </h3>
              <p style={{ fontSize: "12px", color: "#4B5563", margin: 0, lineHeight: 1.45 }}>
                Tăng độ tin cậy về nguồn gốc sản phẩm, hỗ trợ nâng cao khả năng cạnh tranh và đáp ứng các yêu cầu truy xuất nguồn gốc của thị trường xuất khẩu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* S08: PUBLIC PRODUCT TRACEABILITY LOOKUP                     */}
      {/* ============================================================ */}
      <section id="trace-lookup" className="traceLookupSection" aria-labelledby="trace-lookup-title">
        <div className="batsContainer">
          <div className="traceLookupBanner">
            <div className="traceLookupCopy">
              <h2 id="trace-lookup-title">Truy xuất nguồn gốc nông sản</h2>
              <p>
                Quét mã QR hoặc nhập mã để xem hành trình sản phẩm,<br />
                mã vùng trồng, kết quả kiểm tra và bằng chứng xác thực.
              </p>
              <form className="traceLookupForm" onSubmit={handleLookupSubmit}>
                <input
                  type="text"
                  aria-label="Nhập mã truy xuất nguồn gốc hoặc mã sản phẩm để tra cứu thông tin"
                  placeholder="Nhập mã truy xuất nguồn gốc hoặc mã sản phẩm để tra cứu thông tin"
                  value={lookupQuery}
                  onChange={(e) => {
                    setLookupQuery(e.target.value);
                    if (lookupError) setLookupError(null);
                  }}
                />
                <button type="submit">
                  <Search size={18} aria-hidden="true" />
                  Tra cứu
                </button>
              </form>
              {lookupError && (
                <p className="traceLookupError" role="alert">
                  <AlertTriangle size={14} aria-hidden="true" />
                  {lookupError}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* S09: AUDIENCES SECTION (6 Image Cards in Exact Order)        */}
      {/* ============================================================ */}
      <section className="audienceSection" style={{ padding: "24px 0 36px", backgroundColor: "#FFFFFF" }}>
        <div className="batsContainer">
          <div className="sectionCenterHead">
            <h2>Đối tượng sử dụng</h2>
          </div>

          <div className="audienceCardsGrid">
            {/* Card 1: Nông dân */}
            <div className="audienceCardItem">
              <div style={{ width: "100%", height: "82px", position: "relative" }}>
                <Image
                  src="/images/portrait_farmer.png"
                  alt="Nông dân"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div style={{ padding: "8px 10px 10px" }}>
                <h4 style={{ fontSize: "12.5px", fontWeight: 700, color: "#063B2A", margin: "0 0 4px" }}>
                  Nông dân
                </h4>
                <p style={{ fontSize: "11px", color: "#6B7280", margin: 0, lineHeight: 1.35 }}>
                  Ghi lại thông tin thu hoạch ngay tại vườn qua ứng dụng Zalo, chụp ảnh thực tế và theo dõi nhật ký lô hàng ngay cả khi không có kết nối Internet
                </p>
              </div>
            </div>

            {/* Card 2: Thương lái */}
            <div className="audienceCardItem">
              <div style={{ width: "100%", height: "82px", position: "relative" }}>
                <Image
                  src="/images/portrait_collector.png"
                  alt="Thương lái"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div style={{ padding: "8px 10px 10px" }}>
                <h4 style={{ fontSize: "12.5px", fontWeight: 700, color: "#063B2A", margin: "0 0 4px" }}>
                  Thương lái
                </h4>
                <p style={{ fontSize: "11px", color: "#6B7280", margin: 0, lineHeight: 1.35 }}>
                  Quét mã trên sản phẩm để tiếp nhận lô hàng, ghi nhận khối lượng bằng cân điện tử, kiểm tra thông tin cân hàng và xác nhận bàn giao cho khâu tiếp theo
                </p>
              </div>
            </div>

            {/* Card 3: Hợp tác xã */}
            <div className="audienceCardItem">
              <div style={{ width: "100%", height: "82px", position: "relative" }}>
                <Image
                  src="/images/portrait_coop.png"
                  alt="Hợp tác xã"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div style={{ padding: "8px 10px 10px" }}>
                <h4 style={{ fontSize: "12.5px", fontWeight: 700, color: "#063B2A", margin: "0 0 4px" }}>
                  Hợp tác xã
                </h4>
                <p style={{ fontSize: "11px", color: "#6B7280", margin: 0, lineHeight: 1.35 }}>
                  Quản lý thông tin vùng trồng, theo dõi sản lượng của từng xã viên, kiểm tra các trường hợp bất thường và lập báo cáo khi cần thiết
                </p>
              </div>
            </div>

            {/* Card 4: Cơ sở đóng gói */}
            <div className="audienceCardItem">
              <div style={{ width: "100%", height: "82px", position: "relative" }}>
                <Image
                  src="/images/portrait_packhouse.png"
                  alt="Cơ sở đóng gói"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div style={{ padding: "8px 10px 10px" }}>
                <h4 style={{ fontSize: "12.5px", fontWeight: 700, color: "#063B2A", margin: "0 0 4px" }}>
                  Cơ sở đóng gói
                </h4>
                <p style={{ fontSize: "11px", color: "#6B7280", margin: 0, lineHeight: 1.35 }}>
                  Tiếp nhận nông sản, kiểm tra chất lượng, đóng gói và tạo tem truy xuất nguồn gốc theo tiêu chuẩn quốc tế để phục vụ xuất khẩu
                </p>
              </div>
            </div>

            {/* Card 5: Cơ quan quản lý */}
            <div className="audienceCardItem">
              <div style={{ width: "100%", height: "82px", position: "relative" }}>
                <Image
                  src="/images/portrait_regulator.png"
                  alt="Cơ quan quản lý"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div style={{ padding: "8px 10px 10px" }}>
                <h4 style={{ fontSize: "12.5px", fontWeight: 700, color: "#063B2A", margin: "0 0 4px" }}>
                  Cơ quan quản lý
                </h4>
                <p style={{ fontSize: "11px", color: "#6B7280", margin: 0, lineHeight: 1.35 }}>
                  Theo dõi vị trí các vùng trồng trên bản đồ, kiểm tra lịch sử hoạt động của nông sản và xác minh thông tin đã ghi nhận có bị thay đổi hay không
                </p>
              </div>
            </div>

            {/* Card 6: Người tiêu dùng */}
            <div className="audienceCardItem">
              <div style={{ width: "100%", height: "82px", position: "relative" }}>
                <Image
                  src="/images/portrait_consumer.png"
                  alt="Người tiêu dùng"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div style={{ padding: "8px 10px 10px" }}>
                <h4 style={{ fontSize: "12.5px", fontWeight: 700, color: "#063B2A", margin: "0 0 4px" }}>
                  Người tiêu dùng
                </h4>
                <p style={{ fontSize: "11px", color: "#6B7280", margin: 0, lineHeight: 1.35 }}>
                  Quét mã trên sản phẩm để dễ dàng tra cứu nguồn gốc, thông tin sản xuất và quá trình phân phối của lô hàng, kèm theo bằng chứng giúp kiểm tra độ tin cậy của thông tin
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* S10: FINAL CTA BANNER (Exact Mockup Match)                   */}
      {/* ============================================================ */}
      <section style={{ padding: "10px 0 32px" }} id="contact">
        <div className="batsContainer">
          <div className="finalCtaPhotoBanner">
            <EditorialHeading
              level="h2"
              size="section"
              align="center"
              theme="dark"
              eyebrow="Đồng hành cùng chúng tôi"
              primary="Cùng xây dựng chuỗi nông sản"
              accent="minh bạch và bền vững"
              description="Trải nghiệm hệ thống hoặc liên hệ với chúng tôi để tìm hiểu thêm"
              style={{ marginBottom: "22px" }}
            />


            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
              <a
                href="#products"
                style={{
                  backgroundColor: "#087D4D",
                  color: "#FFFFFF",
                  padding: "10px 22px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                  border: "1px solid #10B981"
                }}
              >
                Trải nghiệm sản phẩm
              </a>
              <a
                href="mailto:bats.agriguard@gmail.com"
                style={{
                  backgroundColor: "#FFFFFF",
                  color: "#063B2A",
                  padding: "10px 22px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1
                }}
              >
                Liên hệ hợp tác
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* S11: FOOTER (Exact Mockup 4 Columns)                         */}
      {/* ============================================================ */}
      <footer className="legacyFooter" style={{
        backgroundColor: "#FFFFFF",
        borderTop: "1px solid #E5E7EB",
        padding: "36px 0 20px"
      }}>
        <div className="batsContainer">
          <div className="footerThreeColumnGrid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            alignItems: "start",
            gap: "72px",
            marginBottom: "28px"
          }}>
            <div>
              <Image
                src="/bats-logo.png"
                alt="BATS-AgriGuard"
                width={42}
                height={42}
                style={{ display: "block", objectFit: "contain", marginBottom: "14px" }}
              />
              <div className="footerColumnTitle" style={{ fontSize: "12px", fontWeight: 800, color: "#063B2A", marginBottom: "12px" }}>
                LIÊN HỆ
              </div>
              <a className="footerColumnBody" href="mailto:bats.agriguard@gmail.com" style={{ color: "#4B5563", textDecoration: "none" }}>
                bats.agriguard@gmail.com
              </a>
            </div>

            <div>
              <div className="footerColumnTitle" style={{ fontSize: "12px", fontWeight: 800, color: "#063B2A", marginBottom: "12px" }}>
                CHÍNH SÁCH
              </div>
              <nav className="footerSectionLinks" aria-label="Liên kết footer">
                <a href="#home">Trang chủ</a>
                <a href="#problems">Bối cảnh</a>
                <a href="#solution">Giải pháp</a>
                <a href="#workflow">Quy trình</a>
                <a href="#products">Sản phẩm</a>
                <a href="#trace-lookup-title">Dùng thử</a>
              </nav>
            </div>

            <div>
              <div className="footerColumnTitle" style={{ fontSize: "12px", fontWeight: 800, color: "#063B2A", marginBottom: "12px" }}>
                ZALO MINI APP
              </div>
              <a href="#products" className="footerQrLink" aria-label="Mở Zalo Mini App">
                <QrCode size={72} strokeWidth={1.75} />
                <span>Quét mã QR để trải nghiệm</span>
              </a>
            </div>
          </div>

          {/* Bottom Bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderTop: "1px solid #F3F4F6",
            paddingTop: "16px",
            fontSize: "11px",
            color: "#9CA3AF",
            flexWrap: "wrap",
            gap: "8px"
          }}>
            <div>© 2026 BATS-AgriGuard. All rights reserved.</div>
          </div>
        </div>
      </footer>

      {/* ============================================================ */}
      {/* PUBLIC QR LOOKUP MODAL (Unauthenticated Public Access)       */}
      {/* ============================================================ */}
      {showQrModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          backgroundColor: "rgba(0, 0, 0, 0.55)",
          backdropFilter: "blur(4px)",
          display: "grid",
          placeItems: "center",
          padding: "20px"
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            padding: "24px",
            width: "100%",
            maxWidth: "520px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
            position: "relative"
          }}>
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "#F3F4F6",
                border: "none",
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                color: "#4B5563"
              }}
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Image
                src="/bats-logo.png"
                alt="BATS-AgriGuard"
                width={48}
                height={48}
                style={{ display: "block", flex: "0 0 auto", objectFit: "contain" }}
              />
              <div>
                <h3 style={{ fontSize: "16.5px", fontWeight: 800, color: "#063B2A", margin: 0 }}>
                  Tra cứu nguồn gốc nông sản
                </h3>
                <span style={{ fontSize: "11.5px", color: "#087D4D", fontWeight: 600 }}>
                  Công khai minh bạch & Miễn phí sử dụng
                </span>
              </div>
            </div>

            <p style={{ fontSize: "12.5px", color: "#4B5563", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              Nhập mã lô hàng hoặc mã truy xuất nguồn gốc trên bao bì sản phẩm để xem thông tin vùng trồng, thời gian thu hoạch và quá trình vận chuyển, giao nhận nông sản
            </p>

            {/* Search Input Form */}
            <form onSubmit={handleLookupSubmit} style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <input
                type="text"
                placeholder="Nhập mã lô hàng (VD: SR-20260704-000001)..."
                value={lookupQuery}
                onChange={(e) => {
                  setLookupQuery(e.target.value);
                  if (lookupError) setLookupError(null);
                }}
                autoFocus
                style={{
                  flex: 1,
                  border: lookupError ? "1.5px solid #EF4444" : "1.5px solid #D1D5DB",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "13.5px",
                  outline: "none"
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: "#075038",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 18px",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Search size={15} />
                Tra cứu
              </button>
            </form>

            {lookupError && (
              <div style={{ color: "#DC2626", fontSize: "12px", margin: "15px 0 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                <AlertTriangle size={13} />
                {lookupError}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PUBLIC LOOKUP RESULT MODAL                                   */}
      {/* ============================================================ */}
      {showLookupResult && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lookup-result-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            backgroundColor: "rgba(7, 37, 27, 0.56)",
            backdropFilter: "blur(5px)",
            display: "grid",
            placeItems: "center",
            padding: "20px"
          }}
        >
          <div
            style={{
              background: "#FAFBF7",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "720px",
              maxHeight: "88vh",
              overflowY: "auto",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.28)",
              padding: "28px",
              position: "relative"
            }}
          >
            <button
              type="button"
              aria-label="Đóng kết quả tra cứu"
              onClick={() => setShowLookupResult(false)}
              style={{
                position: "absolute",
                top: "18px",
                right: "18px",
                width: "34px",
                height: "34px",
                border: "none",
                borderRadius: "50%",
                background: "#EEF1EE",
                color: "#475569",
                display: "grid",
                placeItems: "center",
                cursor: "pointer"
              }}
            >
              <X size={19} />
            </button>

            <div style={{ textAlign: "center", paddingRight: "38px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "7px 14px",
                  borderRadius: "999px",
                  color: "#075038",
                  background: "#E7F3EA",
                  fontSize: "12px",
                  fontWeight: 800,
                  letterSpacing: "0.02em"
                }}
              >
                <ShieldCheck size={15} />
                CỔNG XÁC MINH CÔNG KHAI BATS-AGRIGUARD
              </span>
              <h2
                id="lookup-result-title"
                style={{ margin: "16px 0 6px", color: "#1E2D23", fontSize: "28px", lineHeight: 1.2, fontWeight: 800 }}
              >
                Thông tin nông sản xuất khẩu
              </h2>
              <p className="lookupResultDescription" style={{ margin: 0, color: "#68776E", textAlign: "center" }}>
                Thông tin được kiểm tra tự động và lưu giữ an toàn, giúp phát hiện những thay đổi<br />
                và đảm bảo tính minh bạch, đáng tin cậy
              </p>
            </div>

            <section
              style={{
                marginTop: "24px",
                border: "2px solid #8FE5B2",
                borderRadius: "18px",
                background: "#FFFFFF",
                padding: "26px 8px",
                textAlign: "center"
              }}
            >
              <div
                style={{
                  width: "68px",
                  height: "68px",
                  margin: "0 auto 16px",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "50%",
                  background: "#E9F4EB",
                  color: "#075038"
                }}
              >
                <ShieldCheck size={38} strokeWidth={2.3} />
              </div>
              <div style={{ color: "#075038", fontSize: "13px", fontWeight: 800, letterSpacing: "0.04em" }}>
                KẾT QUẢ KIỂM ĐỊNH NGUỒN GỐC
              </div>
              <h3 style={{ margin: "8px 0", color: "#1E2D23", fontSize: "24px", lineHeight: 1.25, fontWeight: 800, textAlign: "center" }}>
                Hợp lệ: Nguồn gốc đã được kiểm tra
              </h3>
              <p id="lookup-result-status-description" className="lookupResultDescription" style={{ maxWidth: "650px", margin: "0 auto 18px", color: "#4D5C53", textAlign: "center" }}>
                Thông tin lô hàng phù hợp với các yêu cầu về vùng trồng, quá trình thu hoạch<br />
                và sản lượng cho phép, chưa phát hiện dấu hiệu bất thường
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  borderRadius: "999px",
                  background: "#F3F7F3",
                  padding: "9px 14px",
                  color: "#087D4D",
                  fontSize: "13px",
                  fontWeight: 700,
                  overflowWrap: "anywhere"
                }}
              >
                <CheckCircle2 size={16} />
                Mã lô định danh: {lookupQuery.trim()}
              </div>
            </section>

            <section style={{ marginTop: "20px", border: "1px solid #DFE6E0", borderRadius: "16px", background: "#FFFFFF", padding: "20px" }}>
              {[
                {
                  title: "Thông tin sản phẩm",
                  fields: [
                    ["Tên nông sản", "Sầu riêng"],
                    ["Giống", "Ri6"],
                    ["Mã lô hàng", "BATS-DLK-001"],
                    ["Khối lượng lô", "1.000 kg"]
                  ]
                },
                {
                  title: "Nguồn gốc và sản xuất",
                  fields: [
                    ["Khu vực trồng", "Krông Pắc, Đắk Lắk"],
                    ["Đơn vị quản lý", "HTX Nông nghiệp Ea Yông"],
                    ["Ngày thu hoạch", "30/03/2026"],
                    ["Mã số vùng trồng", "Đã đăng ký"]
                  ]
                },
                {
                  title: "Đóng gói và kiểm định",
                  fields: [
                    ["Ngày đóng gói", "31/03/2026"],
                    ["Cơ sở đóng gói", "Thông tin cơ sở"],
                    ["Chứng nhận", "VietGAP"],
                    ["Kết quả kiểm tra", "Chưa phát hiện bất thường"]
                  ]
                }
              ].map((group, groupIndex) => (
                <div key={group.title} style={{ marginTop: groupIndex === 0 ? 0 : "24px" }}>
                  <h3 style={{ margin: "0 0 10px", color: "#1E2D23", fontSize: "17px", fontWeight: 800 }}>
                    {group.title}
                  </h3>
                  {group.fields.map(([label, value], index) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "20px",
                        padding: "11px 0",
                        borderTop: index === 0 ? "none" : "1px solid #EEF1EE",
                        fontSize: "14px",
                        lineHeight: 1.4
                      }}
                    >
                      <span style={{ color: "#718075", flex: "0 0 40%" }}>{label}</span>
                      {label === "Chứng nhận" ? (
                        <span style={{ borderRadius: "999px", background: "#E7F3EA", color: "#075038", padding: "4px 10px", fontSize: "12px", fontWeight: 800 }}>
                          {value}
                        </span>
                      ) : (
                        <strong style={{ color: "#26352C", textAlign: "right", fontWeight: 700 }}>{value}</strong>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </section>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginTop: "18px",
                padding: "15px",
                borderRadius: "12px",
                border: "1px solid #E1E7E2",
                color: "#68776E",
                fontSize: "12.5px",
                lineHeight: 1.55
              }}
            >
              <Info size={19} style={{ flex: "0 0 auto" }} />
              <span><strong>Chính sách bảo vệ thông tin cá nhân:</strong> Trang tra cứu chỉ hiển thị những thông tin được phép công khai. Các thông tin riêng tư như vị trí chi tiết của vườn trồng, số điện thoại cá nhân và dữ liệu bảo mật được lưu giữ an toàn, chỉ những người có quyền truy cập mới có thể xem hoặc sử dụng.</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowLookupResult(false);
                setShowQrModal(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                margin: "20px 0 0 auto",
                padding: "10px 16px",
                border: "1px solid #075038",
                borderRadius: "8px",
                background: "#075038",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              ← Tra cứu mã khác
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TECHNICAL DETAILS MODAL (PCIE Rules & Evidence Breakdown)    */}
      {/* ============================================================ */}
      {showTechModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          backgroundColor: "rgba(0, 0, 0, 0.55)",
          backdropFilter: "blur(4px)",
          display: "grid",
          placeItems: "center",
          padding: "20px"
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            padding: "24px",
            width: "100%",
            maxWidth: "600px",
            maxHeight: "85vh",
            overflowY: "auto",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
            position: "relative"
          }}>
            <button
              type="button"
              onClick={() => setShowTechModal(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "#F3F4F6",
                border: "none",
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                color: "#4B5563"
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#ECFDF5",
                color: "#087D4D",
                display: "grid",
                placeItems: "center"
              }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "16.5px", fontWeight: 800, color: "#063B2A", margin: 0 }}>
                  Chi tiết quy tắc kiểm tra PCIE & Bằng chứng
                </h3>
                <span style={{ fontSize: "11.5px", color: "#6B7280" }}>
                  Kịch bản đang chọn: {activeDemo.name} ({activeDemo.badge})
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "18px" }}>
              {activeDemo.rules.map((rule) => (
                <div
                  key={rule.id}
                  style={{
                    background: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    borderRadius: "10px",
                    padding: "12px 14px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        background: "#E5E7EB",
                        color: "#374151",
                        padding: "2px 6px",
                        borderRadius: "4px"
                      }}>
                        {rule.technicalCode}
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#1F2937" }}>
                        {rule.name}
                      </span>
                    </div>

                    <span style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: rule.status === "PASS" ? "#16A34A" : rule.status === "REVIEW" ? "#D97706" : "#DC2626"
                    }}>
                      {rule.statusText}
                    </span>
                  </div>

                  <div style={{ fontSize: "12px", color: "#374151", marginBottom: "4px" }}>
                    {rule.friendlyDetail}
                  </div>
                  <div style={{ fontSize: "11px", color: "#6B7280", fontStyle: "italic" }}>
                    Dữ liệu kỹ thuật: {rule.technicalDetail}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: "8px", padding: "10px 12px", fontSize: "11.5px", color: "#92400E", display: "flex", gap: "8px" }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
              <div>
                <strong>Lưu ý về phạm vi kiểm tra:</strong> PCIE đối chiếu tính hợp lệ của dữ liệu hành trình dựa trên 8 nhóm bất biến chuỗi cung ứng. Kết quả kiểm tra không thay thế cho kiểm định an toàn thực phẩm hay kiểm dịch thực vật.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
