import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const STEPS = { EMAIL: "email", OTP: "otp" };

export default function AuthPage({ onBack }) {
  const { login }      = useAuth();
  const [step,  setStep]  = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [name,  setName]  = useState("");
  const [otp,   setOtp]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [info,    setInfo]    = useState("");

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
          🔒 Secure OTP login · No password needed
        </p>
      </div>
    </div>
  );
}
