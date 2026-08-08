import { Link } from "next-view-transitions";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/animation/reveal";
export default function LoginErrorPage() {
  return (
    <Reveal className="paper-grain mx-auto max-w-lg rounded-xl border border-destructive/20 bg-white/70 px-6 py-16 text-center shadow-sm md:my-12">
      <p className="eyebrow text-destructive">LINK EXPIRED</p>
      <h1 className="mt-2 text-3xl font-semibold">登录链接无效或已过期</h1>
      <p className="mt-3 text-muted-foreground">请重新申请一封登录邮件。</p>
      <Button className="mt-8" asChild>
        <Link href="/login">重新登录</Link>
      </Button>
    </Reveal>
  );
}
