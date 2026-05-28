/**
 * places.js — Express Router
 * Routes:
 *   POST /api/search          → Search Google Places + score leads
 *   POST /api/extract-emails  → SSE stream of email extraction results
 */

const express = require("express");
const axios = require("axios");
const { scoreLead } = require("../utils/leadScorer");
const { extractEmailsParallel } = require("../utils/emailExtractor");

const router = express.Router();

// ── Constants ─────────────────────────────────────────────────────────────────

/** Google Places API key — loaded from env */
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";

const PLACES_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchText";

const PLACES_DETAIL_URL = (id) =>
  `https://places.googleapis.com/v1/${id}`;

/** Fields to request from Text Search */
const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.photos",
  "places.currentOpeningHours",
  "places.businessStatus",
  "places.location",
  "places.googleMapsUri",
  "nextPageToken",          // ← required to enable pagination
].join(",");

/** Fields to request from Place Details */
const DETAIL_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "nationalPhoneNumber",
  "websiteUri",
  "rating",
  "userRatingCount",
  "photos",
  "currentOpeningHours",
  "businessStatus",
  "location",
  "googleMapsUri",
].join(",");

// ── Helper: Normalize a place object ────────────────────────────────────────

function normalizePlace(raw, searchLocation) {
  const photoCount = Array.isArray(raw.photos) ? raw.photos.length : 0;
  const leadData = scoreLead(raw);

  return {
    placeId: raw.id || "",
    name: raw.displayName?.text || raw.displayName || "Unknown",
    address: raw.formattedAddress || "",
    phone: raw.nationalPhoneNumber || null,
    websiteUri: raw.websiteUri || null,
    rating: raw.rating || null,
    userRatingCount: raw.userRatingCount || 0,
    photoCount,
    hasOpeningHours: !!raw.currentOpeningHours,
    businessStatus: raw.businessStatus || "OPERATIONAL",
    googleMapsUri: raw.googleMapsUri || null,
    searchLocation: searchLocation || "",
    searchDate: new Date().toLocaleDateString("en-IN"),
    // Lead scoring
    leadScore: leadData.score,
    leadLabel: leadData.label,
    leadEmoji: leadData.emoji,
    leadType: leadData.type,
    breakdown: leadData.breakdown,
    // Email — starts as 'pending' (frontend shows 🔍 Searching...)
    email: raw.websiteUri ? "pending" : null,
  };
}

// ── Helpers: paginated fetch for one search area ─────────────────────────────

async function fetchOnePage(body) {
  const response = await axios.post(PLACES_SEARCH_URL, body, {
    headers: {
      "Content-Type":    "application/json",
      "X-Goog-Api-Key":  GOOGLE_API_KEY,
      "X-Goog-FieldMask": SEARCH_FIELD_MASK,
    },
    timeout: 15000,
  });
  return {
    places:        response.data?.places        || [],
    nextPageToken: response.data?.nextPageToken || null,
  };
}

/**
 * Fetches all pages (max 60 results) for a single search body.
 * Pages are fetched sequentially because each page needs the previous nextPageToken.
 */
async function fetchAllPages(body) {
  let allPlaces = [];
  let pageToken  = null;

  do {
    const req = { ...body };
    if (pageToken) req.pageToken = pageToken;

    const { places, nextPageToken } = await fetchOnePage(req);
    allPlaces = allPlaces.concat(places);
    pageToken  = nextPageToken;

    // Small pause between pages to avoid rate limiting
    if (pageToken) await new Promise((r) => setTimeout(r, 300));
  } while (pageToken && allPlaces.length < 60);

  return allPlaces;
}

// ── POST /api/search ──────────────────────────────────────────────────────────

router.post("/search", async (req, res) => {
  const { textQuery, maxResults = 60 } = req.body;

  if (!textQuery || !textQuery.trim()) {
    return res.status(400).json({ error: "textQuery is required" });
  }

  const limit = Math.min(Math.max(parseInt(maxResults) || 60, 1), 500);

  try {
    // ── Phase 1: Initial text search (up to 60 results) ──────────────────────
    const initial = await fetchAllPages({
      textQuery:    textQuery.trim(),
      pageSize:     20,
      languageCode: "en",
    });

    const seenIds = new Set(initial.map((p) => p.id).filter(Boolean));
    let allRaw    = [...initial];
    console.log(`[search] Initial query: ${initial.length} results`);

    // ── Phase 2: Grid search to break the 60-result per-query limit ───────────
    // Google Places caps every text query at 60 results. To get more, we search
    // the same business type at multiple grid points around the city center,
    // then deduplicate by placeId.
    if (limit > 60 && initial.length > 0) {

      // Compute city centre from initial results' coordinates
      const locs = initial.filter((p) => p.location);
      if (locs.length > 0) {
        const centerLat = locs.reduce((s, p) => s + p.location.latitude,  0) / locs.length;
        const centerLng = locs.reduce((s, p) => s + p.location.longitude, 0) / locs.length;

        // Extract just the business type (strip " in <city>")
        const bizType = textQuery.trim().replace(/\s+in\s+.+$/i, "").trim();

        // Grid parameters: ~7km step; 3x3=9 pts → ~180 results, 5x5=25 pts → ~500
        const STEP   = 0.07;    // ~7 km per grid step
        const RADIUS = 8000;    // 8 km search radius per grid point
        const side   = limit <= 100 ? 2
                      : limit <= 200 ? 3
                      : limit <= 350 ? 4
                      : 5;
        const half   = Math.floor(side / 2);

        const gridPoints = [];
        for (let r = -half; r <= half; r++) {
          for (let c = -half; c <= half; c++) {
            if (r === 0 && c === 0) continue; // centre already covered
            gridPoints.push({
              lat: centerLat + r * STEP,
              lng: centerLng + c * STEP,
            });
          }
        }

        console.log(`[search] Grid: ${gridPoints.length} points × up to 60 each (limit=${limit})`);

        // Run grid searches in parallel batches of 5
        const BATCH = 5;
        for (let i = 0; i < gridPoints.length && allRaw.length < limit; i += BATCH) {
          const batch = gridPoints.slice(i, i + BATCH);

          const batchResults = await Promise.allSettled(
            batch.map((pt) =>
              fetchAllPages({
                textQuery:    bizType,
                pageSize:     20,
                languageCode: "en",
                locationBias: {
                  circle: {
                    center: { latitude: pt.lat, longitude: pt.lng },
                    radius: RADIUS,
                  },
                },
              })
            )
          );

          for (const r of batchResults) {
            if (r.status === "fulfilled") {
              for (const place of r.value) {
                if (place.id && !seenIds.has(place.id)) {
                  seenIds.add(place.id);
                  allRaw.push(place);
                }
              }
            }
          }

          console.log(`[search] After grid batch ${Math.ceil((i + BATCH) / BATCH)}: ${allRaw.length} unique results`);
        }
      }
    }

    // ── Normalize, trim, sort ────────────────────────────────────────────────
    allRaw = allRaw.slice(0, limit);

    if (allRaw.length === 0) {
      return res.json({
        results: [],
        message: "No businesses found for that query. Try a different location or type.",
      });
    }

    const results = allRaw
      .filter((p) => p.businessStatus !== "CLOSED_PERMANENTLY")
      .map((place) => normalizePlace(place, textQuery.trim()))
      .sort((a, b) => b.leadScore - a.leadScore);

    console.log(`[search] ✅ Returning ${results.length} results`);
    return res.json({ results, total: results.length });

  } catch (err) {
    console.error("[/api/search] Error:", err.response?.data || err.message);

    if (err.response) {
      const status    = err.response.status;
      const googleMsg = err.response.data?.error?.message ||
                        err.response.data?.message ||
                        "Unknown Google API error";

      if (status === 400) return res.status(400).json({ error: "Bad request to Google Places API", detail: googleMsg });
      if (status === 403) return res.status(403).json({ error: "API key is invalid or Places API (New) is not enabled", detail: googleMsg });
      if (status === 429) return res.status(429).json({ error: "Google API quota exceeded. Please try again later.", detail: googleMsg });

      return res.status(status).json({ error: googleMsg });
    }

    if (err.code === "ECONNABORTED") {
      return res.status(504).json({ error: "Request to Google timed out. Please try again." });
    }

    return res.status(500).json({ error: "Failed to fetch places", detail: err.message });
  }
});



// ── GET /api/extract-email ────────────────────────────────────────────────────
// Extracts the email for a SINGLE business website URL.
// Called once per business from the frontend in parallel.
// Returns plain JSON — no SSE needed, works perfectly through Vite proxy.

router.get("/extract-email", async (req, res) => {
  const { url, name = "", city = "" } = req.query;

  if (!url && !name) {
    return res.json({ email: null });
  }

  try {
    const { extractEmail } = require("../utils/emailExtractor");
    const email = await extractEmail(url || null, name, city);
    return res.json({ email: email || null });
  } catch (err) {
    console.error("[/api/extract-email] Error:", err.message);
    return res.json({ email: null });
  }
});

module.exports = router;
