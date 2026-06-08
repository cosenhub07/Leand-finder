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
  let labelClass = "text-blue-400 bg-blue-400/10 border-blue-400/20";
  if (calculatedScore >= 60) {
    leadLabel = "🔥 Hot Lead";
    labelClass = "text-orange-400 bg-orange-400/10 border-orange-400/20";
  } else if (calculatedScore >= 35) {
    leadLabel = "⚡ Warm Lead";
    labelClass = "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
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
    <div className="min-h-screen bg-black text-white font-inter selection:bg-purple-500/30 overflow-x-hidden">
      
      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <div className="bg-black/50 backdrop-blur-md sticky top-0 z-50 border-b border-white/10 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer">
          <object data="/icon.svg" type="image/svg+xml" aria-label="Lead Finder Icon" className="w-8 h-8 pointer-events-none filter invert opacity-90"></object>
          <h2 className="text-xl font-bold tracking-tight">Lead Finder <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">PRO</span></h2>
        </div>
        <nav className="hidden md:flex gap-6 items-center text-sm font-medium">
          <a href="#features" className="text-white/60 hover:text-white transition">Features</a>
          <a href="#tools" className="text-white/60 hover:text-white transition">Tools</a>
          <a href="#faqs" className="text-white/60 hover:text-white transition">FAQs</a>
          <button 
            className="bg-white text-black py-2 px-4 rounded-lg hover:bg-gray-200 transition font-semibold"
            onClick={() => onLaunch('signin')}
          >
            Dashboard
          </button>
        </nav>
        {/* Mobile trigger */}
        <button className="md:hidden text-white/70 hover:text-white" onClick={() => onLaunch('signin')}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
        </button>
      </div>

      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      <div className="bg-black text-white bg-[linear-gradient(to_bottom,#000,#200D42_34%,#4F21A1_65%,#A46EDB_82%)] py-20 sm:py-32 relative overflow-clip border-b border-white/10">
        <div className="absolute h-[375px] w-[750px] sm:w-[1536px] sm:h-[768px] lg:w-[2400px] lg:h-[1200px] rounded-[100%] bg-black left-1/2 -translate-x-1/2 border border-[#B48CDE] bg-[radial-gradient(closest-side,#000_82%,#9560EB)] top-[calc(100%-96px)] sm:top-[calc(100%-120px)] opacity-50"></div>
        <div className="max-w-7xl relative mx-auto px-4">
          <div className="flex items-center justify-center mb-8">
            <div className="inline-flex gap-3 border py-1 px-3 rounded-full border-white/30 bg-black/40 backdrop-blur-sm shadow-[0_0_15px_rgba(248,122,255,0.2)]">
              <span className="bg-[linear-gradient(to_right,#F87AFF,#FB93D0,#FFDD99,#C3F0B2,#2FD8FE)] text-transparent bg-clip-text font-medium text-sm">
                High-Converting Leads for Marketing Agencies
              </span>
            </div>
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter text-center max-w-4xl mx-auto leading-tight">
            Find High-Ticket Clients <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-orange-200 text-transparent bg-clip-text">on Autopilot</span>
          </h1>
          
          <p className="text-center text-lg sm:text-xl mt-8 max-w-2xl mx-auto text-white/70 leading-relaxed">
            Instantly scan any city, discover local businesses with a weak online presence, and extract verified owner emails through our premium 4-step waterfall pipeline.
          </p>
          
          <div className="flex justify-center mt-10">
            <button 
              className="bg-white text-black py-3 px-8 rounded-lg font-semibold text-lg hover:bg-gray-200 transition shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transform hover:-translate-y-1"
              onClick={() => onLaunch('signup')}
            >
              Get Started for Free
            </button>
          </div>
        </div>
      </div>

      {/* ── Trusted By Marquee ────────────────────────────────────────────── */}
      <div className="bg-black py-16 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-center text-sm font-medium tracking-widest uppercase text-white/40 mb-8">Trusted by Growth Agencies Worldwide</h2>
          <div className="flex overflow-hidden relative w-full [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
            <div className="flex gap-16 items-center whitespace-nowrap opacity-60 grayscale animate-[marquee_20s_linear_infinite] hover:grayscale-0 transition-all duration-500">
              <span className="text-2xl font-bold font-outfit">Apex Digital</span>
              <span className="text-2xl font-bold font-serif">GrowScale</span>
              <span className="text-2xl font-bold italic">NexMedia</span>
              <span className="text-2xl font-bold font-mono">Convertify</span>
              <span className="text-2xl font-bold font-outfit">ScaleUp</span>
              <span className="text-2xl font-bold">LeadsRocket</span>
              {/* Duplicate for infinite effect */}
              <span className="text-2xl font-bold font-outfit">Apex Digital</span>
              <span className="text-2xl font-bold font-serif">GrowScale</span>
              <span className="text-2xl font-bold italic">NexMedia</span>
              <span className="text-2xl font-bold font-mono">Convertify</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Features Grid (Everything You Need) ────────────────────────────── */}
      <div id="features" className="bg-[#030712] py-24 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-center text-3xl md:text-5xl font-bold tracking-tighter mb-5">Everything You Need</h2>
          <p className="text-center text-xl text-white/60 max-w-2xl mx-auto mb-16">
            Whether you are a solo freelancer or a large enterprise, we have all the essential tools you will ever need to scale your outreach.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-black/40 backdrop-blur-sm border border-white/10 p-8 rounded-2xl hover:bg-white/5 transition group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-6 border border-white/10 group-hover:bg-purple-500/20 group-hover:border-purple-500/50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-purple-400 transition-colors group-hover:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">4-Step Waterfall</h3>
              <p className="text-white/60 leading-relaxed">
                Why settle for simple scraping? Our pipeline crawls domain data, searches indexed records, and executes full JS environments to ensure no lead is missed.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-black/40 backdrop-blur-sm border border-white/10 p-8 rounded-2xl hover:bg-white/5 transition group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-6 border border-white/10 group-hover:bg-pink-500/20 group-hover:border-pink-500/50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-pink-400 transition-colors group-hover:text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">High-Ticket Targeting</h3>
              <p className="text-white/60 leading-relaxed">
                Filter out low-quality prospects instantly. Our algorithm identifies businesses missing websites, lacking reviews, or with unclaimed profiles.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-black/40 backdrop-blur-sm border border-white/10 p-8 rounded-2xl hover:bg-white/5 transition group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-6 border border-white/10 group-hover:bg-blue-500/20 group-hover:border-blue-500/50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-blue-400 transition-colors group-hover:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Beautiful &amp; Fast</h3>
              <p className="text-white/60 leading-relaxed">
                Complexity is the enemy of productivity. We designed our dashboard to be so minimal and lightning-fast that anyone can use it on day one.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── App Showcase (Live Preview) ────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-[#030712] to-[#200D42] py-24 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <h2 className="text-center text-3xl md:text-5xl font-bold tracking-tighter mb-5">Beyond Expectations</h2>
          <p className="text-center text-xl text-white/60 max-w-2xl mx-auto mb-16">
            Watch our AI scanner search, analyze, score, and extract contact details in real time right from your browser.
          </p>

          <div className="max-w-4xl mx-auto relative group perspective-[1000px]">
            {/* Ambient Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            
            <div className="relative bg-[#0B0F19] border border-white/10 rounded-2xl shadow-2xl overflow-hidden transform-gpu transition-transform duration-700 hover:rotate-x-0 rotate-x-2">
              
              {/* Mac Header */}
              <div className="bg-[#1C212E] px-4 py-3 border-b border-white/5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="mx-auto bg-black/40 text-white/40 text-xs px-24 py-1 rounded-md font-mono">
                  app.leadfinder.pro/search
                </div>
              </div>

              {/* Console Body */}
              <div className="p-6 md:p-10">
                <div className="bg-black/50 border border-white/5 rounded-xl p-4 flex justify-between items-center mb-8">
                  <div className="text-lg font-mono text-white/80 flex items-center gap-2">
                    <span className="text-purple-400">~/search$</span> 
                    {mockInput || <span className="text-white/20">Restaurants in Mumbai</span>}
                    {mockSearchStep === 1 && <span className="animate-pulse bg-white/80 w-2 h-5 inline-block"></span>}
                  </div>
                  <button className="bg-white/10 text-white/50 px-4 py-2 rounded-lg text-sm font-medium border border-white/5">
                    {isMockSearching ? "Scanning..." : "Search"}
                  </button>
                </div>

                <div className="space-y-3 min-h-[300px]">
                  {isMockSearching && (
                    <div className="flex justify-center items-center h-full py-20 text-purple-400 gap-3">
                      <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Querying Grid Sectors...
                    </div>
                  )}

                  {!isMockSearching && visibleMockResults.length === 0 && mockSearchStep === 1 && (
                    <div className="flex justify-center py-20 text-white/20 font-mono text-sm">
                      Waiting for query...
                    </div>
                  )}

                  {visibleMockResults.map((biz, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-xl animate-[fadeIn_0.5s_ease-out]">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-white/90">{biz.name}</span>
                        <span className="text-sm text-white/50 font-mono">
                          {biz.site ? <span className="text-blue-400">🌐 {biz.site}</span> : <span className="text-red-400">⚠️ No Website</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-mono text-white/60 hidden sm:block">📧 {biz.email}</span>
                        <span className={`px-3 py-1 rounded-md text-xs font-bold border ${biz.label === 'hot' ? 'text-orange-400 bg-orange-400/10 border-orange-400/20' : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'}`}>
                          {biz.label === "hot" ? "🔥" : "⚡"} {biz.score} Pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tools Grid ──────────────────────────────────────────────────────── */}
      <div id="tools" className="bg-[#0B0F19] py-24">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-center text-3xl md:text-5xl font-bold tracking-tighter mb-5">Powerful Tools Suite</h2>
          <p className="text-center text-xl text-white/60 max-w-2xl mx-auto mb-16">
            Everything you need to qualify, pitch, and close. Try them out below!
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            
            {/* Tool 1: Scoring Simulator */}
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/10 flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">Live Scoring Engine</h3>
                <p className="text-white/50 mb-6 text-sm leading-relaxed">
                  We rate businesses out of 100 based on digital vulnerability. Toggle the checkboxes to simulate our logic.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    { label: "🌐 Website is Missing (+25)", key: "noWebsite" },
                    { label: "⭐ Google Rating is Low (+20)", key: "lowRating" },
                    { label: "💬 Less than 5 Reviews (+20)", key: "fewReviews" },
                    { label: "📸 Less than 3 Photos (+15)", key: "fewPhotos" },
                    { label: "📞 No Phone Number (+10)", key: "noPhone" },
                    { label: "🕐 No Hours Listed (+10)", key: "noHours" }
                  ].map(factor => (
                    <label key={factor.key} className="flex items-center gap-3 cursor-pointer text-sm text-white/80 hover:text-white group">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${scoreFactors[factor.key] ? 'bg-purple-500 border-purple-500' : 'border-white/20 group-hover:border-white/50'}`}>
                        {scoreFactors[factor.key] && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>}
                      </div>
                      <input type="checkbox" className="hidden" checked={scoreFactors[factor.key]} onChange={(e) => setScoreFactors(prev => ({...prev, [factor.key]: e.target.checked}))} />
                      {factor.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-1">Calculated Score</div>
                  <div className={`text-sm font-bold px-3 py-1 rounded-md border inline-block ${labelClass}`}>
                    {leadLabel}
                  </div>
                </div>
                <div className={`text-5xl font-black font-outfit tabular-nums transition-colors duration-500 ${calculatedScore >= 60 ? 'text-orange-400 drop-shadow-[0_0_15px_rgba(251,146,60,0.5)]' : calculatedScore >= 35 ? 'text-yellow-400' : 'text-blue-400'}`}>
                  {calculatedScore}
                </div>
              </div>
            </div>

            {/* Tool 2: ROI Calculator */}
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/10 flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">ROI Savings Calculator</h3>
                <p className="text-white/50 mb-6 text-sm leading-relaxed">
                  How much time and money does your agency save? Drag the slider to see your monthly savings.
                </p>
                <div className="mb-10">
                  <div className="flex justify-between items-end mb-4">
                    <label className="text-sm font-semibold text-white/80">Leads Needed Per Month</label>
                    <span className="text-3xl font-bold font-outfit text-purple-400 tabular-nums">{roiLeads}</span>
                  </div>
                  <input
                    type="range"
                    min="100" max="5000" step="100"
                    value={roiLeads}
                    onChange={(e) => setRoiLeads(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-xl p-5">
                  <div className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-2">Time Saved</div>
                  <div className="text-3xl font-black font-outfit text-white tabular-nums">{Math.round((roiLeads * 5) / 60)}<span className="text-lg text-white/50 font-normal ml-1">hrs</span></div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-900/20 border border-purple-500/30 rounded-xl p-5">
                  <div className="text-xs text-purple-300/60 uppercase tracking-wider font-semibold mb-2">Manual Cost Saved</div>
                  <div className="text-3xl font-black font-outfit text-purple-400 tabular-nums">₹{(roiLeads * 12).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Tool 3: Pitch Generator */}
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/10 lg:col-span-2">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">1-Click Outreach Templates</h3>
                  <p className="text-white/50 text-sm max-w-xl">
                    Copy our battle-tested agency cold email template. Optimized specifically for pitching found leads.
                  </p>
                </div>
                <button
                  onClick={handleCopyPitch}
                  className={`shrink-0 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${isCopied ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'}`}
                >
                  {isCopied ? (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg> Copied!</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg> Copy Email Template</>
                  )}
                </button>
              </div>
              
              <div className="bg-[#0B0F19] border border-white/5 rounded-xl p-6 font-mono text-sm text-white/60 leading-relaxed overflow-x-auto shadow-inner">
                <div className="text-purple-300 mb-4 font-semibold border-b border-white/5 pb-4">
                  Subject: Quick question about Saffron Spice Restaurant's online presence...
                </div>
                Hi Team, 👋<br /><br />
                I noticed you have over <span className="text-yellow-200">50 great reviews on Google Maps</span> but don't have a website listed under your profile.<br /><br />
                In today's market, 72% of customers search for a local menu/booking page before visiting. By adding a sleek, fast-loading website and booking funnel, we could help you capture another <span className="text-green-300">15-20 clients per week</span>.<br /><br />
                Let me know if you'd be open to a quick 5-minute call to see a mock design I drew for your brand!
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── FAQs ──────────────────────────────────────────────────────────── */}
      <div id="faqs" className="bg-gradient-to-b from-[#110626] to-black py-24 border-t border-purple-900/30">
        <div className="max-w-7xl mx-auto px-4 max-w-3xl">
          <h2 className="text-center text-3xl md:text-4xl font-bold tracking-tighter mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "How does the OTP Signup work?",
                a: "Just enter your work email and name. The system generates a 6-digit OTP code and securely routes it to your email using Brevo SMTP. Enter it on the login page to securely log in. No passwords required!"
              },
              {
                q: "Is my search history saved?",
                a: "Yes! Every successful search, along with all extracted business emails, coordinates, and lead scores, is automatically saved under your account profile. You can view or export past searches at any time."
              },
              {
                q: "Can I export files for Excel?",
                a: "Absolutely! We feature a dedicated export system that compiles all your search results into a clean, styled Excel file (.xlsx). It separates your leads automatically into sheets: Hot, Warm, Cold, and All Leads."
              },
              {
                q: "Are the leads verified?",
                a: "We extract leads in real-time from live business listings and crawl their websites for contact data, meaning the information is as fresh and accurate as the business's current online presence."
              }
            ].map((faq, idx) => (
              <div key={idx} className="border-b border-white/10 py-5">
                <button 
                  className="w-full flex justify-between items-center text-left focus:outline-none group"
                  onClick={() => toggleFaq(idx)}
                >
                  <span className="text-lg font-semibold text-white/80 group-hover:text-white transition-colors">{faq.q}</span>
                  <span className="text-purple-400 text-2xl font-light ml-4">
                    {activeFaq === idx ? "−" : "+"}
                  </span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${activeFaq === idx ? 'max-h-40 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-white/50 leading-relaxed pr-8">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <div className="bg-black py-24 text-center border-t border-white/5 relative overflow-hidden">
        {/* Glow behind CTA */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-600/20 blur-[100px] rounded-[100%] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">Ready to Scale Your Agency?</h2>
          <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
            Stop wasting hours manually checking Google Maps. Find high-ticket clients with missing websites and bad reviews instantly.
          </p>
          <button 
            className="bg-white text-black h-14 px-8 rounded-lg font-bold text-lg hover:bg-gray-200 hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            onClick={() => onLaunch('signup')}
          >
            Start Finding Leads Now
          </button>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-black border-t border-white/10 py-8 text-center text-sm text-white/40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <object data="/icon.svg" type="image/svg+xml" className="w-5 h-5 filter invert opacity-40 pointer-events-none"></object>
            <span className="font-semibold text-white/60">Lead Finder PRO</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
          <div>© 2026 Cosen Group. All rights reserved.</div>
        </div>
      </footer>

      {/* Global CSS animation for Marquee if not configured in tailwind config */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-\\[marquee_20s_linear_infinite\\] {
          animation: marquee 20s linear infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
