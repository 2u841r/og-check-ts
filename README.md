# og-check-ts

Fetch a URL and render its OpenGraph / Twitter Card metadata. TypeScript port of [og-check](https://github.com/deevus/neutils/tree/main/src/tools/og-check) (originally written in Zig).

## Requirements

- Node.js >= 18 (uses native `fetch`)

## Install

```bash
# From the project directory
npm install
npm run build
npm install -g .
```

## Usage

```
og-check-ts [options] <url>
```

### Arguments

| Argument | Description |
|----------|-------------|
| `url` | URL to fetch and inspect |

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output-format <format>` | `-o` | Output format — see below | `opengraph` |
| `--version` | `-V` | Print version | |
| `--help` | `-h` | Show help | |

## Output formats

### `opengraph` (default)

Renders a styled terminal preview of the page's OpenGraph metadata.

Required fields: `og:title`, `og:type`, `og:image`, `og:url`

Optional fields: `og:description`, `og:site-name`, `og:image:alt`, `og:locale`

Missing required fields are reported on stderr and the process exits with code 1.

```bash
og-check-ts https://github.com/deevus/neutils
```

### `twitter`

Renders a styled Twitter Card preview. Falls back to `og:*` fields when `twitter:*` equivalents are absent.

Required fields: `twitter:card`, `twitter:title` (or `og:title`), `twitter:image` (or `og:image`)

```bash
og-check-ts -o twitter https://github.com/deevus/neutils
```

### `table`

All meta tags as a styled table, grouped by namespace (`OpenGraph`, `Twitter Card`, `Facebook`, `HTML`, etc.).

```bash
og-check-ts -o table https://github.com/deevus/neutils
```

### `json`

Machine-readable JSON, keys grouped by namespace with namespace prefix stripped.

```bash
og-check-ts -o json https://github.com/deevus/neutils
```

Example output:

```json
{
  "og": {
    "title": "...",
    "type": "object",
    "image": "https://...",
    "url": "https://..."
  },
  "twitter": {
    "card": "summary_large_image",
    "title": "..."
  },
  "html": {
    "title": "...",
    "description": "..."
  }
}
```

## Namespaces

The following meta tag namespaces are recognised and classified:

| Namespace | Prefix | Description |
|-----------|--------|-------------|
| `og` | `og:` | OpenGraph core |
| `article` | `article:` | OG article type extension |
| `book` | `book:` | OG book type extension |
| `profile` | `profile:` | OG profile type extension |
| `music` | `music:` | OG music type extension |
| `video` | `video:` | OG video type extension |
| `fb` | `fb:` | Facebook extension |
| `twitter` | `twitter:` | Twitter Card |
| `html` | *(none)* | Standard HTML meta tags (`description`, `author`, `keywords`, `theme-color`, `robots`, `application-name`) + `<title>` |

## Inline images

When the terminal supports the [Kitty graphics protocol](https://sw.kovidgoyal.net/kitty/graphics-protocol/), `og:image` and `twitter:image` are rendered inline. Detected via:

- `$KITTY_WINDOW_ID` environment variable (Kitty terminal)
- `$TERM=xterm-kitty`
- `$TERM_PROGRAM=WezTerm`

In other terminals the image URL is printed as plain text.

## Development

```bash
npm run typecheck   # type-check only (no emit)
npm run build       # bundle to dist/og-check.cjs via esbuild (installed as og-check-ts)
```

Source layout:

| File | Purpose |
|------|---------|
| `src/main.ts` | Entry point — fetch → scan → render pipeline |
| `src/cli.ts` | CLI argument parsing (commander) |
| `src/config.ts` | `Config` interface and `OutputFormat` type |
| `src/fetch.ts` | HTTP GET via native `fetch` |
| `src/scan.ts` | HTML parser — extracts meta tags (htmlparser2) |
| `src/render.ts` | Four output renderers (marked + marked-terminal) |
| `src/kitty.ts` | Kitty graphics protocol image output |

## Credits

TypeScript port of **[og-check](https://github.com/deevus/neutils/tree/main/src/tools/og-check)** by [deevus](https://github.com/deevus), originally written in Zig. Core logic — meta tag parsing, namespace classification, renderer templates, Kitty protocol integration — is a faithful translation of the Zig source.

Differences from the Zig version:

- Full namespace classification for `article:`, `book:`, `profile:`, `music:`, `video:`, `fb:` (the Zig version silently drops these due to an incomplete switch)
- HTML entity decoding is handled by `htmlparser2` rather than a custom decoder
- Rendered values in JSON output are decoded (Zig outputs raw HTML entities in JSON)
