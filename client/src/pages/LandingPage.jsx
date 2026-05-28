import { useState, useEffect } from "react";

const MOCK_RESULTS = [
  { name: "Saffron Spice Restaurant", site: "saffronspice.in", email: "info@saffronspice.in", score: 85, label: "hot" },
  { name: "Elite Wellness Clinic", site: "elitewellness.co.in", email: "contact@elitewellness.co.in", score: 75, label: "hot" },
  { name: "Mumbai Royal Dental Care", site: "mumbairoyaldental.com", email: "dr.sharma@mumbairoyaldental.com", score: 65, label: "hot" },
  { name: "Bhopal Book Depot", site: null, email: "bhopalbookdepot@gmail.com", score: 90, label: "hot" },
  { name: "Capital Fitness Hub", site: "capitalfitness.in", email: "support@capitalfitness.in", score: 55, label: "warm" },
];

export default function LandingPage({ onLaunch }) {
  const [activeFaq, setActiveFaq] = useState(null);
  
  // Mock Search Preview States
  const [mockInput, setMockInput] = useState("");
  const [isMockSearching, setIsMockSearching] = useState(false);
  const [visibleMockResults, setVisibleMockResults] = useState([]);
  const [mockSearchStep, setMockSearchStep] = useState(0); // 0: Idle, 1: Typing, 2: Searching, 3: Completed

  // Interactive ROI Calculator State
  const [roiLeads, setRoiLeads] = useState(1200);

  // Interactive Scoring Simulator States
  const [scoreFactors, setScoreFactors] = useState({
    noWebsite: true,
    lowRating: true,
    fewReviews: false,
    fewPhotos: true,
    noPhone: false,
    noHours: false
  });

  // Calculate simulated score dynamically
  const calculatedScore = (scoreFactors.noWebsite ? 25 : 0) +
                           (scoreFactors.lowRating ? 20 : 0) +
                           (scoreFactors.fewReviews ? 20 : 0) +
                           (scoreFactors.fewPhotos ? 15 : 0) +
                           (scoreFactors.noPhone ? 10 : 0) +
                           (scoreFactors.noHours ? 10 : 0);

  let leadLabel = "❄️ Cold Lead";
  let labelClass = "cold";
  if (calculatedScore >= 60) {
    leadLabel = "🔥 Hot Lead";
    labelClass = "hot";
  } else if (calculatedScore >= 35) {
    leadLabel = "⚡ Warm Lead";
    labelClass = "warm";
  }

  // Pitch copy clipboard state
  const [isCopied, setIsCopied] = useState(false);

  // Automatic mock searching simulation on load
  useEffect(() => {
    let typingInterval;
    let t1, t2;
    let t3Timers = [];
    
    function runSimulation() {
      // Clear all active timers to prevent overlapping runs
      clearInterval(typingInterval);
      clearTimeout(t1);
      clearTimeout(t2);
      t3Timers.forEach(clearTimeout);
      t3Timers = [];
      
      setMockInput("");
      setVisibleMockResults([]);
      setMockSearchStep(1);
      
      const query = "Restaurants in Mumbai";
      let charIdx = 0;
      
      typingInterval = setInterval(() => {
        if (charIdx < query.length) {
          const nextChar = query[charIdx];
          if (nextChar !== undefined) {
            setMockInput((prev) => prev + nextChar);
          }
          charIdx++;
        } else {
          clearInterval(typingInterval);
          
          // Step 2: Trigger search
          t1 = setTimeout(() => {
            setMockSearchStep(2);
            setIsMockSearching(true);
            
            // Step 3: Populate results live
            t2 = setTimeout(() => {
              setIsMockSearching(false);
              setMockSearchStep(3);
              
              MOCK_RESULTS.forEach((res, index) => {
                const timer = setTimeout(() => {
                  setVisibleMockResults((prev) => [...prev, res]);
                }, index * 350);
                t3Timers.push(timer);
              });
            }, 1200);
            
          }, 400);
        }
      }, 50);
    }
    
    runSimulation();
    
    // Loop the simulation every 10 seconds to keep the landing page alive and dynamic
    const loopInterval = setInterval(runSimulation, 10000);
    
    return () => {
      clearInterval(typingInterval);
      clearInterval(loopInterval);
      clearTimeout(t1);
      clearTimeout(t2);
      t3Timers.forEach(clearTimeout);
    };
  }, []);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleCopyPitch = () => {
    const text = `Subject: Quick question about Saffron Spice Restaurant's online presence...

Hi Team,

I noticed you have over 50 great reviews on Google Maps but don't have a website listed under your profile.

In today's market, 72% of customers search for a local menu/booking page before visiting. By adding a sleek, fast-loading website and booking funnel, we could help you capture another 15-20 clients per week.

Let me know if you'd be open to a quick 5-minute call to see a mock design I drew for your brand!`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="landing-container animate-fade-in">
      {/* ── Background Blobs ────────────────────────────────────────────────── */}
      <div className="auth-blob blob-1" />
      <div className="auth-blob blob-2" />
      <div className="auth-blob blob-3" />

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <span>🎯</span>
          <h2>Lead Finder <span>PRO</span></h2>
        </div>
        <button id="landing-nav-launch-btn" className="landing-nav-btn" onClick={onLaunch}>
          Launch App →
        </button>
      </nav>

      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      <header className="landing-hero">
        <div className="landing-hero-badge">
          <span>🇮🇳</span> High-Converting Leads for Indian Marketing Agencies
        </div>
        <h1>
          Find High-Ticket Web Design <br />
          &amp; SEO Clients <span>on Autopilot</span>
        </h1>
        <p className="hero-subtitle">
          Instantly scan any city, discover local businesses with a weak online presence, 
          and extract verified owner emails through our premium 4-step waterfall pipeline.
        </p>
        
        <button id="landing-hero-cta-btn" className="landing-cta-btn" onClick={onLaunch}>
          🎯 Get Started for Free
        </button>

        <div className="landing-hero-stats">
          <div className="landing-hero-stat">
            <span className="stat-num">500+</span>
            <span className="stat-label">Max Leads/Search</span>
          </div>
          <div className="landing-hero-stat">
            <span className="stat-num">~60%</span>
            <span className="stat-label">Email Find Rate</span>
          </div>
          <div className="landing-hero-stat">
            <span className="stat-num">100%</span>
            <span className="stat-label">Secure OTP Login</span>
          </div>
        </div>
      </header>

      {/* ── Interactive Live Preview Section ──────────────────────────────── */}
      <section className="landing-preview-section">
        <h2 className="section-title">See the Dashboard in Action</h2>
        <p className="section-desc">
          Watch our AI scanner search, analyze, score, and extract contact details in real time.
        </p>
        
        <div className="landing-live-preview">
          <div className="landing-mock-console">
            {/* Mock Header */}
            <div className="landing-mock-header">
              <div className="mock-dots">
                <span></span><span></span><span></span>
              </div>
              <div className="mock-address-bar">https://app.leadfinder.pro/search</div>
              <div style={{ width: 40 }} />
            </div>

            {/* Mock Search Bar */}
            <div className="landing-mock-search">
              <div className="mock-input">
                🔍 {mockInput || <span style={{ color: "#334155" }}>Restaurants in Mumbai</span>}
                {mockSearchStep === 1 && <span className="typing-cursor">|</span>}
              </div>
              <button className="mock-search-btn" disabled>
                {isMockSearching ? "Scanning..." : "Search"}
              </button>
            </div>

            {/* Mock Results Board */}
            <div className="landing-mock-results">
              {isMockSearching && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", gap: 10 }}>
                  <span className="auth-spinner" />
                  <p style={{ fontSize: 13, color: "#818cf8" }}>Querying Google Places &amp; breaking city into search grids...</p>
                </div>
              )}
              
              {!isMockSearching && visibleMockResults.length === 0 && mockSearchStep === 1 && (
                <div style={{ display: "flex", justifyContent: "center", padding: "60px 0", color: "#475569", fontSize: 13 }}>
                  Waiting to search...
                </div>
              )}

              {visibleMockResults.map((biz, idx) => (
                <div key={idx} className="mock-result-row">
                  <div className="mock-biz-info">
                    <span className="mock-biz-name">{biz.name}</span>
                    <span className="mock-biz-meta">
                      {biz.site ? (
                        <span style={{ color: "#818cf8" }}>🌐 {biz.site}</span>
                      ) : (
                        <span style={{ color: "#ef4444" }}>⚠️ No Website</span>
                      )}
                      <span>⭐ {biz.site ? "4.2 rating" : "No rating"}</span>
                    </span>
                  </div>
                  
                  <div className="mock-email-status">
                    <span className="mock-email-badge">📧 {biz.email}</span>
                    <span className={`mock-score ${biz.label}`}>
                      {biz.label === "hot" ? "🔥" : "⚡"} {biz.score} Pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── NEW: Interactive Lead Scorer Simulator ────────────────────────── */}
      <section className="landing-waterfall-section" style={{ background: "rgba(99, 102, 241, 0.01)" }}>
        <h2 className="section-title">How Our Lead Scoring Algorithm Works</h2>
        <p className="section-desc">
          We rate every business out of 100 points based on their sales vulnerability. Toggle the checkmarks below to simulate our scoring logic in real time!
        </p>

        <div className="roi-container" style={{ maxWidth: 980 }}>
          {/* Scoring Factors Checklist */}
          <div className="roi-pitch">
            <h3 style={{ fontSize: 20, marginBottom: 20 }}>Select Missing Elements:</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={scoreFactors.noWebsite}
                  onChange={(e) => setScoreFactors(prev => ({ ...prev, noWebsite: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: "#f97316" }}
                />
                🌐 Website is Missing (+25 Pts)
              </label>
              
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={scoreFactors.lowRating}
                  onChange={(e) => setScoreFactors(prev => ({ ...prev, lowRating: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: "#f97316" }}
                />
                ⭐ Google Rating is Low/Empty (+20 Pts)
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={scoreFactors.fewReviews}
                  onChange={(e) => setScoreFactors(prev => ({ ...prev, fewReviews: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: "#f97316" }}
                />
                💬 Less than 5 Google Reviews (+20 Pts)
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={scoreFactors.fewPhotos}
                  onChange={(e) => setScoreFactors(prev => ({ ...prev, fewPhotos: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: "#f97316" }}
                />
                📸 Less than 3 Google Photos (+15 Pts)
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={scoreFactors.noPhone}
                  onChange={(e) => setScoreFactors(prev => ({ ...prev, noPhone: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: "#f97316" }}
                />
                📞 No Phone Number listed (+10 Pts)
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={scoreFactors.noHours}
                  onChange={(e) => setScoreFactors(prev => ({ ...prev, noHours: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: "#f97316" }}
                />
                🕐 No Business Hours listed (+10 Pts)
              </label>
            </div>
          </div>

          {/* Glowing Animated Score Visualizer Card */}
          <div style={{
            background: "rgba(15, 23, 42, 0.8)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            borderRadius: 20,
            padding: 40,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "0 10px 40px rgba(99, 102, 241, 0.1)"
          }}>
            <h4 style={{ textTransform: "uppercase", fontSize: 11, color: "#64748b", letterSpacing: 1.5, marginBottom: 15 }}>
              Live Score Breakdown
            </h4>

            {/* Glowing Ring */}
            <div style={{
              width: 140,
              height: 140,
              borderRadius: "50%",
              border: `6px solid ${calculatedScore >= 60 ? "#f97316" : calculatedScore >= 35 ? "#f59e0b" : "#60a5fa"}`,
              boxShadow: `0 0 25px ${calculatedScore >= 60 ? "rgba(249,115,22,0.25)" : calculatedScore >= 35 ? "rgba(245,158,11,0.2)" : "rgba(96,165,250,0.15)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontWeight: 900,
              color: "white",
              fontFamily: "'Outfit', sans-serif",
              marginBottom: 20,
              transition: "all 0.3s"
            }}>
              {calculatedScore}
            </div>

            <span className={`roi-tag ${labelClass}`} style={{ fontSize: 13, padding: "4px 14px", borderRadius: 6, fontWeight: 700 }}>
              {leadLabel}
            </span>

            <p style={{ fontSize: 12, color: "#64748b", marginTop: 15, lineHeight: 1.4 }}>
              Businesses with higher scores are perfect cold-outreach candidates. They need websites, marketing, and reputation management immediately.
            </p>
          </div>
        </div>
      </section>

      {/* ── Feature Cards (4-Step Waterfall) ─────────────────────────────── */}
      <section className="landing-waterfall-section">
        <h2 className="section-title">The 4-Step Waterfall Pipeline</h2>
        <p className="section-desc">
          Why settle for simple scraping? Our pipeline crawls domain data, searches indexed records, and executes full JS environments to ensure no lead is missed.
        </p>

        <div className="landing-waterfall-grid">
          {/* Step 1 */}
          <div className="landing-waterfall-card">
            <span className="card-step">Step 1</span>
            <h3 className="card-title">Cheerio Scraper</h3>
            <p className="card-desc">
              Checks 50 contact-related page paths in parallel, parsing anchor links, meta tags, raw script tags, and de-obfuscating scrambled email addresses instantly.
            </p>
          </div>

          {/* Step 2 */}
          <div className="landing-waterfall-card">
            <span className="card-step">Step 2</span>
            <h3 className="card-title">WHOIS Lookup</h3>
            <p className="card-desc">
              Queries global WHOIS domain registration servers. Small business owners frequently register domains with their direct personal emails, bypassing privacy gates.
            </p>
          </div>

          {/* Step 3 */}
          <div className="landing-waterfall-card">
            <span className="card-step">Step 3</span>
            <h3 className="card-title">Serper.dev Google Search</h3>
            <p className="card-desc">
              Searches indexed listings (JustDial, IndiaMart, news, social media) to capture emails published on platforms we cannot scrape directly.
            </p>
          </div>

          {/* Step 4 */}
          <div className="landing-waterfall-card">
            <span className="card-step">Step 4</span>
            <h3 className="card-title">Puppeteer Fallback</h3>
            <p className="card-desc">
              Runs a headless browser in the background for modern JavaScript-heavy sites (React, Wix, Squarespace) to capture dynamically loaded contact details.
            </p>
          </div>
        </div>
      </section>

      {/* ── NEW: Interactive Outreach Template Mockup ───────────────────── */}
      <section className="landing-roi-section">
        <h2 className="section-title">Personalized Cold Outreach in Seconds</h2>
        <p className="section-desc">
          Copy our battle-tested, high-converting agency cold email template. Optimized specifically for pitching found leads.
        </p>

        <div className="landing-live-preview" style={{ maxWidth: 850, padding: 0, border: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Mock Client Top */}
          <div style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>To: <strong>info@saffronspice.in</strong> (Saffron Spice Restaurant)</span>
            <button
              onClick={handleCopyPitch}
              style={{
                background: isCopied ? "#10b981" : "rgba(99, 102, 241, 0.15)",
                border: `1px solid ${isCopied ? "#10b981" : "rgba(99, 102, 241, 0.3)"}`,
                color: isCopied ? "white" : "#818cf8",
                fontSize: 11,
                padding: "5px 12px",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 700,
                transition: "all 0.2s"
              }}
            >
              {isCopied ? "✓ Copied!" : "📋 Copy Outreach Email"}
            </button>
          </div>

          {/* Email Text */}
          <div style={{ padding: 24, fontFamily: "monospace", fontSize: 13, color: "#94a3b8", lineHeight: 1.6, background: "#090a12" }}>
            <span style={{ color: "#818cf8" }}>Subject: Quick question about Saffron Spice Restaurant's online presence...</span><br /><br />
            Hi Team, 👋<br /><br />
            I noticed you have over 50 great reviews on Google Maps but don't have a website listed under your profile.<br /><br />
            In today's market, 72% of customers search for a local menu/booking page before visiting. By adding a sleek, fast-loading website and booking funnel, we could help you capture another 15-20 clients per week.<br /><br />
            Let me know if you'd be open to a quick 5-minute call to see a mock design I drew for your brand!
          </div>
        </div>
      </section>

      {/* ── NEW: Interactive ROI Savings Calculator ─────────────────────── */}
      <section className="landing-waterfall-section" style={{ background: "rgba(99,102,241,0.01)" }}>
        <h2 className="section-title">ROI &amp; Time Savings Calculator</h2>
        <p className="section-desc">
          How much time and money does your agency save using Lead Finder PRO? Drag the slider to calculate your savings!
        </p>

        <div className="glass-card p-6" style={{ maxWidth: 650, width: "100%", textAlign: "center" }}>
          <div style={{ marginBottom: 25 }}>
            <label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 10 }}>
              Leads Needed Per Month: <strong>{roiLeads}</strong>
            </label>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={roiLeads}
              onChange={(e) => setRoiLeads(parseInt(e.target.value))}
              style={{ width: "100%", accentColor: "#f97316", cursor: "pointer" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 15 }}>
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: 15 }}>
              <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase" }}>Time Saved</span>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#818cf8", fontFamily: "Outfit", marginTop: 4 }}>
                {Math.round((roiLeads * 5) / 60)} hrs
              </p>
            </div>
            
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: 15 }}>
              <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase" }}>Manual Cost Saved</span>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#f97316", fontFamily: "Outfit", marginTop: 4 }}>
                ₹{(roiLeads * 12).toLocaleString()}
              </p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: 15 }}>
              <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase" }}>Emails Found</span>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#10b981", fontFamily: "Outfit", marginTop: 4 }}>
                ~{Math.round(roiLeads * 0.58)} leads
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROI Comparison Table ───────────────────────────────────────────── */}
      <section className="landing-roi-section">
        <div className="roi-container">
          <div className="roi-pitch">
            <h3>Designed for India's Modern Web Agencies</h3>
            <p>
              Traditional scrapers miss over 70% of local emails because of dynamic Wix/React sites or cheap server blocking. Lead Finder PRO handles all edge cases with a custom grid-search coordination and automatic email waterfall logic.
            </p>
            <div className="roi-highlight">
              💡 <strong>Pro Tip:</strong> Hot leads (no website, low review count) are color-coded in Saffron so your sales team knows exactly where to pitch.
            </div>
          </div>

          <div className="roi-table-card">
            <table className="roi-table">
              <thead>
                <tr>
                  <th>Scanning Channel</th>
                  <th>Standard Scrapers</th>
                  <th>Lead Finder PRO</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Wix / React Websites</td>
                  <td><span className="roi-tag bad">0% (Fails)</span></td>
                  <td><span className="roi-tag good">95% (Puppeteer)</span></td>
                </tr>
                <tr>
                  <td>No Website listed</td>
                  <td><span className="roi-tag bad">0% (Skips)</span></td>
                  <td><span className="roi-tag good">40% (WHOIS/Serper)</span></td>
                </tr>
                <tr>
                  <td>Indian Directory listings</td>
                  <td><span className="roi-tag bad">Blocked</span></td>
                  <td><span className="roi-tag good">✅ (Serper Engine)</span></td>
                </tr>
                <tr>
                  <td>Grid Area Search</td>
                  <td>60 Leads max</td>
                  <td><strong>Up to 500 Leads</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ───────────────────────────────────────────────────── */}
      <section className="landing-faq-section">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <p className="section-desc">Everything you need to know about setting up your agency search dashboard.</p>
        
        <div className="faq-list">
          <div className="faq-item">
            <button className="faq-question" onClick={() => toggleFaq(0)}>
              How does the OTP Signup work? <span>{activeFaq === 0 ? "−" : "+"}</span>
            </button>
            {activeFaq === 0 && (
              <div className="faq-answer">
                Just enter your work email and name. The system generates a 6-digit OTP code and securely routes it to your email using Brevo SMTP. Enter it on the login page to securely log in. No passwords required!
              </div>
            )}
          </div>

          <div className="faq-item">
            <button className="faq-question" onClick={() => toggleFaq(1)}>
              Is my search history saved? <span>{activeFaq === 1 ? "−" : "+"}</span>
            </button>
            {activeFaq === 1 && (
              <div className="faq-answer">
                Yes! Every successful search, along with all extracted business emails, coordinates, and lead scores, is automatically saved under your account profile in Supabase. You can view or reload past searches at any time from your Sidebar History.
              </div>
            )}
          </div>

          <div className="faq-item">
            <button className="faq-question" onClick={() => toggleFaq(2)}>
              Can I export files for Excel? <span>{activeFaq === 2 ? "−" : "+"}</span>
            </button>
            {activeFaq === 2 && (
              <div className="faq-answer">
                Absolutely! We feature a dedicated export system that compiles all your search results into a clean, styled multi-sheet Excel file (.xlsx). It separates your leads automatically into sheets: Hot, Warm, Cold, and All Leads.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA Banner ──────────────────────────────────────────────── */}
      <section className="landing-cta-banner">
        <h2>Ready to Find Your Next High-Ticket Clients?</h2>
        <p>Log in with your email to start scanning businesses in seconds.</p>
        <button id="landing-bottom-cta-btn" className="landing-cta-btn" onClick={onLaunch}>
          🎯 Launch Dashboard Now
        </button>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        © 2026 Lead Finder PRO · Google Places API · Brevo SMTP · Supabase Integration · Designed for Indian Marketing Agencies 🇮🇳
      </footer>
    </div>
  );
}
