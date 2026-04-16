const APC_START = '\x1b_G';
const APC_END = '\x1b\\';
const CHUNK_SIZE = 4096;

export function isKittySupported(): boolean {
  return (
    process.env['KITTY_WINDOW_ID'] !== undefined ||
    process.env['TERM'] === 'xterm-kitty' ||
    process.env['TERM_PROGRAM'] === 'WezTerm'
  );
}

export function renderKittyImage(url: string): string {
  if (!isKittySupported()) {
    return `Image: ${url}\n\n`;
  }

  const encoded = Buffer.from(url).toString('base64');
  const chunks: string[] = [];
  for (let i = 0; i < encoded.length; i += CHUNK_SIZE) {
    chunks.push(encoded.slice(i, i + CHUNK_SIZE));
  }
  if (chunks.length === 0) chunks.push('');

  return chunks
    .map((chunk, i) => {
      const isFirst = i === 0;
      const isLast = i === chunks.length - 1;
      const more = isLast ? 0 : 1;
      const params = isFirst
        ? `a=T,t=u,q=2,m=${more}`
        : `m=${more}`;
      return `${APC_START}${params};${chunk}${APC_END}`;
    })
    .join('') + '\n\n';
}
