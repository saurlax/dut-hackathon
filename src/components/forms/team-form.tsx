"use client";
import { useActionState } from "react";
import { saveTeam } from "@/app/actions";
import { initialActionState } from "@/lib/domain";
import type { teams } from "@/db/schema";
import { Button } from "@/components/ui/button";
import {
  CheckField,
  FormMessage,
  TextAreaField,
  TextField,
} from "./form-parts";
type Team = typeof teams.$inferSelect;
export type TeamFormValue = Pick<
  Team,
  | "name"
  | "projectDirection"
  | "track"
  | "maturity"
  | "techStack"
  | "capabilities"
  | "requiredRoles"
  | "contact"
  | "recruitmentDeadline"
  | "maxSize"
  | "description"
  | "requirements"
  | "allowExternal"
  | "publicDisplay"
>;
export function TeamForm({ team }: { team: TeamFormValue | null }) {
  const [state, action, pending] = useActionState(saveTeam, initialActionState);
  const deadline = team?.recruitmentDeadline ?? "";
  return (
    <form action={action} className="form-surface space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="name"
          label="队伍名称"
          defaultValue={team?.name}
          required
        />
        <TextField
          name="projectDirection"
          label="项目方向"
          defaultValue={team?.projectDirection}
        />
        <TextField
          name="track"
          label="所属赛道"
          defaultValue={team?.track.join(", ")}
        />
        <TextField
          name="maturity"
          label="当前设想成熟度"
          defaultValue={team?.maturity}
        />
        <TextField
          name="techStack"
          label="技术栈"
          defaultValue={team?.techStack.join(", ")}
        />
        <TextField
          name="capabilities"
          label="已有能力"
          defaultValue={team?.capabilities.join(", ")}
        />
        <TextField
          name="requiredRoles"
          label="招募角色"
          defaultValue={team?.requiredRoles.join(", ")}
        />
        <TextField
          name="contact"
          label="公开联系渠道"
          defaultValue={team?.contact}
          required
        />
        <TextField
          name="recruitmentDeadline"
          label="招募截止日期"
          type="date"
          defaultValue={deadline}
          required
        />
        <TextField
          name="maxSize"
          label="最大人数"
          type="number"
          defaultValue={team?.maxSize ?? 4}
          required
        />
        <TextAreaField
          name="description"
          label="队伍介绍"
          defaultValue={team?.description}
          required
        />
        <TextAreaField
          name="requirements"
          label="招募要求"
          defaultValue={team?.requirements}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <CheckField
          name="allowExternal"
          label="允许校外成员"
          defaultChecked={team?.allowExternal}
        />
        <CheckField
          name="publicDisplay"
          label="我同意公开队伍资料、联系渠道和已授权成员信息"
          defaultChecked={team?.publicDisplay ?? false}
          description="未勾选时队伍不会出现在组队大厅；勾选后仍需管理员审核通过。"
        />
      </div>
      <FormMessage state={state} />
      <Button size="lg" disabled={pending}>
        {pending ? "保存中…" : team ? "更新队伍" : "创建队伍"}
      </Button>
    </form>
  );
}
