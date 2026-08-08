"use client";

import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const publicLinks = [
  { href: "/", label: "首页", routePrefixes: ["/"] },
  {
    href: "/browse-teams",
    label: "队伍大厅",
    routePrefixes: ["/browse-teams", "/team"],
  },
  {
    href: "/browse-pool",
    label: "找队友",
    routePrefixes: ["/browse-pool"],
  },
  {
    href: "/showcase",
    label: "作品展示",
    routePrefixes: ["/showcase"],
  },
] as const;

function matchesRoute(pathname: string, routePrefixes: readonly string[]) {
  return routePrefixes.some((prefix) =>
    prefix === "/"
      ? pathname === prefix
      : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function SiteNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const navigationRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobile) return;

    const activeLink = navigationRef.current?.querySelector<HTMLElement>(
      '[aria-current="page"]',
    );
    activeLink?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [mobile, pathname]);

  return (
    <nav
      ref={navigationRef}
      aria-label="主导航"
      className={cn(
        mobile
          ? "mobile-scroll-x mx-auto flex max-w-6xl items-center gap-1 border-t border-primary/10 px-3 [scrollbar-width:none] min-[360px]:justify-center [&::-webkit-scrollbar]:hidden"
          : "hidden h-full items-stretch gap-0.5 md:flex",
      )}
    >
      {publicLinks.map(({ href, label, routePrefixes }) => {
        const isActive = matchesRoute(pathname, routePrefixes);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group relative flex min-h-11 shrink-0 items-center rounded-md px-3 text-sm font-semibold tracking-[0.01em] outline-none transition-[color,background-color] duration-200 hover:bg-primary/[0.045] active:bg-primary/[0.08] focus-visible:bg-white/75 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset md:min-h-0 md:px-3.5",
              isActive
                ? "font-bold text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>{label}</span>
            <span
              aria-hidden="true"
              className={cn(
                "absolute bottom-0 left-1/2 h-[3px] -translate-x-1/2 rounded-full bg-[linear-gradient(90deg,var(--visual-blue),var(--visual-cyan-bright))] transition-[width,opacity] duration-200",
                isActive
                  ? "w-7 opacity-100"
                  : "w-0 opacity-0 group-hover:w-4 group-hover:opacity-70",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
