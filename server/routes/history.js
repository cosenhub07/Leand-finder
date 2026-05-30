/**
 * history.js — Search history routes
 *
 * POST /api/history/save    → save a search + all leads
 * GET  /api/history/list    → list all searches for this user
 * GET  /api/history/:id     → get all leads for a specific search
 */

const express  = require("express");
const jwt      = require("jsonwebtoken");
const supabase = require("../lib/supabase");
const { JWT_SECRET } = require("./auth");

const router = express.Router();

// ── Auth middleware (local) ───────────────────────────────────────────────────
function getUser(req) {
  try {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) return null;
    return jwt.verify(auth.slice(7), JWT_SECRET);
  } catch {
    return null;
  }
}

// ── POST /api/history/save ────────────────────────────────────────────────────
router.post("/save", async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const { query, location, businessType, maxResults, results = [] } = req.body;
  if (!query) return res.status(400).json({ error: "query is required" });

  const emailsFound = results.filter((r) => r.email && r.email !== "pending").length;

  // Insert search session
  const { data: searches, error: searchErr } = await supabase
    .from("lf_search_history")
    .insert({
      user_id:       user.userId,
      query,
      location,
      business_type: businessType,
      max_results:   maxResults,
      results_count: results.length,
      emails_found:  emailsFound,
    })
    .select();

  if (searchErr) {
    console.error("[history/save] Search insert error:", searchErr.message);
    return res.status(500).json({ error: "Failed to save search" });
  }

  const searchId = searches[0].id;

  // Insert all leads (batch)
  if (results.length > 0) {
    const leads = results.map((r) => ({
      search_id:      searchId,
      user_id:        user.userId,
      place_id:       r.placeId        || null,
      name:           r.name           || "Unknown",
      address:        r.address        || null,
      phone:          r.phone          || null,
      website:        r.websiteUri     || null,
      email:          r.email && r.email !== "pending" ? r.email : null,
      rating:         r.rating         || null,
      reviews_count:  r.userRatingCount || null,
      photos_count:   Array.isArray(r.photos) ? r.photos.length : null,
      lead_score:     r.leadScore      || null,
      lead_type:      r.leadType       || null,
      google_maps_uri: r.googleMapsUri || null,
    }));

    const { error: leadsErr } = await supabase.from("lf_saved_leads").insert(leads);
    if (leadsErr) {
      console.error("[history/save] Leads insert error:", leadsErr.message);
    }
  }

  console.log(`[history/save] Saved search "${query}" with ${results.length} leads for ${user.email}`);
  return res.json({ success: true, searchId });
});

// ── GET /api/history/list ─────────────────────────────────────────────────────
router.get("/list", async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const { data, error } = await supabase
    .from("lf_search_history")
    .select("*")
    .eq("user_id", user.userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return res.status(500).json({ error: "Failed to fetch history" });
  }

  return res.json({ history: data || [] });
});

// ── GET /api/history/usage ────────────────────────────────────────────────────
router.get("/usage", async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("lf_search_history")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.userId)
    .gte("created_at", startOfDay.toISOString());

  if (error) {
    console.error("[history/usage] Error:", error.message);
    return res.status(500).json({ error: "Failed to fetch usage" });
  }

  return res.json({ searchesToday: count || 0 });
});

// ── GET /api/history/:id ──────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const { id } = req.params;

  // Verify this search belongs to the user
  const { data: search, error: searchErr } = await supabase
    .from("lf_search_history")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.userId)
    .single();

  if (searchErr || !search) {
    return res.status(404).json({ error: "Search not found" });
  }

  const { data: leads, error: leadsErr } = await supabase
    .from("lf_saved_leads")
    .select("*")
    .eq("search_id", id)
    .order("lead_score", { ascending: false });

  if (leadsErr) {
    return res.status(500).json({ error: "Failed to fetch leads" });
  }

  return res.json({ search, leads: leads || [] });
});

module.exports = router;
