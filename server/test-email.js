/**
 * test-email.js — Run this directly to debug email extraction
 * Usage: node test-email.js https://yourwebsite.com
 */

const axios = require("axios");
const cheerio = require("cheerio");
const https = require("https");

const HTTPS_AGENT = new https.Agent({ rejectUnauthorized: false });

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  Connection: "keep-alive",
};

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

async function testUrl(url) {
  console.log(`\n🔍 Testing: ${url}`);
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: BROWSER_HEADERS,
      httpsAgent: HTTPS_AGENT,
      maxRedirects: 5,
      validateStatus: () => true,
    });
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers["content-type"]}`);
    const html = String(response.data || "");
    console.log(`   HTML length: ${html.length} chars`);

    // Check cheerio
    const $ = cheerio.load(html);
    const bodyText = $("body").text();
    console.log(`   Body text length: ${bodyText.length}`);

    // Find mailto links
    const mailtoLinks = [];
    $("a").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (href.toLowerCase().includes("mailto:")) mailtoLinks.push(href);
    });
    console.log(`   Mailto links found: ${mailtoLinks.length}`, mailtoLinks);

    // Find emails via regex in raw HTML
    const htmlMatches = html.match(EMAIL_REGEX) || [];
    console.log(`   Emails in raw HTML: ${htmlMatches.length}`, htmlMatches.slice(0, 5));

    // Find emails in body text
    const textMatches = bodyText.match(EMAIL_REGEX) || [];
    console.log(`   Emails in body text: ${textMatches.length}`, textMatches.slice(0, 5));

  } catch (err) {
    console.log(`   ❌ ERROR: ${err.message} (code: ${err.code})`);
  }
}

async function main() {
  const testUrl1 = process.argv[2] || "https://www.justdial.com";

  // Also test a known email-containing page
  await testUrl(testUrl1);
  
  // Test sub-pages
  try {
    const base = new URL(testUrl1.startsWith("http") ? testUrl1 : "https://" + testUrl1);
    const baseUrl = `${base.protocol}//${base.host}`;
    for (const path of ["/contact", "/contact-us", "/about"]) {
      await testUrl(baseUrl + path);
    }
  } catch (e) {
    console.log("Couldn't parse URL for sub-pages:", e.message);
  }
}

main();
