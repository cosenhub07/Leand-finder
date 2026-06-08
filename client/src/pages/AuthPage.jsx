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
    <div className="min-h-screen flex items-center justify-center bg-black relative p-6 font-inter overflow-hidden">
      {/* Vercel-style Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-40">
        <div className="absolute w-[800px] h-[600px] bg-gradient-to-tr from-[#7928ca] to-[#ff0080] rounded-full blur-[120px] opacity-30 mix-blend-screen" style={{ transform: 'translate3d(-20%, -10%, 0)' }} />
        <div className="absolute w-[600px] h-[500px] bg-gradient-to-tr from-[#007cf0] to-[#00dfd8] rounded-full blur-[100px] opacity-30 mix-blend-screen" style={{ transform: 'translate3d(30%, 20%, 0)' }} />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-[440px] bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 shrink-0 rounded-lg border border-white/20 bg-white/5 flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <img src="/src/image/icon.svg" alt="Lead Finder Icon" className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
          </div>
          <div>
            <h1 className="font-inter text-2xl font-bold tracking-tight text-white">
              Lead Finder
            </h1>
            <p className="text-[13px] text-[#a1a1a1] mt-0.5">
              AI-Powered Business Lead Generation
            </p>
          </div>
        </div>

        <div className="h-px bg-white/10 mb-8" />

        {/* Forgot Password Flow */}
        {step !== STEPS.FORM && (
          <div className="flex flex-col gap-5">
            <button type="button" className="text-[13px] text-[#a1a1a1] hover:text-white transition-colors w-fit focus-visible:outline-none focus-visible:underline mb-2 flex items-center gap-1.5" onClick={goBackToForm}>
              <span aria-hidden="true">&larr;</span> Back to Login
            </button>
            <h3 className="text-2xl font-bold tracking-tight text-white text-center mb-2">
              {step === STEPS.FORGOT_EMAIL && "Reset Password"}
              {step === STEPS.FORGOT_OTP   && "Verify OTP"}
              {step === STEPS.FORGOT_RESET && "Set New Password"}
            </h3>

            {error && <div className="px-4 py-3 rounded-lg text-[13px] font-medium mb-2 bg-[#ff0000]/10 border border-[#ff0000]/20 text-[#ff4d4d] shadow-sm backdrop-blur-md">{error}</div>}
            {info  && <div className="px-4 py-3 rounded-lg text-[13px] font-medium mb-2 bg-[#0070f3]/10 border border-[#0070f3]/20 text-[#3291ff] shadow-sm backdrop-blur-md">{info}</div>}

            {step === STEPS.FORGOT_EMAIL && (
              <form onSubmit={handleForgotSendOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="fp-email" className="text-[13px] font-medium text-[#a1a1a1]">Your Email</label>
                  <input id="fp-email" type="email" placeholder="name@company.com" value={fpEmail}
                    onChange={e => setFpEmail(e.target.value)} autoFocus
                    className="bg-[#111111] border border-[#333333] rounded-lg h-11 px-4 text-[14px] text-white shadow-inner outline-none transition-all focus:border-white focus:ring-1 focus:ring-white placeholder:text-[#666666]" />
                </div>
                <button type="submit" disabled={loading} className="mt-4 bg-white text-black rounded-lg h-11 text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#e0e0e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                  {loading ? <span className="auth-spinner invert" /> : "Send Reset OTP"}
                </button>
              </form>
            )}

            {step === STEPS.FORGOT_OTP && (
              <form onSubmit={handleForgotVerifyOtp} className="flex flex-col gap-4">
                <p className="text-[14px] text-[#a1a1a1] text-center leading-relaxed mb-2">Enter the 6-digit code sent to <strong className="text-white font-medium">{fpEmail}</strong></p>
                <div className="flex flex-col gap-2">
                  <label htmlFor="fp-otp" className="text-[13px] font-medium text-[#a1a1a1]">OTP Code</label>
                  <input id="fp-otp" type="text" inputMode="numeric" placeholder="000000" maxLength={6}
                    value={fpOtp} onChange={e => setFpOtp(e.target.value.replace(/\D/g, ""))} autoFocus
                    className="bg-[#111111] border border-[#333333] rounded-lg h-12 px-4 text-[24px] tracking-[8px] text-center text-white shadow-inner outline-none transition-all focus:border-white focus:ring-1 focus:ring-white placeholder:text-[#333333] tabular-nums font-mono" />
                </div>
                <button type="submit" disabled={loading} className="mt-4 bg-white text-black rounded-lg h-11 text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#e0e0e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                  {loading ? <span className="auth-spinner invert" /> : "Verify OTP"}
                </button>
              </form>
            )}

            {step === STEPS.FORGOT_RESET && (
              <form onSubmit={handleForgotReset} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="fp-new-pass" className="text-[13px] font-medium text-[#a1a1a1]">New Password</label>
                  <div className="relative flex items-center">
                    <input id="fp-new-pass" type={fpShowPw ? "text" : "password"} placeholder="Min. 8 characters"
                      value={fpPass} onChange={e => setFpPass(e.target.value)} autoFocus
                      className="bg-[#111111] border border-[#333333] rounded-lg h-11 px-4 pr-10 text-[14px] text-white shadow-inner outline-none transition-all focus:border-white focus:ring-1 focus:ring-white placeholder:text-[#666666] w-full" />
                    <button type="button" onClick={() => setFpShowPw(v => !v)} aria-label={fpShowPw ? "Hide password" : "Show password"}
                      className="absolute right-3 text-[#666666] hover:text-[#a1a1a1] transition-colors focus-visible:outline-none">
                      {fpShowPw ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="fp-confirm-pass" className="text-[13px] font-medium text-[#a1a1a1]">Confirm Password</label>
                  <div className="relative flex items-center">
                    <input id="fp-confirm-pass" type={fpShowPw ? "text" : "password"} placeholder="Repeat password"
                      value={fpConfirm} onChange={e => setFpConfirm(e.target.value)}
                      className="bg-[#111111] border border-[#333333] rounded-lg h-11 px-4 pr-10 text-[14px] text-white shadow-inner outline-none transition-all focus:border-white focus:ring-1 focus:ring-white placeholder:text-[#666666] w-full" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="mt-4 bg-white text-black rounded-lg h-11 text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#e0e0e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                  {loading ? <span className="auth-spinner invert" /> : "Set New Password"}
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
              <div className="flex justify-center items-center my-2 min-h-[46px]">
                {gLoading
                  ? <div className="flex items-center gap-2.5 text-[#a1a1a1] text-[14px] py-3 px-5 bg-white/5 rounded-full border border-white/10 shadow-sm"><span className="auth-spinner invert" /><span>Signing in…</span></div>
                  : <div id="google-signin-btn" className="flex justify-center w-full [&>div]:rounded-full [&>div]:overflow-hidden" />
                }
              </div>
            ) : null}

            {/* OR divider */}
            <div className="flex items-center gap-3 my-4">
              <span className="flex-1 h-px bg-white/10" />
              <span className="text-[12px] text-[#888888] uppercase tracking-wide font-medium">or continue with email</span>
              <span className="flex-1 h-px bg-white/10" />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-[#111111] p-1 rounded-lg mb-6 border border-[#333333]">
              <button
                className={`flex-1 py-2 text-[14px] rounded-md cursor-pointer transition-all font-inter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${tab === TABS.SIGNIN ? "bg-white/10 text-white font-medium shadow-[0_1px_2px_rgba(0,0,0,0.2)] border border-white/5" : "bg-transparent text-[#888888] font-medium hover:text-white border border-transparent"}`}
                onClick={() => { setTab(TABS.SIGNIN); clearMessages(); }}
              >Sign In</button>
              <button
                className={`flex-1 py-2 text-[14px] rounded-md cursor-pointer transition-all font-inter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${tab === TABS.SIGNUP ? "bg-white/10 text-white font-medium shadow-[0_1px_2px_rgba(0,0,0,0.2)] border border-white/5" : "bg-transparent text-[#888888] font-medium hover:text-white border border-transparent"}`}
                onClick={() => { setTab(TABS.SIGNUP); clearMessages(); }}
              >Sign Up</button>
            </div>

            {error && <div className="px-4 py-3 rounded-lg text-[13px] font-medium mb-4 bg-[#ff0000]/10 border border-[#ff0000]/20 text-[#ff4d4d] shadow-sm backdrop-blur-md">{error}</div>}
            {info  && <div className="px-4 py-3 rounded-lg text-[13px] font-medium mb-4 bg-[#0070f3]/10 border border-[#0070f3]/20 text-[#3291ff] shadow-sm backdrop-blur-md">{info}</div>}

            {/* Sign In Form */}
            {tab === TABS.SIGNIN && (
              <form className="flex flex-col gap-4" onSubmit={handleSignIn}>
                <div className="flex flex-col gap-2">
                  <label htmlFor="si-email" className="text-[13px] font-medium text-[#a1a1a1]">Email</label>
                  <input id="si-email" type="email" placeholder="name@company.com"
                    value={siEmail} onChange={e => setSiEmail(e.target.value)} autoFocus
                    className="bg-[#111111] border border-[#333333] rounded-lg h-11 px-4 text-[14px] text-white shadow-inner outline-none transition-all focus:border-white focus:ring-1 focus:ring-white placeholder:text-[#666666]" />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="si-pass" className="text-[13px] font-medium text-[#a1a1a1]">Password</label>
                  <div className="relative flex items-center">
                    <input id="si-pass" type={siShowPw ? "text" : "password"}
                      placeholder="Your password" value={siPass}
                      onChange={e => setSiPass(e.target.value)}
                      className="bg-[#111111] border border-[#333333] rounded-lg h-11 px-4 pr-10 text-[14px] text-white shadow-inner outline-none transition-all focus:border-white focus:ring-1 focus:ring-white placeholder:text-[#666666] w-full" />
                    <button type="button" aria-label={siShowPw ? "Hide password" : "Show password"} onClick={() => setSiShowPw(v => !v)}
                      className="absolute right-3 text-[#666666] hover:text-[#a1a1a1] transition-colors focus-visible:outline-none">
                      {siShowPw ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                <button id="auth-signin-btn" type="submit" disabled={loading} className="mt-4 bg-white text-black rounded-lg h-11 text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#e0e0e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                  {loading ? <span className="auth-spinner invert" /> : "Sign In"}
                </button>
                <button type="button" className="text-[#a1a1a1] text-[13px] cursor-pointer mt-3 text-center w-full transition-colors hover:text-white focus-visible:outline-none focus-visible:underline"
                  onClick={() => { setStep(STEPS.FORGOT_EMAIL); clearMessages(); setFpEmail(siEmail); }}>
                  Forgot password?
                </button>
                {onBack && (
                  <button type="button" className="text-[13px] text-[#a1a1a1] hover:text-white transition-colors w-full mt-2 focus-visible:outline-none focus-visible:underline flex items-center justify-center gap-1.5" onClick={onBack}>
                    <span aria-hidden="true">&larr;</span> Back to Homepage
                  </button>
                )}
              </form>
            )}

            {/* Sign Up Form */}
            {tab === TABS.SIGNUP && (
              <form className="flex flex-col gap-4" onSubmit={handleSignUp}>
                <div className="flex flex-col gap-2">
                  <label htmlFor="su-name" className="text-[13px] font-medium text-[#a1a1a1]">Full Name</label>
                  <input id="su-name" type="text" placeholder="Sarah Jenkins"
                    value={suName} onChange={e => setSuName(e.target.value)} autoFocus
                    className="bg-[#111111] border border-[#333333] rounded-lg h-11 px-4 text-[14px] text-white shadow-inner outline-none transition-all focus:border-white focus:ring-1 focus:ring-white placeholder:text-[#666666]" />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="su-email" className="text-[13px] font-medium text-[#a1a1a1]">Email</label>
                  <input id="su-email" type="email" placeholder="name@company.com"
                    value={suEmail} onChange={e => setSuEmail(e.target.value)}
                    className="bg-[#111111] border border-[#333333] rounded-lg h-11 px-4 text-[14px] text-white shadow-inner outline-none transition-all focus:border-white focus:ring-1 focus:ring-white placeholder:text-[#666666]" />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="su-pass" className="text-[13px] font-medium text-[#a1a1a1]">Password <span className="text-[#666666] font-normal ml-1 whitespace-nowrap">(min. 8 characters)</span></label>
                  <div className="relative flex items-center">
                    <input id="su-pass" type={suShowPw ? "text" : "password"}
                      placeholder="Create a strong password" value={suPass}
                      onChange={e => setSuPass(e.target.value)}
                      className="bg-[#111111] border border-[#333333] rounded-lg h-11 px-4 pr-10 text-[14px] text-white shadow-inner outline-none transition-all focus:border-white focus:ring-1 focus:ring-white placeholder:text-[#666666] w-full" />
                    <button type="button" aria-label={suShowPw ? "Hide password" : "Show password"} onClick={() => setSuShowPw(v => !v)}
                      className="absolute right-3 text-[#666666] hover:text-[#a1a1a1] transition-colors focus-visible:outline-none">
                      {suShowPw ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {suPass.length > 0 && (
                    <div className="flex items-center gap-2 mt-1.5 text-[12px] text-[#a1a1a1]">
                      <div className="flex-1 h-1 bg-[#333333] rounded-sm overflow-hidden relative">
                        <div className={`absolute top-0 left-0 h-full transition-all duration-300 ${suPass.length >= 8 ? suPass.length >= 12 ? "w-full bg-[#0070f3]" : "w-2/3 bg-[#f5a623]" : "w-1/3 bg-[#ff0000]"}`} />
                      </div>
                      <span>{suPass.length >= 12 ? "Strong" : suPass.length >= 8 ? "Medium" : "Too short"}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="su-confirm" className="text-[13px] font-medium text-[#a1a1a1]">Confirm Password</label>
                  <div className="relative flex items-center">
                    <input id="su-confirm" type={suShowPw ? "text" : "password"}
                      placeholder="Repeat your password" value={suConfirm}
                      onChange={e => setSuConfirm(e.target.value)}
                      className="bg-[#111111] border border-[#333333] rounded-lg h-11 px-4 pr-10 text-[14px] text-white shadow-inner outline-none transition-all focus:border-white focus:ring-1 focus:ring-white placeholder:text-[#666666] w-full" />
                  </div>
                  {suConfirm.length > 0 && suPass !== suConfirm && (
                    <p className="text-[13px] text-[#ff4d4d] m-0 mt-1">Passwords don't match</p>
                  )}
                </div>
                <button id="auth-signup-btn" type="submit" disabled={loading} className="mt-4 bg-white text-black rounded-lg h-11 text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#e0e0e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                  {loading ? <span className="auth-spinner invert" /> : "Create Account"}
                </button>
                {onBack && (
                  <button type="button" className="text-[13px] text-[#a1a1a1] hover:text-white transition-colors w-full mt-2 focus-visible:outline-none focus-visible:underline flex items-center justify-center gap-1.5" onClick={onBack}>
                    <span aria-hidden="true">&larr;</span> Back to Homepage
                  </button>
                )}
              </form>
            )}
          </>
        )}

        <p className="text-[12px] text-[#666666] text-center mt-8">
          Secure • Encrypted • No spam
        </p>
      </div>
    </div>
  );
}
