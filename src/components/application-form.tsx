"use client";
import { useActionState } from "react";
import { applyToTeam } from "@/app/actions";
import { initialActionState } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
export function ApplicationForm({ teamId }: { teamId: string }) {
  const action = applyToTeam.bind(null, teamId);
  const [state, formAction, pending] = useActionState(
    action,
    initialActionState,
  );
  return (
    <form action={formAction} className="space-y-3">
      <Label htmlFor="message">申请留言（可选）</Label>
      <Textarea
        id="message"
        name="message"
        maxLength={200}
        placeholder="简单介绍你能为队伍带来什么"
      />
      {state.message && (
        <p
          className={
            state.ok ? "text-sm text-emerald-600" : "text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      )}
      <Button disabled={pending}>{pending ? "提交中…" : "申请加入"}</Button>
    </form>
  );
}
