"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, X } from "lucide-react";
import { findTerms, type GrammarTerm } from "@/lib/grammar-terms";
import styles from "./GrammarNotes.module.css";

type Glossary = {
  terms: GrammarTerm[];
  active: string | null;
  setActive: (id: string | null) => void;
};

const GlossaryContext = createContext<Glossary | null>(null);

/** Makes a lecture's grammar words available to every text inside it. */
export function GlossaryProvider({ terms, children }: { terms: GrammarTerm[]; children: ReactNode }) {
  const [active, setActive] = useState<string | null>(null);
  return <GlossaryContext.Provider value={{ terms, active, setActive }}>{children}</GlossaryContext.Provider>;
}

function TermCard({ term, compact = false }: { term: GrammarTerm; compact?: boolean }) {
  return (
    <>
      <b>{term.term}</b>
      <p>{term.plain}</p>
      {!compact && (
        <dl>
          <dt>English</dt>
          <dd>{term.english}</dd>
          <dt>Swedish</dt>
          <dd lang="sv">{term.swedish}</dd>
        </dl>
      )}
      {!compact && term.tip && <small>{term.tip}</small>}
    </>
  );
}

/**
 * Plain text with the lecture's grammar words underlined. The first mention
 * of each word is tappable and opens a short plain-English note beside it.
 * Outside a GlossaryProvider it renders the text unchanged.
 */
export function GlossText({ text }: { text: string }) {
  const glossary = useContext(GlossaryContext);
  const [open, setOpen] = useState<string | null>(null);
  const wrapper = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !wrapper.current?.contains(event.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  if (!glossary?.terms.length) return <>{text}</>;
  const toggle = (key: string, termId: string) => {
    setOpen(open === key ? null : key);
    glossary.setActive(termId);
  };
  const seen = new Set<string>();
  const matches = findTerms(text, glossary.terms).filter((match) => {
    if (seen.has(match.term.id)) return false;
    seen.add(match.term.id);
    return true;
  });
  if (!matches.length) return <>{text}</>;
  const parts: ReactNode[] = [];
  let cursor = 0;
  matches.forEach((match, index) => {
    parts.push(text.slice(cursor, match.start));
    const key = `${match.term.id}-${index}`;
    parts.push(
      <span className={styles.inline} key={key}>
        {/* A span, not a button, so a long term wraps across lines like the text around it. */}
        <span
          role="button"
          tabIndex={0}
          className={styles.termButton}
          aria-expanded={open === key}
          onClick={() => toggle(key, match.term.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggle(key, match.term.id);
            }
          }}
        >
          {text.slice(match.start, match.end)}
        </span>
        {open === key && (
          <span className={styles.popover} role="note">
            <TermCard term={match.term} compact />
          </span>
        )}
      </span>,
    );
    cursor = match.end;
  });
  parts.push(text.slice(cursor));
  return <span ref={wrapper}>{parts}</span>;
}

/**
 * The side column beside a teaching topic: only the grammar words this topic
 * uses, each in plain English with a familiar English example first.
 */
export function GrammarSideNotes({ terms }: { terms: GrammarTerm[] }) {
  const glossary = useContext(GlossaryContext);
  const all = glossary?.terms ?? [];
  const others = all.filter((term) => !terms.some((shown) => shown.id === term.id));
  const refs = useRef<Record<string, HTMLLIElement | null>>({});
  const active = glossary?.active;
  useEffect(() => {
    if (active) refs.current[active]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [active]);
  if (!all.length) return null;
  return (
    <aside className={styles.side} aria-label="Grammar words in plain English">
      <div className={styles.sideHead}>
        <BookOpen size={17} aria-hidden="true" />
        <div>
          <b>Grammar words, in plain English</b>
          <small>Tap any underlined word in the lesson to highlight it here.</small>
        </div>
      </div>
      {terms.length ? (
        <ul>
          {terms.map((term) => (
            <li
              key={term.id}
              ref={(node) => {
                refs.current[term.id] = node;
              }}
              className={active === term.id ? styles.activeNote : ""}
            >
              <TermCard term={term} />
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>No grammar words in this topic. Just listen and copy.</p>
      )}
      {others.length > 0 && (
        <details className={styles.more}>
          <summary>All grammar words in this lecture ({all.length})</summary>
          <ul>
            {others.map((term) => (
              <li key={term.id}>
                <TermCard term={term} compact />
              </li>
            ))}
          </ul>
        </details>
      )}
      {active && (
        <button type="button" className={styles.clear} onClick={() => glossary?.setActive(null)}>
          <X size={13} aria-hidden="true" /> Clear highlight
        </button>
      )}
    </aside>
  );
}
