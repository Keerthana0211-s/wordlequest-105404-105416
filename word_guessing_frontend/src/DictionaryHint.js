import React, { useEffect, useState } from "react";

/**
 * DictionaryHint component
 * Fetches and displays a dictionary definition or example for a word, intended as a hint.
 * Uses the Free Dictionary API (https://api.dictionaryapi.dev/api/v2/entries/en/<word>).
 * If unavailable, falls back to a simple "No descriptive hint available." message.
 * 
 * Props:
 *   - word (string): the word to fetch and show a descriptive hint for.
 */
// PUBLIC_INTERFACE
export default function DictionaryHint({ word }) {
  const [loading, setLoading] = useState(true);
  const [hint, setHint] = useState("");
  const [error, setError] = useState(null);

  // Fetch the definition/example sentence on mount or when word changes.
  useEffect(() => {
    setLoading(true);
    setHint("");
    setError(null);

    async function fetchDefinition() {
      try {
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
          word.toLowerCase()
        )}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error("No definition found");
        const data = await resp.json();
        // Find a definition or example
        if (
          Array.isArray(data) &&
          data[0] &&
          data[0].meanings &&
          data[0].meanings.length
        ) {
          // Grab the first non-empty definition or example
          let hintText = "";
          const firstMeaning = data[0].meanings.find(
            (m) => m.definitions && m.definitions.length > 0
          );
          if (firstMeaning) {
            const defObj = firstMeaning.definitions.find(
              (d) => d.definition && d.definition.length > 0
            );
            if (defObj && defObj.definition) {
              hintText = defObj.definition;
            } else if (defObj && defObj.example) {
              hintText = `Example: ${defObj.example}`;
            }
          }
          // Fallback: Try the first definition anywhere
          if (!hintText) {
            for (const meaning of data[0].meanings) {
              for (const d of meaning.definitions) {
                if (d.definition) {
                  hintText = d.definition;
                  break;
                }
              }
              if (hintText) break;
            }
          }
          if (hintText) {
            setHint(hintText);
            setLoading(false);
            return;
          }
        }
        throw new Error("No definition available");
      } catch (e) {
        setError("No descriptive hint available.");
        setLoading(false);
      }
    }

    fetchDefinition();
  }, [word]);

  return (
    <div
      style={{
        margin: "0.7rem auto 0.6rem",
        padding: "11px 16px",
        maxWidth: 360,
        borderRadius: 10,
        background: "#ffe19f",
        color: "#613320",
        fontWeight: 600,
        fontSize: 18,
        letterSpacing: 1,
        border: "2px solid #ffce64",
        boxShadow: "0 0 8px #f6d07c60",
      }}
      aria-live="polite"
    >
      <span role="img" aria-label="hint" style={{ marginRight: 7 }}>
        💡
      </span>
      {loading && <span>Fetching hint...</span>}
      {!loading && hint && (
        <span>
          Hint: <i>{hint}</i>
        </span>
      )}
      {!loading && !hint && error && (
        <span>
          Hint: <i>No descriptive hint available.</i>
        </span>
      )}
    </div>
  );
}
