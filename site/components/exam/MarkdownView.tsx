"use client";

import { Fragment, type ReactNode } from "react";
import { inlineText, parseBlocks, parseInline, safeHref, speakableText, type Block, type Inline } from "@/lib/exam-markdown";
import { playSpeech, useSpeech } from "./speech";
import styles from "./exam.module.css";

/** One Swedish line the learner can tap to hear. */
export function SwedishChip({ text, children }: { text: string; children: ReactNode }) {
  const key = `chip:${text}`;
  const { state, error } = useSpeech(key);
  return (
    <>
      <button
        type="button"
        className={styles.chip}
        data-state={state}
        aria-label={`${state === "idle" ? "Hear" : "Stop"}: ${text}`}
        onClick={() => void playSpeech(key, { text })}
      >
        {children}
      </button>
      {error ? <span role="status" className={styles.chipError}>{error}</span> : null}
    </>
  );
}

function renderInline(nodes: Inline[], playable: boolean, keyPrefix = "i"): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}${index}`;
    switch (node.t) {
      case "text": return <Fragment key={key}>{node.v}</Fragment>;
      case "strong": return <strong key={key}>{renderInline(node.c, playable, key)}</strong>;
      case "del": return <del key={key}>{renderInline(node.c, playable, key)}</del>;
      case "code": return <code key={key}>{node.v}</code>;
      case "br": return <br key={key} />;
      case "link": {
        const href = safeHref(node.href);
        // in-page anchors would change the app's own #hash route, so they are shown as text
        return href && !href.startsWith("#")
          ? <a key={key} href={href} target="_blank" rel="noreferrer noopener">{renderInline(node.c, playable, key)}</a>
          : <Fragment key={key}>{renderInline(node.c, playable, key)}</Fragment>;
      }
      case "em": {
        const speak = playable ? speakableText(inlineText(node.c)) : null;
        return speak
          ? <SwedishChip key={key} text={speak}>{renderInline(node.c, playable, key)}</SwedishChip>
          : <em key={key}>{renderInline(node.c, playable, key)}</em>;
      }
    }
  });
}

function renderBlocks(blocks: Block[], playable: boolean, keyPrefix = "b"): ReactNode[] {
  return blocks.map((block, index) => {
    const key = `${keyPrefix}${index}`;
    switch (block.t) {
      case "heading": {
        const level = Math.min(6, Math.max(3, block.level + 1));
        const Tag = `h${level}` as "h3" | "h4" | "h5" | "h6";
        return <Tag key={key}>{renderInline(block.c, playable, key)}</Tag>;
      }
      case "para": return <p key={key}>{renderInline(block.c, playable, key)}</p>;
      case "hr": return <hr key={key} />;
      case "code": return <pre key={key}><code>{block.v}</code></pre>;
      case "quote": return <blockquote key={key}>{renderBlocks(block.blocks, playable, key)}</blockquote>;
      case "list": {
        const Tag = block.ordered ? "ol" : "ul";
        return (
          <Tag key={key}>
            {block.items.map((item, i) => (
              <li key={`${key}-${i}`}>
                {renderInline(item.c, playable, `${key}-${i}`)}
                {item.children.length ? renderBlocks(item.children, playable, `${key}-${i}c`) : null}
              </li>
            ))}
          </Tag>
        );
      }
      case "table":
        return (
          <div className={styles.tableWrap} key={key}>
            <table>
              <thead><tr>{block.head.map((cell, c) => <th key={c}>{renderInline(cell, playable, `${key}h${c}`)}</th>)}</tr></thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r}>{row.map((cell, c) => <td key={c}>{renderInline(cell, playable, `${key}r${r}c${c}`)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  });
}

/**
 * Renders course Markdown as React nodes (never as HTML). With `playable`, every Swedish
 * phrase (written in *italics* in the course files) becomes a tap-to-hear chip.
 */
export default function MarkdownView({ markdown, playable = false }: { markdown: string; playable?: boolean }) {
  return <div className={styles.md}>{renderBlocks(parseBlocks(markdown), playable)}</div>;
}

/** One line of Markdown (bold, italics, ~~strikethrough~~) as React nodes, for short strings such as done-when text. */
export function InlineMarkdown({ text, playable = false }: { text: string; playable?: boolean }) {
  return <>{renderInline(parseInline(text), playable, "m")}</>;
}
