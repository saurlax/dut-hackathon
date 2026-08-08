import Link from "next/link";
import { Home } from "lucide-react";

export function BackHome() {
  return (
    <Link
      href="/"
      className="label-mono mb-5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-primary"
    >
      <Home className="size-3.5" />
      返回首页
    </Link>
  );
}
