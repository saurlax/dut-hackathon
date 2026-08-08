"use client";

import { useActionState } from "react";
import { addAdminUser } from "@/app/actions";
import { initialActionState } from "@/lib/domain";
import { FormMessage } from "@/components/forms/form-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminUserForm() {
  const [state, action, pending] = useActionState(
    addAdminUser,
    initialActionState,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="adminEmail">管理员邮箱</Label>
        <Input
          id="adminEmail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="admin@example.com"
          aria-describedby="adminEmailHelp"
          required
        />
        <p
          id="adminEmailHelp"
          className="text-xs leading-relaxed text-muted-foreground"
        >
          已注册用户会立即提升为管理员；尚未注册的邮箱会预创建账户，对方可直接使用魔法链接登录。
        </p>
      </div>
      <Button type="submit" pending={pending}>
        新增管理员
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
