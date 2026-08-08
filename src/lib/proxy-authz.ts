/**
 * Edge/proxy authorization for the admin area.
 *
 * The proxy (Next.js 16 middleware) runs on the Node.js runtime, so the
 * session is loaded from the database on every matched request. We use that
 * only to keep unauthenticated users out of `/admin` early — the real role
 * enforcement stays in {@link requireAdmin} on the page/action so that an
 * authenticated non-admin still gets the existing `/?error=forbidden`
 * redirect instead of being bounced to the login page.
 *
 * Extracted as a pure function so the decision can be unit-tested without
 * spinning up the full Auth.js + database stack.
 */
export function authorizeAdminPath(input: {
  pathname: string;
  hasSession: boolean;
}): boolean {
  if (input.pathname.startsWith("/admin")) return input.hasSession;
  return true;
}
