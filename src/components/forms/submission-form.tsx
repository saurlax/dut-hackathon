"use client";
import { useActionState } from "react";
import { saveSubmission } from "@/app/actions";
import { initialActionState } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import {
  CheckField,
  FormMessage,
  TextAreaField,
  TextField,
} from "./form-parts";
const linkNames = [
  "githubUrl",
  "demoUrl",
  "demoVideo",
  "datasetUrl",
  "pptUrl",
  "docsUrl",
  "packageUrl",
  "coverUrl",
  "supplementaryUrl",
] as const;
const linkLabels = [
  "代码仓库",
  "在线演示",
  "演示视频",
  "数据集或模型",
  "项目 PPT",
  "说明文档",
  "安装包",
  "项目封面",
  "补充附件",
];
export interface SubmissionDraft {
  id: string;
  projectName: string;
  track: string;
  oneLiner: string;
  background: string;
  problemSolved: string;
  coreFeatures: string;
  techApproach: string;
  innovation: string;
  applicationValue: string;
  usageGuide: string;
  links: Record<string, string>;
  publicDisplay: boolean;
}
export function SubmissionForm({
  submission,
}: {
  submission: SubmissionDraft | null;
}) {
  const [state, action, pending] = useActionState(
    saveSubmission,
    initialActionState,
  );
  return (
    <form action={action} className="form-surface space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="projectName"
          label="作品名称"
          defaultValue={submission?.projectName}
          required
        />
        <TextField
          name="track"
          label="所属赛道"
          defaultValue={submission?.track}
          required
        />
        <TextAreaField
          name="oneLiner"
          label="一句话介绍"
          defaultValue={submission?.oneLiner}
          required
          maxLength={350}
        />
        {[
          ["background", "项目背景"],
          ["problemSolved", "解决的问题"],
          ["coreFeatures", "核心功能"],
          ["techApproach", "技术方案"],
          ["innovation", "创新点"],
          ["applicationValue", "应用价值"],
          ["usageGuide", "使用说明"],
        ].map(([name, label]) => (
          <TextAreaField
            key={name}
            name={name}
            label={label}
            defaultValue={submission?.[name as keyof SubmissionDraft] as string}
            required
            maxLength={350}
          />
        ))}
        {linkNames.map((name, index) => (
          <TextField
            key={name}
            name={name}
            label={linkLabels[index]}
            type="url"
            defaultValue={submission?.links[name]}
          />
        ))}
      </div>
      <CheckField
        name="publicDisplay"
        label="我同意审核通过后公开展示作品说明及上述链接"
        defaultChecked={submission?.publicDisplay ?? false}
      />
      <FormMessage state={state} />
      <Button size="lg" disabled={pending}>
        {pending ? "保存中…" : submission ? "更新作品" : "提交作品"}
      </Button>
    </form>
  );
}
