import Image from "next/image";
import { Link } from "next-view-transitions";
import { auth } from "@/auth";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogIn, ShieldCheck, UserRound } from "lucide-react";

const publicLinks = [
  ["/", "首页", "00"],
  ["/browse-teams", "队伍大厅", "01"],
  ["/browse-pool", "找队友", "02"],
  ["/showcase", "作品展示", "03"],
] as const;

const accountLinks = [
  ["/register", "报名资料"],
  ["/my-registration", "我的报名"],
  ["/create", "创建队伍"],
  ["/my-team", "我的队伍"],
  ["/final-confirmation", "最终确认"],
  ["/submission", "作品提交"],
] as const;

export async function SiteHeader() {
  const session = await auth();
  return (
    <header className="sticky top-0 z-50 border-b border-primary/15 bg-background/90 shadow-xs backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="返回首页"
          title="返回首页"
          className="mr-auto flex min-w-0 items-center gap-2.5 text-foreground"
        >
          <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-white text-primary shadow-sm ring-1 ring-inset ring-primary/15">
            <Image
              src="/brand/dut-hackathon-s2.png"
              alt=""
              width={2400}
              height={2400}
              sizes="36px"
              loading="eager"
              className="size-full scale-110 object-contain"
            />
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate font-display text-base font-black italic">
              大工黑客松 S2
            </span>
            <span className="tech-kicker brand-text mt-1 hidden text-[9px] sm:block">
              DUT HACKATHON · S2
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {publicLinks.map(([href, label, index]) => (
            <Link
              key={href}
              href={href}
              className="group relative flex items-center gap-2 px-1 py-5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="label-mono text-[10px] text-primary/70">
                {index}
              </span>
              <span>{label}</span>
              <span className="brand-gradient absolute -bottom-px left-0 h-0.5 w-0 transition-all duration-200 group-hover:w-full" />
            </Link>
          ))}
        </nav>
        {session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-lg">
                <UserRound />
                我的
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">
                {session.user.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {accountLinks.map(([href, label]) => (
                <DropdownMenuItem key={href} asChild>
                  <Link href={href}>{label}</Link>
                </DropdownMenuItem>
              ))}
              {session.user.role === "admin" && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <ShieldCheck />
                    管理后台
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <LogoutButton />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button size="sm" variant="outline" className="rounded-lg" asChild>
            <Link href="/login">
              <LogIn />
              邮箱登录
            </Link>
          </Button>
        )}
      </div>
      <nav className="mx-auto flex max-w-6xl items-center gap-5 overflow-x-auto border-t border-primary/10 px-4 md:hidden">
        {publicLinks.map(([href, label, index]) => (
          <Link
            key={href}
            href={href}
            className="flex shrink-0 items-center gap-1.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="label-mono text-[9px] text-primary/70">
              {index}
            </span>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
