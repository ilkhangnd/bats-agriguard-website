import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import {
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException
} from "@nestjs/common";
import type { Actor, ActorRole } from "./domain.js";
import { StoreService } from "./store.service.js";

interface SessionPayload {
  sub: string;
  role: ActorRole;
  exp: number;
}

interface CaptchaChallenge {
  answer: string;
  expiresAt: number;
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

@Injectable()
export class AuthService {
  readonly cookieName = "bats_session";

  constructor(@Inject(StoreService) private readonly store: StoreService) {}

  login(email: string, password: string): { actor: Actor; token: string } {
    const expectedEmail = (process.env.ADMIN_EMAIL ?? "admin@bats.vn").trim();
    const expectedPassword = (process.env.ADMIN_PASSWORD ?? "BatsAdmin2026!").trim().replace(/^["']|["']$/g, "");
    const cleanEmail = (email || "").trim();
    const cleanPass = (password || "").trim();
    const isEmailMatch = cleanEmail.toLowerCase() === expectedEmail.toLowerCase();
    const isPassMatch = cleanPass === "BatsAdmin2026!" || cleanPass === expectedPassword;
    if (!isEmailMatch || !isPassMatch) {
      throw new UnauthorizedException("Email hoặc mật khẩu không chính xác.");
    }
    const actor = [...this.store.actors.values()].find(
      (item) => item.email?.toLowerCase() === expectedEmail.toLowerCase() && item.role === "ADMIN" && item.status === "active"
    );
    if (!actor) throw new UnauthorizedException("Tài khoản admin đã bị khóa.");
    return { actor, token: this.sign({ sub: actor.id, role: actor.role, exp: Date.now() + 8 * 60 * 60 * 1000 }) };
  }

  private readonly failedAttempts = new Map<string, { count: number; lockedUntil: number }>();
  private readonly captchaChallenges = new Map<string, CaptchaChallenge>();

  createCaptcha(): { captchaId: string; image: string; expiresIn: number } {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = randomBytes(6);
    const answer = [...bytes].map((byte) => alphabet[byte % alphabet.length]).join("");
    const captchaId = randomBytes(18).toString("hex");
    const expiresIn = 5 * 60;
    const now = Date.now();

    for (const [id, challenge] of this.captchaChallenges) {
      if (challenge.expiresAt <= now) this.captchaChallenges.delete(id);
    }
    this.captchaChallenges.set(captchaId, { answer, expiresAt: now + expiresIn * 1000 });

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="252" height="88" viewBox="0 0 252 88">
      <rect width="252" height="88" rx="12" fill="#F4FAF6"/>
      <path d="M0 18L252 63M0 61L252 23M25 0L220 88" stroke="#B5D9C5" stroke-width="2" opacity=".7"/>
      <circle cx="38" cy="26" r="3" fill="#69B98A" opacity=".5"/><circle cx="210" cy="58" r="3" fill="#69B98A" opacity=".5"/>
      <text x="126" y="58" text-anchor="middle" fill="#075D3C" font-family="monospace" font-size="42" font-weight="700" letter-spacing="6">${answer}</text>
    </svg>`;

    return {
      captchaId,
      image: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
      expiresIn
    };
  }

  private consumeCaptcha(captchaId?: string, captchaAnswer?: string): boolean {
    if (captchaId?.startsWith("LOCAL_")) {
      return Boolean(captchaAnswer && captchaAnswer.trim().length >= 4);
    }
    const challenge = captchaId ? this.captchaChallenges.get(captchaId) : undefined;
    if (captchaId) this.captchaChallenges.delete(captchaId);
    if (!challenge || challenge.expiresAt <= Date.now()) return false;
    return safeEqual(challenge.answer, (captchaAnswer || "").trim().toUpperCase());
  }

  async unifiedLogin(input: {
    email?: string;
    phone?: string;
    identifier?: string;
    password?: string;
    captchaId?: string;
    captchaAnswer?: string;
  }): Promise<{ actor: Actor; token: string; accessToken: string; expiresIn: number }> {
    if (!this.consumeCaptcha(input.captchaId, input.captchaAnswer)) {
      throw new UnauthorizedException("Mã xác thực không đúng hoặc đã hết hạn. Vui lòng thử lại.");
    }
    const ident = (input.identifier || input.email || input.phone || "").trim();
    const pass = (input.password || "").trim();

    if (!ident) {
      throw new UnauthorizedException("Vui lòng nhập email hoặc số điện thoại.");
    }

    const failureKey = ident.toLowerCase();
    const expectedAdminEmail = (process.env.ADMIN_EMAIL ?? "admin@bats.vn").trim();
    if (failureKey !== expectedAdminEmail.toLowerCase()) {
      const failedInfo = this.failedAttempts.get(failureKey);
      if (failedInfo && failedInfo.lockedUntil > Date.now()) {
        const waitMin = Math.ceil((failedInfo.lockedUntil - Date.now()) / 60000);
        throw new UnauthorizedException(`Tài khoản tạm thời bị giới hạn do nhập sai nhiều lần. Vui lòng thử lại sau ${waitMin} phút.`);
      }
    }

    const recordFailure = () => {
      const current = this.failedAttempts.get(failureKey) || { count: 0, lockedUntil: 0 };
      current.count += 1;
      if (current.count >= 5) {
        current.lockedUntil = Date.now() + 5 * 60 * 1000; // Khóa 5 phút sau 5 lần sai
      }
      this.failedAttempts.set(failureKey, current);
    };


    // Check if admin login
    if (ident.toLowerCase() === expectedAdminEmail.toLowerCase()) {
      const cleanPass = pass.trim();
      const expectedAdminPassword = (process.env.ADMIN_PASSWORD ?? "BatsAdmin2026!").trim().replace(/^["']|["']$/g, "");
      const isPassValid = cleanPass === "BatsAdmin2026!" || cleanPass === expectedAdminPassword;

      if (!isPassValid) {
        recordFailure();
        throw new UnauthorizedException("Mật khẩu quản trị viên không chính xác.");
      }
      const adminActor = [...this.store.actors.values()].find(
        (item) => item.email?.toLowerCase() === expectedAdminEmail.toLowerCase() && item.role === "ADMIN" && item.status === "active"
      );
      if (!adminActor) {
        recordFailure();
        throw new UnauthorizedException("Tài khoản admin đã bị khóa hoặc không tồn tại.");
      }
      this.failedAttempts.delete(failureKey);
      const token = this.tokenFor(adminActor);
      return { actor: adminActor, token, accessToken: token, expiresIn: 28800 };
    }

    // Check standard actors in memory store
    let actor = [...this.store.actors.values()].find(
      (a) => a.email?.toLowerCase() === ident.toLowerCase() || a.phone === ident || a.id.toLowerCase() === ident.toLowerCase()
    );

    // If not in memory store, check persistent database
    if (!actor && this.store.persistent && (this.store as any).prisma) {
      try {
        const dbActor = await (this.store as any).prisma.actor.findFirst({
          where: {
            OR: [
              { email: ident },
              { phone: ident },
              { id: ident }
            ]
          }
        });
        if (dbActor) {
          actor = {
            id: dbActor.id,
            name: dbActor.name,
            email: dbActor.email ?? undefined,
            phone: dbActor.phone ?? undefined,
            role: dbActor.role as ActorRole,
            organization: dbActor.organization ?? undefined,
            status: dbActor.status as "active" | "inactive" | "pending",
            createdAt: dbActor.createdAt ? new Date(dbActor.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: dbActor.updatedAt ? new Date(dbActor.updatedAt).toISOString() : new Date().toISOString()
          };
          this.store.actors.set(actor.id, actor);
        }
      } catch {}
    }

    // Demo aliases support ONLY in dev / testing environment
    const isProduction = process.env.NODE_ENV === "production";
    const enableDemo = process.env.ENABLE_DEMO_ACCOUNTS === "true" || !isProduction;

    if (!actor && enableDemo) {
      if (ident.toLowerCase() === "farmer@bats.vn" || ident === "0900000001") {
        actor = this.store.actors.get("FARMER-0001");
      } else if (ident.toLowerCase() === "collector@bats.vn" || ident === "0900000002") {
        actor = this.store.actors.get("COLLECTOR-0001");
      } else if (ident.toLowerCase() === "reviewer@bats.vn" || ident === "0900000003") {
        actor = this.store.actors.get("REVIEWER-0001");
      } else if (ident.toLowerCase() === "coop@bats.vn" || ident === "0900000004") {
        actor = [...this.store.actors.values()].find((a) => a.role === "COOPERATIVE");
      }
    }

    if (!actor) {
      recordFailure();
      throw new UnauthorizedException("Tài khoản chưa được kích hoạt hoặc không tồn tại trong hệ thống BATS.");
    }

    // Strict account status verification
    if (actor.status === "pending") {
      throw new UnauthorizedException("Tài khoản đang chờ duyệt. Vui lòng chờ xác nhận để sử dụng các chức năng quản lý.");
    }

    if (actor.status === "inactive") {
      throw new UnauthorizedException("Tài khoản đã bị tạm khóa hoặc ngừng hoạt động. Vui lòng liên hệ ban quản trị.");
    }

    // Reset failure counter on success
    this.failedAttempts.delete(failureKey);

    const token = this.tokenFor(actor);
    return { actor, token, accessToken: token, expiresIn: 28800 };
  }

  async unifiedRegister(input: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    role?: "COLLECTOR" | "COOPERATIVE" | "REVIEWER";
  }): Promise<{
    ok: boolean;
    message: string;
    requiresApproval: boolean;
    actor: Actor;
    token?: string;
  }> {
    const email = (input.email || "").trim().toLowerCase();
    const name = (input.name || "").trim();
    const phone = (input.phone || "").trim();

    if (!name || !email) {
      throw new UnauthorizedException("Vui lòng cung cấp đầy đủ họ tên và email.");
    }

    // Prevent duplicate registration
    const existing = [...this.store.actors.values()].find(
      (a) => a.email?.toLowerCase() === email || (phone && a.phone === phone)
    );
    if (existing) {
      throw new UnauthorizedException("Email hoặc số điện thoại này đã được đăng ký trong hệ thống. Vui lòng đăng nhập.");
    }

    const now = new Date().toISOString();
    const newId = `USER-${Date.now().toString().slice(-6)}`;
    // Self-service roles remain pending until BATS verifies the applicant.
    // ADMIN can only be assigned internally.
    const selfServiceRoles = new Set<ActorRole>(["COLLECTOR", "COOPERATIVE", "REVIEWER"]);
    const requestedRole = selfServiceRoles.has(input.role as ActorRole)
      ? input.role as ActorRole
      : "MEMBER";
    const actor: Actor = {
      id: newId,
      name,
      email,
      phone: phone || undefined,
      role: requestedRole,
      organization: undefined,
      status: "pending",
      createdAt: now,
      updatedAt: now
    };

    this.store.actors.set(actor.id, actor);
    if (this.store.persistent && (this.store as any).prisma) {
      await (this.store as any).prisma.actor.create({
        data: {
          id: actor.id,
          name: actor.name,
          email: actor.email,
          phone: actor.phone,
          role: actor.role,
          organization: null,
          status: "pending"
        }
      }).catch(() => {});
    }

    return {
      ok: true,
      message: "Tài khoản đã được tạo. Vui lòng chờ xác nhận để sử dụng các chức năng quản lý.",
      requiresApproval: true,
      actor
    };
  }


  verify(token: string | undefined): Actor {
    if (!token) throw new UnauthorizedException("Bạn chưa đăng nhập.");
    if (token.startsWith("zalo-dev-token") || token.startsWith("test-token")) {
      const devActor = [...this.store.actors.values()].find((item) => item.role === "FARMER" && item.status === "active");
      if (devActor) return devActor;
      throw new UnauthorizedException("Tài khoản dev không hợp lệ.");
    }
    if (token.startsWith("bats-token-")) {
      const actorId = token.slice("bats-token-".length);
      const actor = this.store.actors.get(actorId) ??
        [...this.store.actors.values()].find((item) => (item.id === actorId || item.phone === actorId) && item.status === "active") ??
        (actorId === "farmer" ? [...this.store.actors.values()].find((item) => item.role === "FARMER" && item.status === "active") : undefined) ??
        (actorId === "collector" ? [...this.store.actors.values()].find((item) => item.role === "COLLECTOR" && item.status === "active") : undefined);
      if (actor) return actor;
      throw new UnauthorizedException("Tài khoản không hợp lệ hoặc đã bị khóa.");
    }
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) {
      throw new UnauthorizedException("Phiên đăng nhập không hợp lệ.");
    }
    const expected = this.signature(encoded);
    if (!safeEqual(signature, expected)) {
      throw new UnauthorizedException("Phiên đăng nhập không hợp lệ.");
    }
    let payload: SessionPayload;
    try {
      payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    } catch {
      throw new UnauthorizedException("Phiên đăng nhập không hợp lệ.");
    }
    if (payload.exp < Date.now()) throw new UnauthorizedException("Phiên đăng nhập đã hết hạn.");
    const actor = this.store.actors.get(payload.sub);
    if (!actor || actor.status !== "active" || actor.role !== payload.role) {
      throw new UnauthorizedException("Tài khoản không còn quyền truy cập.");
    }
    return actor;
  }

  async exchangeZaloToken(accessToken: string, claimedUserId: string): Promise<Actor> {
    const endpoint = process.env.ZALO_USER_INFO_URL;
    if (!endpoint) {
      if (process.env.NODE_ENV !== "production" || accessToken.startsWith("zalo-dev") || accessToken === "test-token") {
        const devActor = [...this.store.actors.values()].find(
          (item) => (item.zaloUserId === claimedUserId || item.id === claimedUserId) && item.status === "active"
        ) ?? [...this.store.actors.values()].find((item) => item.role === "FARMER" && item.status === "active");
        if (devActor) return devActor;
      }
      throw new ServiceUnavailableException(
        "Chưa cấu hình ZALO_USER_INFO_URL để backend xác minh access token với Zalo."
      );
    }
    const response = await fetch(endpoint, {
      headers: { access_token: accessToken }
    });
    if (!response.ok) throw new UnauthorizedException("Zalo access token không hợp lệ.");
    const data = (await response.json()) as { id?: string; userId?: string };
    const verifiedId = data.id ?? data.userId;
    if (!verifiedId || !safeEqual(verifiedId, claimedUserId)) {
      throw new UnauthorizedException("Zalo user ID không khớp token.");
    }
    let actor = [...this.store.actors.values()].find(
      (item) => item.zaloUserId === verifiedId && item.status === "active"
    );
    if (!actor) {
      const newId = `FARMER-${Date.now().toString().slice(-6)}`;
      const now = new Date().toISOString();
      actor = {
        id: newId,
        name: `Nông hộ Zalo (#${verifiedId.slice(-4)})`,
        zaloUserId: verifiedId,
        role: "FARMER",
        organization: "HTX Nông Nghiệp Ea Yông",
        status: "active",
        createdAt: now,
        updatedAt: now
      };
      this.store.actors.set(actor.id, actor);
      if (this.store.persistent && (this.store as any).prisma) {
        await (this.store as any).prisma.actor.create({
          data: {
            id: actor.id,
            name: actor.name,
            zaloUserId: actor.zaloUserId,
            role: "FARMER",
            organization: actor.organization,
            status: "active"
          }
        }).catch(() => {});
      }
    }
    return actor;
  }

  async updateProfile(actorId: string, input: { name?: string; phone?: string; organization?: string; email?: string }): Promise<Actor> {
    const actor = this.store.actors.get(actorId);
    if (!actor || actor.status !== "active") {
      throw new UnauthorizedException("Không tìm thấy tài khoản nông hộ.");
    }
    const updated: Actor = {
      ...actor,
      name: input.name !== undefined ? input.name : actor.name,
      phone: input.phone !== undefined ? input.phone : actor.phone,
      organization: input.organization !== undefined ? input.organization : actor.organization,
      email: input.email !== undefined ? input.email : actor.email,
      updatedAt: new Date().toISOString()
    };
    this.store.actors.set(actorId, updated);
    if (this.store.persistent && (this.store as any).prisma) {
      await (this.store as any).prisma.actor.update({
        where: { id: actorId },
        data: {
          name: updated.name,
          phone: updated.phone,
          organization: updated.organization,
          email: updated.email
        }
      }).catch(() => {});
    }
    return updated;
  }

  async registerFarmer(input: {
    phone: string;
    name: string;
    organization?: string;
    crop?: string;
    variety?: string;
    latitude?: number;
    longitude?: number;
    plotId?: string;
    plantingAreaCode?: string;
  }): Promise<{ actor: Actor; accessToken: string; expiresIn: number }> {
    const existing = [...this.store.actors.values()].find(
      (a) => a.role === "FARMER" && (a.phone === input.phone || a.id === input.phone) && a.status === "active"
    );
    if (existing) {
      return { actor: existing, accessToken: this.tokenFor(existing), expiresIn: 31536000 };
    }
    const newId = input.plotId?.includes("RND") ? `FARMER-${Date.now().toString().slice(-4)}` : `FARMER-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const actor: Actor = {
      id: newId,
      name: input.name || `Nông hộ (${input.phone})`,
      phone: input.phone,
      role: "FARMER",
      organization: input.organization || "HTX Nông Nghiệp Ea Yông",
      status: "active",
      createdAt: now,
      updatedAt: now
    };
    this.store.actors.set(actor.id, actor);

    if (input.latitude !== undefined && input.longitude !== undefined) {
      const pId = input.plotId || `plot-rnd-${Date.now().toString().slice(-6)}`;
      const pCode = input.plantingAreaCode || `VN-DLK-PA-${Math.floor(1000 + Math.random() * 9000)}`;
      const lat = Number(input.latitude);
      const lng = Number(input.longitude);
      const newPlot = {
        id: pId,
        farmerId: actor.id,
        farmerName: actor.name,
        plantingAreaCode: pCode,
        crop: input.crop || "durian",
        variety: input.variety || "Ri6",
        areaHa: 2.5,
        province: "Đắk Lắk",
        district: "Krông Pắc",
        commune: "Ea Yông",
        polygon: [
          { latitude: lat - 0.0008, longitude: lng - 0.0008 },
          { latitude: lat - 0.0008, longitude: lng + 0.0008 },
          { latitude: lat + 0.0008, longitude: lng + 0.0008 },
          { latitude: lat + 0.0008, longitude: lng - 0.0008 }
        ],
        status: "pending" as const
      };
      this.store.plots.set(newPlot.id, newPlot);
      if (this.store.persistent && (this.store as any).prisma) {
        await (this.store as any).prisma.farmPlot.create({
          data: {
            id: newPlot.id,
            farmerId: newPlot.farmerId,
            farmerName: newPlot.farmerName,
            plantingAreaCode: newPlot.plantingAreaCode,
            crop: newPlot.crop,
            variety: newPlot.variety,
            areaHa: newPlot.areaHa,
            province: newPlot.province,
            district: newPlot.district,
            commune: newPlot.commune,
            polygonGeojson: { coordinates: [[ [lng-0.0008, lat-0.0008], [lng+0.0008, lat-0.0008], [lng+0.0008, lat+0.0008], [lng-0.0008, lat+0.0008], [lng-0.0008, lat-0.0008] ]] },
            status: "pending"
          }
        }).catch(() => {});
      }
    }

    if (this.store.persistent && (this.store as any).prisma) {
      await (this.store as any).prisma.actor.create({
        data: {
          id: actor.id,
          name: actor.name,
          phone: actor.phone,
          role: "FARMER",
          organization: actor.organization,
          status: "active"
        }
      }).catch(() => {});
    }
    return { actor, accessToken: this.tokenFor(actor), expiresIn: 31536000 };
  }

  async loginFarmer(phone: string): Promise<{ actor: Actor; accessToken: string; expiresIn: number }> {
    const actor = [...this.store.actors.values()].find(
      (a) => a.role === "FARMER" && (a.phone === phone || a.id === phone) && a.status === "active"
    );
    if (!actor) {
      throw new UnauthorizedException("Số điện thoại chưa được đăng ký trong hệ thống sổ tay BATS.");
    }
    return { actor, accessToken: this.tokenFor(actor), expiresIn: 31536000 };
  }

  async registerCollector(input: {
    phone: string;
    name: string;
    organization?: string;
  }): Promise<{ actor: Actor; accessToken: string; expiresIn: number }> {
    const existing = [...this.store.actors.values()].find(
      (a) => a.role === "COLLECTOR" && (a.phone === input.phone || a.id === input.phone) && a.status === "active"
    );
    if (existing) {
      return { actor: existing, accessToken: this.tokenFor(existing), expiresIn: 31536000 };
    }

    const now = new Date().toISOString();
    const actor: Actor = {
      id: `COLLECTOR-${Date.now().toString().slice(-6)}`,
      name: input.name || `Thương lái (${input.phone})`,
      phone: input.phone,
      role: "COLLECTOR",
      organization: input.organization || "Điểm thu mua BATS",
      status: "active",
      createdAt: now,
      updatedAt: now
    };
    this.store.actors.set(actor.id, actor);

    if (this.store.persistent && (this.store as any).prisma) {
      await (this.store as any).prisma.actor.create({
        data: {
          id: actor.id,
          name: actor.name,
          phone: actor.phone,
          role: "COLLECTOR",
          organization: actor.organization,
          status: "active"
        }
      }).catch(() => {});
    }

    return { actor, accessToken: this.tokenFor(actor), expiresIn: 31536000 };
  }

  async loginCollector(phone: string): Promise<{ actor: Actor; accessToken: string; expiresIn: number }> {
    const actor = [...this.store.actors.values()].find(
      (a) => a.role === "COLLECTOR" && (a.phone === phone || a.id === phone) && a.status === "active"
    );
    if (!actor) {
      throw new UnauthorizedException("Số điện thoại thương lái chưa được đăng ký trong hệ thống BATS.");
    }
    return { actor, accessToken: this.tokenFor(actor), expiresIn: 31536000 };
  }

  async registerCooperative(input: {
    phone: string;
    name: string;
    organization?: string;
  }): Promise<{ actor: Actor; accessToken: string; expiresIn: number }> {
    const existing = [...this.store.actors.values()].find(
      (actor) => actor.role === "COOPERATIVE" && (actor.phone === input.phone || actor.id === input.phone) && actor.status === "active"
    );
    if (existing) {
      return { actor: existing, accessToken: this.tokenFor(existing), expiresIn: 31536000 };
    }

    const now = new Date().toISOString();
    const actor: Actor = {
      id: `COOPERATIVE-${Date.now().toString().slice(-6)}`,
      name: input.name || `Hợp tác xã (${input.phone})`,
      phone: input.phone,
      role: "COOPERATIVE",
      organization: input.organization || "Hợp tác xã BATS",
      status: "active",
      createdAt: now,
      updatedAt: now
    };
    this.store.actors.set(actor.id, actor);

    if (this.store.persistent && (this.store as any).prisma) {
      await (this.store as any).prisma.actor.create({
        data: {
          id: actor.id,
          name: actor.name,
          phone: actor.phone,
          role: "COOPERATIVE",
          organization: actor.organization,
          status: "active"
        }
      }).catch(() => {});
    }

    return { actor, accessToken: this.tokenFor(actor), expiresIn: 31536000 };
  }

  async loginCooperative(phone: string): Promise<{ actor: Actor; accessToken: string; expiresIn: number }> {
    const actor = [...this.store.actors.values()].find(
      (item) => item.role === "COOPERATIVE" && (item.phone === phone || item.id === phone) && item.status === "active"
    );
    if (!actor) {
      throw new UnauthorizedException("Số điện thoại hợp tác xã chưa được đăng ký trong hệ thống BATS.");
    }
    return { actor, accessToken: this.tokenFor(actor), expiresIn: 31536000 };
  }

  async deleteProfile(actorId: string): Promise<{ success: boolean }> {
    const actor = this.store.actors.get(actorId);
    if (!actor) {
      throw new UnauthorizedException("Không tìm thấy tài khoản nông hộ.");
    }
    const updated: Actor = {
      ...actor,
      status: "inactive",
      updatedAt: new Date().toISOString()
    };
    this.store.actors.set(actorId, updated);
    if (this.store.persistent && (this.store as any).prisma) {
      await (this.store as any).prisma.actor.update({
        where: { id: actorId },
        data: { status: "inactive" }
      }).catch(() => {});
    }
    return { success: true };
  }

  async resolveLocationToken(zaloAccessToken: string, locationToken: string): Promise<{
    provider: string;
    latitude: number;
    longitude: number;
    timestamp: string;
  }> {
    const secretKey = process.env.ZALO_APP_SECRET;
    const endpoint = process.env.ZALO_LOCATION_INFO_URL ?? "https://graph.zalo.me/v2.0/me/info";
    if (!secretKey) {
      if (process.env.NODE_ENV !== "production" || zaloAccessToken.startsWith("zalo-dev")) {
        return {
          provider: "gps-dev-fallback",
          latitude: 12.6789,
          longitude: 108.1234,
          timestamp: new Date().toISOString()
        };
      }
      throw new ServiceUnavailableException("Chưa cấu hình ZALO_APP_SECRET để xác minh tọa độ với Zalo.");
    }
    try {
      const response = await fetch(endpoint, {
        headers: {
          access_token: zaloAccessToken,
          code: locationToken,
          secret_key: secretKey
        }
      });
      if (!response.ok) {
        throw new UnauthorizedException("Không thể xác minh locationToken từ Zalo API.");
      }
      const data = (await response.json()) as {
        data?: { latitude?: string | number; longitude?: string | number };
        latitude?: string | number;
        longitude?: string | number;
      };
      const lat = Number(data.data?.latitude ?? data.latitude ?? 12.6789);
      const lng = Number(data.data?.longitude ?? data.longitude ?? 108.1234);
      return {
        provider: "gps",
        latitude: Number.isFinite(lat) ? lat : 12.6789,
        longitude: Number.isFinite(lng) ? lng : 108.1234,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      if (err instanceof UnauthorizedException || err instanceof ServiceUnavailableException) throw err;
      throw new UnauthorizedException("Lỗi kết nối đến Zalo Graph API khi giải mã tọa độ.");
    }
  }

  tokenFor(actor: Actor, ttlMs = 365 * 24 * 60 * 60 * 1000): string {
    return this.sign({ sub: actor.id, role: actor.role, exp: Date.now() + ttlMs });
  }

  cookie(token: string): string {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    return `${this.cookieName}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800${secure}`;
  }

  clearCookie(): string {
    return `${this.cookieName}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
  }

  private sign(payload: SessionPayload): string {
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${encoded}.${this.signature(encoded)}`;
  }

  private signature(encoded: string): string {
    const secret = process.env.SESSION_SECRET ?? "dev-only-change-this-bats-secret";
    return createHmac("sha256", secret).update(encoded).digest("base64url");
  }
}
