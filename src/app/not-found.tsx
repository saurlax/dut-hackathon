import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <div className="py-28 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-4xl font-black">页面不存在</h1>
      <p className="mt-3 text-muted-foreground">
        链接可能已失效，或内容尚未公开。
      </p>
      <Button className="mt-7" asChild>
        <Link href="/">返回首页</Link>
      </Button>
    </div>
  );
}
