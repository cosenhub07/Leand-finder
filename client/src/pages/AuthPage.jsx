import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const TABS  = { SIGNIN: "signin", SIGNUP: "signup" };
const STEPS = { FORM: "form", FORGOT_EMAIL: "forgot_email", FORGOT_OTP: "forgot_otp", FORGOT_RESET: "forgot_reset" };
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function AuthPage({ onBack }) {
  const { login } = useAuth();

  const [tab,       setTab]     = useState(TABS.SIGNIN);
  const [step,      setStep]    = useState(STEPS.FORM);
  const [loading,   setLoading] = useState(false);
  const [gLoading,  setGLoading]  = useState(false);
  const [error,     setError]   = useState("");
  const [info,      setInfo]    = useState("");

  // Sign In fields
  const [siEmail,   setSiEmail]    = useState("");
  const [siPass,    setSiPass]     = useState("");
  const [siShowPw,  setSiShowPw]   = useState(false);

  // Sign Up fields
  const [suName,    setSuName]    = useState("");
  const [suEmail,   setSuEmail]   = useState("");
  const [suPass,    setSuPass]    = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [suShowPw,  setSuShowPw]  = useState(false);

  // Forgot Password fields
  const [fpEmail, setFpEmail] = useState("");
  const [fpOtp,   setFpOtp]   = useState("");
  const [fpPass,  setFpPass]  = useState("");
  const [fpConfirm, setFpConfirm] = useState("");
  const [fpShowPw, setFpShowPw] = useState(false);

  // ── Google OAuth ─────────────────────────────────────────────────────────
  const handleGoogleResponse = useCallback(async (response) => {
    setGLoading(true); setError("");
    try {
      const { data } = await axios.post("/api/auth/google", { credential: response.credential });
      login(data.token, data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Google sign-in failed. Try again.");
    } finally { setGLoading(false); }
  }, [login]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const initGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-btn"),
        { theme: "filled_black", size: "large", shape: "pill", text: "continue_with", width: 340 }
      );
    };
    if (window.google) { initGoogle(); }
    else {
      const iv = setInterval(() => { if (window.google) { initGoogle(); clearInterval(iv); } }, 100);
      return () => clearInterval(iv);
    }
  }, [handleGoogleResponse]);

  function clearMessages() { setError(""); setInfo(""); }

  // ── Sign In ───────────────────────────────────────────────────────────────
  async function handleSignIn(e) {
    e.preventDefault();
    if (!siEmail.trim() || !siPass) { setError("Please enter your email and password."); return; }
    setLoading(true); clearMessages();
    try {
      const { data } = await axios.post("/api/auth/login", { email: siEmail.trim(), password: siPass });
      login(data.token, data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid email or password.");
    } finally { setLoading(false); }
  }

  // ── Sign Up ───────────────────────────────────────────────────────────────
  async function handleSignUp(e) {
    e.preventDefault();
    if (!suName.trim())                          { setError("Please enter your full name."); return; }
    if (!suEmail.trim())                         { setError("Please enter your email."); return; }
    if (suPass.length < 8)                       { setError("Password must be at least 8 characters."); return; }
    if (suPass !== suConfirm)                    { setError("Passwords do not match."); return; }
    setLoading(true); clearMessages();
    try {
      const { data } = await axios.post("/api/auth/signup", {
        name: suName.trim(), email: suEmail.trim(), password: suPass,
      });
      login(data.token, data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create account. Try again.");
    } finally { setLoading(false); }
  }

  // ── Forgot Password — Step 1: Send OTP ───────────────────────────────────
  async function handleForgotSendOtp(e) {
    e.preventDefault();
    if (!fpEmail.trim()) { setError("Please enter your email."); return; }
    setLoading(true); clearMessages();
    try {
      await axios.post("/api/auth/send-otp", { email: fpEmail.trim(), name: "User" });
      setInfo(`✅ OTP sent to ${fpEmail}. Check your inbox.`);
      setStep(STEPS.FORGOT_OTP);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP. Try again.");
    } finally { setLoading(false); }
  }

  // ── Forgot Password — Step 2: Verify OTP ─────────────────────────────────
  async function handleForgotVerifyOtp(e) {
    e.preventDefault();
    if (!fpOtp.trim()) { setError("Enter the OTP from your email."); return; }
    setLoading(true); clearMessages();
    try {
      await axios.post("/api/auth/verify-otp-only", { email: fpEmail.trim(), otp: fpOtp.trim() });
      setInfo("✅ OTP verified. Set your new password.");
      setStep(STEPS.FORGOT_RESET);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired OTP.");
    } finally { setLoading(false); }
  }

  // ── Forgot Password — Step 3: Set New Password ───────────────────────────
  async function handleForgotReset(e) {
    e.preventDefault();
    if (fpPass.length < 8)          { setError("Password must be at least 8 characters."); return; }
    if (fpPass !== fpConfirm)       { setError("Passwords do not match."); return; }
    setLoading(true); clearMessages();
    try {
      await axios.post("/api/auth/reset-password", { email: fpEmail.trim(), password: fpPass });
      setInfo("✅ Password updated! You can now sign in.");
      setStep(STEPS.FORM);
      setTab(TABS.SIGNIN);
      setSiEmail(fpEmail);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password.");
    } finally { setLoading(false); }
  }

  function goBackToForm() { setStep(STEPS.FORM); clearMessages(); }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-blob blob-1" />
      <div className="auth-blob blob-2" />
      <div className="auth-blob blob-3" />

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🎯</div>
          <div>
            <h1 className="auth-title">Lead Finder</h1>
            <p className="auth-subtitle">AI-Powered Business Lead Generation</p>
          </div>
        </div>

        <div className="auth-divider" />

        {/* Forgot Password Flow */}
        {step !== STEPS.FORM && (
          <div className="auth-form">
            <button type="button" className="auth-btn-ghost" style={{ marginBottom: 16 }} onClick={goBackToForm}>
              ← Back to Login
            </button>
            <h3 className="auth-forgot-title">
              {step === STEPS.FORGOT_EMAIL && "🔑 Reset Password"}
              {step === STEPS.FORGOT_OTP   && "📧 Verify OTP"}
              {step === STEPS.FORGOT_RESET && "🔒 Set New Password"}
            </h3>

            {error && <div className="auth-alert error">{error}</div>}
            {info  && <div className="auth-alert info">{info}</div>}

            {step === STEPS.FORGOT_EMAIL && (
              <form onSubmit={handleForgotSendOtp}>
                <div className="auth-field">
                  <label>Your Email</label>
                  <input type="email" placeholder="rahul@agency.com" value={fpEmail}
                    onChange={e => setFpEmail(e.target.value)} autoFocus />
                </div>
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? <span className="auth-spinner" /> : "📧 Send Reset OTP"}
                </button>
              </form>
            )}

            {step === STEPS.FORGOT_OTP && (
              <form onSubmit={handleForgotVerifyOtp}>
                <p className="auth-otp-hint">Enter the 6-digit code sent to <strong>{fpEmail}</strong></p>
                <div className="auth-field">
                  <label>OTP Code</label>
                  <input type="text" inputMode="numeric" placeholder="_ _ _ _ _ _" maxLength={6}
                    className="auth-otp-input" value={fpOtp}
                    onChange={e => setFpOtp(e.target.value.replace(/\D/g, ""))} autoFocus />
                </div>
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? <span className="auth-spinner" /> : "✅ Verify OTP"}
                </button>
              </form>
            )}

            {step === STEPS.FORGOT_RESET && (
              <form onSubmit={handleForgotReset}>
                <div className="auth-field">
                  <label>New Password</label>
                  <div className="auth-pw-wrap">
                    <input type={fpShowPw ? "text" : "password"} placeholder="Min. 8 characters"
                      value={fpPass} onChange={e => setFpPass(e.target.value)} autoFocus />
                    <button type="button" className="auth-pw-toggle" onClick={() => setFpShowPw(v => !v)}>
                      {fpShowPw ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                <div className="auth-field">
                  <label>Confirm Password</label>
                  <div className="auth-pw-wrap">
                    <input type={fpShowPw ? "text" : "password"} placeholder="Repeat password"
                      value={fpConfirm} onChange={e => setFpConfirm(e.target.value)} />
                  </div>
                </div>
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? <span className="auth-spinner" /> : "🔒 Set New Password"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Main Sign In / Sign Up */}
        {step === STEPS.FORM && (
          <>
            {/* Google Button */}
            {GOOGLE_CLIENT_ID ? (
              <div className="auth-google-section">
                {gLoading
                  ? <div className="auth-google-loading"><span className="auth-spinner" /><span>Signing in...</span></div>
                  : <div id="google-signin-btn" className="auth-google-btn-wrapper" />
                }
              </div>
            ) : null}

            {/* OR divider */}
            <div className="auth-or-divider">
              <span className="auth-or-line" />
              <span className="auth-or-text">or use email</span>
              <span className="auth-or-line" />
            </div>

            {/* Tabs */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${tab === TABS.SIGNIN ? "active" : ""}`}
                onClick={() => { setTab(TABS.SIGNIN); clearMessages(); }}
              >Sign In</button>
              <button
                className={`auth-tab ${tab === TABS.SIGNUP ? "active" : ""}`}
                onClick={() => { setTab(TABS.SIGNUP); clearMessages(); }}
              >Sign Up</button>
            </div>

            {error && <div className="auth-alert error">{error}</div>}
            {info  && <div className="auth-alert info">{info}</div>}

            {/* Sign In Form */}
            {tab === TABS.SIGNIN && (
              <form className="auth-form" onSubmit={handleSignIn}>
                <div className="auth-field">
                  <label>Email</label>
                  <input id="si-email" type="email" placeholder="rahul@agency.com"
                    value={siEmail} onChange={e => setSiEmail(e.target.value)} autoFocus />
                </div>
                <div className="auth-field">
                  <label>Password</label>
                  <div className="auth-pw-wrap">
                    <input id="si-pass" type={siShowPw ? "text" : "password"}
                      placeholder="Your password" value={siPass}
                      onChange={e => setSiPass(e.target.value)} />
                    <button type="button" className="auth-pw-toggle" onClick={() => setSiShowPw(v => !v)}>
                      {siShowPw ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                <button id="auth-signin-btn" type="submit" className="auth-btn" disabled={loading}>
                  {loading ? <span className="auth-spinner" /> : "🚀 Sign In"}
                </button>
                <button type="button" className="auth-forgot-link"
                  onClick={() => { setStep(STEPS.FORGOT_EMAIL); clearMessages(); setFpEmail(siEmail); }}>
                  Forgot password?
                </button>
                {onBack && (
                  <button type="button" className="auth-btn-ghost" style={{ marginTop: 8 }} onClick={onBack}>
                    ← Back to Homepage
                  </button>
                )}
              </form>
            )}

            {/* Sign Up Form */}
            {tab === TABS.SIGNUP && (
              <form className="auth-form" onSubmit={handleSignUp}>
                <div className="auth-field">
                  <label>Full Name</label>
                  <input id="su-name" type="text" placeholder="Rahul Sharma"
                    value={suName} onChange={e => setSuName(e.target.value)} autoFocus />
                </div>
                <div className="auth-field">
                  <label>Email</label>
                  <input id="su-email" type="email" placeholder="rahul@agency.com"
                    value={suEmail} onChange={e => setSuEmail(e.target.value)} />
                </div>
                <div className="auth-field">
                  <label>Password <span className="auth-field-hint">(min. 8 characters)</span></label>
                  <div className="auth-pw-wrap">
                    <input id="su-pass" type={suShowPw ? "text" : "password"}
                      placeholder="Create a strong password" value={suPass}
                      onChange={e => setSuPass(e.target.value)} />
                    <button type="button" className="auth-pw-toggle" onClick={() => setSuShowPw(v => !v)}>
                      {suShowPw ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {suPass.length > 0 && (
                    <div className="auth-pw-strength">
                      <div className={`auth-pw-bar ${suPass.length >= 8 ? suPass.length >= 12 ? "strong" : "medium" : "weak"}`} />
                      <span>{suPass.length >= 12 ? "Strong 💪" : suPass.length >= 8 ? "Medium 👍" : "Too short ❌"}</span>
                    </div>
                  )}
                </div>
                <div className="auth-field">
                  <label>Confirm Password</label>
                  <div className="auth-pw-wrap">
                    <input id="su-confirm" type={suShowPw ? "text" : "password"}
                      placeholder="Repeat your password" value={suConfirm}
                      onChange={e => setSuConfirm(e.target.value)} />
                  </div>
                  {suConfirm.length > 0 && suPass !== suConfirm && (
                    <p className="auth-field-error">Passwords don't match</p>
                  )}
                </div>
                <button id="auth-signup-btn" type="submit" className="auth-btn" disabled={loading}>
                  {loading ? <span className="auth-spinner" /> : "✨ Create Account"}
                </button>
                {onBack && (
                  <button type="button" className="auth-btn-ghost" style={{ marginTop: 8 }} onClick={onBack}>
                    ← Back to Homepage
                  </button>
                )}
              </form>
            )}
          </>
        )}

        <p className="auth-footer">
          🔒 Secure · Encrypted passwords · No spam
        </p>
      </div>
    </div>
  );
}
