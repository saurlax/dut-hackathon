"use client";
import { useActionState } from "react";
import { saveRegistration } from "@/app/actions";
import { initialActionState } from "@/lib/domain";
import type { participants } from "@/db/schema";
import { Button } from "@/components/ui/button";
import {
  CheckField,
  FormMessage,
  TextAreaField,
  TextField,
} from "./form-parts";
type Participant = typeof participants.$inferSelect;
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
  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="name"
          label="姓名"
          defaultValue={participant?.name}
          required
        />
        <TextField
          name="phone"
          label="手机号"
          defaultValue={participant?.phone}
          required
        />
        <TextField
          name="email"
          label="联系邮箱"
          type="email"
          defaultValue={participant?.email ?? email}
          required
        />
        <TextField
          name="school"
          label="学校"
          defaultValue={participant?.school}
          required
        />
        <TextField
          name="college"
          label="学院"
          defaultValue={participant?.college}
          required
        />
        <TextField
          name="grade"
          label="年级"
          defaultValue={participant?.grade}
          required
        />
        <TextField
          name="studentId"
          label="学号"
          defaultValue={participant?.studentId}
          required
        />
        <TextField
          name="registrationMethod"
          label="报名方式"
          defaultValue={participant?.registrationMethod ?? "暂未确定"}
          required
          placeholder="个人报名，正在找队伍"
        />
        <TextField
          name="skills"
          label="技能标签"
          defaultValue={participant?.skills.join(", ")}
          placeholder="产品, 设计, 前端"
        />
        <TextField
          name="techStack"
          label="熟悉技术"
          defaultValue={participant?.techStack.join(", ")}
          placeholder="Next.js, Python"
        />
        <TextField
          name="desiredRoles"
          label="希望承担角色"
          defaultValue={participant?.desiredRoles.join(", ")}
        />
        <TextField
          name="expectedTracks"
          label="期望赛道"
          defaultValue={participant?.expectedTracks.join(", ")}
        />
        <TextField
          name="availableTime"
          label="可投入时间"
          defaultValue={participant?.availableTime}
        />
        <TextField
          name="teamRole"
          label="队内角色"
          defaultValue={participant?.teamRole}
        />
        <TextField
          name="portfolioUrl"
          label="GitHub 或作品集"
          type="url"
          defaultValue={participant?.portfolioUrl}
        />
        <TextField
          name="publicContact"
          label="公开联系方式"
          defaultValue={participant?.publicContact}
        />
        <TextAreaField
          name="projectExperience"
          label="项目经历"
          defaultValue={participant?.projectExperience}
        />
        <TextAreaField
          name="bio"
          label="个人简介"
          defaultValue={participant?.bio}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <CheckField
          name="isInternal"
          label="我是校内学生"
          defaultChecked={participant?.isInternal ?? true}
        />
        <CheckField
          name="publicDisplay"
          label="同意在找队友页面公开展示"
          defaultChecked={participant?.publicDisplay}
        />
      </div>
      <FormMessage state={state} />
      <Button size="lg" disabled={pending}>
        {pending ? "保存中…" : participant ? "保存修改" : "提交报名"}
      </Button>
    </form>
  );
}
