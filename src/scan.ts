import { Parser } from 'htmlparser2';

export type Namespace =
  | 'og'
  | 'article'
  | 'book'
  | 'profile'
  | 'music'
  | 'video'
  | 'fb'
  | 'twitter'
  | 'html';

// Matches Zig enum declaration order (used for JSON output grouping)
export const NAMESPACE_ORDER: Namespace[] = [
  'og', 'article', 'book', 'profile', 'music', 'video', 'fb', 'twitter', 'html',
];

export const NAMESPACE_LABEL: Record<Namespace, string> = {
  og: 'OpenGraph',
  article: 'Article',
  book: 'Book',
  profile: 'Profile',
  music: 'Music',
  video: 'Video',
  fb: 'Facebook',
  twitter: 'Twitter Card',
  html: 'HTML',
};

export const NAMESPACE_PREFIX: Record<Namespace, string> = {
  og: 'og:',
  article: 'article:',
  book: 'book:',
  profile: 'profile:',
  music: 'music:',
  video: 'video:',
  fb: 'fb:',
  twitter: 'twitter:',
  html: '',
};

export interface Meta {
  raw: string;
  key: string;
  value: string;
  namespace: Namespace;
}

// Allowed keys for html namespace (mirrors Zig's html_key_allow_list)
const HTML_KEY_ALLOW_LIST = new Set([
  'description',
  'author',
  'keywords',
  'theme-color',
  'robots',
  'application-name',
  'title',
]);

function classifyNamespace(key: string): Namespace {
  if (key.startsWith('og:')) return 'og';
  if (key.startsWith('twitter:')) return 'twitter';
  if (key.startsWith('article:')) return 'article';
  if (key.startsWith('book:')) return 'book';
  if (key.startsWith('profile:')) return 'profile';
  if (key.startsWith('music:')) return 'music';
  if (key.startsWith('video:')) return 'video';
  if (key.startsWith('fb:')) return 'fb';
  return 'html';
}

function parseMeta(attribs: Record<string, string>): Meta | null {
  // Key comes from name= or property= attribute
  const key = attribs['name'] ?? attribs['property'] ?? null;
  const value = attribs['content'] ?? null;

  // content attribute is required
  if (key === null || value === null) return null;

  const namespace = classifyNamespace(key);

  // html namespace is filtered to the allow-list
  if (namespace === 'html' && !HTML_KEY_ALLOW_LIST.has(key)) return null;

  return { raw: '', key, value, namespace };
}

export function parseSlice(html: string): Meta[] {
  const tags: Meta[] = [];
  let inTitle = false;
  let titleText = '';

  const parser = new Parser({
    onopentag(name, attribs) {
      if (name === 'title') {
        inTitle = true;
        titleText = '';
        return;
      }
      if (name === 'meta') {
        const meta = parseMeta(attribs);
        if (meta) tags.push(meta);
      }
    },
    ontext(text) {
      if (inTitle) titleText += text;
    },
    onclosetag(name) {
      if (name === 'title') {
        inTitle = false;
        if (titleText) {
          tags.push({ raw: '', key: 'title', value: titleText, namespace: 'html' });
        }
      }
    },
  }, { decodeEntities: true, lowerCaseTags: true, lowerCaseAttributeNames: true });

  parser.write(html);
  parser.end();
  return tags;
}

export function findByKey(key: string, tags: Meta[]): Meta | undefined {
  return tags.find(t => t.key === key);
}
