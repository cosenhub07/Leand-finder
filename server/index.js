/**
 * index.js — Express server entry point
 * Lead Finder API — Port 3001
 */

require("dotenv").config();
const express       = require("express");
const cors          = require("cors");
const placesRouter  = require("./routes/places");
const authRouter    = require("./routes/auth");
const historyRouter = require("./routes/history");

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      "http://localhost:5173", "http://127.0.0.1:5173",
      "http://localhost:5174", "http://127.0.0.1:5174",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api",         placesRouter);
app.use("/api/auth",    authRouter);
app.use("/api/history", historyRouter);

// ── Health check ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Global error handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[Server Error]", err.message);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

// ── Start (with auto-recovery for EADDRINUSE) ────────────────────────────────
const { execSync } = require("child_process");

function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`✅ Lead Finder API running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`⚠️  Port ${PORT} busy — killing existing process and retrying...`);
      try {
        execSync(
          `FOR /F "tokens=5" %P IN ('netstat -a -n -o ^| findstr :${PORT}') DO TaskKill /PID %P /F`,
          { stdio: "ignore", shell: true }
        );
      } catch (_) {}
      setTimeout(() => startServer(), 1500);
    } else {
      console.error("[Server Error]", err.message);
      process.exit(1);
    }
  });
}

startServer();
