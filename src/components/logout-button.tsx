"use client";

import { useTransition } from "react";
import { logout } from "@/app/actions";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(() => logout());
      }}
    >
      <button
        data-slot="button"
        data-pending={pending || undefined}
        aria-busy={pending || undefined}
        className="w-full"
        disabled={pending}
      >
        <LogOut />
        退出登录
      </button>
    </form>
  );
}
