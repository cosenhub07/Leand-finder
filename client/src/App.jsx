/**
 * App.jsx — Root component
 * Auth guard → redirect to AuthPage if not logged in.
 * Auto-saves every search + leads to Supabase via /api/history/save.
 * Shows HistoryPanel for past searches.
 */

import { useState, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import SearchForm from "./components/SearchForm";
import FilterBar from "./components/FilterBar";
import ResultsTable from "./components/ResultsTable";
import ExportButton from "./components/ExportButton";
import HistoryPanel from "./components/HistoryPanel";

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

  // ref to latest results for auto-save after extraction completes
  const resultsRef = useRef([]);

  // ── Auth guard loading splash ────────────────────────────────────────────────
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

  // ── Show auth page or landing page if not logged in ─────────────────────────
  if (!user) {
    if (publicView === "landing") {
      return <LandingPage onLaunch={() => setPublicView("auth")} />;
    }
    return <AuthPage onBack={() => setPublicView("landing")} />;
  }

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
      const response = await axios.post("/api/search", { textQuery, maxResults }, { timeout: 120000 });
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

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
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
              <span className="user-avatar">{(user.name || user.email)[0].toUpperCase()}</span>
              <span className="user-name">{user.name || user.email}</span>
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

        {/* Search Form */}
        <SearchForm onSearch={handleSearch} isLoading={isSearching} />

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
              <ExportButton results={filteredResults} />
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
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="app-footer">
        Lead Finder PRO · Google Places API · Supabase · Made for Indian Marketing Agencies 🇮🇳
      </footer>
    </div>
  );
}
