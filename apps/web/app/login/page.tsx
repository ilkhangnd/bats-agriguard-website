"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import "./login.css";
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserRound,
  CheckCircle2,
  MapPin,
  Calendar,
  Sprout,
  AlertCircle,
  X,
  Info,
  Check,
  RefreshCw
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function saveAuthSession(actor: {
  id: string;
  name: string;
  role: string;
  organization?: string;
  phone?: string;
  email?: string;
}, token?: string) {
  const profile = {
    name: actor.name,
    org: actor.organization ?? "",
    code: actor.id,
    actorId: actor.id,
    role: actor.role,
    phone: actor.phone ?? "",
    email: actor.email ?? "",
    token
  };
  localStorage.setItem("bats_current_user", JSON.stringify(profile));
  localStorage.setItem("bats_current_role", actor.role);
  window.dispatchEvent(new Event("bats-auth-change"));
}

function getDestinationForRole(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/app/dashboard";
    case "FARMER":
      return "/app/plantations";
    case "COLLECTOR":
      return "/app/receive";
    case "REVIEWER":
      return "/app/alerts";
    case "COOPERATIVE":
    case "COOP_MANAGER":
      return "/app/dashboard";
    case "MEMBER":
      return "/portal";
    default:
      return "/portal";
  }
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams?.get("mode") === "register" ? "register" : "login";

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [requestedRole, setRequestedRole] = useState<"" | "COLLECTOR" | "COOPERATIVE" | "REVIEWER">("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState<{ captchaId: string; image: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captchaFailed, setCaptchaFailed] = useState(false);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState("");
  const [forgotDone, setForgotDone] = useState(false);

  const loadCaptcha = async () => {
    setCaptchaLoading(true);
    setCaptchaFailed(false);
    try {
      const response = await fetch(`${API_BASE}/auth/captcha`, { cache: "no-store" });
      if (!response.ok) throw new Error("Không thể tạo mã xác thực.");
      const data = await response.json();
      setCaptcha({ captchaId: data.captchaId, image: data.image });
      setCaptchaAnswer("");
      setCaptchaFailed(false);
    } catch {
      setCaptcha(null);
      setCaptchaFailed(true);
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    const qMode = searchParams?.get("mode");
    if (qMode === "register") setMode("register");
    else if (qMode === "login") setMode("login");
  }, [searchParams]);

  useEffect(() => {
    void loadCaptcha();
  }, []);

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    let isRedirecting = false;

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setError("Vui lòng nhập Email hoặc SĐT.");
      return;
    }
    if (!cleanPass) {
      setError("Vui lòng nhập mật khẩu tài khoản.");
      return;
    }
    if (!captcha || !captchaAnswer.trim()) {
      setError("Vui lòng nhập mã xác thực.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: cleanId,
          password: cleanPass,
          captchaId: captcha.captchaId,
          captchaAnswer: captchaAnswer.trim()
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Tài khoản hoặc mật khẩu không chính xác.");
      }

      const actor = data.actor;
      if (!actor) {
        throw new Error("Không thể xác thực danh tính tài khoản.");
      }

      saveAuthSession(actor, data.token || data.accessToken);
      isRedirecting = true;
      router.push(getDestinationForRole(actor.role));
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại.");
      void loadCaptcha();
    } finally {
      // Keep the button in its loading state while Next.js navigates away.
      if (!isRedirecting) setLoading(false);
    }
  };

  // Handle Register submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanName = fullName.trim();
    const cleanId = identifier.trim();
    const cleanPass = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanName) {
      setError("Vui lòng nhập họ và tên của bạn.");
      return;
    }
    if (!cleanId) {
      setError("Vui lòng nhập email hoặc số điện thoại đăng ký.");
      return;
    }
    if (!requestedRole) {
      setError("Vui lòng chọn vai trò đăng ký.");
      return;
    }
    if (cleanPass.length < 8) {
      setError("Mật khẩu phải có độ dài tối thiểu 8 ký tự.");
      return;
    }
    if (cleanPass !== cleanConfirm) {
      setError("Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          email: cleanId.includes("@") ? cleanId : `${cleanId.replace(/\D/g, "")}@nongho.bats.vn`,
          phone: cleanId.replace(/\D/g, "") || undefined,
          password: cleanPass,
          role: requestedRole
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Không thể khởi tạo tài khoản.");
      }

      if (data.requiresApproval || !data.token) {
        setSuccessMsg(data.message || "Tài khoản đã được tạo. Vui lòng chờ xác nhận để sử dụng các chức năng quản lý.");
        setFullName("");
        setIdentifier("");
        setPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setMode("login");
        }, 2800);
        return;
      }

      const actor = data.actor;
      saveAuthSession(actor, data.token || data.accessToken);
      setSuccessMsg("Tạo tài khoản thành công! Đang chuyển hướng vào hệ thống...");

      setTimeout(() => {
        router.push(getDestinationForRole(actor.role));
      }, 700);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authPageContainer">
      {/* Top Header Link */}
      <div className="authTopBar">
        <Link href="/" className="authBackLink">
          <ArrowLeft size={16} />
          <span>Về trang chủ</span>
        </Link>
      </div>

      <div className="authCardWrapper">
        {/* ============================================================ */}
        {/* LEFT COLUMN: BRAND SHOWCASE CARD                              */}
        {/* ============================================================ */}
        <section
          className="authBrandShowcase"
          aria-label="Thung lũng sầu riêng lúc bình minh"
        >
        </section>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: AUTHENTICATION FORM CARD                       */}
        {/* ============================================================ */}
        <section className="authFormCard">
          {/* Centered Top Logo */}
          <div className="formLogoHeader">
            <Image
              src="/bats-logo.png"
              alt="BATS-AgriGuard Logo"
              width={72}
              height={72}
              style={{ objectFit: "contain" }}
              priority
            />
          </div>

          {/* Heading */}
          <div className="formHeader">
            <h1 className="formTitle" style={{ width: "100%", textAlign: "center" }}>
              {mode === "login" ? "Chào mừng bạn" : "Tạo tài khoản"}
            </h1>
            <p className="formSubtitle">
              {mode === "login"
                ? "Đăng nhập để tiếp tục sử dụng BATS-AgriGuard"
                : "Đăng ký tài khoản thành viên hệ thống BATS-AgriGuard"}
            </p>
          </div>

          {/* Error / Success Feedback */}
          {error && (
            <div className="feedbackAlert errorAlert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {mode === "register" && successMsg && (
            <div className="feedbackAlert successAlert">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ========================================================== */}
          {/* LOGIN FORM                                                 */}
          {/* ========================================================== */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="authMainForm">
              <div className="formFieldGroup">
                <label className="fieldLabel" htmlFor="login-identifier">
                  Email hoặc SĐT
                </label>
                <div className="inputWrapper">
                  <Mail className="inputIcon" size={17} />
                  <input
                    id="login-identifier"
                    type="text"
                    className="formInput"
                    placeholder="Nhập tài khoản email hoặc số điện thoại"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="formFieldGroup">
                <div className="fieldLabelRow">
                  <label className="fieldLabel" htmlFor="login-password">
                    Mật khẩu
                  </label>
                </div>
                <div className="inputWrapper">
                  <Lock className="inputIcon" size={17} />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    className="formInput"
                    placeholder="Nhập mật khẩu của bạn"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="passwordToggleBtn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="formOptionsRow">
                <label className="checkboxLabel">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Ghi nhớ phiên đăng nhập</span>
                </label>
                <button
                  type="button"
                  className="forgotLinkBtn"
                  onClick={() => {
                    setForgotInput(identifier);
                    setShowForgotModal(true);
                    setForgotDone(false);
                  }}
                >
                  Quên mật khẩu?
                </button>
              </div>

              <div className="captchaField">
                <div className="captchaHeader">
                  <label className="fieldLabel" htmlFor="login-captcha">Mã xác thực</label>
                  <button type="button" className="captchaRefreshBtn" onClick={() => void loadCaptcha()}>
                    <RefreshCw size={13} />
                    Đổi mã
                  </button>
                </div>
                <div className="captchaControls">
                  {captcha ? (
                    <img className="captchaImage" src={captcha.image} alt="Mã xác thực" />
                  ) : captchaLoading ? (
                    <div className="captchaImage captchaLoading" aria-live="polite">Đang tạo mã…</div>
                  ) : (
                    <button type="button" onClick={() => void loadCaptcha()} className="captchaImage captchaRetryBtn" aria-live="polite" style={{ cursor: "pointer", background: "#fef2f2", color: "#b91c1c", fontSize: 13, border: "1px dashed #f87171" }}>
                      ⚠️ Lỗi nạp mã. Bấm thử lại
                    </button>
                  )}
                  <input
                    id="login-captcha"
                    type="text"
                    className="formInput noIcon captchaInput"
                    placeholder="Nhập mã trong ảnh"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value.toUpperCase())}
                    autoComplete="off"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="submitBtn"
                disabled={loading}
              >
                {loading ? (
                  <span className="loadingFlex">
                    <span className="spinner" />
                    <span>Đang xác thực...</span>
                  </span>
                ) : (
                  <span>Đăng nhập</span>
                )}
              </button>

              <div className="formFooterSwitch">
                <span>Chưa có tài khoản? </span>
                <button
                  type="button"
                  className="switchModeTextBtn"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                >
                  Đăng ký tài khoản mới
                </button>
              </div>
            </form>
          )}

          {/* ========================================================== */}
          {/* REGISTER FORM                                              */}
          {/* ========================================================== */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="authMainForm registerMainForm">
              <div className="formFieldGroup">
                <label className="fieldLabel" htmlFor="reg-name">
                  Họ và tên
                </label>
                <div className="inputWrapper">
                  <UserRound className="inputIcon" size={17} />
                  <input
                    id="reg-name"
                    type="text"
                    className="formInput"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="formFieldGroup">
                <label className="fieldLabel" htmlFor="reg-email">
                  Email hoặc SĐT
                </label>
                <div className="inputWrapper">
                  <Mail className="inputIcon" size={17} />
                  <input
                    id="reg-email"
                    type="text"
                    className="formInput"
                    placeholder="Nhập Email hoặc SĐT"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="formFieldGroup">
                <label className="fieldLabel" htmlFor="reg-password">
                  Mật khẩu
                </label>
                <div className="inputWrapper">
                  <Lock className="inputIcon" size={17} />
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    className="formInput"
                    placeholder="Tối thiểu 8 ký tự"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="passwordToggleBtn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={0}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="fieldHelpText">
                  Bao gồm tối thiểu 8 ký tự kết hợp chữ và số.
                </div>
              </div>

              <div className="formFieldGroup">
                <label className="fieldLabel" htmlFor="reg-confirm">
                  Xác nhận mật khẩu
                </label>
                <div className="inputWrapper">
                  <Lock className="inputIcon" size={17} />
                  <input
                    id="reg-confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    className="formInput"
                    placeholder="Nhập lại mật khẩu vừa đặt"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="passwordToggleBtn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={0}
                    aria-label={showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="formFieldGroup registerRoleField">
                <label className="fieldLabel" htmlFor="reg-role">
                  Vai trò đăng ký
                </label>
                <div className="inputWrapper">
                  <select
                    id="reg-role"
                    className="formInput formSelect"
                    value={requestedRole}
                    onChange={(e) => setRequestedRole(e.target.value as "" | "COLLECTOR" | "COOPERATIVE" | "REVIEWER")}
                    required
                  >
                    <option value="" disabled>Chọn vai trò của bạn</option>
                    <option value="COLLECTOR">Thương lái / Điểm thu mua</option>
                    <option value="COOPERATIVE">Hợp tác xã / Cơ sở đóng gói</option>
                    <option value="REVIEWER">Cơ quan quản lý / Hậu kiểm</option>
                  </select>
                </div>
              </div>

              <div className="registerNoticeBox">
                <Info size={14} color="#D92D20" />
                <span className="registerNoticeText">
                  Sau khi đăng ký, vui lòng bổ sung hồ sơ để BATS xác minh và kích hoạt quyền theo vai trò.
                </span>
              </div>

              <button
                type="submit"
                className="submitBtn"
                disabled={loading}
              >
                {loading ? (
                  <span className="loadingFlex">
                    <span className="spinner" />
                    <span>Đang khởi tạo tài khoản...</span>
                  </span>
                ) : (
                  <span>Tạo tài khoản</span>
                )}
              </button>

              <div className="formFooterSwitch">
                <span>Đã có tài khoản? </span>
                <button
                  type="button"
                  className="switchModeTextBtn"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                >
                  Đăng nhập ngay
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      {/* ============================================================ */}
      {/* FORGOT PASSWORD MODAL                                        */}
      {/* ============================================================ */}
      {showForgotModal && (
        <div className="modalBackdrop" onClick={() => setShowForgotModal(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h3 className="modalTitle">Khôi phục mật khẩu</h3>
              <button
                type="button"
                className="modalCloseBtn"
                onClick={() => setShowForgotModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modalBody" style={{ textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#E8F5EE", display: "grid", placeItems: "center" }}>
                  <Info size={20} color="#08764C" />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: "#083F30", fontSize: "15px", fontWeight: 700 }}>
                    Quy trình khôi phục mật khẩu
                  </h4>
                  <span style={{ fontSize: "12px", color: "#5D796C" }}>Xác thực danh tính và cấp lại quyền truy cập</span>
                </div>
              </div>

              <p style={{ fontSize: "13px", color: "#4A6B5D", lineHeight: 1.6, margin: "0 0 16px" }}>
                Tính năng tự đặt lại mật khẩu tự động qua email/SMS đang được hoàn thiện theo quy chuẩn bảo mật tập trung của BATS-AgriGuard. Để đảm bảo an toàn cho dữ liệu vùng trồng, vui lòng sử dụng các kênh chính thức dưới đây:
              </p>

              <div style={{ background: "#F0F7F4", border: "1px solid #D7E8DF", borderRadius: "12px", padding: "14px 16px", marginBottom: "18px" }}>
                <div style={{ fontWeight: 700, fontSize: "12.5px", color: "#083F30", marginBottom: "8px" }}>
                  Kênh hỗ trợ kỹ thuật & Quản trị:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px", color: "#36594C" }}>
                  <div>📞 <strong>Hotline hỗ trợ:</strong> 1900 6868 hoặc 0909 123 456 (8h00 - 18h00)</div>
                  <div>✉️ <strong>Email tiếp nhận:</strong> <span style={{ color: "#08764C", fontWeight: 600 }}>hotro@bats.vn</span> hoặc <span style={{ color: "#08764C", fontWeight: 600 }}>admin@bats.vn</span></div>
                  <div>🏢 <strong>Thành viên HTX / Vựa thu mua:</strong> Vui lòng liên hệ trực tiếp Quản trị viên đơn vị để được cấp lại mật khẩu ngay trên cổng quản trị.</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="submitBtn"
                  style={{ width: "auto", padding: "10px 24px" }}
                  onClick={() => setShowForgotModal(false)}
                >
                  Đã hiểu & Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>Đang tải giao diện...</div>}>
      <LoginInner />
    </Suspense>
  );
}
