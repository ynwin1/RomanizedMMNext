export const adminNavigation = [
  { href: "/admin", label: "Overview", description: "Your content workspace." },
  { href: "/admin/songs", label: "Songs", description: "Manage the song catalogue." },
  { href: "/admin/artists", label: "Artists", description: "Manage artist profiles." },
  { href: "/admin/requests", label: "Requests", description: "Review incoming song requests." },
  { href: "/admin/migrations/lyrics-v2", label: "Lyrics V2", description: "Review migration readiness." },
] as const;

export function isAdminRouteActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === href || pathname === "/admin/";
  return pathname === href || pathname.startsWith(href + "/");
}
