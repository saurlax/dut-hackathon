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
    <form action={formAction} className="space-y-4">
      <Label htmlFor="message">申请留言（可选）</Label>
      <Textarea
        id="message"
        name="message"
        maxLength={200}
        placeholder="简单介绍你能为队伍带来什么"
      />
      <p className="text-xs text-muted-foreground">
        提交后，队长可看到你的姓名、参赛编号、校内身份和本条留言。
      </p>
      {state.message && (
        <p
          className={`status-in text-sm ${state.ok ? "text-success" : "text-destructive"}`}
        >
          {state.message}
        </p>
      )}
      <Button pending={pending}>申请加入</Button>
    </form>
  );
}
