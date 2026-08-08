"use client";

import { useActionState, useState } from "react";
import { removeAdmin } from "@/app/actions";
import { initialActionState } from "@/lib/domain";
import { Button } from "@/components/ui/button";

export function RemoveAdminButton({
  email,
  disabled,
}: {
  email: string;
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState(
    removeAdmin,
    initialActionState,
  );
  const [confirming, setConfirming] = useState(false);

  if (disabled) return <span className="text-xs text-muted-foreground">—</span>;

  if (!confirming)
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(true)}
      >
        移除
      </Button>
    );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={action}>
        <input type="hidden" name="email" value={email} />
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          disabled={pending}
        >
          {pending ? "移除中…" : "确认移除"}
        </Button>
      </form>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(false)}
        disabled={pending}
      >
        取消
      </Button>
      {state.ok === false && state.message ? (
        <span className="text-xs text-destructive">{state.message}</span>
      ) : null}
    </div>
  );
}
