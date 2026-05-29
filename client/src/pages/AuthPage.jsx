import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const STEPS = { EMAIL: "email", OTP: "otp" };
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function AuthPage({ onBack }) {
  const { login }      = useAuth();
  const [step,  setStep]  = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [name,  setName]  = useState("");
  const [otp,   setOtp]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [gLoading, setGLoading]   = useState(false);
  const [error,   setError]       = useState("");
  const [info,    setInfo]        = useState("");

  // ── Google OAuth handler ───────────────────────────────────────────────────
  const handleGoogleResponse = useCallback(async (response) => {
    setGLoading(true);
    setError("");
    try {
      const { data } = await axios.post("/api/auth/google", {
        credential: response.credential,
      });
      login(data.token, data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Google sign-in failed. Try again.");
    } finally {
      setGLoading(false);
    }
  }, [login]);

  // ── Initialize Google Identity Services ────────────────────────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return; // skip if no client ID configured
    const initGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-btn"),
        {
          theme: "filled_black",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: 340,
        }
      );
    };

    // Wait for Google script to load
    if (window.google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) { initGoogle(); clearInterval(interval); }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [handleGoogleResponse]);

  // ── OTP flow ───────────────────────────────────────────────────────────────
  async function handleSendOtp(e) {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      setError("Please enter your name and email."); return;
    }
    setLoading(true); setError(""); setInfo("");
    try {
      await axios.post("/api/auth/send-otp", { email: email.trim(), name: name.trim() });
      setInfo(`✅ OTP sent to ${email}. Check your inbox.`);
      setStep(STEPS.OTP);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (!otp.trim()) { setError("Enter the OTP from your email."); return; }
    setLoading(true); setError("");
    try {
      const { data } = await axios.post("/api/auth/verify-otp", {
        email: email.trim(), otp: otp.trim(), name: name.trim(),
      });
      login(data.token, data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Animated background blobs */}
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

        {/* ── Google Sign-In Button ───────────────────────────────────────── */}
        {GOOGLE_CLIENT_ID ? (
          <div className="auth-google-section">
            {gLoading ? (
              <div className="auth-google-loading">
                <span className="auth-spinner" />
                <span>Signing in with Google...</span>
              </div>
            ) : (
              <div id="google-signin-btn" className="auth-google-btn-wrapper" />
            )}
          </div>
        ) : (
          <div className="auth-google-missing">
            <span>⚠️ Google login not configured</span>
          </div>
        )}

        {/* ── OR Divider ─────────────────────────────────────────────────── */}
        <div className="auth-or-divider">
          <span className="auth-or-line" />
          <span className="auth-or-text">or continue with email</span>
          <span className="auth-or-line" />
        </div>

        {/* Step indicator */}
        <div className="auth-steps">
          <div className={`auth-step ${step === STEPS.EMAIL ? "active" : "done"}`}>
            <span>{step === STEPS.EMAIL ? "1" : "✓"}</span> Your Details
          </div>
          <div className="auth-step-line" />
          <div className={`auth-step ${step === STEPS.OTP ? "active" : ""}`}>
            <span>2</span> Verify OTP
          </div>
        </div>

        {/* Error / Info */}
        {error && <div className="auth-alert error">{error}</div>}
        {info  && <div className="auth-alert info">{info}</div>}

        {/* Step 1: Email + Name */}
        {step === STEPS.EMAIL && (
          <form className="auth-form" onSubmit={handleSendOtp}>
            <div className="auth-field">
              <label>Full Name</label>
              <input
                id="auth-name"
                type="text"
                placeholder="Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="auth-field">
              <label>Work Email</label>
              <input
                id="auth-email"
                type="email"
                placeholder="rahul@agency.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              id="auth-send-otp-btn"
              type="submit"
              className="auth-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                <>📧 Send OTP to Email</>
              )}
            </button>
            {onBack && (
              <button
                type="button"
                className="auth-btn-ghost"
                style={{ marginTop: 10, width: "100%" }}
                onClick={onBack}
              >
                ← Back to Homepage
              </button>
            )}
          </form>
        )}

        {/* Step 2: OTP */}
        {step === STEPS.OTP && (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <p className="auth-otp-hint">
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>
            <div className="auth-field">
              <label>OTP Code</label>
              <input
                id="auth-otp-input"
                type="text"
                inputMode="numeric"
                placeholder="_ _ _ _ _ _"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="auth-otp-input"
                autoFocus
              />
            </div>
            <button
              id="auth-verify-btn"
              type="submit"
              className="auth-btn"
              disabled={loading}
            >
              {loading ? <span className="auth-spinner" /> : <>✅ Verify &amp; Login</>}
            </button>
            <button
              type="button"
              className="auth-btn-ghost"
              onClick={() => { setStep(STEPS.EMAIL); setOtp(""); setError(""); setInfo(""); }}
            >
              ← Change Email
            </button>
          </form>
        )}

        <p className="auth-footer">
          🔒 Secure login · OTP or Google · No password needed
        </p>
      </div>
    </div>
  );
}
