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
        <div className="landing-nav-logo flex items-center gap-2">
          <object data="/icon.svg" type="image/svg+xml" aria-label="Lead Finder Icon" className="w-8 h-8 pointer-events-none"></object>
          <h2>Lead Finder <span>PRO</span></h2>
        </div>
        <button id="landing-nav-launch-btn" className="landing-nav-btn" onClick={() => onLaunch('signin')}>
          Login
        </button>
      </nav>

      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      <header className="landing-hero relative overflow-hidden">
        {/* Ambient Mesh Gradients */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-40 mix-blend-screen">
          <div className="absolute w-[800px] h-[600px] bg-gradient-to-tr from-[#7928ca] to-[#ff0080] rounded-full blur-[120px] opacity-30" style={{ transform: 'translate3d(-20%, -10%, 0)' }} />
          <div className="absolute w-[600px] h-[500px] bg-gradient-to-tr from-[#007cf0] to-[#00dfd8] rounded-full blur-[100px] opacity-30" style={{ transform: 'translate3d(30%, 20%, 0)' }} />
        </div>

        {/* Glass Container */}
        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center bg-black/30 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 md:p-16 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="landing-hero-badge">
            <span>🇮🇳</span> High-Converting Leads for Indian Marketing Agencies
          </div>
          <h1 className="text-balance">
            Find High-Ticket Web Design <br />
            &amp; SEO Clients <span>on Autopilot</span>
          </h1>
          <p className="hero-subtitle text-balance">
            Instantly scan any city, discover local businesses with a weak online presence, 
            and extract verified owner emails through our premium 4-step waterfall pipeline.
          </p>
          
          <button id="landing-hero-cta-btn" className="landing-cta-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-bg" onClick={() => onLaunch('signup')}>
            Get Started for Free
          </button>

          <div className="landing-hero-stats flex flex-wrap justify-center items-center w-full max-w-3xl mt-12 gap-10 md:gap-20 pt-10 border-t border-white/10">
            <div className="landing-hero-stat">
              <span className="stat-num tabular-nums">500+</span>
              <span className="stat-label">Max Leads/Search</span>
            </div>
            <div className="landing-hero-stat">
              <span className="stat-num tabular-nums">~60%</span>
              <span className="stat-label">Email Find Rate</span>
            </div>
            <div className="landing-hero-stat">
              <span className="stat-num tabular-nums">100%</span>
              <span className="stat-label">Secure OTP Login</span>
            </div>
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
                🔍 {mockInput || <span className="text-slate-700">Restaurants in Mumbai</span>}
                {mockSearchStep === 1 && <span className="typing-cursor">|</span>}
              </div>
              <button className="mock-search-btn disabled:opacity-50" disabled>
                {isMockSearching ? "Scanning…" : "Search"}
              </button>
            </div>

            {/* Mock Results Board */}
            <div className="landing-mock-results">
              {isMockSearching && (
                <div className="flex flex-col items-center py-10 gap-2.5">
                  <span className="auth-spinner" />
                  <p className="text-[13px] text-primary-light">Querying Google Places &amp; breaking city into search grids…</p>
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

        <div className="roi-container max-w-[980px]">
          {/* Scoring Factors Checklist */}
          <div className="roi-pitch">
            <h3 className="text-xl mb-5">Select Missing Elements:</h3>
            <div className="flex flex-col gap-3.5">
              <label className="flex items-center gap-3 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={scoreFactors.noWebsite}
                  onChange={(e) => setScoreFactors(prev => ({ ...prev, noWebsite: e.target.checked }))}
                  className="w-[18px] h-[18px] accent-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-sm"
                />
                🌐 Website is Missing (+25 Pts)
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={scoreFactors.lowRating}
                  onChange={(e) => setScoreFactors(prev => ({ ...prev, lowRating: e.target.checked }))}
                  className="w-[18px] h-[18px] accent-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-sm"
                />
                ⭐ Google Rating is Low/Empty (+20 Pts)
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={scoreFactors.fewReviews}
                  onChange={(e) => setScoreFactors(prev => ({ ...prev, fewReviews: e.target.checked }))}
                  className="w-[18px] h-[18px] accent-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-sm"
                />
                💬 Less than 5 Google Reviews (+20 Pts)
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={scoreFactors.fewPhotos}
                  onChange={(e) => setScoreFactors(prev => ({ ...prev, fewPhotos: e.target.checked }))}
                  className="w-[18px] h-[18px] accent-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-sm"
                />
                📸 Less than 3 Google Photos (+15 Pts)
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={scoreFactors.noPhone}
                  onChange={(e) => setScoreFactors(prev => ({ ...prev, noPhone: e.target.checked }))}
                  className="w-[18px] h-[18px] accent-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-sm"
                />
                📞 No Phone Number listed (+10 Pts)
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={scoreFactors.noHours}
                  onChange={(e) => setScoreFactors(prev => ({ ...prev, noHours: e.target.checked }))}
                  className="w-[18px] h-[18px] accent-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-sm"
                />
                🕐 No Business Hours listed (+10 Pts)
              </label>
            </div>
          </div>

          {/* Glowing Animated Score Visualizer Card */}
          <div className="bg-slate-900/80 border border-primary/25 rounded-[20px] p-10 text-center flex flex-col items-center shadow-[0_10px_40px_rgba(99,102,241,0.1)]">
            <h4 className="uppercase text-[11px] text-slate-500 tracking-[1.5px] mb-[15px]">
              Live Score Breakdown
            </h4>

            {/* Glowing Ring */}
            <div 
              className={`w-[140px] h-[140px] rounded-full border-[6px] flex items-center justify-center text-5xl font-black text-white font-outfit mb-5 transition-all duration-300 tabular-nums ${calculatedScore >= 60 ? 'border-accent shadow-[0_0_25px_rgba(249,115,22,0.25)]' : calculatedScore >= 35 ? 'border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.2)]' : 'border-blue-400 shadow-[0_0_25px_rgba(96,165,250,0.15)]'}`}
            >
              {calculatedScore}
            </div>

            <span className={`roi-tag ${labelClass} text-[13px] px-[14px] py-1 rounded-md font-bold`}>
              {leadLabel}
            </span>

            <p className="text-xs text-slate-500 mt-[15px] leading-relaxed text-balance">
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

        <div className="landing-live-preview max-w-[850px] p-0 border border-white/5">
          {/* Mock Client Top */}
          <div className="bg-white/5 border-b border-white/5 px-5 py-3 flex justify-between items-center">
            <span className="text-xs text-slate-500">To: <strong>info@saffronspice.in</strong> (Saffron Spice Restaurant)</span>
            <button
              onClick={handleCopyPitch}
              className={`text-[11px] px-3 py-1.5 rounded-md font-bold cursor-pointer transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none ${isCopied ? 'bg-emerald-500 border border-emerald-500 text-white' : 'bg-primary/15 border border-primary/30 text-primary-light hover:bg-primary/25'}`}
            >
              {isCopied ? "✓ Copied!" : "📋 Copy Outreach Email"}
            </button>
          </div>

          {/* Email Text */}
          <div className="p-6 font-mono text-[13px] text-slate-400 leading-relaxed bg-[#090a12] text-left">
            <span className="text-primary-light">Subject: Quick question about Saffron Spice Restaurant's online presence…</span><br /><br />
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

        <div className="glass-card p-6 max-w-[650px] w-full text-center">
          <div className="mb-6">
            <label className="text-sm text-slate-400 block mb-2.5">
              Leads Needed Per Month: <strong className="tabular-nums">{roiLeads}</strong>
            </label>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={roiLeads}
              onChange={(e) => setRoiLeads(parseInt(e.target.value))}
              className="w-full accent-accent cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              aria-label="Leads Needed Per Month"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <span className="text-[11px] text-slate-500 uppercase">Time Saved</span>
              <p className="text-xl font-extrabold text-primary-light font-outfit mt-1 tabular-nums">
                {Math.round((roiLeads * 5) / 60)} hrs
              </p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <span className="text-[11px] text-slate-500 uppercase">Manual Cost Saved</span>
              <p className="text-xl font-extrabold text-accent font-outfit mt-1 tabular-nums">
                ₹{(roiLeads * 12).toLocaleString()}
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <span className="text-[11px] text-slate-500 uppercase">Emails Found</span>
              <p className="text-xl font-extrabold text-emerald-500 font-outfit mt-1 tabular-nums">
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
            <button className="faq-question focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-md" onClick={() => toggleFaq(0)}>
              How does the OTP Signup work? <span>{activeFaq === 0 ? "−" : "+"}</span>
            </button>
            {activeFaq === 0 && (
              <div className="faq-answer">
                Just enter your work email and name. The system generates a 6-digit OTP code and securely routes it to your email using Brevo SMTP. Enter it on the login page to securely log in. No passwords required!
              </div>
            )}
          </div>

          <div className="faq-item">
            <button className="faq-question focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-md" onClick={() => toggleFaq(1)}>
              Is my search history saved? <span>{activeFaq === 1 ? "−" : "+"}</span>
            </button>
            {activeFaq === 1 && (
              <div className="faq-answer">
                Yes! Every successful search, along with all extracted business emails, coordinates, and lead scores, is automatically saved under your account profile in Supabase. You can view or reload past searches at any time from your Sidebar History.
              </div>
            )}
          </div>

          <div className="faq-item">
            <button className="faq-question focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-md" onClick={() => toggleFaq(2)}>
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
        <button id="landing-bottom-cta-btn" className="landing-cta-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg" onClick={() => onLaunch('signup')}>
          Launch Dashboard Now
        </button>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        © 2026 Lead Finder PRO · Designed for Indian Marketing Agencies 🇮🇳
      </footer>
    </div>
  );
}
