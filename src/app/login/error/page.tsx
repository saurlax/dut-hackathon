import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function LoginErrorPage() {
  return (
    <div className="mx-auto max-w-lg py-24 text-center">
      <h1 className="text-3xl font-black">登录链接无效或已过期</h1>
      <p className="mt-3 text-muted-foreground">请重新申请一封登录邮件。</p>
      <Button className="mt-8" asChild>
        <Link href="/login">重新登录</Link>
      </Button>
    </div>
  );
}
