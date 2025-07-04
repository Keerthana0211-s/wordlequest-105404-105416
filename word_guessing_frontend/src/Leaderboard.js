import React, { useEffect, useState } from "react";

/*
  Leaderboard component: fetches and displays leaderboard data from external API.
  Ranks users by ascending attempts (best scores on top).
  External API is used for both fetching and (from App.js) submitting new scores.
*/

// PUBLIC_INTERFACE
export default function Leaderboard({ onBack }) {
  // SheetDB API endpoint for leaderboard
  const API_URL = "https://sheetdb.io/api/v1/jm22e5onx3agw";
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      setErr("");
      try {
        const resp = await fetch(API_URL);
        if (!resp.ok) throw new Error("Network error");
        const raw = await resp.json();
        // SheetDB returns array of objects with {"Name":..., "Attempts":...} (case-sensitive)
        // If attempt is string, convert to number
        let result = raw.map(x => ({
          // SheetDB sends "Name" and "Attempts" (uppercase first)
          name: x.Name || x.name, // Try both, but "Name" is expected
          attempts: Number(x.Attempts || x.attempts),
        })).filter(x => typeof x.attempts === "number" && !!x.name);
        // Log for diagnostics when empty or missing fields
        if (!result.length || result.some(row => !row.name)) {
          // eslint-disable-next-line no-console
          console.log("Diagnostics: SheetDB raw leaderboard data:", raw);
        }
        // Sort ascending (fewest attempts = best)
        result.sort((a, b) => a.attempts - b.attempts);
        setData(result);
      } catch (e) {
        setErr("Failed to fetch leaderboard.");
      }
      setLoading(false);
    }
    fetchLeaderboard();
  }, []);

  return (
    <div style={{
      padding: 24, maxWidth: 450, margin: "40px auto", background: "var(--bg-secondary)", borderRadius: 12,
      boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
      color: "var(--text-primary)"
    }}>
      <h2 style={{marginTop: 0}}>🏆 Leaderboard</h2>
      <div style={{marginBottom: 10, color: "var(--text-secondary)", fontSize: 14}}>Best scores (fewest attempts)</div>
      {loading && <div>Loading...</div>}
      {err && <div style={{color: "#b94a48"}}>{err}</div>}
      {(!loading && !err && data.length === 0) && <div>No scores yet. Play and win to be first!</div>}
      {(!loading && !err && data.length > 0) && (
        <table style={{
          width: "100%", textAlign: "left", fontSize: 16, borderCollapse: "collapse", marginBottom: 18
        }}>
          <thead>
            <tr>
              <th style={{padding: "6px 0"}}>#</th>
              <th>Name</th>
              <th>Attempts</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} style={{background: idx % 2 === 1 ? "rgba(0,0,0,0.02)" : "transparent"}}>
                <td style={{paddingRight: 10, fontWeight: 700}}>{idx + 1}</td>
                <td style={{padding: "4px 0"}}>
                  {row.name || <span style={{color: "#aaa"}}>—</span>}
                </td>
                <td style={{padding: "4px 0", fontVariantNumeric: "tabular-nums"}}>{row.attempts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button
        type="button"
        style={{
          padding: "10px 22px", backgroundColor: "var(--button-bg)", color: "var(--button-text)",
          border: 0, borderRadius: 8, fontWeight: 600, fontSize: 16, cursor: "pointer"
        }}
        onClick={onBack}
        aria-label="Back to game"
      >Back to Game</button>
    </div>
  );
}
