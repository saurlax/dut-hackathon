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
      onSubmit={(event) => {
        const formElement = event.currentTarget;
        void form.handleSubmit(() => {
          const formData = new FormData(formElement);
          startTransition(() => action(formData));
        })(event);
      }}
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
          className={`status-in text-sm ${state.ok ? "text-success" : "text-destructive"}`}
        >
          {state.message}
        </p>
      )}
      <Button className="w-full" pending={pending || transitioning}>
        发送登录链接
      </Button>
    </form>
  );
}
