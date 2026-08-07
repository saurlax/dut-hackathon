import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthForm } from "@/components/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl = "/" } = await searchParams;
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center">
      <Card className="w-full bg-white/80">
        <CardHeader>
          <CardTitle className="text-2xl">
            <h1>邮箱登录</h1>
          </CardTitle>
          <CardDescription>
            我们会向你的邮箱发送一次性安全登录链接，无需密码。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm callbackUrl={callbackUrl} />
        </CardContent>
      </Card>
    </div>
  );
}
