/**
 * ResultsTable.jsx
 * Responsive table showing all scored business leads with live email states.
 */

import React from "react";
import LeadBadge from "./LeadBadge";

function StarRating({ rating }) {
  if (!rating) return <span className="text-slate-600 text-xs">No rating</span>;
  const stars = Math.round(rating);
  return (
    <span className="flex items-center gap-1">
      <span className="text-yellow-400 text-xs">{"★".repeat(stars)}{"☆".repeat(5 - stars)}</span>
      <span className="text-slate-300 text-xs font-medium">{rating.toFixed(1)}</span>
    </span>
  );
}

function EmailCell({ email }) {
  if (email === "pending") {
    return (
      <span className="email-searching text-xs flex items-center gap-1">
        🔍 Searching...
      </span>
    );
  }
  if (!email) {
    return <span className="text-slate-600 text-xs italic">Not found</span>;
  }
  return (
    <a
      href={`mailto:${email}`}
      className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1 transition-colors group"
      title={email}
    >
      <span>📧</span>
      <span className="underline underline-offset-2 group-hover:no-underline break-all">{email}</span>
    </a>
  );
}

function WebsiteCell({ uri }) {
  if (!uri) return <span className="text-red-500 text-sm">❌</span>;
  return (
    <a
      href={uri}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-400 hover:text-indigo-300 text-xs underline underline-offset-2 transition-colors break-all"
      title={uri}
    >
      🌐 {new URL(uri.startsWith("http") ? uri : "https://" + uri).hostname.replace(/^www\./, "")}
    </a>
  );
}

function PhoneCell({ phone }) {
  if (!phone) return <span className="text-red-500 text-sm">❌</span>;
  return (
    <a
      href={`tel:${phone}`}
      className="text-slate-300 hover:text-white text-xs transition-colors whitespace-nowrap"
    >
      📞 {phone}
    </a>
  );
}

const ROW_CLASS = {
  hot:  "row-hot",
  warm: "row-warm",
  cold: "row-cold",
};

export default function ResultsTable({ results }) {
  if (results.length === 0) {
    return (
      <div className="glass-card">
        <div className="empty-state">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-slate-400 text-lg font-medium">No results to show</p>
          <p className="text-slate-600 text-sm mt-1">Try adjusting your filters or run a new search.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="results-table">
          <thead>
            <tr>
              <th className="text-left hidden sm:table-cell">#</th>
              <th className="text-left">Business</th>
              <th className="text-left hidden md:table-cell">Phone</th>
              <th className="text-left">Website</th>
              <th className="text-left">Email</th>
              <th className="text-left">Rating</th>
              <th className="text-left text-center">Reviews</th>
              <th className="text-left hidden md:table-cell">Photos</th>
              <th className="text-left">Score &amp; Type</th>
            </tr>
          </thead>
          <tbody>
            {results.map((biz, idx) => (
              <tr
                key={biz.placeId || idx}
                className={`${ROW_CLASS[biz.leadType] || ""} transition-all duration-150 animate-fade-in`}
                style={{ animationDelay: `${Math.min(idx * 30, 500)}ms` }}
              >
                {/* # */}
                <td className="text-slate-600 text-xs font-mono w-8 hidden sm:table-cell">{idx + 1}</td>

                {/* Business Name + Address */}
                <td className="min-w-[150px] max-w-[200px]">
                  <div className="font-semibold text-slate-100 text-sm leading-tight">
                    {biz.googleMapsUri ? (
                      <a
                        href={biz.googleMapsUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-indigo-300 transition-colors"
                      >
                        {biz.name}
                      </a>
                    ) : (
                      biz.name
                    )}
                  </div>
                  {biz.address && (
                    <div className="text-slate-500 text-xs mt-0.5 leading-snug line-clamp-2">
                      {biz.address}
                    </div>
                  )}
                </td>

                {/* Phone */}
                <td className="whitespace-nowrap hidden md:table-cell">
                  <PhoneCell phone={biz.phone} />
                </td>

                {/* Website */}
                <td className="max-w-[120px] truncate">
                  <WebsiteCell uri={biz.websiteUri} />
                </td>

                {/* Email */}
                <td className="max-w-[150px] truncate">
                  <EmailCell email={biz.email} />
                </td>

                {/* Rating */}
                <td>
                  <StarRating rating={biz.rating} />
                </td>

                {/* Reviews */}
                <td className="text-slate-400 text-xs text-center">
                  {biz.userRatingCount > 0 ? biz.userRatingCount.toLocaleString() : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>

                {/* Photos */}
                <td className="text-slate-400 text-xs text-center hidden md:table-cell">
                  <span className={biz.photoCount < 3 ? "text-amber-500 font-semibold" : "text-slate-400"}>
                    {biz.photoCount}
                  </span>
                </td>

                {/* Score + Badge */}
                <td className="min-w-[130px]">
                  <LeadBadge
                    score={biz.leadScore}
                    label={biz.leadLabel}
                    emoji={biz.leadEmoji}
                    type={biz.leadType}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
