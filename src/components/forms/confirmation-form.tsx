"use client";
import { useActionState } from "react";
import { submitConfirmation } from "@/app/actions";
import { initialActionState } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { CheckField, FormMessage } from "./form-parts";
export function ConfirmationForm() {
  const [state, action, pending] = useActionState(
    submitConfirmation,
    initialActionState,
  );
  return (
    <form action={action} className="space-y-4">
      <CheckField
        name="allConfirmed"
        label="我确认全体成员信息无误，并已取得成员同意"
      />
      <FormMessage state={state} />
      <Button size="lg" disabled={pending}>
        {pending ? "提交中…" : "提交最终确认"}
      </Button>
    </form>
  );
}
