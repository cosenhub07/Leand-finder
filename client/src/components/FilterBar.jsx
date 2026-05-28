/**
 * FilterBar.jsx
 * Filter pills (All/Hot/Warm/Cold) + toggle switches + stats + progress bar.
 */

import React from "react";
import ExportButton from "./ExportButton";

export default function FilterBar({
  results,
  filteredResults,
  activeFilter,
  setActiveFilter,
  noWebsiteOnly,
  setNoWebsiteOnly,
  lowRatingOnly,
  setLowRatingOnly,
  hasEmailOnly,
  setHasEmailOnly,
  emailProgress,
  isExtracting,
}) {
  const counts = {
    all:  results.length,
    hot:  results.filter((r) => r.leadType === "hot").length,
    warm: results.filter((r) => r.leadType === "warm").length,
    cold: results.filter((r) => r.leadType === "cold").length,
  };

  const emailsFound = results.filter(
    (r) => r.email && r.email !== "pending" && r.email !== null
  ).length;

  const withWebsite = results.filter((r) => r.websiteUri).length;
  const progressPct =
    emailProgress.total > 0
      ? Math.round((emailProgress.completed / emailProgress.total) * 100)
      : 0;

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Stats Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-slate-300 font-medium">
            <span className="text-indigo-400 font-bold text-base">{results.length}</span>
            {" "}businesses found
          </span>
          {results.length > 0 && (
            <span className="text-slate-400">
              📧 Emails found:{" "}
              <span className={emailsFound > 0 ? "text-emerald-400 font-semibold" : "text-slate-500"}>
                {emailsFound}/{withWebsite}
              </span>
            </span>
          )}
          {filteredResults.length !== results.length && (
            <span className="text-slate-500 text-xs">
              ({filteredResults.length} shown)
            </span>
          )}
        </div>

        <ExportButton results={filteredResults.length > 0 ? filteredResults : results} />
      </div>

      {/* Email Progress Bar */}
      {isExtracting && emailProgress.total > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="email-searching">
              🔍 Extracting emails... {emailProgress.completed}/{emailProgress.total} done
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Done state */}
      {!isExtracting && emailProgress.total > 0 && (
        <div className="text-xs text-emerald-400 flex items-center gap-1.5">
          ✅ Email extraction complete — {emailsFound} emails found out of {withWebsite} websites crawled
        </div>
      )}

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          id="filter-all"
          className={`filter-pill ${activeFilter === "all" ? "active" : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          All ({counts.all})
        </button>
        <button
          id="filter-hot"
          className={`filter-pill ${activeFilter === "hot" ? "active-hot" : ""}`}
          onClick={() => setActiveFilter("hot")}
        >
          🔥 Hot ({counts.hot})
        </button>
        <button
          id="filter-warm"
          className={`filter-pill ${activeFilter === "warm" ? "active-warm" : ""}`}
          onClick={() => setActiveFilter("warm")}
        >
          ⚡ Warm ({counts.warm})
        </button>
        <button
          id="filter-cold"
          className={`filter-pill ${activeFilter === "cold" ? "active-cold" : ""}`}
          onClick={() => setActiveFilter("cold")}
        >
          ❄️ Cold ({counts.cold})
        </button>
      </div>

      {/* Toggle Switches */}
      <div className="flex flex-wrap gap-4">
        <ToggleSwitch
          id="toggle-no-website"
          label="No Website Only"
          checked={noWebsiteOnly}
          onChange={setNoWebsiteOnly}
        />
        <ToggleSwitch
          id="toggle-low-rating"
          label="Low Rating Only"
          checked={lowRatingOnly}
          onChange={setLowRatingOnly}
        />
        <ToggleSwitch
          id="toggle-has-email"
          label="Has Email Only"
          checked={hasEmailOnly}
          onChange={setHasEmailOnly}
        />
      </div>
    </div>
  );
}

function ToggleSwitch({ id, label, checked, onChange }) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2.5 cursor-pointer group"
    >
      <div className="toggle-switch">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle-slider" />
      </div>
      <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors select-none">
        {label}
      </span>
    </label>
  );
}
