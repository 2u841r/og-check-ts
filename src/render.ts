import { marked } from 'marked';
import { markedTerminal } from 'marked-terminal';
import { findByKey, Meta, NAMESPACE_ORDER, NAMESPACE_PREFIX, NAMESPACE_LABEL } from './scan.js';
import { renderKittyImage } from './kitty.js';

export class MissingFieldError extends Error {
  constructor(public readonly field: string) {
    super(`Missing required field: ${field}`);
    this.name = 'MissingFieldError';
  }
}

let rendererReady = false;

function setupRenderer(): void {
  if (rendererReady) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  marked.use(markedTerminal() as any);
  rendererReady = true;
}

// Split markdown on image tags, render text parts with marked,
// inject Kitty/fallback output for image parts.
function renderMarkdown(markdown: string): string {
  setupRenderer();

  // Split on ![...](...)  — odd indices are full image tags
  const parts = markdown.split(/(!\[[^\]]*\]\([^)]+\))/);
  let result = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i] ?? '';
    if (i % 2 === 0) {
      if (part) {
        result += marked.parse(part, { async: false }) as string;
      }
    } else {
      const match = part.match(/!\[[^\]]*\]\(([^)]+)\)/);
      if (match?.[1]) {
        result += renderKittyImage(match[1]);
      }
    }
  }

  return result;
}

export function writeOpenGraph(tags: Meta[]): void {
  const title = findByKey('og:title', tags);
  if (!title) throw new MissingFieldError('og:title');

  const type = findByKey('og:type', tags);
  if (!type) throw new MissingFieldError('og:type');

  const image = findByKey('og:image', tags);
  if (!image) throw new MissingFieldError('og:image');

  const url = findByKey('og:url', tags);
  if (!url) throw new MissingFieldError('og:url');

  let md = `# Title: [${title.value}](${url.value})\n\n`;

  const description = findByKey('og:description', tags);
  if (description) md += `## Description\n\n${description.value}\n\n`;

  const siteName = findByKey('og:site-name', tags);
  if (siteName) md += `## Site name: ${siteName.value}\n\n`;

  md += `![Image](${image.value})\n\n`;

  const imageAlt = findByKey('og:image:alt', tags);
  if (imageAlt) md += `**Image Alt**: ${imageAlt.value}\n\n`;

  md += `**Type**: ${type.value}\n\n`;
  md += `**URL**: [${url.value}](${url.value})\n\n`;

  const locale = findByKey('og:locale', tags);
  if (locale) md += `**Locale**: ${locale.value}\n\n`;

  process.stdout.write(renderMarkdown(md));
}

export function writeTwitter(tags: Meta[]): void {
  const card = findByKey('twitter:card', tags);
  if (!card) throw new MissingFieldError('twitter:card');

  const title = findByKey('twitter:title', tags) ?? findByKey('og:title', tags);
  if (!title) throw new MissingFieldError('twitter:title');

  const image = findByKey('twitter:image', tags) ?? findByKey('og:image', tags);
  if (!image) throw new MissingFieldError('twitter:image');

  let md = `# Title: ${title.value}\n\n`;

  const description =
    findByKey('twitter:description', tags) ?? findByKey('og:description', tags);
  if (description) md += `## Description\n\n${description.value}\n\n`;

  const site = findByKey('twitter:site', tags);
  if (site) md += `## Site: ${site.value}\n\n`;

  const creator = findByKey('twitter:creator', tags);
  if (creator) md += `## Creator: ${creator.value}\n\n`;

  md += `![Image](${image.value})\n\n`;

  const imageAlt =
    findByKey('twitter:image:alt', tags) ?? findByKey('og:image:alt', tags);
  if (imageAlt) md += `**Image Alt**: ${imageAlt.value}\n\n`;

  md += `**Card**: ${card.value}\n\n`;

  const url = findByKey('twitter:url', tags) ?? findByKey('og:url', tags);
  if (url) md += `**URL**: [${url.value}](${url.value})\n`;

  process.stdout.write(renderMarkdown(md));
}

export function writeTable(tags: Meta[]): void {
  if (tags.length === 0) return;

  let md = '|Type|Key|Value|\n|-|-|-|\n';
  for (const tag of tags) {
    const label = NAMESPACE_LABEL[tag.namespace];
    md += `|${label}|${tag.key}|${tag.value}|\n`;
  }

  process.stdout.write(renderMarkdown(md));
}

export function writeJson(tags: Meta[]): void {
  const output: Record<string, Record<string, string>> = {};

  for (const ns of NAMESPACE_ORDER) {
    const prefix = NAMESPACE_PREFIX[ns];
    const nsTags = tags.filter(t => t.namespace === ns);
    if (nsTags.length === 0) continue;

    output[ns] = {};
    for (const tag of nsTags) {
      const key = tag.key.startsWith(prefix) ? tag.key.slice(prefix.length) : tag.key;
      output[ns]![key] = tag.value;
    }
  }

  process.stdout.write(JSON.stringify(output, null, 2) + '\n');
}
