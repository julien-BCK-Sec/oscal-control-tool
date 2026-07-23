"use client";

import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type TextareaHTMLAttributes,
} from "react";
import type { MentionCandidate } from "@/app/actions/mention-candidates";

export type MentionTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange"
> & {
  value: string;
  onChange: (value: string) => void;
  candidates: MentionCandidate[];
};

/**
 * Textarea with @mention autocomplete against organization members.
 */
export function MentionTextarea({
  value,
  onChange,
  candidates,
  className = "",
  ...rest
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    if (query === null) {
      return [];
    }
    const q = query.toLowerCase();
    return candidates
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.email.split("@")[0]?.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [candidates, query]);

  function detectMention(nextValue: string, cursor: number) {
    const before = nextValue.slice(0, cursor);
    const match = before.match(/@([A-Za-z0-9._+-]*)$/);
    if (!match) {
      setQuery(null);
      setActiveIndex(0);
      return;
    }
    setQuery(match[1] ?? "");
    setActiveIndex(0);
  }

  function insertCandidate(candidate: MentionCandidate) {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    const cursor = el.selectionStart;
    const before = value.slice(0, cursor);
    const after = value.slice(cursor);
    const match = before.match(/@([A-Za-z0-9._+-]*)$/);
    if (!match) {
      return;
    }
    const token = candidate.email.split("@")[0] || candidate.name.replace(/\s+/g, "");
    const replaced = `${before.slice(0, match.index)}@${token} ${after}`;
    onChange(replaced);
    setQuery(null);
    requestAnimationFrame(() => {
      const pos = (match.index ?? 0) + token.length + 2;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (query === null || filtered.length === 0) {
      rest.onKeyDown?.(event);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % filtered.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
      return;
    }
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      insertCandidate(filtered[activeIndex] ?? filtered[0]);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setQuery(null);
      return;
    }
    rest.onKeyDown?.(event);
  }

  return (
    <div className="relative">
      <textarea
        {...rest}
        ref={textareaRef}
        value={value}
        className={className}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next);
          detectMention(next, event.target.selectionStart);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => {
          // Delay so option click can register.
          window.setTimeout(() => setQuery(null), 150);
        }}
      />
      {query !== null && filtered.length > 0 ? (
        <ul
          role="listbox"
          aria-label="Mention suggestions"
          className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-surface shadow-elevated"
        >
          {filtered.map((candidate, index) => (
            <li key={candidate.userId} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={`flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-accent-muted ${
                  index === activeIndex ? "bg-accent-muted" : ""
                }`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  insertCandidate(candidate);
                }}
              >
                <span className="font-medium text-text-primary">
                  {candidate.name}
                </span>
                <span className="text-xs text-text-secondary">
                  {candidate.email}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
