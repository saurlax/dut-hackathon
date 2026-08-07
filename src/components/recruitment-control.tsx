"use client";

import { useActionState } from "react";
import { closeMyTeam } from "@/app/actions";
import { initialActionState } from "@/lib/domain";
import { FormMessage } from "@/components/forms/form-parts";
import { Button } from "@/components/ui/button";

export function RecruitmentControl({ recruiting }: { recruiting: boolean }) {
  const [state, action, pending] = useActionState(
    closeMyTeam,
    initialActionState,
  );

  if (!recruiting && !state.message) return null;

  return (
    <div className="space-y-2">
      {recruiting && (
        <form action={action}>
          <Button type="submit" variant="destructive" disabled={pending}>
            {pending ? "处理中…" : "停止招募"}
          </Button>
        </form>
      )}
      <FormMessage state={state} />
    </div>
  );
}
