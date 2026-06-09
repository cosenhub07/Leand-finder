/**
 * SearchForm.jsx
 * Handles location input, business type selector, and search trigger.
 * API key is now managed server-side — no longer needed from user.
 */

import React, { useState } from "react";
import Lottie from "lottie-react";
import loadingAnimation from "../image/loding_status.json";

const BUSINESS_TYPES = [
  "Restaurants",
  "Cafes & Coffee Shops",
  "Salons & Beauty Parlors",
  "Medical Stores & Pharmacies",
  "Dental Clinics",
  "Gyms & Fitness Centers",
  "Retail & Clothing Shops",
  "Hotels & Guest Houses",
  "Auto Repair Shops",
  "Real Estate Agencies",
  "Law Firms",
  "Coaching Centers & Tutors",
  "Hardware Stores",
  "Grocery Stores",
  "Bakeries",
  "Photography Studios",
  "Plumbers & Electricians",
  "Travel Agencies",
  "Pet Shops",
  "Chartered Accountants",
];

export default function SearchForm({ onSearch, isLoading, tierLimit = 20 }) {
  const [location, setLocation]         = useState("");
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [customType, setCustomType]     = useState("");
  const [isCustom, setIsCustom]         = useState(false);
  const [maxResults, setMaxResults]     = useState(tierLimit.toString());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!location.trim()) return;

    const type = isCustom ? customType.trim() : businessType;
    if (!type) return;

    const textQuery = `${type} in ${location.trim()}`;
    onSearch({ textQuery, location: location.trim(), maxResults: parseInt(maxResults) });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Location */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            📍 Location
          </label>
          <input
            id="location-input"
            type="text"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            placeholder="e.g. Bhopal, India or Austin, Texas"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>

        {/* Business Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            🏢 Business Type
          </label>
          {isCustom ? (
            <div className="flex gap-1">
              <input
                id="custom-type-input"
                type="text"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="e.g. Tailor shops"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setIsCustom(false)}
                className="px-2 rounded-lg text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 transition-colors text-sm"
                title="Back to list"
              >
                ↩
              </button>
            </div>
          ) : (
            <select
              id="business-type-select"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer appearance-none"
              value={businessType}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setIsCustom(true);
                  setCustomType("");
                } else {
                  setBusinessType(e.target.value);
                }
              }}
            >
              {BUSINESS_TYPES.map((t) => (
                <option key={t} value={t} className="bg-slate-800 text-slate-200">{t}</option>
              ))}
              <option value="custom" className="bg-slate-800 text-indigo-400 font-medium">✨ Custom Search...</option>
            </select>
          )}
        </div>

        {/* Search Button */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-transparent uppercase tracking-wider select-none">
            &nbsp;
          </label>
          <button
            id="search-button"
            type="submit"
            disabled={isLoading || !location.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-[42px] shadow-lg shadow-indigo-500/20"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5"><Lottie animationData={loadingAnimation} loop={true} /></div>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <span>🔍</span>
                <span>Search Leads</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Row 2: Max Results + Query Preview */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            📊 Max Results
          </label>
          <select
            id="max-results-select"
            className="bg-slate-900/50 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
            value={maxResults}
            onChange={(e) => setMaxResults(e.target.value)}
          >
            <option value="20" className="bg-slate-800">20</option>
            <option value="50" disabled={tierLimit < 50} className="bg-slate-800">50 {tierLimit < 50 ? "🔒" : ""}</option>
            <option value="100" disabled={tierLimit < 100} className="bg-slate-800">100 {tierLimit < 100 ? "🔒" : ""}</option>
            <option value="200" disabled={tierLimit < 200} className="bg-slate-800">200 {tierLimit < 200 ? "🔒" : ""}</option>
            <option value="500" disabled={tierLimit < 500} className="bg-slate-800">500 {tierLimit < 500 ? "🔒" : ""}</option>
          </select>
          <span className="text-xs text-slate-600">businesses</span>
        </div>

        {location.trim() && (
          <p className="text-xs text-slate-500">
            Will search:{" "}
            <span className="text-indigo-400 font-medium">
              "{isCustom ? customType || "..." : businessType} in {location}"
            </span>
            <span className="text-slate-600"> — up to {maxResults} results</span>
          </p>
        )}
      </div>
    </form>
  );
}
