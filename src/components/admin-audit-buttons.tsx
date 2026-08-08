"use client";

import { useActionState } from "react";
import { updateAudit } from "@/app/actions";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AuditKind = "participant" | "team" | "confirmation" | "submission";

export function AdminAuditButtons({
  kind,
  id,
}: {
  kind: AuditKind;
  id: string;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      <ApproveButton kind={kind} id={id} />
      <RejectDialog kind={kind} id={id} />
    </div>
  );
}

function ApproveButton({ kind, id }: { kind: AuditKind; id: string }) {
  const boundAction = updateAudit.bind(null, kind, id);
  const moderationRecord = kind === "participant" || kind === "team";
  const [state, action, pending] = useActionState(
    boundAction,
    initialActionState,
  );

  return (
    <div className="space-y-2">
      <form action={action}>
        <input type="hidden" name="decision" value="approved" />
        <Button size="sm" variant="outline" pending={pending}>
          {moderationRecord ? "恢复公开" : "通过"}
        </Button>
      </form>
      {!state.ok && <FormMessage state={state} />}
    </div>
  );
}

function RejectDialog({ kind, id }: { kind: AuditKind; id: string }) {
  const boundAction = updateAudit.bind(null, kind, id);
  const moderationRecord = kind === "participant" || kind === "team";
  const [state, action, pending] = useActionState(
    boundAction,
    initialActionState,
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="destructive">
          {moderationRecord ? "下架" : "驳回"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {moderationRecord ? "填写下架原因" : "填写驳回原因"}
          </DialogTitle>
          <DialogDescription>
            {moderationRecord
              ? "下架后资料不再公开展示；原因会展示给提交人。"
              : "这段说明会展示给提交人，帮助对方修改后重新提交。"}
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="decision" value="rejected" />
          <div className="space-y-2">
            <Label htmlFor={`audit-reason-${id}`}>
              {moderationRecord ? "下架原因" : "驳回原因"}
            </Label>
            <Textarea
              id={`audit-reason-${id}`}
              name="reason"
              maxLength={1000}
              placeholder="请说明需要修改或补充的内容"
              required
              autoFocus
            />
          </div>
          <FormMessage state={state} />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                取消
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" pending={pending}>
              {moderationRecord ? "确认下架" : "确认驳回"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
