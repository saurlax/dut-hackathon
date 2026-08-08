import type { ReactNode } from "react";

type MockLinkProps = {
  href: string;
  children?: ReactNode;
} & Record<string, unknown>;

export function Link({ href, children, ...props }: MockLinkProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

export function ViewTransitions({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useTransitionRouter() {
  return {
    push: () => undefined,
    replace: () => undefined,
  };
}
