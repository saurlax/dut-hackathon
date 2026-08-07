import Link from "next/link";
import { auth } from "@/auth";
import { logout } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Code2, LogIn, LogOut, ShieldCheck, UserRound } from "lucide-react";

const publicLinks = [
  ["/browse-teams", "队伍大厅"],
  ["/browse-pool", "找队友"],
  ["/showcase", "作品展示"],
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
    <header className="sticky top-0 z-50 border-b border-blue-500/10 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-5 px-4 sm:px-6">
        <Link href="/" className="mr-auto flex items-center gap-2 font-black">
          <span className="brand-gradient grid size-9 place-items-center rounded-xl text-white">
            <Code2 className="size-5" />
          </span>
          <span className="hidden sm:inline">大工黑客松</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {publicLinks.map(([href, label]) => (
            <Button key={href} variant="ghost" size="sm" asChild>
              <Link href={href}>{label}</Link>
            </Button>
          ))}
        </nav>
        {session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
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
              <form action={logout}>
                <DropdownMenuItem asChild>
                  <button className="w-full">
                    <LogOut />
                    退出登录
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button size="sm" asChild>
            <Link href="/login">
              <LogIn />
              邮箱登录
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
