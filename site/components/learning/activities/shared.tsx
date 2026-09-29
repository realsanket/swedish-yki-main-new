/** Deterministic shuffle so server and client renders agree and a retry reorders. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const next = () => {
    hash = Math.imul(hash ^ (hash >>> 15), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    hash ^= hash >>> 16;
    return (hash >>> 0) / 4294967296;
  };
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Highlights the first case-insensitive occurrence of `mark` inside a word. */
export function MarkedWord({ text, mark, className }: { text: string; mark?: string; className?: string }) {
  const start = mark ? text.toLocaleLowerCase("sv").indexOf(mark.toLocaleLowerCase("sv")) : -1;
  if (!mark || start < 0) return <span lang="sv">{text}</span>;
  return (
    <span lang="sv">
      {text.slice(0, start)}
      <mark className={className}>{text.slice(start, start + mark.length)}</mark>
      {text.slice(start + mark.length)}
    </span>
  );
}
