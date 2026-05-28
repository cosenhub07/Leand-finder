# 🔍 LeadFinder Pro

A professional **Lead Generation Tool** for marketing & web design agencies.  
Find small businesses with weak online presence, auto-extract emails, and export leads to CSV.

---

## ✨ Features

- 🔎 Search businesses by **location + type** (restaurants, salons, medical stores, etc.)
- 🏆 **Automatic lead scoring** (0–100) based on online presence weakness
- 📧 **Email extraction** — crawls business websites automatically in parallel
- 📊 **Real-time progress** — results appear instantly, emails stream in live
- 🎯 **Smart filters** — Hot/Warm/Cold leads, No Website Only, Has Email Only
- 📥 **CSV Export** — 14 columns including lead score, type, email

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18 or higher — [download here](https://nodejs.org)
- A **Google Cloud** account with **Places API (New)** enabled

### 1. Install Backend

```bash
cd server
npm install
```

### 2. Install Frontend

```bash
cd client
npm install
```

### 3. Start Backend (Terminal 1)

```bash
cd server
npm start
```

> Backend runs at **http://localhost:3001**

### 4. Start Frontend (Terminal 2)

```bash
cd client
npm run dev
```

> Frontend runs at **http://localhost:5173**

---

## 🔑 Google Places API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Navigate to **APIs & Services → Library**
4. Search for **"Places API (New)"** and enable it
5. Go to **APIs & Services → Credentials**
6. Click **Create Credentials → API Key**
7. Copy the key — paste it into the LeadFinder UI (it's pre-filled with a demo key)

> **Important**: Make sure you enable **"Places API (New)"** — NOT the legacy "Places API"

---

## 🧠 Lead Scoring System

| Criterion | Points |
|---|---|
| No website listed | +25 |
| Rating below 3.5 stars | +20 |
| Less than 5 reviews | +20 |
| Less than 3 photos | +15 |
| Phone number missing | +10 |
| Business hours not listed | +10 |
| **Maximum** | **100** |

| Score Range | Label |
|---|---|
| 60–100 | 🔥 Hot Lead |
| 35–59 | ⚡ Warm Lead |
| 0–34 | ❄️ Cold Lead |

---

## 📁 Project Structure

```
lead-finder/
├── client/                          ← React + Tailwind (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchForm.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── ResultsTable.jsx
│   │   │   ├── LeadBadge.jsx
│   │   │   └── ExportButton.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/
│   ├── routes/
│   │   └── places.js                ← /api/search + /api/extract-emails (SSE)
│   ├── utils/
│   │   ├── leadScorer.js
│   │   └── emailExtractor.js
│   ├── index.js
│   └── package.json
│
└── README.md
```

---

## 📥 CSV Export Columns

| Column | Description |
|---|---|
| Business Name | Full business name |
| Address | Formatted address |
| Phone | Phone number or blank |
| Email | Extracted email or blank |
| Website | Website URL or blank |
| Rating | Google rating (1–5) |
| Review Count | Total review count |
| Photo Count | Number of Google photos |
| Lead Score | 0–100 score |
| Lead Type | Hot / Warm / Cold |
| Has Website | Yes / No |
| Has Email | Yes / No |
| Search Location | Original search query |
| Search Date | Date of search |

---

## ⚙️ API Endpoints

### `POST /api/search`
Search Google Places and score leads.

```json
{
  "textQuery": "restaurants in Bhopal India",
  "apiKey": "your-google-api-key"
}
```

### `POST /api/extract-emails`
Extract emails from business websites via Server-Sent Events (SSE stream).

```json
{
  "businesses": [
    { "placeId": "ChIJ...", "websiteUri": "https://example.com" }
  ]
}
```

Returns a stream of SSE events:
```
data: {"type":"start","total":12}
data: {"type":"result","placeId":"ChIJ...","email":"owner@business.com","completed":1,"total":12}
data: {"type":"done","total":12}
```

---

## 🛡️ Technical Notes

- API key is **never hardcoded** — entered by user in the UI
- Email crawling uses **5-second timeouts** per site — no crashes on slow sites
- **Promise.allSettled()** runs all crawls in parallel — one failure doesn't stop others
- CORS is configured to allow `localhost:5173` during development
- Business hours missing → treated as additional weakness signal

---

## 🐛 Troubleshooting

| Issue | Fix |
|---|---|
| "API key invalid" | Ensure **Places API (New)** is enabled in Google Cloud |
| No results returned | Try a broader query like "restaurants in Mumbai" |
| Emails not found | Many sites block bots — this is normal; tool handles gracefully |
| CORS error | Make sure backend is running on port 3001 before starting frontend |
