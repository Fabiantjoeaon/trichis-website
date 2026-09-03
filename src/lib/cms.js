const BLOCK_TAGS =
  "p|h[1-6]|div|ul|ol|li|blockquote|pre|hr|br|table|tr|td|th|thead|tbody|tfoot|section|article|aside|header|footer|nav|main|figure|figcaption|address";

const SOFT_BREAK_RE = new RegExp(
  `\\r?\\n(?!\\s*<\\/?(?:${BLOCK_TAGS})\\b)`,
  "g",
);

const BLOCK_RE =
  /<(p|h[1-6]|ul|ol|blockquote|div)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi;

export function preserveSoftLineBreaks(html) {
  if (typeof html !== "string" || !html) return html;
  return html.replace(SOFT_BREAK_RE, "<br>");
}

export function isEmptyHtml(html) {
  return !String(html)
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, "")
    .replace(/\s+/g, "");
}

export function markdownBoldToHtml(text) {
  return String(text).replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>");
}

export function looksLikeHtml(text) {
  return typeof text === "string" && /<\/?[a-z][\s\S]*>/i.test(text);
}

export function splitParagraphs(html) {
  if (typeof html !== "string" || !html) return [];
  const matches = html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi);
  return Array.from(matches, (m) => m[1].trim()).filter((inner) => !isEmptyHtml(inner));
}

export function splitRichBlocks(html) {
  if (typeof html !== "string" || !html.trim()) return [];
  const source = html.trim();
  const blocks = [];
  let last = 0;
  let found = false;

  for (const match of source.matchAll(BLOCK_RE)) {
    found = true;
    const before = source.slice(last, match.index).trim();
    if (before && !isEmptyHtml(before)) {
      blocks.push({ tag: "p", html: before });
    }
    const tag = match[1].toLowerCase();
    const inner = match[3];
    if (!isEmptyHtml(inner) || tag === "ul" || tag === "ol") {
      blocks.push({ tag, html: inner });
    }
    last = match.index + match[0].length;
  }

  const tail = source.slice(last).trim();
  if (tail && !isEmptyHtml(tail)) {
    blocks.push({ tag: "p", html: tail });
  }
  if (!found && source && !isEmptyHtml(source)) {
    blocks.push({ tag: "p", html: source });
  }
  return blocks;
}

function onlyStrongInner(html) {
  const match = String(html)
    .trim()
    .match(/^<strong\b[^>]*>([\s\S]*)<\/strong>$/i);
  if (!match) return null;
  if (/<(p|ul|ol|div|h[1-6])\b/i.test(match[1])) return null;
  return match[1];
}

export function convertMultiParagraphToNineFormat(text) {
  if (!text) return [];
  const trimmed = String(text).trim();
  if (!trimmed) return [];

  if (looksLikeHtml(trimmed)) {
    const raw = markdownBoldToHtml(trimmed);
    return splitRichBlocks(preserveSoftLineBreaks(raw)).map((block) => {
      const strongOnly = onlyStrongInner(block.html);
      if (strongOnly != null && block.tag === "p") {
        return {
          tag: "strong",
          text: strongOnly,
          html: true,
        };
      }
      const isList = block.tag === "ul" || block.tag === "ol";
      return {
        tag: block.tag,
        text: block.html,
        html: true,
        static: isList || block.tag === "blockquote" || block.tag === "div",
      };
    });
  }

  return trimmed
    .split("\n")
    .filter((line) => line.trim().length > 1)
    .map((paragraph) => {
      if (paragraph.includes("**")) {
        return { tag: "strong", text: paragraph.replaceAll("**", "") };
      }
      return { tag: "p", text: paragraph };
    });
}
