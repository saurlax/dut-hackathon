"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { saveTeam } from "@/app/actions";
import { initialActionState } from "@/lib/domain";
import type { teams } from "@/db/schema";
import {
  capabilityOptions,
  roleOptions,
  techStackOptions,
} from "@/lib/tag-options";
import { Button } from "@/components/ui/button";
import {
  CheckField,
  FormMessage,
  TextAreaField,
  TextField,
} from "./form-parts";
import { TagSelectField } from "./tag-select-field";
import { CheckCircle2, ClipboardCheck, PlusCircle } from "lucide-react";
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

type TeamDraft = {
  name: string;
  projectDirection: string;
  track: string;
  maturity: string;
  techStack: string[];
  capabilities: string[];
  requiredRoles: string[];
  contact: string;
  recruitmentDeadline: string;
  maxSize: string;
  description: string;
  requirements: string;
  allowExternal: boolean;
  publicDisplay: boolean;
};

function teamDraft(team: TeamFormValue | null): TeamDraft {
  return {
    name: team?.name ?? "",
    projectDirection: team?.projectDirection ?? "",
    track: team?.track.join(", ") ?? "",
    maturity: team?.maturity ?? "",
    techStack: team?.techStack ?? [],
    capabilities: team?.capabilities ?? [],
    requiredRoles: team?.requiredRoles ?? [],
    contact: team?.contact ?? "",
    recruitmentDeadline: team?.recruitmentDeadline ?? "",
    maxSize: String(team?.maxSize ?? 4),
    description: team?.description ?? "",
    requirements: team?.requirements ?? "",
    allowExternal: team?.allowExternal ?? false,
    publicDisplay: team?.publicDisplay ?? false,
  };
}

export function TeamForm({ team }: { team: TeamFormValue | null }) {
  const [state, action, pending] = useActionState(saveTeam, initialActionState);
  const [draft, setDraft] = useState(() => teamDraft(team));
  function update<Key extends keyof TeamDraft>(
    key: Key,
    value: TeamDraft[Key],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  return (
    <>
      {state.ok && (
        <div className="mb-6 rounded-xl border border-success/25 bg-success/10 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
            <div>
              <h2 className="font-display text-lg font-bold">队伍资料已保存</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {draft.publicDisplay
                  ? "队伍会按公开授权立即展示；管理员会不定期巡查违规内容。"
                  : "当前未授权公开，不会出现在组队大厅。"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/my-team">
                <ClipboardCheck />
                查看我的队伍
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/browse-teams">
                <PlusCircle />
                浏览队伍大厅
              </Link>
            </Button>
          </div>
        </div>
      )}
      <form action={action} className="form-surface space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="name"
            label="队伍名称"
            value={draft.name}
            onChange={(value) => update("name", value)}
            required
          />
          <TextField
            name="projectDirection"
            label="项目方向"
            value={draft.projectDirection}
            onChange={(value) => update("projectDirection", value)}
          />
          <TextField
            name="track"
            label="所属赛道"
            value={draft.track}
            onChange={(value) => update("track", value)}
          />
          <TextField
            name="maturity"
            label="当前设想成熟度"
            value={draft.maturity}
            onChange={(value) => update("maturity", value)}
          />
          <TagSelectField
            name="techStack"
            label="技术栈"
            options={techStackOptions}
            defaultValue={draft.techStack}
          />
          <TagSelectField
            name="capabilities"
            label="已有能力"
            options={capabilityOptions}
            defaultValue={draft.capabilities}
          />
          <TagSelectField
            name="requiredRoles"
            label="招募角色"
            options={roleOptions}
            defaultValue={draft.requiredRoles}
          />
          <TextField
            name="contact"
            label="公开联系渠道"
            value={draft.contact}
            onChange={(value) => update("contact", value)}
            required
          />
          <TextField
            name="recruitmentDeadline"
            label="招募截止日期"
            type="date"
            value={draft.recruitmentDeadline}
            onChange={(value) => update("recruitmentDeadline", value)}
            required
          />
          <TextField
            name="maxSize"
            label="最大人数"
            type="number"
            value={draft.maxSize}
            onChange={(value) => update("maxSize", value)}
            required
          />
          <TextAreaField
            name="description"
            label="队伍介绍"
            value={draft.description}
            onChange={(value) => update("description", value)}
            required
          />
          <TextAreaField
            name="requirements"
            label="招募要求"
            value={draft.requirements}
            onChange={(value) => update("requirements", value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <CheckField
            name="allowExternal"
            label="允许校外成员"
            checked={draft.allowExternal}
            onCheckedChange={(checked) => update("allowExternal", checked)}
          />
          <CheckField
            name="publicDisplay"
            label="我同意公开队伍资料、联系渠道和已授权成员信息"
            checked={draft.publicDisplay}
            onCheckedChange={(checked) => update("publicDisplay", checked)}
            description="未勾选时队伍不会出现在组队大厅；勾选后会立即公开，管理员会不定期巡查。"
          />
        </div>
        <FormMessage state={state} />
        <Button size="lg" disabled={pending}>
          {pending ? "保存中…" : team ? "更新队伍" : "创建队伍"}
        </Button>
      </form>
    </>
  );
}
