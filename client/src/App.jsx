/**
 * App.jsx — Root component
 * Auth guard → redirect to AuthPage if not logged in.
 * Auto-saves every search + leads to Supabase via /api/history/save.
 * Shows HistoryPanel for past searches.
 */

import { useState, useCallback, useMemo, useRef, Component, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import SearchForm from "./components/SearchForm";
import FilterBar from "./components/FilterBar";
import ResultsTable from "./components/ResultsTable";
import ExportButton from "./components/ExportButton";
import HistoryPanel from "./components/HistoryPanel";

// ── Error Boundary to catch dashboard crashes ────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0f0f1a", color: "#e2e8f0", gap: 16, padding: 24 }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ color: "#818cf8", margin: 0 }}>Something went wrong</h2>
          <p style={{ color: "#94a3b8", maxWidth: 400, textAlign: "center" }}>{this.state.error?.message || "An unexpected error occurred."}</p>
          <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }} style={{ background: "#6366f1", color: "white", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { user, token, logout, authLoading } = useAuth();

  // ── Core State ──────────────────────────────────────────────────────────────
  const [publicView,    setPublicView]    = useState("landing"); // "landing" | "auth"
  const [results,       setResults]       = useState([]);
  const [isSearching,   setIsSearching]   = useState(false);
  const [isExtracting,  setIsExtracting]  = useState(false);
  const [error,         setError]         = useState(null);
  const [lastQuery,     setLastQuery]     = useState("");
  const [emailProgress, setEmailProgress] = useState({ completed: 0, total: 0 });
  const [showHistory,   setShowHistory]   = useState(false);
  const [savedMsg,      setSavedMsg]      = useState("");   // "Search saved ✅"

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [activeFilter,   setActiveFilter]   = useState("all");
  const [noWebsiteOnly,  setNoWebsiteOnly]  = useState(false);
  const [lowRatingOnly,  setLowRatingOnly]  = useState(false);
  const [hasEmailOnly,   setHasEmailOnly]   = useState(false);

  // ── Usage & Tiers ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("free"); // "free" | "ai"
  const [dailySearches, setDailySearches] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customKeys, setCustomKeys] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("lf_custom_keys")) || { google: "", serper: "" };
    } catch {
      return { google: "", serper: "" };
    }
  });

  useEffect(() => {
    if (token) {
      axios.get("/api/history/usage", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setDailySearches(res.data.searchesToday || 0))
        .catch(() => {});
    }
  }, [token, savedMsg]); // refresh usage when a search is saved

  const saveCustomKeys = (keys) => {
    setCustomKeys(keys);
    localStorage.setItem("lf_custom_keys", JSON.stringify(keys));
    setShowSettingsModal(false);
  };

  // ref to latest results for auto-save after extraction completes
  const resultsRef = useRef([]);

  // ── Auto-save search to Supabase ─────────────────────────────────────────────
  async function saveToHistory(query, location, businessType, maxResults, finalResults) {
    if (!token || !query) return;
    try {
      await axios.post("/api/history/save",
        { query, location, businessType, maxResults, results: finalResults },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSavedMsg("Search saved ✅");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch {
      // silent fail — saving to history is non-critical
    }
  }

  // ── Search Handler ───────────────────────────────────────────────────────────
  const handleSearch = useCallback(async ({ textQuery, location, maxResults = 60 }) => {
    setIsSearching(true);
    setError(null);
    setResults([]);
    resultsRef.current = [];
    setEmailProgress({ completed: 0, total: 0 });
    setIsExtracting(false);
    setActiveFilter("all");
    setNoWebsiteOnly(false);
    setLowRatingOnly(false);
    setHasEmailOnly(false);
    setLastQuery(textQuery);

    try {
      const response = await axios.post("/api/search", {
        textQuery,
        maxResults,
        customGoogleKey: customKeys.google || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 120000
      });
      const { results: places = [], message } = response.data;

      if (places.length === 0) {
        setError(message || "No businesses found. Try a different location or business type.");
        setIsSearching(false);
        return;
      }

      const allPending = places.map((p) => ({ ...p, email: "pending" }));
      setResults(allPending);
      resultsRef.current = allPending;
      setIsSearching(false);

      // Email extraction — when done, auto-save to history
      startEmailExtraction(allPending, textQuery, location, maxResults);
    } catch (err) {
      setIsSearching(false);
      setError(
        err.response?.data?.error || err.response?.data?.detail ||
        err.message || "Failed to search. Please check your API key and try again."
      );
    }
  }, [token]); // eslint-disable-line

  // ── Email Extraction ─────────────────────────────────────────────────────────
  const startEmailExtraction = useCallback(async (allPlaces, query, location, maxResults) => {
    setIsExtracting(true);
    setEmailProgress({ completed: 0, total: allPlaces.length });
    let completed = 0;
    const finalResults = [...allPlaces];

    await Promise.allSettled(
      allPlaces.map(async (biz, idx) => {
        let email = null;
        try {
          const resp = await axios.get("/api/extract-email", {
            params: {
              url:  biz.websiteUri || "",
              name: biz.name       || "",
              city: biz.searchLocation
                      ? biz.searchLocation.replace(/^.*\bin\b\s*/i, "").trim()
                      : "",
              customSerperKey: customKeys.serper || undefined
            },
            timeout: 20000,
          });
          email = resp.data?.email || null;
        } catch { email = null; }

        finalResults[idx] = { ...biz, email };
        completed++;
        setEmailProgress({ completed, total: allPlaces.length });
        setResults((prev) => prev.map((b) => b.placeId === biz.placeId ? { ...b, email } : b));
      })
    );

    setIsExtracting(false);
    resultsRef.current = finalResults;

    // Auto-save to Supabase when done
    const bizType = query.split(" in ")[0] || query;
    saveToHistory(query, location, bizType, maxResults, finalResults);
  }, []); // eslint-disable-line

  // ── Load from History ────────────────────────────────────────────────────────
  function handleLoadSearch({ results: loaded, query }) {
    setResults(loaded);
    resultsRef.current = loaded;
    setLastQuery(query);
    setActiveFilter("all");
    setNoWebsiteOnly(false);
    setLowRatingOnly(false);
    setHasEmailOnly(false);
    setError(null);
    setShowHistory(false);
  }

  // ── Filtered Results ─────────────────────────────────────────────────────────
  const filteredResults = useMemo(() => results.filter((biz) => {
    if (activeFilter !== "all" && biz.leadType !== activeFilter) return false;
    if (noWebsiteOnly && biz.websiteUri) return false;
    if (lowRatingOnly && biz.rating && biz.rating >= 3.5) return false;
    if (hasEmailOnly) {
      const hasEmail = biz.email && biz.email !== "pending" && biz.email !== null;
      if (!hasEmail) return false;
    }
    return true;
  }), [results, activeFilter, noWebsiteOnly, lowRatingOnly, hasEmailOnly]);

  // ── Render ───────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-blob blob-1" /><div className="auth-blob blob-2" />
        <div style={{ color: "#818cf8", fontSize: 18, fontWeight: 600 }}>
          <span className="auth-spinner" style={{ marginRight: 10 }} />
          Loading Lead Finder...
        </div>
      </div>
    );
  }

  if (!user) {
    if (publicView === "landing") {
      return <LandingPage onLaunch={() => setPublicView("auth")} />;
    }
    return <AuthPage onBack={() => setPublicView("landing")} />;
  }

  return (
    <ErrorBoundary>
    <div className="app-root">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-logo">
            <span className="app-logo-icon">🎯</span>
            <div>
              <h1 className="app-logo-title">Lead Finder <span className="app-logo-pro">PRO</span></h1>
              <p className="app-logo-sub">AI-Powered Business Lead Generation</p>
            </div>
          </div>

          <div className="app-header-actions">
            {savedMsg && <span className="saved-badge">{savedMsg}</span>}
            <button
              className="header-btn"
              onClick={() => setShowHistory((v) => !v)}
              title="Search History"
            >
              📂 History
            </button>
            <div className="user-badge">
              <span className="user-avatar">{((user.name || user.email || "U")[0] || "U").toUpperCase()}</span>
              <span className="user-name">{user.name || user.email || "User"}</span>
              <button className="logout-btn" onClick={logout} title="Logout">↩</button>
            </div>
          </div>
        </div>
      </header>

      {/* ── History Panel Overlay ────────────────────────────────────────────── */}
      {showHistory && (
        <div className="history-overlay" onClick={() => setShowHistory(false)}>
          <div className="history-sidebar" onClick={(e) => e.stopPropagation()}>
            <HistoryPanel
              onLoadSearch={handleLoadSearch}
              onClose={() => setShowHistory(false)}
            />
          </div>
        </div>
      )}

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="app-main">

        {/* ── Tier Tabs ──────────────────────────────────────────────────────── */}
        <div className="tier-tabs">
          <button 
            className={`tier-tab ${activeTab === "free" ? "active" : ""}`}
            onClick={() => setActiveTab("free")}
          >
            Free Search
          </button>
          <button 
            className={`tier-tab ${activeTab === "ai" ? "active" : ""}`}
            onClick={() => setActiveTab("ai")}
          >
            AI Advanced Search 🚀
          </button>
        </div>

        {activeTab === "ai" ? (
          <div className="glass-card p-10 text-center flex flex-col items-center justify-center gap-4 mt-6">
            <div className="text-5xl">🚧</div>
            <h2 className="text-2xl font-bold text-white">Building Stage</h2>
            <p className="text-slate-400 max-w-md">
              This feature is currently under construction. Please use the Free Search version at this time.
            </p>
            <button className="btn-primary mt-2" onClick={() => setActiveTab("free")}>Go to Free Search</button>
          </div>
        ) : (
          <>
            {/* ── Limit / Upgrade Banner ────────────────────────────────────────── */}
            {dailySearches >= 3 && (!customKeys.google || !customKeys.serper) && (
              <div className="limit-banner glass-card mt-4 mb-4 p-5 border-amber-500/30 bg-amber-500/5">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">⚠️</span>
                  <div>
                    <h3 className="text-amber-400 font-bold text-lg m-0">Daily Limit Reached (3/3)</h3>
                    <p className="text-slate-300 text-sm mt-1 mb-3">
                      You have used your 3 free searches for today. To continue searching or to unlock up to 100 results per search, please provide your own API keys.
                    </p>
                    <button className="btn-primary !bg-amber-600 hover:!bg-amber-500" onClick={() => setShowSettingsModal(true)}>
                      Bring Your Own Keys (Settings)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Search Form */}
            <SearchForm 
              onSearch={handleSearch} 
              isLoading={isSearching} 
              tierLimit={customKeys.google && customKeys.google.length > 10 ? 100 : 20} 
            />

        {/* Error Banner */}
        {error && (
          <div className="alert-error">
            <span>⚠️</span>
            <div>
              <p className="alert-title">Search Failed</p>
              <p className="alert-msg">{error}</p>
            </div>
            <button className="alert-close" onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* Searching Spinner */}
        {isSearching && (
          <div className="loading-card">
            <div className="loading-spinner-wrap">
              <div className="loading-ring ring-1" />
              <div className="loading-ring ring-2" />
            </div>
            <div>
              <p className="loading-title">Searching Google Places...</p>
              <p className="loading-sub">Querying: <span className="text-indigo">{lastQuery}</span></p>
            </div>
          </div>
        )}

        {/* Results */}
        {!isSearching && results.length > 0 && (
          <>
            <div className="results-toolbar">
              <FilterBar
                results={results}
                filteredResults={filteredResults}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                noWebsiteOnly={noWebsiteOnly}
                setNoWebsiteOnly={setNoWebsiteOnly}
                lowRatingOnly={lowRatingOnly}
                setLowRatingOnly={setLowRatingOnly}
                hasEmailOnly={hasEmailOnly}
                setHasEmailOnly={setHasEmailOnly}
                emailProgress={emailProgress}
                isExtracting={isExtracting}
              />
            </div>
            <ResultsTable results={filteredResults} />
          </>
        )}

        {/* Empty state */}
        {!isSearching && results.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h2 className="empty-title">Find Your Next Clients</h2>
            <p className="empty-sub">
              Enter a city and business type above to discover local businesses with weak
              online presence — restaurants, salons, medical stores, and more.
            </p>
            <div className="score-pills">
              <span className="score-pill">🔥 No website = +25 pts</span>
              <span className="score-pill">⭐ Low rating = +20 pts</span>
              <span className="score-pill">📝 Few reviews = +20 pts</span>
              <span className="score-pill">📸 Few photos = +15 pts</span>
              <span className="score-pill">📞 No phone = +10 pts</span>
              <span className="score-pill">🕐 No hours = +10 pts</span>
            </div>
          </div>
        )}
        </>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="app-footer">
        Lead Finder PRO · Google Places API · Supabase · Made for Indian Marketing Agencies 🇮🇳
      </footer>
      {/* ── Settings Modal (BYOK) ────────────────────────────────────────────── */}
      {showSettingsModal && (
        <div className="history-overlay" style={{ alignItems: "center", justifyContent: "center" }} onClick={() => setShowSettingsModal(false)}>
          <div className="glass-card p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-2">API Settings</h2>
            <p className="text-sm text-slate-400 mb-6">
              Enter your API keys to bypass the free limits and unlock 100 results per search. Keys are saved securely in your browser.
            </p>
            
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Google Places API Key</label>
                <input 
                  type="password" 
                  className="input-field" 
                  defaultValue={customKeys.google}
                  id="google-key-input"
                  placeholder="AIzaSy..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Serper.dev API Key</label>
                <input 
                  type="password" 
                  className="input-field" 
                  defaultValue={customKeys.serper}
                  id="serper-key-input"
                  placeholder="... (for emails)"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button className="px-4 py-2 rounded-lg text-slate-300 hover:text-white" onClick={() => setShowSettingsModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => {
                const g = document.getElementById("google-key-input").value;
                const s = document.getElementById("serper-key-input").value;
                saveCustomKeys({ google: g, serper: s });
              }}>Save Keys</button>
            </div>
          </div>
        </div>
      )}

    </div>
    </ErrorBoundary>
  );
}
