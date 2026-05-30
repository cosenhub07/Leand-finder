/**
 * emailExtractor.js
 *
 * FOUR-STEP WATERFALL EMAIL EXTRACTION:
 *
 * Step 1 — Website Scraper (existing):
 *   50 URL paths checked in parallel using Cheerio (7-layer scanning).
 *   Returns as soon as any page finds an email.
 *
 * Step 2 — WHOIS Domain Lookup (NEW — free, no API key):
 *   Queries WHOIS servers for the domain's registration record.
 *   Small Indian businesses often list owner email in WHOIS.
 *
 * Step 3 — Web Search via Serper.dev (NEW — Google Search API):
 *   Searches Google for: "Business Name" "City" email
 *   Finds emails from JustDial, IndiaMart, directories, news, social media
 *   — sources that Google has already indexed but we can't scrape directly.
 *
 * Each step only runs if the previous found nothing. As soon as any step
 * finds an email, we return it immediately.
 */

const axios   = require("axios");
const cheerio = require("cheerio");
const https   = require("https");
const http    = require("http");
const whois   = require("whois");
const util    = require("util");
const puppeteer = require("puppeteer");

// Promisify whois.lookup so we can use async/await
const whoisLookup = util.promisify(whois.lookup);

// Serper.dev API key (Google Search API)
const SERPER_API_KEY = process.env.SERPER_API_KEY || "";
const SERPER_URL     = "https://google.serper.dev/search";

// ── Domains to Skip Entirely ──────────────────────────────────────────────────
// Aggregator/booking platforms that show THEIR OWN email, not the business email.
// Everything else (including social media) is attempted — Instagram/Facebook
// business pages sometimes DO show contact emails.
const SKIP_DOMAINS = [
  // ── Platforms that block scrapers (ECONNRESET/403 every time) ─────────────
  // Instagram, Facebook etc. block all non-browser requests instantly.
  // Crawling them wastes ~6s per business with zero chance of finding an email.
  "instagram.com", "facebook.com", "fb.com",
  "twitter.com", "x.com",
  "tiktok.com", "snapchat.com", "pinterest.com",
  // YouTube, LinkedIn — no business email in page HTML
  "youtube.com", "linkedin.com",
  // WhatsApp / Telegram links — not websites
  "whatsapp.com", "wa.me", "t.me", "telegram.me",

  // ── Google/Maps ───────────────────────────────────────────────────────────
  "google.com", "maps.google.com", "goo.gl",

  // ── Indian aggregators — show platform email, not business email ──────────
  "justdial.com", "sulekha.com", "indiamart.com",
  "tradeindia.com", "yellowpages.in",
  "zomato.com", "swiggy.com", "magicpin.in",

  // ── Global aggregators / review sites ────────────────────────────────────
  "yelp.com", "tripadvisor.com",
  "booking.com", "makemytrip.com", "goibibo.com", "agoda.com",

  // ── Healthcare aggregators ────────────────────────────────────────────────
  "practo.com", "1mg.com", "netmeds.com", "apollo247.com",

  // ── E-commerce platforms ──────────────────────────────────────────────────
  "amazon.in", "amazon.com", "flipkart.com", "myntra.com",
  "meesho.com", "snapdeal.com",

  // ── Booking/salon platforms ───────────────────────────────────────────────
  "vagaro.com", "fresha.com", "mindbodyonline.com",
  "styleseat.com", "schedulicity.com",
];


function shouldSkipUrl(url) {
  if (!url) return true;
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return SKIP_DOMAINS.some(
      (domain) => host === domain || host.endsWith("." + domain)
    );
  } catch {
    return false;
  }
}

// ── Agents & Headers ──────────────────────────────────────────────────────────

const HTTPS_AGENT = new https.Agent({ rejectUnauthorized: false });
const HTTP_AGENT  = new http.Agent({ keepAlive: false });

// Rotate between two User-Agents to reduce bot detection
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
];

function getBrowserHeaders(index = 0) {
  return {
    "User-Agent": USER_AGENTS[index % USER_AGENTS.length],
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Cache-Control": "no-cache",
  };
}

// ── Page Paths to Try (Phase 1) ───────────────────────────────────────────────
// These cover 95%+ of where emails appear on small business sites.
// All tried simultaneously — adding more paths doesn't slow us down.

const CONTACT_PATHS = [
  // Contact page variations
  "/contact",
  "/contact-us",
  "/contact_us",
  "/contactus",
  "/contacts",
  "/contact.html",
  "/contact.php",
  "/contactus.php",
  "/contactus.html",

  // About page variations
  "/about",
  "/about-us",
  "/about_us",
  "/aboutus",
  "/about.html",
  "/about.php",
  "/about-us.html",
  "/our-story",
  "/who-we-are",

  // Indian-specific inquiry/reach pages
  "/reach-us",
  "/reach_us",
  "/enquiry",
  "/enquire",
  "/inquiry",
  "/enquiry.php",
  "/enquiry.html",

  // Get in touch
  "/get-in-touch",
  "/getintouch",
  "/touch",

  // Write/mail
  "/write-to-us",
  "/mail-us",
  "/email-us",

  // Team / staff (often has email addresses)
  "/team",
  "/our-team",
  "/meet-the-team",
  "/staff",
  "/management",

  // Other likely pages
  "/info",
  "/find-us",
  "/location",
  "/locations",
  "/support",
  "/help",
  "/feedback",
  "/connect",
  "/connect-with-us",

  // Homepage / root
  "",
  "/home",
  "/index.html",
  "/index.php",
];

// Keywords that indicate a link leads to a contact/about page (Phase 2)
const CONTACT_LINK_KEYWORDS = [
  "contact", "about", "reach", "enquir", "inquir",
  "touch", "write", "mail", "email", "team", "staff",
  "info", "support", "help", "find", "location", "connect",
  "feedback", "management", "address",
];

// ── Email Validation & Detection ──────────────────────────────────────────────

// Standard email regex
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;



const JUNK_PATTERNS = [
  /^noreply@/i, /^no-reply@/i, /^donotreply@/i, /^do-not-reply@/i,
  /sentry/i, /example\.(com|org|net)/i,
  /wixpress\.com/i, /squarespace\.com/i, /wordpress\.(com|org)/i,
  /amazonaws\.com/i, /cloudflare\.com/i,
  /^mailer@/i, /^postmaster@/i, /^bounce@/i,
  /^abuse@/i, /^spam@/i,
  /schema\.org/i, /googleapis\.com/i, /gstatic\.com/i,
  /w3\.org/i, /openstreetmap\.org/i,
  /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|ttf)$/i,
];

function isJunkEmail(email) {
  if (!email || typeof email !== "string") return true;
  const e = email.trim().toLowerCase();
  if (e.length < 6 || e.length > 80) return true;
  const parts = e.split("@");
  if (parts.length !== 2) return true;
  if (!parts[1].includes(".")) return true;
  if (/^\d+$/.test(parts[0])) return true;
  if (parts[0].length < 1 || parts[1].length < 4) return true;
  for (const p of JUNK_PATTERNS) if (p.test(e)) return true;
  return false;
}

/**
 * De-obfuscate email-like patterns in text.
 * Converts:  info [at] shop [dot] com  →  info@shop.com
 */
function deobfuscate(text) {
  if (!text || typeof text !== "string") return text;
  return text
    // [at] / (at) / {at} → @
    .replace(/\[\s*at\s*\]/gi, "@")
    .replace(/\(\s*at\s*\)/gi, "@")
    .replace(/\{\s*at\s*\}/gi, "@")
    // standalone " at " surrounded by word chars → @
    .replace(/(?<=[a-zA-Z0-9._%+\-])\s+at\s+(?=[a-zA-Z0-9.\-])/gi, "@")
    // [dot] / (dot) / {dot} → .
    .replace(/\[\s*dot\s*\]/gi, ".")
    .replace(/\(\s*dot\s*\)/gi, ".")
    .replace(/\{\s*dot\s*\}/gi, ".")
    // standalone " dot " surrounded by word chars → .
    .replace(/(?<=[a-zA-Z0-9])\s+dot\s+(?=[a-zA-Z])/gi, ".")
    // "_at_" → @  and  "_dot_" → .
    .replace(/_at_/gi, "@")
    .replace(/_dot_/gi, ".");
}

// ── URL Helpers ───────────────────────────────────────────────────────────────

function normalizeUrl(url) {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  return t.startsWith("http") ? t : "https://" + t;
}

function getBase(url) {
  try {
    const p = new URL(url);
    return `${p.protocol}//${p.host}`;
  } catch {
    return url.replace(/\/+$/, "");
  }
}

// ── Single Page Fetcher ───────────────────────────────────────────────────────

/**
 * Fetches one page and extracts emails carefully.
 *
 * Improvements over naive approach:
 *  - 12s timeout (Indian servers are slow)
 *  - HTTP fallback if HTTPS fails
 *  - Deobfuscates  info[at]shop[dot]com  style emails
 *  - Scans mailto links, meta tags, JSON-LD, data-* attrs, raw HTML, visible text
 *  - Follows up to 6 redirects
 *
 * Returns { emails: [...], html: "..." } or null (unreachable)
 */
async function fetchPage(pageUrl, timeoutMs = 6000, headersIndex = 0) {
  // Try the URL as-is, then fall back to HTTP if HTTPS failed
  const urlsToTry = [pageUrl];
  if (pageUrl.startsWith("https://")) {
    urlsToTry.push(pageUrl.replace("https://", "http://"));
  }

  for (const url of urlsToTry) {
    try {
      const isHttps = url.startsWith("https");
      const response = await axios.get(url, {
        timeout: timeoutMs,
        headers: getBrowserHeaders(headersIndex),
        httpsAgent: isHttps ? HTTPS_AGENT : undefined,
        httpAgent:  !isHttps ? HTTP_AGENT : undefined,
        maxRedirects: 6,
        decompress: true,
        validateStatus: (s) => s < 500,
      });

      const ct = (response.headers["content-type"] || "").toLowerCase();
      if (ct && !ct.includes("html") && !ct.includes("text")) {
        return { emails: [], html: "" };
      }

      const html = String(response.data || "");
      if (html.length < 50) return { emails: [], html: "" };

      const $ = cheerio.load(html);
      const found = new Set();

      // ── Layer 1: mailto: links (most reliable) ──────────────────────────
      $("a[href]").each((_, el) => {
        const href = ($(el).attr("href") || "").trim();
        if (href.toLowerCase().startsWith("mailto:")) {
          const email = href.replace(/^mailto:/i, "").split("?")[0].trim().toLowerCase();
          if (!isJunkEmail(email)) found.add(email);
        }
      });
      if (found.size > 0) return { emails: Array.from(found), html };

      // ── Layer 2: <meta> tags (some sites put email in meta) ─────────────
      $("meta").each((_, el) => {
        const content = ($(el).attr("content") || "").trim();
        const matches = content.match(EMAIL_REGEX) || [];
        for (const e of matches) {
          if (!isJunkEmail(e.toLowerCase())) found.add(e.toLowerCase());
        }
      });
      if (found.size > 0) return { emails: Array.from(found), html };

      // ── Layer 3: JSON-LD structured data ────────────────────────────────
      $("script[type='application/ld+json']").each((_, el) => {
        const scriptText = $(el).html() || "";
        const matches = scriptText.match(EMAIL_REGEX) || [];
        for (const e of matches) {
          if (!isJunkEmail(e.toLowerCase())) found.add(e.toLowerCase());
        }
      });
      if (found.size > 0) return { emails: Array.from(found), html };

      // ── Layer 4: data-* attributes (some builders store email here) ─────
      $("[data-email], [data-mail], [data-contact-email]").each((_, el) => {
        ["data-email", "data-mail", "data-contact-email"].forEach((attr) => {
          const val = ($(el).attr(attr) || "").trim().toLowerCase();
          if (val && !isJunkEmail(val)) found.add(val);
        });
      });
      if (found.size > 0) return { emails: Array.from(found), html };

      // ── Layer 5: Raw HTML regex (catches inline JS, JSON, comments) ─────
      const rawMatches = html.match(EMAIL_REGEX) || [];
      for (const e of rawMatches) {
        const lower = e.toLowerCase().trim();
        if (!isJunkEmail(lower)) found.add(lower);
      }
      if (found.size > 0) return { emails: Array.from(found), html };

      // ── Layer 6: Visible body text (plain text emails) ──────────────────
      const bodyText = $("body").text() || "";
      const textMatches = bodyText.match(EMAIL_REGEX) || [];
      for (const e of textMatches) {
        const lower = e.toLowerCase().trim();
        if (!isJunkEmail(lower)) found.add(lower);
      }
      if (found.size > 0) return { emails: Array.from(found), html };

      // ── Layer 7: Deobfuscated text  info[at]shop[dot]com ────────────────
      const deobfuscated = deobfuscate(bodyText);
      const deobMatches = deobfuscated.match(EMAIL_REGEX) || [];
      for (const e of deobMatches) {
        const lower = e.toLowerCase().trim();
        if (!isJunkEmail(lower)) found.add(lower);
      }
      // Also deobfuscate the raw HTML
      const deobHtml = deobfuscate(html);
      const deobHtmlMatches = deobHtml.match(EMAIL_REGEX) || [];
      for (const e of deobHtmlMatches) {
        const lower = e.toLowerCase().trim();
        if (!isJunkEmail(lower)) found.add(lower);
      }

      return { emails: Array.from(found), html };

    } catch (err) {
      const code = err.code || err.response?.status || "ERR";
      // Only log HTTPS attempt (HTTP fallback logged separately if needed)
      if (url === urlsToTry[0]) {
        console.log(`  [crawl] ${url.replace(/^https?:\/\//, "").slice(0, 55)} → ${code}`);
      }
      // If HTTPS failed and we have HTTP fallback, continue to next iteration
      if (url !== urlsToTry[urlsToTry.length - 1]) continue;
      return null;
    }
  }
  return null;
}

// ── Phase 2: Smart Link Discovery ─────────────────────────────────────────────

/**
 * Reads the homepage HTML and finds internal links that likely lead to
 * contact or about pages — by matching link text or href against keywords.
 *
 * @param {string} baseUrl   — e.g. "https://www.example.com"
 * @param {string} homepageHtml — HTML already fetched (saves one request)
 * @returns {string[]}       — array of absolute URLs to crawl next
 */
function discoverContactLinks(baseUrl, homepageHtml) {
  if (!homepageHtml) return [];

  try {
    const $ = cheerio.load(homepageHtml);
    const discovered = new Set();
    const baseHost = new URL(baseUrl).hostname;

    $("a[href]").each((_, el) => {
      const href = ($(el).attr("href") || "").trim();
      if (!href) return;
      // Skip anchors, mailto, tel, javascript, external social links
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        href.includes("facebook.com") ||
        href.includes("instagram.com") ||
        href.includes("twitter.com") ||
        href.includes("youtube.com") ||
        href.includes("linkedin.com") ||
        href.includes("whatsapp.com")
      ) return;

      const linkText = $(el).text().toLowerCase().trim();
      const hrefLower = href.toLowerCase();

      // Check if link text OR href contains any contact-related keyword
      const isRelevant = CONTACT_LINK_KEYWORDS.some(
        (kw) => linkText.includes(kw) || hrefLower.includes(kw)
      );
      if (!isRelevant) return;

      // Resolve relative URLs
      try {
        const absoluteUrl = new URL(href, baseUrl + "/").href;
        const resolvedHost = new URL(absoluteUrl).hostname;

        // Only follow same-domain links
        if (
          resolvedHost === baseHost ||
          resolvedHost.endsWith("." + baseHost) ||
          baseHost.endsWith("." + resolvedHost)
        ) {
          // Remove query strings and fragments for deduplication
          const cleanUrl = absoluteUrl.split("?")[0].split("#")[0];
          discovered.add(cleanUrl);
        }
      } catch (_) {}
    });

    const links = [...discovered];
    console.log(`  [discover] Found ${links.length} contact-like links in homepage`);
    return links.slice(0, 15); // Max 15 discovered links to avoid runaway crawling
  } catch {
    return [];
  }
}

// ── Parallel Email Race ───────────────────────────────────────────────────────

/**
 * Crawls multiple pages in parallel and resolves with the first email found.
 * Returns null if no email is found across all pages (or timeout).
 *
 * @param {string[]} pages       — list of absolute URLs to crawl
 * @param {number}   timeoutMs  — hard timeout in milliseconds
 * @returns {Promise<{email: string|null, homepageHtml: string|null}>}
 */
function racePages(pages, timeoutMs = 10000) {
  return new Promise((resolve) => {
    if (pages.length === 0) { resolve({ email: null, homepageHtml: null }); return; }

    let settled = false;
    let done = 0;
    const total = pages.length;
    let capturedHomepageHtml = null;

    pages.forEach((pageUrl) => {
      fetchPage(pageUrl).then((result) => {
        done++;

        // Capture homepage HTML for Phase 2 link discovery
        if (result?.html && (pageUrl.endsWith("/") || pageUrl.match(/https?:\/\/[^/]+\/?$/))) {
          capturedHomepageHtml = result.html;
        }

        if (!settled && result?.emails?.length > 0) {
          settled = true;
          console.log(`  ✅ Found: ${result.emails[0]} on ${pageUrl}`);
          resolve({ email: result.emails[0], homepageHtml: capturedHomepageHtml });
        } else if (done >= total && !settled) {
          resolve({ email: null, homepageHtml: capturedHomepageHtml });
        }
      }).catch(() => {
        done++;
        if (done >= total && !settled) {
          resolve({ email: null, homepageHtml: capturedHomepageHtml });
        }
      });
    });

    setTimeout(() => {
      if (!settled) { settled = true; resolve({ email: null, homepageHtml: capturedHomepageHtml }); }
    }, timeoutMs);
  });
}

// ── Step 2: WHOIS Domain Lookup ──────────────────────────────────────────────

/**
 * Looks up the domain registration record via WHOIS and extracts the
 * Registrant Email. Small Indian businesses often skip WHOIS privacy
 * protection, so the owner's real email appears in the record.
 *
 * @param {string} domain  — e.g. "example.in" or "shop.co.in"
 * @returns {Promise<string|null>}
 */
async function lookupWhoisEmail(domain) {
  try {
    // Strip www. and any paths
    const cleanDomain = domain.replace(/^www\./, "").split("/")[0];

    const raw = await Promise.race([
      whoisLookup(cleanDomain),
      new Promise((_, reject) => setTimeout(() => reject(new Error("WHOIS timeout")), 5000)),
    ]);

    if (!raw || typeof raw !== "string") return null;

    // Extract all emails from WHOIS text
    const matches = raw.match(EMAIL_REGEX) || [];
    for (const email of matches) {
      const lower = email.toLowerCase().trim();
      // Skip privacy-protection proxy emails
      if (
        !isJunkEmail(lower) &&
        !lower.includes("privacy") &&
        !lower.includes("whoisguard") &&
        !lower.includes("protect") &&
        !lower.includes("redacted") &&
        !lower.includes("gdpr") &&
        !lower.includes("abuse")
      ) {
        console.log(`  ✅ [WHOIS] Found: ${lower}`);
        return lower;
      }
    }
    return null;
  } catch (err) {
    console.log(`  [WHOIS] ${err.message}`);
    return null;
  }
}

// ── Step 3: Web Search via Serper.dev ────────────────────────────────────────

/**
 * Searches Google for the business email using Serper.dev API.
 * Scans titles, snippets, and sitelinks from top 10 search results.
 *
 * This finds emails from:
 *  - JustDial, IndiaMart, Sulekha, TradeIndia listings
 *  - Local news articles mentioning the business
 *  - Old directory pages Google has indexed
 *  - Facebook/Instagram posts in Google's index
 *  - The business's own cached pages
 *
 * @param {string} businessName
 * @param {string} businessCity  — e.g. "Bhopal"
 * @param {string} domain        — e.g. "example.in" (optional fallback query)
 * @returns {Promise<string|null>}
 */
async function searchWebForEmail(businessName, businessCity, domain, customSerperKey) {
  const apiKey = customSerperKey && customSerperKey.trim().length > 10 ? customSerperKey.trim() : SERPER_API_KEY;
  if (!apiKey) return null;

  // Build targeted search queries
  const name = (businessName || "").trim();
  const city = (businessCity || "").trim();

  const queries = [];
  if (name && city) queries.push(`"${name}" "${city}" email`);
  if (name)         queries.push(`"${name}" email contact`);
  if (domain)       queries.push(`site:${domain} email`);

  for (const q of queries) {
    try {
      const response = await axios.post(
        SERPER_URL,
        { q, gl: "in", hl: "en", num: 10 },
        {
          headers: {
            "X-API-KEY":    apiKey,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );

      const data = response.data || {};

      // Collect all text snippets to scan
      const textParts = [];

      // Organic results — title + snippet
      for (const item of data.organic || []) {
        if (item.title)   textParts.push(item.title);
        if (item.snippet) textParts.push(item.snippet);
        if (item.link)    textParts.push(item.link);
        // Sitelinks
        for (const sl of item.sitelinks || []) {
          if (sl.snippet) textParts.push(sl.snippet);
          if (sl.title)   textParts.push(sl.title);
        }
      }

      // Knowledge graph (sometimes has email)
      if (data.knowledgeGraph) {
        const kg = data.knowledgeGraph;
        if (kg.description) textParts.push(kg.description);
        if (kg.website)     textParts.push(kg.website);
        // KG attributes
        for (const attr of kg.attributes ? Object.values(kg.attributes) : []) {
          textParts.push(String(attr));
        }
      }

      // Answer box
      if (data.answerBox?.snippet) textParts.push(data.answerBox.snippet);

      // Scan all collected text for emails
      const fullText = textParts.join(" ");
      const matches  = fullText.match(EMAIL_REGEX) || [];

      for (const email of matches) {
        const lower = email.toLowerCase().trim();
        if (!isJunkEmail(lower)) {
          console.log(`  ✅ [WebSearch] Found: ${lower}  (query: "${q}")`);
          return lower;
        }
      }
    } catch (err) {
      console.log(`  [WebSearch] Error for query "${q}": ${err.message}`);
    }
  }

  return null;
}

// ── Step 4: Puppeteer Headless Browser Fallback ──────────────────────────────────
/**
 * Opens a real headless browser, waits for JS to render,
 * then scans the fully-rendered page HTML and text content.
 *
 * @param {string} url
 * @param {number} timeoutMs
 * @returns {Promise<string|null>}
 */
async function scrapeWithPuppeteer(url, timeoutMs = 12000) {
  let browser = null;
  try {
    console.log(`  Step 4: Launching headless browser to scrape ${url}...`);
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENTS[0]);
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
    });

    // Set page viewport and custom timeout
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to URL
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: timeoutMs,
    });

    // Give the page a brief moment (1.5s) to execute any pending JS/AJAX
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const html = await page.content();
    const bodyText = await page.evaluate(() => document.body?.innerText || "");

    const found = new Set();

    // 1. Scan mailto: links in the DOM
    const mailtos = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a[href^='mailto:']"));
      return links.map((a) => a.getAttribute("href"));
    });
    for (const href of mailtos) {
      if (href) {
        const email = href.replace(/^mailto:/i, "").split("?")[0].trim().toLowerCase();
        if (!isJunkEmail(email)) found.add(email);
      }
    }

    // 2. Scan rendered HTML with regex
    const htmlMatches = html.match(EMAIL_REGEX) || [];
    for (const e of htmlMatches) {
      const lower = e.toLowerCase().trim();
      if (!isJunkEmail(lower)) found.add(lower);
    }

    // 3. Scan visible body text with regex
    const textMatches = bodyText.match(EMAIL_REGEX) || [];
    for (const e of textMatches) {
      const lower = e.toLowerCase().trim();
      if (!isJunkEmail(lower)) found.add(lower);
    }

    // 4. De-obfuscate body text and scan
    const deobBody = deobfuscate(bodyText);
    const deobMatches = deobBody.match(EMAIL_REGEX) || [];
    for (const e of deobMatches) {
      const lower = e.toLowerCase().trim();
      if (!isJunkEmail(lower)) found.add(lower);
    }

    const emails = Array.from(found);
    if (emails.length > 0) {
      console.log(`  ✅ [Puppeteer] Found: ${emails[0]}`);
      return emails[0];
    }
    return null;
  } catch (err) {
    console.log(`  [Puppeteer] Error crawling ${url.replace(/^https?:\/\//, "").slice(0, 50)}: ${err.message}`);
    return null;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
    }
  }
}

// ── Main: Extract Email (4-Step Waterfall) ────────────────────────────────────

/**
 * Waterfall email extraction for one business.
 *
 * Step 1 — Website scraper   (Cheerio, 50 paths, 7 layers)
 * Step 2 — WHOIS lookup      (domain registration record)
 * Step 3 — Web search        (Serper.dev Google Search API)
 * Step 4 — Puppeteer         (headless browser for JS rendering)
 *
 * Returns as soon as any step finds an email.
 *
 * @param {string|null} websiteUrl
 * @param {string}      businessName  — used for web search query
 * @param {string}      businessCity  — used for web search query
 * @returns {Promise<string|null>}
 */
async function extractEmail(websiteUrl, businessName = "", businessCity = "", customSerperKey = null) {
  const normalized = normalizeUrl(websiteUrl);
  const hasWebsite = !!normalized && !shouldSkipUrl(normalized);

  const domain = hasWebsite
    ? new URL(normalized).hostname.replace(/^www\./, "")
    : null;

  // ── Step 1: Website Scraper ───────────────────────────────────────────────
  if (hasWebsite) {
    const base = getBase(normalized);
    console.log(`\n[extractEmail] ${base}  name="${businessName}"  city="${businessCity}"`);

    const phase1Pages = CONTACT_PATHS.map((path) => base + path);
    if (normalized !== base && normalized !== base + "/" && !phase1Pages.includes(normalized)) {
      phase1Pages.push(normalized);
    }
    const uniquePhase1 = [...new Set(phase1Pages)];
    console.log(`  Step 1: Scraping ${uniquePhase1.length} paths...`);

    const { email: scraperEmail, homepageHtml } = await racePages(uniquePhase1, 10000);
    if (scraperEmail) return scraperEmail;

    // Phase 1b: Smart link discovery
    const discoveredLinks = discoverContactLinks(base, homepageHtml);
    if (discoveredLinks.length > 0) {
      const { email: discoveredEmail } = await racePages(discoveredLinks, 8000);
      if (discoveredEmail) return discoveredEmail;
    }
    console.log(`  Step 1: No email found via scraper`);
  } else {
    console.log(`\n[extractEmail] No scrapable website  name="${businessName}"  city="${businessCity}"`);
  }

  // ── Step 2: WHOIS Lookup ──────────────────────────────────────────────────
  if (domain) {
    console.log(`  Step 2: WHOIS lookup for ${domain}...`);
    const whoisEmail = await lookupWhoisEmail(domain);
    if (whoisEmail) return whoisEmail;
    console.log(`  Step 2: No email in WHOIS record`);
  }

  // ── Step 3: Web Search via Serper.dev ────────────────────────────────────────
  console.log(`  Step 3: Querying Serper.dev for mentions...`);
  const webEmail = await searchWebForEmail(businessName, businessCity, domain, customSerperKey);
  if (webEmail) return webEmail;
  console.log(`  Step 3: No email found via web search`);

  // ── Step 4: Puppeteer JS Fallback ─────────────────────────────────────────
  if (hasWebsite) {
    console.log(`  Step 4: Puppeteer headless browser fallback...`);
    const puppeteerEmail = await scrapeWithPuppeteer(normalized);
    if (puppeteerEmail) return puppeteerEmail;
    console.log(`  Step 4: No email found via Puppeteer`);
  }

  console.log(`  ❌ Email not found: "${businessName}"`);
  return null;
}

// ── Parallel Batch ────────────────────────────────────────────────────────────

/**
 * Extracts emails for multiple businesses using Promise.allSettled.
 * One failure never stops the others.
 *
 * @param {Array<{placeId: string, websiteUri?: string}>} businesses
 * @param {Function} [onProgress]
 */
async function extractEmailsParallel(businesses, onProgress) {
  const total = businesses.length;
  let completed = 0;

  const promises = businesses.map(async (biz) => {
    const email = await extractEmail(biz.websiteUri, biz.name || "", biz.searchLocation || "");
    completed++;
    if (typeof onProgress === "function") {
      try { onProgress(completed, total, biz.placeId, email); } catch (_) {}
    }
    return { placeId: biz.placeId, email };
  });

  const settled = await Promise.allSettled(promises);
  return settled.map((r, i) =>
    r.status === "fulfilled" ? r.value : { placeId: businesses[i].placeId, email: null }
  );
}

module.exports = { extractEmail, extractEmailsParallel };
