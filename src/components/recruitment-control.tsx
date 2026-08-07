"use client";

import { useActionState } from "react";
import { closeMyTeam, resumeMyTeam } from "@/app/actions";
import { initialActionState } from "@/lib/domain";
import { FormMessage } from "@/components/forms/form-parts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type RecruitmentStatus = "recruiting" | "paused" | "full" | "completed";

export function RecruitmentControl({
  status,
  canResume,
}: {
  status: RecruitmentStatus;
  canResume: boolean;
}) {
  if (status === "recruiting") return <PauseRecruitment />;
  if (status === "paused") return <ResumeRecruitment enabled={canResume} />;
  return null;
}

function PauseRecruitment() {
  const [state, action, pending] = useActionState(
    closeMyTeam,
    initialActionState,
  );

  return (
    <div className="space-y-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button type="button" variant="destructive">
            暂停招募
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认暂停招募？</DialogTitle>
            <DialogDescription>
              队伍会暂时从组队大厅隐藏，并停止接收新申请；现有待处理申请会保留，仍可继续审批。
            </DialogDescription>
          </DialogHeader>
          <form action={action} className="space-y-4">
            <FormMessage state={state} />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  取消
                </Button>
              </DialogClose>
              <Button type="submit" variant="destructive" disabled={pending}>
                {pending ? "处理中…" : "确认暂停"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <FormMessage state={state} />
    </div>
  );
}

function ResumeRecruitment({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState(
    resumeMyTeam,
    initialActionState,
  );

  if (!enabled) {
    return (
      <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
        当前无法恢复招募；请检查人数上限和招募截止日期，必要时先编辑队伍资料。
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <form action={action}>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "处理中…" : "恢复招募"}
        </Button>
      </form>
      <FormMessage state={state} />
    </div>
  );
}
