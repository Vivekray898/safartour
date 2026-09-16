/**
 * Shared navigation helpers — one source of truth for active-link logic so
 * the desktop header and mobile menu can never disagree.
 */

/** Treat a nav item as active for the current pathname. */
export function isNavItemActive(pathname: string, href: string): boolean {
  // Hash links like /#destinations are only active on the home page.
  if (href.startsWith("/#")) return pathname === "/";
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
