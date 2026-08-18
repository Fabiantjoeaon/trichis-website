const BLOCK_TAGS =
  "p|h[1-6]|div|ul|ol|li|blockquote|pre|hr|br|table|tr|td|th|thead|tbody|tfoot|section|article|aside|header|footer|nav|main|figure|figcaption|address";

const SOFT_BREAK_RE = new RegExp(
  `\\r?\\n(?!\\s*<\\/?(?:${BLOCK_TAGS})\\b)`,
  "g",
);

export function preserveSoftLineBreaks(html) {
  if (typeof html !== "string" || !html) return html;
  return html.replace(SOFT_BREAK_RE, "<br>");
}

export function splitParagraphs(html) {
  if (typeof html !== "string" || !html) return [];
  const matches = html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi);
  return Array.from(matches, (m) => m[1].trim()).filter(Boolean);
}

export function convertMultiParagraphToNineFormat(text) {
  if (!text) return [];
  return text
    .split("\n")
    .filter((t) => t.length > 1)
    .map((paragraph) => {
      if (paragraph.includes("**")) {
        return { tag: "strong", text: paragraph.replaceAll("**", "") };
      }
      return { tag: "p", text: paragraph };
    });
}