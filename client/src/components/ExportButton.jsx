/**
 * ExportButton.jsx
 * Three export actions:
 *   1. 📥 Export All Leads (CSV)
 *   2. 📧 Export Emails Only (CSV)
 *   3. 📊 Export Excel (.xlsx) — 4 sheets: All, Hot, Warm, Cold
 */

import * as XLSX from "xlsx";

function escapeCSV(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const ALL_COLUMNS = [
  { header: "Business Name",   key: (r) => r.name },
  { header: "Address",         key: (r) => r.address },
  { header: "Phone",           key: (r) => r.phone || "" },
  { header: "Email",           key: (r) => (r.email && r.email !== "pending" ? r.email : "") },
  { header: "Website",         key: (r) => r.websiteUri || "" },
  { header: "Rating",          key: (r) => r.rating || "" },
  { header: "Review Count",    key: (r) => r.userRatingCount || 0 },
  { header: "Lead Score",      key: (r) => r.leadScore },
  { header: "Lead Type",       key: (r) => r.leadLabel },
  { header: "Has Website",     key: (r) => (r.websiteUri ? "Yes" : "No") },
  { header: "Has Email",       key: (r) => (r.email && r.email !== "pending" ? "Yes" : "No") },
  { header: "Search Location", key: (r) => r.searchLocation || "" },
  { header: "Search Date",     key: (r) => r.searchDate || "" },
];

const EMAIL_COLUMNS = [
  { header: "Business Name", key: (r) => r.name },
  { header: "Email",         key: (r) => r.email },
  { header: "Phone",         key: (r) => r.phone || "" },
  { header: "Website",       key: (r) => r.websiteUri || "" },
  { header: "Lead Score",    key: (r) => r.leadScore },
  { header: "Lead Type",     key: (r) => r.leadLabel },
];

function downloadCSV(rows, columns, filename) {
  const headerRow  = columns.map((c) => escapeCSV(c.header)).join(",");
  const dataRows   = rows.map((row) => columns.map((c) => escapeCSV(c.key(row))).join(","));
  const csvContent = [headerRow, ...dataRows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href  = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportExcel(results, filename) {
  const wb = XLSX.utils.book_new();

  // Helper: build a sheet from rows
  function makeSheet(rows) {
    if (rows.length === 0) {
      return XLSX.utils.aoa_to_sheet([ALL_COLUMNS.map((c) => c.header)]);
    }
    const data = [
      ALL_COLUMNS.map((c) => c.header),
      ...rows.map((r) => ALL_COLUMNS.map((c) => c.key(r) || "")),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Column widths
    ws["!cols"] = ALL_COLUMNS.map((c) => ({ wch: Math.max(c.header.length + 4, 18) }));

    // Bold + styled header row
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
      if (cell) {
        cell.s = {
          font:    { bold: true, color: { rgb: "FFFFFF" } },
          fill:    { fgColor: { rgb: "6366F1" } },
          alignment: { horizontal: "center" },
        };
      }
    }
    return ws;
  }

  const hot  = results.filter((r) => r.leadType === "hot");
  const warm = results.filter((r) => r.leadType === "warm");
  const cold = results.filter((r) => r.leadType === "cold");

  XLSX.utils.book_append_sheet(wb, makeSheet(results), "📋 All Leads");
  XLSX.utils.book_append_sheet(wb, makeSheet(hot),     "🔥 Hot Leads");
  XLSX.utils.book_append_sheet(wb, makeSheet(warm),    "⚡ Warm Leads");
  XLSX.utils.book_append_sheet(wb, makeSheet(cold),    "❄️ Cold Leads");

  XLSX.writeFile(wb, filename);
}

export default function ExportButton({ results }) {
  const hasResults = results && results.length > 0;
  const dateStr    = new Date().toISOString().slice(0, 10);

  const emailRows = (results || []).filter(
    (r) => r.email && r.email !== "pending" && r.email !== null
  );
  const hasEmails = emailRows.length > 0;

  return (
    <div className="export-group">
      {/* CSV — All */}
      <button
        id="export-csv-button"
        className="btn-export"
        disabled={!hasResults}
        onClick={() => downloadCSV(results, ALL_COLUMNS, `leads_${dateStr}.csv`)}
        title={!hasResults ? "Run a search first" : `Export ${results.length} leads as CSV`}
      >
        📥 Export CSV {hasResults && <span className="export-count">({results.length})</span>}
      </button>

      {/* Excel — 4 sheets */}
      <button
        id="export-excel-button"
        className="btn-export excel"
        disabled={!hasResults}
        onClick={() => exportExcel(results, `leads_${dateStr}.xlsx`)}
        title={!hasResults ? "Run a search first" : "Export as Excel with 4 sheets"}
      >
        📊 Excel {hasResults && <span className="export-count">({results.length})</span>}
      </button>

      {/* CSV — Emails only */}
      <button
        id="export-emails-button"
        className="btn-export emails"
        disabled={!hasEmails}
        onClick={() => downloadCSV(emailRows, EMAIL_COLUMNS, `emails_${dateStr}.csv`)}
        title={!hasEmails ? "No emails extracted yet" : `Download ${emailRows.length} emails`}
      >
        📧 Emails Only {hasEmails && <span className="export-count">({emailRows.length})</span>}
      </button>
    </div>
  );
}
