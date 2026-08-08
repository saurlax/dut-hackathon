"use client";

import { useActionState, useEffect, useState } from "react";
import { saveAnnouncement } from "@/app/actions";
import { AnnouncementMarkdown } from "@/components/announcement-markdown";
import { CheckField, FormMessage } from "@/components/forms/form-parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/domain";

export type AdminAnnouncementInitialValue = {
  title: string;
  content: string;
  enabled: boolean;
  updatedAtLabel: string;
};

export function AdminAnnouncementForm({
  initialValue,
}: {
  initialValue: AdminAnnouncementInitialValue;
}) {
  const [title, setTitle] = useState(initialValue.title);
  const [content, setContent] = useState(initialValue.content);
  const [enabled, setEnabled] = useState(initialValue.enabled);
  const [state, action, pending] = useActionState(
    saveAnnouncement,
    initialActionState,
  );

  /* eslint-disable react-hooks/set-state-in-effect -- A Server Action refresh can normalize or replace the saved draft; keep the editor in sync without remounting and losing action feedback. */
  useEffect(() => {
    setTitle(initialValue.title);
    setContent(initialValue.content);
    setEnabled(initialValue.enabled);
  }, [initialValue.title, initialValue.content, initialValue.enabled]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="border-primary/15">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow text-primary">ANNOUNCEMENT EDITOR</p>
              <CardTitle className="mt-1">编辑全站公告</CardTitle>
            </div>
            <Badge
              variant="outline"
              className={
                enabled
                  ? "border-success/25 bg-success/10 text-success"
                  : "border-muted-foreground/20 bg-muted text-muted-foreground"
              }
            >
              {enabled ? "已启用" : "已停用"}
            </Badge>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            保存后立即对下一次访问生效。标题或正文变化时，曾关闭公告的浏览器也会再次看到。
          </p>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="announcement-title">公告标题 *</Label>
              <Input
                id="announcement-title"
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={100}
                placeholder="例如：报名截止时间调整"
                required
              />
              <p className="text-xs text-muted-foreground">
                {title.length}/100
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement-content">Markdown 正文 *</Label>
              <Textarea
                id="announcement-content"
                name="content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={10_000}
                rows={14}
                className="min-h-80 resize-y font-mono text-sm leading-6"
                placeholder={
                  "支持 **加粗**、列表、表格、链接和 HTTPS 图片。\n\n原始 HTML 不会显示。"
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                {content.length}/10000
              </p>
            </div>
            <CheckField
              name="enabled"
              label="启用这条公告"
              checked={enabled}
              onCheckedChange={setEnabled}
              description="停用后前台不再弹出，但标题和正文会作为草稿保留。"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" pending={pending}>
                保存公告
              </Button>
              <span className="text-xs text-muted-foreground">
                {initialValue.updatedAtLabel}
              </span>
            </div>
            <FormMessage state={state} />
          </form>
        </CardContent>
      </Card>

      <Card className="min-w-0 border-primary/15">
        <CardHeader>
          <p className="eyebrow text-primary">LIVE PREVIEW</p>
          <CardTitle>前台预览</CardTitle>
          <p className="text-sm text-muted-foreground">
            预览使用与访客弹窗完全相同的 Markdown 渲染规则。
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-primary/15 bg-white/75 shadow-sm">
            <div className="border-b border-primary/15 bg-[linear-gradient(135deg,rgba(37,99,235,0.09),rgba(6,182,212,0.06),rgba(255,255,255,0.75))] px-5 py-4">
              <p className="eyebrow text-primary">ANNOUNCEMENT</p>
              <h3 className="mt-1 font-display text-2xl font-bold">
                {title.trim() || "公告标题预览"}
              </h3>
            </div>
            <div className="max-h-[42rem] overflow-y-auto px-5 py-5">
              {content.trim() ? (
                <AnnouncementMarkdown markdown={content} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  在左侧输入 Markdown 正文后，这里会实时显示效果。
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
