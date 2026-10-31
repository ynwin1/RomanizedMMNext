/** Public lyrics/discovery routes must not invoke Clerk's browser handshake. */
export function isAnonymousSeoRoute(pathname: string): boolean {
  return /^\/(en|my)\/(?:song\/[^/]+\/[^/]+|song-catalogue)(?:\/)?$/.test(pathname);
}
