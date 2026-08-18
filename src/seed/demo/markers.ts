/** Stable HTML-comment markers so demo seed rows can be found without overwriting user edits. */

export function demoSeedMarker(key: string): string {
  return `\n\n<!-- demo-seed:${key} -->`;
}

export function hasDemoSeedMarker(body: string, key: string): boolean {
  return body.includes(`<!-- demo-seed:${key} -->`);
}
