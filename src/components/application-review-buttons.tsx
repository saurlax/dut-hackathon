"use client";

import { useActionState } from "react";
import { reviewTeamApplication } from "@/app/actions";
import { initialActionState } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/forms/form-parts";

export function ApplicationReviewButtons({
  applicationId,
}: {
  applicationId: string;
}) {
  const action = reviewTeamApplication.bind(null, applicationId);
  const [state, formAction, pending] = useActionState(
    action,
    initialActionState,
  );
  return (
    <form action={formAction} className="mt-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          name="decision"
          value="approve"
          size="sm"
          disabled={pending}
        >
          同意并加入队伍
        </Button>
        <Button
          type="submit"
          name="decision"
          value="reject"
          size="sm"
          variant="outline"
          disabled={pending}
        >
          拒绝
        </Button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
