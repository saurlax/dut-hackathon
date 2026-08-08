import { Link } from "next-view-transitions";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/animation/reveal";
export default function VerifyPage() {
  return (
    <Reveal className="paper-grain mx-auto max-w-lg rounded-xl border border-primary/20 bg-white/70 px-6 py-16 text-center shadow-sm md:my-12">
      <span className="mx-auto grid size-14 place-items-center rounded-lg bg-secondary text-primary ring-1 ring-inset ring-primary/15">
        <MailCheck className="size-7" />
      </span>
      <p className="eyebrow mt-5 text-primary">MAGIC LINK SENT</p>
      <h1 className="mt-2 text-3xl font-semibold">检查你的邮箱</h1>
      <p className="mt-3 text-muted-foreground">
        点击邮件中的登录链接即可继续。链接仅可使用一次。
      </p>
      <Button className="mt-8" variant="outline" asChild>
        <Link href="/">返回首页</Link>
      </Button>
    </Reveal>
  );
}
