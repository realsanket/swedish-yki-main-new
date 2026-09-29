import glossary from "../content/grammar-terms.json";

/** One grammar word explained for a learner who has never studied grammar. */
export type GrammarTerm = {
  id: string;
  term: string;
  /** Spellings to recognise inside teaching text, e.g. verb and verbs. */
  aliases: string[];
  plain: string;
  english: string;
  swedish: string;
  tip?: string;
};

export const grammarTerms = glossary.terms as GrammarTerm[];

/** The glossary entries a lecture opts into, in the lecture's own order. */
export function grammarTermsFor(ids: readonly string[] | undefined): GrammarTerm[] {
  if (!ids?.length) return [];
  return ids.flatMap((id) => grammarTerms.find((term) => term.id === id) ?? []);
}

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

/**
 * Finds every alias as a whole word. Longer aliases win, so "front vowel" is
 * matched before "vowel" and "verb second" before "verb".
 */
export function findTerms(text: string, terms: readonly GrammarTerm[]) {
  const entries = terms
    .flatMap((term) => term.aliases.map((alias) => ({ alias, term })))
    .sort((a, b) => b.alias.length - a.alias.length);
  if (!entries.length || !text) return [];
  const pattern = new RegExp(`(?<![\\p{L}])(${entries.map((entry) => escape(entry.alias)).join("|")})(?![\\p{L}])`, "giu");
  const matches: { start: number; end: number; term: GrammarTerm }[] = [];
  for (const match of text.matchAll(pattern)) {
    const found = entries.find((entry) => entry.alias.toLocaleLowerCase("en") === match[0].toLocaleLowerCase("en"));
    if (found && match.index !== undefined) matches.push({ start: match.index, end: match.index + match[0].length, term: found.term });
  }
  return matches;
}

/** The lecture terms that actually appear in some text, in glossary order. */
export function termsInText(texts: readonly string[], terms: readonly GrammarTerm[]) {
  const ids = new Set(texts.flatMap((text) => findTerms(text, terms).map((match) => match.term.id)));
  return terms.filter((term) => ids.has(term.id));
}
