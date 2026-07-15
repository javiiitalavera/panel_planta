const RICH_TAG_PATTERN = /<(?:strong|b|u|span|font|br|div|p)\b/i;
const TAG_TOKEN_PATTERN = /<[^>]*>|[^<]+/g;

export type RichTextSegment = {
  text?: string;
  break?: true;
  bold?: boolean;
  underline?: boolean;
  color?: string;
};

type FormatState = Pick<RichTextSegment, "bold" | "underline" | "color">;

type StackEntry = {
  tag: string;
  previous: FormatState;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: "\u00a0",
    "#39": "'",
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
    const lower = code.toLowerCase();
    if (named[lower] !== undefined) return named[lower];

    if (lower.startsWith("#x")) {
      const point = Number.parseInt(lower.slice(2), 16);
      return Number.isFinite(point) ? String.fromCodePoint(point) : entity;
    }

    if (lower.startsWith("#")) {
      const point = Number.parseInt(lower.slice(1), 10);
      return Number.isFinite(point) ? String.fromCodePoint(point) : entity;
    }

    return entity;
  });
}

function normalizeColor(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim().toLowerCase();
  const shortHex = trimmed.match(/^#([0-9a-f]{3})$/i);
  if (shortHex) {
    const [r, g, b] = shortHex[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed;

  const rgb = trimmed.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/i,
  );
  if (!rgb) return null;

  const channels = rgb.slice(1, 4).map((channel) =>
    Math.max(0, Math.min(255, Number(channel))),
  );

  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function attributeValue(tag: string, name: string): string | null {
  const quoted = tag.match(new RegExp(`${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  if (quoted) return decodeHtmlEntities(quoted[2]);

  const bare = tag.match(new RegExp(`${name}\\s*=\\s*([^\\s>]+)`, "i"));
  return bare ? decodeHtmlEntities(bare[1]) : null;
}

function styleValue(style: string, property: string): string | null {
  const match = style.match(new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, "i"));
  return match ? match[1].trim() : null;
}

function appendBreak(segments: RichTextSegment[]): void {
  if (!segments.length || segments.at(-1)?.break) return;
  segments.push({ break: true });
}

function appendText(
  segments: RichTextSegment[],
  text: string,
  format: FormatState,
): void {
  if (!text) return;

  const previous = segments.at(-1);
  if (
    previous &&
    !previous.break &&
    previous.bold === format.bold &&
    previous.underline === format.underline &&
    previous.color === format.color
  ) {
    previous.text = `${previous.text ?? ""}${text}`;
    return;
  }

  segments.push({ text, ...format });
}

function formatFromTag(tagToken: string, current: FormatState): FormatState {
  const next = { ...current };
  const name = tagToken.match(/^<\s*([a-z0-9]+)/i)?.[1]?.toLowerCase();

  if (name === "b" || name === "strong") next.bold = true;
  if (name === "u") next.underline = true;

  if (name === "font") {
    next.color = normalizeColor(attributeValue(tagToken, "color")) ?? next.color;
  }

  if (name === "span") {
    const style = attributeValue(tagToken, "style") ?? "";
    const weight = styleValue(style, "font-weight")?.toLowerCase();
    const decoration = `${styleValue(style, "text-decoration") ?? ""} ${styleValue(style, "text-decoration-line") ?? ""}`.toLowerCase();
    const color = normalizeColor(styleValue(style, "color"));

    if (weight === "bold" || (weight && Number(weight) >= 600)) next.bold = true;
    if (decoration.includes("underline")) next.underline = true;
    if (color) next.color = color;
  }

  return next;
}

function trimBreaks(segments: RichTextSegment[]): RichTextSegment[] {
  const result = [...segments];
  while (result[0]?.break) result.shift();
  while (result.at(-1)?.break) result.pop();
  return result;
}

export function parseRichTextSegments(value: string): RichTextSegment[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  if (!RICH_TAG_PATTERN.test(trimmed)) {
    const segments: RichTextSegment[] = [];
    trimmed.split(/\r?\n/).forEach((line, index) => {
      if (index > 0) segments.push({ break: true });
      appendText(segments, line, {});
    });
    return trimBreaks(segments);
  }

  const safeSource = trimmed.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  const tokens = safeSource.match(TAG_TOKEN_PATTERN) ?? [];
  const segments: RichTextSegment[] = [];
  const stack: StackEntry[] = [];
  let format: FormatState = {};

  for (const token of tokens) {
    if (!token.startsWith("<")) {
      appendText(segments, decodeHtmlEntities(token).replace(/\u00a0/g, " "), format);
      continue;
    }

    const closing = token.match(/^<\s*\/\s*([a-z0-9]+)/i);
    if (closing) {
      const tag = closing[1].toLowerCase();
      const index = stack.map((entry) => entry.tag).lastIndexOf(tag);
      if (index >= 0) {
        format = { ...stack[index].previous };
        stack.splice(index);
      }
      continue;
    }

    const opening = token.match(/^<\s*([a-z0-9]+)/i);
    if (!opening) continue;

    const tag = opening[1].toLowerCase();
    if (tag === "br") {
      appendBreak(segments);
      continue;
    }

    if (tag === "div" || tag === "p") {
      appendBreak(segments);
      continue;
    }

    if (!["b", "strong", "u", "font", "span"].includes(tag)) continue;

    const previous = { ...format };
    format = formatFromTag(token, format);
    stack.push({ tag, previous });
  }

  return trimBreaks(segments);
}

export function sanitizeRichText(value: string): string {
  return parseRichTextSegments(value)
    .map((segment) => {
      if (segment.break) return "<br>";

      let result = escapeHtml(segment.text ?? "");
      if (segment.bold) result = `<strong>${result}</strong>`;
      if (segment.underline) result = `<u>${result}</u>`;
      if (segment.color) result = `<span style="color:${segment.color}">${result}</span>`;
      return result;
    })
    .join("")
    .trim();
}

export function richTextToPlainText(value: string): string {
  return parseRichTextSegments(value)
    .map((segment) => (segment.break ? "\n" : segment.text ?? ""))
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function richTextIsEmpty(value: string): boolean {
  return richTextToPlainText(value).length === 0;
}

export function richTextForEditor(value: string): string {
  return sanitizeRichText(value);
}

export function colorToHexWithoutHash(value: string | null | undefined): string | null {
  return normalizeColor(value)?.slice(1).toUpperCase() ?? null;
}
