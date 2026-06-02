/** RFC4122 v4 uuid via Web Crypto (available in modern browsers and Node 19+). */
export function newUuid(): string {
  return crypto.randomUUID()
}
