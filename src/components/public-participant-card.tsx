"use client";

import { ExternalLink, Maximize2, XIcon } from "lucide-react";
import { displayNumber, isSafeHttpUrl } from "@/lib/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type PublicParticipant = {
  id: string;
  participantNumber: number;
  name: string;
  school: string;
  college: string;
  grade: string;
  isInternal: boolean;
  registrationMethod: string;
  skills: string[];
  techStack: string[];
  desiredRoles: string[];
  availableTime: string;
  teamRole: string;
  projectExperience: string;
  bio: string;
  portfolioUrl: string;
  publicContact: string;
};

function publicText(value: string) {
  return value.trim() || "未填写";
}

function PublicTags({ values }: { values: string[] }) {
  if (!values.length) {
    return <span className="text-muted-foreground">未填写</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value, index) => (
        <Badge key={`${value}-${index}`} variant="outline">
          {value}
        </Badge>
      ))}
    </div>
  );
}

function DetailItem({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`min-w-0 bg-white/90 p-4 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="label-mono text-[10px] text-muted-foreground">{label}</dt>
      <dd className="mt-1.5 min-w-0 text-sm leading-relaxed whitespace-pre-wrap break-words">
        {children}
      </dd>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="font-display text-base font-bold">{title}</h3>
      <dl className="grid gap-px overflow-hidden border border-primary/15 bg-primary/15 sm:grid-cols-2">
        {children}
      </dl>
    </section>
  );
}

export function PublicParticipantCard({
  participant,
}: {
  participant: PublicParticipant;
}) {
  const profile = [
    participant.school,
    participant.college,
    participant.grade,
  ].filter(Boolean);
  const number = displayNumber("P", participant.participantNumber);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`查看 ${participant.name} 的公开资料`}
          className="group block h-full w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Card className="flex h-full flex-col rounded-none border-foreground/15 bg-white p-5 shadow-none transition-all duration-150 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:border-foreground group-hover:shadow-hard">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
                  {participant.name}
                </h3>
                <p className="nums mt-0.5 label-mono text-[10px] text-muted-foreground">
                  {number}
                </p>
              </div>
              <Maximize2 className="size-4 shrink-0 text-foreground/35 transition-colors group-hover:text-foreground" />
            </div>

            {profile.length > 0 && (
              <p className="mt-1 label-mono text-[10px] text-muted-foreground">
                {profile.join(" · ")}
              </p>
            )}

            {participant.desiredRoles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {participant.desiredRoles.map((role) => (
                  <span
                    key={role}
                    className="label-mono bg-foreground px-1.5 py-0.5 text-[10px] text-background"
                  >
                    {role}
                  </span>
                ))}
              </div>
            )}

            {participant.techStack.length > 0 && (
              <div className="mt-2.5 font-mono text-[10px] text-muted-foreground">
                <span className="mr-1.5 label-mono text-foreground/40">
                  STACK
                </span>
                {participant.techStack.slice(0, 4).map((tech, index) => (
                  <span key={tech}>
                    {index > 0 && (
                      <span className="mx-1 text-foreground/20">/</span>
                    )}
                    {tech}
                  </span>
                ))}
                {participant.techStack.length > 4 && (
                  <span className="ml-1 text-foreground/40">
                    +{participant.techStack.length - 4}
                  </span>
                )}
              </div>
            )}

            <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-muted-foreground">
              {participant.bio ? (
                participant.bio
              ) : (
                <span className="italic text-foreground/35">
                  这位参赛者暂未填写简介
                </span>
              )}
            </p>

            <div className="mt-auto pt-4">
              {participant.publicContact && (
                <div className="border-t border-foreground/15 pt-3 font-mono text-[11px] text-muted-foreground">
                  <span className="mr-1.5 label-mono text-[10px] text-foreground/40">
                    公开联系方式
                  </span>
                  <span className="break-all">{participant.publicContact}</span>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-foreground/15 pt-3 label-mono text-[10px] text-foreground/55">
                <span>点击查看完整资料</span>
                <span aria-hidden="true">OPEN ↗</span>
              </div>
            </div>
          </Card>
        </button>
      </DialogTrigger>

      <DialogContent
        className="max-w-3xl rounded-none p-0"
        showCloseButton={false}
      >
        <DialogHeader className="relative border-b border-foreground/15 bg-white px-6 py-5 sm:px-7">
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-4 right-4 sm:right-5"
            >
              <XIcon />
              <span className="sr-only">关闭</span>
            </Button>
          </DialogClose>
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <DialogTitle className="text-2xl">{participant.name}</DialogTitle>
            <Badge variant="outline">
              {participant.isInternal ? "校内学生" : "校外参赛者"}
            </Badge>
          </div>
          <DialogDescription className="label-mono text-[11px]">
            {number} · 完整公开资料
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 pb-7 sm:px-7">
          <DetailSection title="基本信息">
            <DetailItem label="学校">
              {publicText(participant.school)}
            </DetailItem>
            <DetailItem label="学院">
              {publicText(participant.college)}
            </DetailItem>
            <DetailItem label="年级">
              {publicText(participant.grade)}
            </DetailItem>
            <DetailItem label="报名方式">
              {publicText(participant.registrationMethod)}
            </DetailItem>
            <DetailItem label="可投入时间">
              {publicText(participant.availableTime)}
            </DetailItem>
            <DetailItem label="队内角色">
              {publicText(participant.teamRole)}
            </DetailItem>
          </DetailSection>

          <DetailSection title="能力与方向">
            <DetailItem label="技能标签">
              <PublicTags values={participant.skills} />
            </DetailItem>
            <DetailItem label="熟悉技术">
              <PublicTags values={participant.techStack} />
            </DetailItem>
            <DetailItem label="希望承担角色" wide>
              <PublicTags values={participant.desiredRoles} />
            </DetailItem>
          </DetailSection>

          <DetailSection title="经历与介绍">
            <DetailItem label="项目经历" wide>
              {publicText(participant.projectExperience)}
            </DetailItem>
            <DetailItem label="个人简介" wide>
              {publicText(participant.bio)}
            </DetailItem>
          </DetailSection>

          <DetailSection title="联系与作品">
            <DetailItem label="公开联系方式" wide>
              {publicText(participant.publicContact)}
            </DetailItem>
            <DetailItem label="GitHub 或作品集" wide>
              {isSafeHttpUrl(participant.portfolioUrl) ? (
                <a
                  href={participant.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex max-w-full items-center gap-1.5 break-all text-primary underline underline-offset-2"
                >
                  {participant.portfolioUrl}
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              ) : (
                "未填写"
              )}
            </DetailItem>
          </DetailSection>

          <p className="border-t border-foreground/15 pt-4 text-xs leading-relaxed text-muted-foreground">
            此处仅展示参赛者授权公开的组队资料，不包含手机号、联系邮箱和学号等核验信息。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
