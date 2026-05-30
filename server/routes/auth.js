/**
 * auth.js — Authentication routes
 *
 * POST /api/auth/send-otp   → generate OTP, send via Brevo REST API
 * POST /api/auth/verify-otp → verify code, upsert user, return JWT
 * GET  /api/auth/me         → return current user from JWT
 */

const express  = require("express");
const jwt      = require("jsonwebtoken");
const axios    = require("axios");
const { OAuth2Client } = require("google-auth-library");
const supabase = require("../lib/supabase");

const router = express.Router();

const JWT_SECRET      = "lf_jwt_secret_2026_x9k2m7p";
const BREVO_KEY       = process.env.BREVO_API_KEY || "";
const BREVO_API_URL   = "https://api.brevo.com/v3/smtp/email";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const googleClient    = new OAuth2Client(GOOGLE_CLIENT_ID);
// IMPORTANT: this must be a verified sender in your Brevo account
const BREVO_SENDER_EMAIL = "cosen.hub@gmail.com";
const OTP_EXPIRY_MIN     = 10;

// ── Helper: send OTP email via Brevo REST API ─────────────────────────────────
async function sendOtpEmail(toEmail, toName, otp) {
  const payload = {
    sender:  { name: "Lead Finder", email: BREVO_SENDER_EMAIL },
    to:      [{ email: toEmail, name: toName || toEmail }],
    subject: `${otp} — Your Lead Finder OTP`,
    htmlContent: `
      <!DOCTYPE html><html>
      <body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="padding:40px 20px;">
            <table width="520" cellpadding="0" cellspacing="0"
              style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px;
                     border:1px solid rgba(99,102,241,0.3);">
              <tr><td style="padding:36px 40px 20px;">
                <h1 style="margin:0;font-size:26px;font-weight:800;color:#818cf8;">🎯 Lead Finder</h1>
                <p style="color:#94a3b8;font-size:13px;margin:4px 0 0;">AI-Powered Business Lead Generation</p>
              </td></tr>
              <tr><td style="padding:0 40px 30px;">
                <p style="color:#e2e8f0;font-size:16px;line-height:1.6;margin:0 0 20px;">
                  Hi ${toName || "there"} 👋<br>Your one-time login code is:
                </p>
                <div style="background:rgba(99,102,241,0.15);border:2px solid rgba(99,102,241,0.4);
                            border-radius:12px;padding:28px;text-align:center;margin-bottom:20px;">
                  <span style="font-size:46px;font-weight:900;letter-spacing:14px;
                               color:#818cf8;font-family:'Courier New',monospace;">${otp}</span>
                </div>
                <p style="color:#64748b;font-size:13px;margin:0;">
                  ⏳ Expires in <strong style="color:#f97316;">${OTP_EXPIRY_MIN} minutes</strong>.
                  If you didn't request this, ignore this email.
                </p>
              </td></tr>
              <tr><td style="padding:16px 40px 24px;border-top:1px solid rgba(255,255,255,0.05);">
                <p style="color:#374151;font-size:12px;margin:0;text-align:center;">
                  © 2026 Lead Finder • Made for Indian Marketing Agencies 🇮🇳
                </p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body></html>
    `,
  };

  await axios.post(BREVO_API_URL, payload, {
    headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
    timeout: 8000,
  });
}

// ── POST /api/auth/send-otp ───────────────────────────────────────────────────
router.post("/send-otp", async (req, res) => {
  const { email, name } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email is required" });
  }

  // Generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));

  // Invalidate old OTPs for this email
  await supabase.from("lf_otp_codes")
    .update({ used: true })
    .eq("email", email.toLowerCase())
    .eq("used", false);

  // Save new OTP
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000).toISOString();
  const { error: insertErr } = await supabase.from("lf_otp_codes").insert({
    email:      email.toLowerCase(),
    code:       otp,
    expires_at: expiresAt,
  });

  if (insertErr) {
    console.error("[auth/send-otp] Supabase insert error:", insertErr.message);
    return res.status(500).json({ error: "Failed to generate OTP" });
  }

  // Send email via Brevo
  try {
    console.log(`[auth/send-otp] Attempting to send OTP to: ${email}`);
    console.log(`[auth/send-otp] Using sender: ${BREVO_SENDER_EMAIL}`);
    console.log(`[auth/send-otp] Brevo API key present: ${BREVO_KEY ? "YES (" + BREVO_KEY.substring(0, 12) + "...)" : "NO - MISSING!"}`);
    await sendOtpEmail(email, name, otp);
    console.log(`[auth/send-otp] ✅ OTP sent successfully to ${email}`);
    return res.json({ success: true, message: `OTP sent to ${email}` });
  } catch (err) {
    const detail = err.response?.data || err.message;
    const status = err.response?.status;
    console.error(`[auth/send-otp] ❌ Brevo error (HTTP ${status}):`, JSON.stringify(detail));
    return res.status(500).json({
      error: "Failed to send OTP email.",
      detail: typeof detail === "object" ? JSON.stringify(detail) : detail,
    });
  }
});

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
router.post("/verify-otp", async (req, res) => {
  const { email, otp, name } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  // Find valid, unused OTP
  const { data: codes, error } = await supabase
    .from("lf_otp_codes")
    .select("*")
    .eq("email", email.toLowerCase())
    .eq("code", String(otp).trim())
    .eq("used", false)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !codes || codes.length === 0) {
    return res.status(401).json({ error: "Invalid or expired OTP. Please try again." });
  }

  // Mark OTP as used
  await supabase.from("lf_otp_codes").update({ used: true }).eq("id", codes[0].id);

  // Upsert user
  const { data: users, error: upsertErr } = await supabase
    .from("lf_users")
    .upsert(
      { email: email.toLowerCase(), name: name || null, last_login: new Date().toISOString() },
      { onConflict: "email", returning: "representation" }
    )
    .select();

  if (upsertErr) {
    console.error("[auth/verify-otp] Upsert error:", upsertErr.message);
    return res.status(500).json({ error: "Failed to create user account" });
  }

  const user = users[0];

  // Issue JWT (7-day expiry)
  const token = jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  console.log(`[auth/verify-otp] Logged in: ${user.email}`);
  return res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name } });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get("/me", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    return res.json({ user: { id: payload.userId, email: payload.email, name: payload.name } });
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

// ── POST /api/auth/google ─────────────────────────────────────────────────────
router.post("/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: "Google credential token is required" });
  }
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: "Google OAuth not configured on server" });
  }

  try {
    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email   = payload.email;
    const name    = payload.name || payload.email.split("@")[0];

    if (!payload.email_verified) {
      return res.status(401).json({ error: "Google account email is not verified" });
    }

    console.log(`[auth/google] Google sign-in: ${email}`);

    // Upsert user in Supabase
    const { data: users, error: upsertErr } = await supabase
      .from("lf_users")
      .upsert(
        { email: email.toLowerCase(), name, last_login: new Date().toISOString() },
        { onConflict: "email", returning: "representation" }
      )
      .select();

    if (upsertErr) {
      console.error("[auth/google] Supabase upsert error:", upsertErr.message);
      return res.status(500).json({ error: "Failed to create/update user account" });
    }

    const user = users[0];

    // Issue JWT (7-day expiry) — same format as OTP login
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });

  } catch (err) {
    console.error("[auth/google] Verification error:", err.message);
    return res.status(401).json({ error: "Invalid Google token. Please try again." });
  }
});

module.exports = router;
module.exports.JWT_SECRET = JWT_SECRET;
