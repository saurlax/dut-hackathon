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
      <button className="w-full" disabled={pending}>
        <LogOut />
        {pending ? "退出中…" : "退出登录"}
      </button>
    </form>
  );
}
