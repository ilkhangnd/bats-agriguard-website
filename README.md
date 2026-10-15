# BATS-AgriGuard Website & End-to-End System

Hệ thống bảo vệ mã số vùng trồng và truy xuất nguồn gốc nông sản xuất khẩu toàn diện theo chuẩn GS1 EPCIS 2.0 và công nghệ Blockchain Merkle Tree (Plantation Code Integrity Engine - PCIE).

---

## 🏛 Kiến trúc hệ thống (Architecture)

Repository này chứa đầy đủ toàn bộ các thành phần của hệ thống phục vụ website:

```
bats-agriguard-website/
├── apps/
│   ├── web/           # Frontend Website & Operations Dashboard (Next.js 15, React 19, Vanilla CSS)
│   ├── backend/       # Core API & PCIE Verification Engine (NestJS, Prisma, OpenAPI)
│   └── blockchain/    # Smart Contracts Merkle Root Anchor (Solidity, Hardhat, BATSAnchor.sol)
├── packages/
│   └── shared-types/  # Định nghĩa kiểu dữ liệu dùng chung (PCIE 8-rules, GS1 EPCIS)
├── vercel.json        # Cấu hình triển khai tự động Vercel
├── turbo.json         # Cấu hình Turbo monorepo build pipeline
└── pnpm-workspace.yaml
```

---

## 🚀 Khởi chạy hệ thống ở môi trường Local

### 1. Yêu cầu môi trường
- Node.js >= 22.13.0
- PNPM >= 10.0.0

### 2. Cài đặt dependencies
```bash
pnpm install
```

### 3. Khởi chạy các dịch vụ

- **Chạy toàn bộ (Frontend + Backend):**
  ```bash
  pnpm dev
  ```
  - Frontend: `http://localhost:3000`
  - Backend API: `http://localhost:4000` (Swagger Docs: `http://localhost:4000/docs`)

- **Chỉ chạy Frontend Website:**
  ```bash
  pnpm dev:web
  ```

- **Chỉ chạy Backend API:**
  ```bash
  pnpm dev:backend
  ```

- **Biên dịch Smart Contract Blockchain:**
  ```bash
  pnpm dev:blockchain
  ```

---

## 🌐 Hướng dẫn Deploy Website lên VERCEL

Hệ thống Frontend Next.js được thiết kế tương thích 100% với nền tảng Vercel.

### Cách 1: Deploy qua Vercel Dashboard (Khuyên dùng)
1. Đăng nhập vào [Vercel](https://vercel.com) và bấm **Add New...** -> **Project**.
2. Chọn repository **`ilkhangnd/bats-agriguard-website`**.
3. Tại mục **Root Directory**, bấm **Edit** và chọn thư mục:
   ```
   apps/web
   ```
4. Tại mục **Build and Output Settings**: Vercel sẽ tự động nhận diện **Next.js**.
5. *(Tùy chọn)* Cài đặt biến môi trường (Environment Variables):
   - `NEXT_PUBLIC_API_URL`: Địa chỉ URL Backend API của bạn (ví dụ: `https://api-bats.up.railway.app` hoặc để trống nếu dùng demo fallback).
6. Bấm **Deploy**. Sau khoảng 1-2 phút, website sẽ chính thức online với tên miền dạng `https://bats-agriguard-website.vercel.app`.

### Cơ chế Offline Fallback trên Vercel:
Frontend `apps/web` được xây dựng với cơ chế **Graceful Fallback**: nếu chưa thiết lập hoặc Backend chưa online, website vẫn hoạt động trơn tru với dữ liệu mẫu hoàn chỉnh:
- Tra cứu chứng thư công khai QR (`/verify/BATS-2026-0001` - PASS, `0002` - REVIEW, `0003` - BLOCK).
- Tạo lô hàng mới, thêm vùng trồng, đổi thông tin tài khoản (lưu qua LocalStorage).
- Hệ thống Cảnh báo (`/app/alerts`) và badge tự động cập nhật theo thời gian thực.

---

## 🔗 Triển khai Backend & Blockchain

- **Backend (NestJS + Prisma):** Khuyên dùng triển khai trên **Railway**, **Render**, hoặc **GCP Cloud Run** (hỗ trợ database bền vững và worker chạy nền).
- **Blockchain (Smart Contract `BATSAnchor.sol`):**
  - Mạng thử nghiệm: Polygon Amoy / Ethereum Sepolia.
  - Hợp đồng `BATSAnchor.sol` lưu trữ gốc Merkle (Merkle Root) hàng ngày cho các sự kiện EPCIS, đảm bảo tính bất biến và chống giả mạo bằng chứng kiểm toán.
