import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function HistoryPanel({ onLoadSearch, onClose }) {
  const { token }                 = useAuth();
  const [history,  setHistory]    = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    axios.get("/api/history/list", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setHistory(r.data.history || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleLoad(search) {
    setLoadingId(search.id);
    try {
      const { data } = await axios.get(`/api/history/${search.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Normalise saved leads back to the result format App.jsx expects
      const results = (data.leads || []).map((l) => ({
        placeId:        l.place_id,
        name:           l.name,
        address:        l.address,
        phone:          l.phone,
        websiteUri:     l.website,
        email:          l.email || null,
        rating:         l.rating,
        userRatingCount: l.reviews_count,
        photos:         Array(l.photos_count || 0).fill({}),
        leadScore:      l.lead_score,
        leadType:       l.lead_type,
        googleMapsUri:  l.google_maps_uri,
        searchLocation: data.search.query,
      }));
      onLoadSearch({ results, query: data.search.query });
    } catch {
      alert("Could not load that search. Please try again.");
    } finally {
      setLoadingId(null);
    }
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  const typeLabel = (t) => {
    const m = { hot: "🔥", warm: "⚡", cold: "❄️" };
    return m[t] || t;
  };

  return (
    <div className="history-panel">
      <div className="history-header">
        <h2>📂 Search History</h2>
        <button className="history-close" onClick={onClose} title="Close">✕</button>
      </div>

      {loading && (
        <div className="history-loading">
          <span className="auth-spinner" /> Loading history...
        </div>
      )}

      {!loading && history.length === 0 && (
        <div className="history-empty">
          <span>🔍</span>
          <p>No past searches yet.<br />Do a search and it'll appear here.</p>
        </div>
      )}

      {!loading && history.length > 0 && (
        <ul className="history-list">
          {history.map((h) => (
            <li key={h.id} className="history-item">
              <div className="history-item-main">
                <span className="history-query">{h.query}</span>
                <span className="history-date">{formatDate(h.created_at)}</span>
              </div>
              <div className="history-item-stats">
                <span className="history-stat">📋 {h.results_count} results</span>
                <span className="history-stat">📧 {h.emails_found} emails</span>
              </div>
              <button
                className="history-load-btn"
                onClick={() => handleLoad(h)}
                disabled={loadingId === h.id}
              >
                {loadingId === h.id ? <span className="auth-spinner small" /> : "↩ Load"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
