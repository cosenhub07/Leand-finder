/**
 * leadScorer.js
 * Core business logic: scores a business lead based on weakness of online presence.
 * Higher score = weaker online presence = better potential client for the agency.
 *
 * Max possible score: 100
 * 🔥 Hot Lead  → 60–100
 * ⚡ Warm Lead → 35–59
 * ❄️ Cold Lead  → 0–34
 */

/**
 * @param {Object} place — normalized place object from Google Places API
 * @returns {{ score: number, label: string, emoji: string, breakdown: Object }}
 */
function scoreLead(place) {
  let score = 0;
  const breakdown = {};

  // +25 → No website listed
  if (!place.websiteUri) {
    score += 25;
    breakdown.noWebsite = { points: 25, triggered: true };
  } else {
    breakdown.noWebsite = { points: 0, triggered: false };
  }

  // +20 → Rating below 3.5 stars (or no rating at all)
  if (!place.rating || place.rating < 3.5) {
    score += 20;
    breakdown.lowRating = { points: 20, triggered: true };
  } else {
    breakdown.lowRating = { points: 0, triggered: false };
  }

  // +20 → Less than 5 reviews total (or no reviews)
  if (!place.userRatingCount || place.userRatingCount < 5) {
    score += 20;
    breakdown.fewReviews = { points: 20, triggered: true };
  } else {
    breakdown.fewReviews = { points: 0, triggered: false };
  }

  // +15 → Less than 3 photos on Google
  const photoCount = Array.isArray(place.photos) ? place.photos.length : 0;
  if (photoCount < 3) {
    score += 15;
    breakdown.fewPhotos = { points: 15, triggered: true, count: photoCount };
  } else {
    breakdown.fewPhotos = { points: 0, triggered: false, count: photoCount };
  }

  // +10 → Phone number missing
  if (!place.nationalPhoneNumber) {
    score += 10;
    breakdown.noPhone = { points: 10, triggered: true };
  } else {
    breakdown.noPhone = { points: 0, triggered: false };
  }

  // +10 → Business hours not listed
  if (!place.currentOpeningHours) {
    score += 10;
    breakdown.noHours = { points: 10, triggered: true };
  } else {
    breakdown.noHours = { points: 0, triggered: false };
  }

  // Cap at 100
  score = Math.min(score, 100);

  // Determine label and emoji
  let label, emoji, type;
  if (score >= 60) {
    label = "Hot Lead";
    emoji = "🔥";
    type = "hot";
  } else if (score >= 35) {
    label = "Warm Lead";
    emoji = "⚡";
    type = "warm";
  } else {
    label = "Cold Lead";
    emoji = "❄️";
    type = "cold";
  }

  return { score, label, emoji, type, breakdown };
}

module.exports = { scoreLead };
