"use client";
import { useActionState, useState } from "react";
import { Link } from "next-view-transitions";
import { saveRegistration } from "@/app/actions";
import { initialActionState } from "@/lib/domain";
import type { participants } from "@/db/schema";
import { roleOptions, skillOptions, techStackOptions } from "@/lib/tag-options";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckField,
  FormMessage,
  TextAreaField,
  TextField,
} from "./form-parts";
import { TagSelectField } from "./tag-select-field";
import { CheckCircle2, ClipboardCheck, PlusCircle, Users } from "lucide-react";

const registrationMethods = [
  "个人报名，正在找队伍",
  "已经加入队伍",
  "个人参赛，不再组队",
  "暂未确定",
] as const;

type Participant = typeof participants.$inferSelect;
type RegistrationDraft = {
  name: string;
  phone: string;
  email: string;
  school: string;
  college: string;
  grade: string;
  studentId: string;
  registrationMethod: string;
  skills: string[];
  techStack: string[];
  desiredRoles: string[];
  availableTime: string;
  teamRole: string;
  portfolioUrl: string;
  publicContact: string;
  projectExperience: string;
  bio: string;
  isInternal: boolean;
  publicDisplay: boolean;
};

function registrationDraft(
  participant: Participant | null,
  email: string,
): RegistrationDraft {
  return {
    name: participant?.name ?? "",
    phone: participant?.phone ?? "",
    email: participant?.email ?? email,
    school: participant?.school ?? "",
    college: participant?.college ?? "",
    grade: participant?.grade ?? "",
    studentId: participant?.studentId ?? "",
    registrationMethod: participant?.registrationMethod ?? "暂未确定",
    skills: participant?.skills ?? [],
    techStack: participant?.techStack ?? [],
    desiredRoles: participant?.desiredRoles ?? [],
    availableTime: participant?.availableTime ?? "",
    teamRole: participant?.teamRole ?? "",
    portfolioUrl: participant?.portfolioUrl ?? "",
    publicContact: participant?.publicContact ?? "",
    projectExperience: participant?.projectExperience ?? "",
    bio: participant?.bio ?? "",
    isInternal: participant?.isInternal ?? false,
    publicDisplay: participant?.publicDisplay ?? false,
  };
}

export function RegistrationForm({
  participant,
  email,
}: {
  participant: Participant | null;
  email: string;
}) {
  const [state, action, pending] = useActionState(
    saveRegistration,
    initialActionState,
  );
  const [draft, setDraft] = useState(() =>
    registrationDraft(participant, email),
  );
  function update<Key extends keyof RegistrationDraft>(
    key: Key,
    value: RegistrationDraft[Key],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  return (
    <>
      {state.ok && (
        <div className="status-in mb-6 rounded-xl border border-success/25 bg-success/10 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
            <div>
              <h2 className="font-display text-lg font-bold">报名资料已保存</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                资料会按你的公开授权立即展示；管理员会不定期巡查违规内容。
                接下来可以查看报名资料，或直接创建队伍。
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/my-registration">
                <ClipboardCheck />
                查看我的报名
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/create">
                <PlusCircle />
                创建队伍
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/browse-teams">
                <Users />
                浏览队伍
              </Link>
            </Button>
          </div>
        </div>
      )}
      <form action={action} className="form-surface space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="name"
            label="姓名"
            value={draft.name}
            onChange={(value) => update("name", value)}
            required
          />
          <TextField
            name="phone"
            label="手机号"
            value={draft.phone}
            onChange={(value) => update("phone", value)}
            required
          />
          <TextField
            name="email"
            label="联系邮箱（可与登录邮箱不同）"
            type="email"
            value={draft.email}
            onChange={(value) => update("email", value)}
            required
          />
          <TextField
            name="school"
            label="学校"
            value={draft.school}
            onChange={(value) => update("school", value)}
            required
          />
          <TextField
            name="college"
            label="学院"
            value={draft.college}
            onChange={(value) => update("college", value)}
            required
          />
          <TextField
            name="grade"
            label="年级"
            value={draft.grade}
            onChange={(value) => update("grade", value)}
            required
          />
          <TextField
            name="studentId"
            label="学号"
            value={draft.studentId}
            onChange={(value) => update("studentId", value)}
            required
          />
          <div className="space-y-2">
            <Label
              htmlFor="registrationMethod"
              className="font-semibold text-foreground/85"
            >
              报名方式 *
            </Label>
            <Select
              name="registrationMethod"
              value={draft.registrationMethod}
              onValueChange={(value) => update("registrationMethod", value)}
              required
            >
              <SelectTrigger id="registrationMethod" className="w-full">
                <SelectValue placeholder="请选择报名方式" />
              </SelectTrigger>
              <SelectContent>
                {registrationMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TagSelectField
            name="skills"
            label="技能标签"
            options={skillOptions}
            defaultValue={draft.skills}
          />
          <TagSelectField
            name="techStack"
            label="熟悉技术"
            options={techStackOptions}
            defaultValue={draft.techStack}
          />
          <TagSelectField
            name="desiredRoles"
            label="希望承担角色"
            options={roleOptions}
            defaultValue={draft.desiredRoles}
          />
          <TextField
            name="availableTime"
            label="可投入时间"
            value={draft.availableTime}
            onChange={(value) => update("availableTime", value)}
          />
          <TextField
            name="teamRole"
            label="队内角色"
            value={draft.teamRole}
            onChange={(value) => update("teamRole", value)}
          />
          <TextField
            name="portfolioUrl"
            label="GitHub 或作品集"
            type="url"
            value={draft.portfolioUrl}
            onChange={(value) => update("portfolioUrl", value)}
          />
          <TextField
            name="publicContact"
            label="公开联系方式（选填）"
            value={draft.publicContact}
            onChange={(value) => update("publicContact", value)}
            placeholder="邮箱、微信或手机号"
          />
          <TextAreaField
            name="projectExperience"
            label="项目经历"
            value={draft.projectExperience}
            onChange={(value) => update("projectExperience", value)}
          />
          <TextAreaField
            name="bio"
            label="个人简介"
            value={draft.bio}
            onChange={(value) => update("bio", value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <CheckField
            name="isInternal"
            label="我是校内学生"
            checked={draft.isInternal}
            onCheckedChange={(checked) => update("isInternal", checked)}
          />
          <CheckField
            name="publicDisplay"
            label="同意在找队友页面公开展示"
            description="将公开基础资料、院系与年级、校内身份、报名方式、能力与角色意向、合作安排、经历、简介、作品集和你主动填写的公开联系渠道；报名所需的私密身份核验资料不会公开。"
            checked={draft.publicDisplay}
            onCheckedChange={(checked) => update("publicDisplay", checked)}
          />
        </div>
        <FormMessage state={state} />
        <Button size="lg" pending={pending}>
          {participant ? "保存修改" : "提交报名"}
        </Button>
      </form>
    </>
  );
}
