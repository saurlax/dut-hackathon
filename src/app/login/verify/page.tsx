import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function VerifyPage() {
  return (
    <div className="mx-auto max-w-lg py-24 text-center">
      <MailCheck className="mx-auto size-14 text-blue-600" />
      <h1 className="mt-5 text-3xl font-black">检查你的邮箱</h1>
      <p className="mt-3 text-muted-foreground">
        点击邮件中的登录链接即可继续。链接仅可使用一次。
      </p>
      <Button className="mt-8" variant="outline" asChild>
        <Link href="/">返回首页</Link>
      </Button>
    </div>
  );
}
