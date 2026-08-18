/**
 * Concise production startup logging. Callers must never pass secrets,
 * passwords, connection strings, or tokens.
 */
export function logStartup(message: string): void {
  console.log(`[startup] ${message}`);
}
