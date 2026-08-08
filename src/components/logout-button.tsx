"use client";

import type { ComponentProps } from "react";
import { useTransition } from "react";
import { logout } from "@/app/actions";
import { LogOut } from "lucide-react";

export function LogoutButton({
  onClick,
  disabled,
  ...props
}: ComponentProps<"button">) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      {...props}
      type="button"
      data-pending={pending || undefined}
      aria-busy={pending || undefined}
      disabled={disabled || pending}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        startTransition(() => logout());
      }}
    >
      <LogOut />
      退出登录
    </button>
  );
}
