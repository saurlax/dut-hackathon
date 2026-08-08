import { z } from "zod";
import { isSafeHttpUrl } from "@/lib/domain";

const required = (label: string, max = 200) =>
  z.string().trim().min(1, `${label}不能为空`).max(max);
const tag = z
  .string()
  .trim()
  .min(1, "标签不能为空")
  .max(24, "单个标签不能超过 24 个字");
const stringList = z.preprocess(
  (value) =>
    typeof value === "string"
      ? value
          .split(/[,，]/)
          .map((item) => item.trim())
          .filter(Boolean)
      : value,
  z
    .array(tag)
    .max(12, "标签最多填写 12 个")
    .transform((items) => [...new Set(items)])
    .default([]),
);
const checkbox = z.preprocess(
  (value) => value === true || value === "on",
  z.boolean(),
);

export const emailLoginSchema = z.object({
  email: z.string().trim().email("请输入有效邮箱"),
});

export const participantSchema = z.object({
  name: required("姓名", 40),
  phone: required("手机号", 30),
  email: z.string().trim().email("请输入有效邮箱"),
  school: required("学校", 100),
  college: required("学院", 100),
  grade: required("年级", 30),
  studentId: required("学号", 50),
  isInternal: checkbox,
  skills: stringList,
  techStack: stringList,
  desiredRoles: stringList,
  projectExperience: z.string().trim().max(1000).default(""),
  bio: z.string().trim().max(500).default(""),
  portfolioUrl: z
    .union([
      z.literal(""),
      z
        .string()
        .url("请输入有效链接")
        .refine(isSafeHttpUrl, "仅支持 http:// 或 https:// 链接"),
    ])
    .default(""),
  availableTime: z.string().trim().max(100).default(""),
  registrationMethod: z.enum([
    "个人报名，正在找队伍",
    "已经加入队伍",
    "个人参赛，不再组队",
    "暂未确定",
  ]),
  teamRole: z.string().trim().max(50).default(""),
  publicContact: z.string().trim().max(200).default(""),
  publicDisplay: checkbox,
});

export const teamSchema = z.object({
  name: required("队伍名称", 80),
  track: stringList,
  projectDirection: z.string().trim().max(200).default(""),
  maturity: z.string().trim().max(50).default(""),
  capabilities: stringList,
  requiredRoles: stringList,
  techStack: stringList,
  requirements: z.string().trim().max(1000).default(""),
  description: required("队伍介绍", 2000),
  contact: required("公开联系渠道", 200),
  allowExternal: checkbox,
  publicDisplay: checkbox,
  recruitmentDeadline: z.iso.date(),
  maxSize: z.coerce.number().int().min(1).max(4),
});

export const applicationSchema = z.object({
  message: z.string().trim().max(200).default(""),
});

export const confirmationSchema = z.object({
  allConfirmed: z.literal("on", "请确认全员已确认"),
});

export const auditDecisionSchema = z
  .object({
    decision: z.enum(["approved", "rejected"]),
    reason: z.string().trim().max(1000, "审核说明不能超过 1000 字").default(""),
    expectedStatus: z.enum(["pending", "approved", "rejected"]),
    expectedRevision: z.coerce.number().int().min(1),
  })
  .superRefine((value, ctx) => {
    if (value.decision === "rejected" && !value.reason) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "驳回时必须填写原因",
      });
    }
  });

const optionalUrl = z
  .union([
    z.literal(""),
    z
      .string()
      .url("请输入有效链接")
      .refine(isSafeHttpUrl, "仅支持 http:// 或 https:// 链接"),
  ])
  .default("");
export const submissionSchema = z.object({
  projectName: required("作品名称", 100),
  track: required("所属赛道", 80),
  oneLiner: required("一句话介绍", 350),
  background: required("项目背景", 350),
  problemSolved: required("解决的问题", 350),
  coreFeatures: required("核心功能", 350),
  techApproach: required("技术方案", 350),
  innovation: required("创新点", 350),
  applicationValue: required("应用价值", 350),
  usageGuide: required("使用说明", 350),
  githubUrl: optionalUrl,
  demoUrl: optionalUrl,
  demoVideo: optionalUrl,
  datasetUrl: optionalUrl,
  pptUrl: optionalUrl,
  docsUrl: optionalUrl,
  packageUrl: optionalUrl,
  coverUrl: optionalUrl,
  supplementaryUrl: optionalUrl,
  publicDisplay: checkbox,
});

export function formDataObject(formData: FormData) {
  const values: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
  for (const [key, value] of formData.entries()) {
    const existing = values[key];
    if (existing === undefined) {
      values[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      values[key] = [existing, value];
    }
  }
  return values;
}
