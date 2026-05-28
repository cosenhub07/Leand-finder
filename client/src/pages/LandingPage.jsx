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
                {mockSearchStep === 1 && <span className="auth-spinner small" style={{ marginLeft: 6 }} />}
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
