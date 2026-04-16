export async function getBody(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { Accept: 'text/html,application/xhtml+xml' },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  return res.text();
}
