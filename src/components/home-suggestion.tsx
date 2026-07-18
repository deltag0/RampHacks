"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { HomeSuggestion as HomeSuggestionResult } from "@/domain/suggestions/home-suggestion";

type Props = {
  homeId: string;
  search: {
    destination: string;
    travelers: number;
    amenities: string[];
  };
};

export function HomeSuggestion({ homeId, search }: Props) {
  const [suggestion, setSuggestion] = useState<HomeSuggestionResult>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadSuggestion() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeId, search }),
      });
      const payload = (await response.json()) as {
        suggestion?: HomeSuggestionResult;
        error?: string;
      };

      if (!response.ok || !payload.suggestion) {
        setError(payload.error ?? "This suggestion is unavailable.");
        return;
      }

      setSuggestion(payload.suggestion);
    } catch {
      setError("This suggestion is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }

  if (suggestion) {
    return (
      <aside className="home-suggestion" aria-live="polite">
        <span>
          <Sparkles size={14} aria-hidden="true" /> {suggestion.fitLabel}
        </span>
        <strong>{suggestion.headline}</strong>
        <ul>
          {suggestion.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        <small>
          {suggestion.generatedBy === "openai"
            ? "AI-written from verified listing facts"
            : "Generated from verified listing facts"}
        </small>
      </aside>
    );
  }

  return (
    <div className="suggestion-action">
      <button type="button" onClick={loadSuggestion} disabled={loading}>
        <Sparkles size={15} aria-hidden="true" />
        {loading ? "Writing suggestion…" : "Why this suggestion?"}
      </button>
      {error ? (
        <span className="suggestion-error" role="status">
          {error}
        </span>
      ) : null}
    </div>
  );
}
