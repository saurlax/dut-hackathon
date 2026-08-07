"use client";

import { useActionState } from "react";
import { respondToMembership } from "@/app/actions";
import { initialActionState } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/forms/form-parts";

export function MembershipActions({ confirmed }: { confirmed: boolean }) {
  const [state, action, pending] = useActionState(
    respondToMembership,
    initialActionState,
  );
  return (
    <form action={action} className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {!confirmed && (
          <Button
            type="submit"
            name="decision"
            value="confirm"
            disabled={pending}
          >
            确认加入
          </Button>
        )}
        <Button
          type="submit"
          name="decision"
          value="leave"
          variant="destructive"
          disabled={pending}
        >
          {confirmed ? "退出队伍" : "拒绝加入"}
        </Button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
