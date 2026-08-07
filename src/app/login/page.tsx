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
    <div className="mx-auto grid min-h-[62vh] max-w-md place-items-center py-8">
      <Card className="paper-grain w-full border-primary/20 bg-white/85">
        <CardHeader>
          <p className="eyebrow text-primary">SECURE SIGN IN</p>
          <CardTitle className="text-3xl">
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
