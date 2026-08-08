/**
 * Same-origin redirect resolution for the Auth.js `redirect` callback.
 *
 * The callback runs on every sign-in redirect and must never hand a URL to
 * the browser that points off the app origin (an open-redirect vector). Pure
 * so it can be unit-tested without booting the Auth.js + database stack.
 */
export function resolveAppRedirect(url: string, appOrigin: string): string {
  if (url.startsWith("/")) return `${appOrigin}${url}`;
  try {
    return new URL(url).origin === appOrigin ? url : appOrigin;
  } catch {
    return appOrigin;
  }
}
