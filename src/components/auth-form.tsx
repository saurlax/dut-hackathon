"use client";

import { useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { requestMagicLink } from "@/app/actions";
import { initialActionState } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emailLoginSchema } from "@/lib/validators";

export function AuthForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(
    requestMagicLink,
    initialActionState,
  );
  const [transitioning, startTransition] = useTransition();
  const form = useForm<z.infer<typeof emailLoginSchema>>({
    resolver: zodResolver(emailLoginSchema),
    mode: "onBlur",
  });
  return (
    <form
      onSubmit={form.handleSubmit((_values, event) => {
        if (!event) return;
        const formData = new FormData(event.currentTarget as HTMLFormElement);
        startTransition(() => action(formData));
      })}
      className="space-y-5"
    >
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="space-y-2">
        <Label htmlFor="email">邮箱地址</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          required
          autoFocus
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      {state.message && (
        <p
          role="status"
          className={
            state.ok ? "text-sm text-emerald-600" : "text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      )}
      <Button className="w-full" disabled={pending || transitioning}>
        {pending || transitioning ? "正在发送…" : "发送登录链接"}
      </Button>
    </form>
  );
}
