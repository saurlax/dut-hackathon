"use client";
import { useActionState } from "react";
import { changeTeamLeader } from "@/app/actions";
import { initialActionState } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { FormMessage, TextField } from "./form-parts";
export function LeaderForm() {
  const [state, action, pending] = useActionState(
    changeTeamLeader,
    initialActionState,
  );
  return (
    <form
      action={action}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <TextField
        name="participantNumber"
        label="新队长参赛者编号"
        placeholder="P0002"
        required
      />
      <Button disabled={pending}>{pending ? "转让中…" : "转让队长"}</Button>
      <FormMessage state={state} />
    </form>
  );
}
