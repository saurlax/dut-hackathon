import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Search,
    title: "发现合适队友",
    text: "按方向、技术栈和角色浏览公开队伍与参赛者。",
    href: "/browse-teams",
  },
  {
    icon: Users,
    title: "建立你的队伍",
    text: "完善报名资料，创建队伍并管理招募状态。",
    href: "/create",
  },
  {
    icon: ClipboardCheck,
    title: "完成参赛闭环",
    text: "从最终组队确认到作品提交，全流程集中管理。",
    href: "/final-confirmation",
  },
];

export default function Home() {
  return (
    <div className="space-y-14 py-4">
      <section className="tech-frame relative overflow-hidden rounded-3xl px-6 py-16 sm:px-12 sm:py-24">
        <div className="relative z-10 max-w-3xl">
          <p className="eyebrow mb-4">DUT HACKATHON · TEAM CENTER</p>
          <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-7xl">
            找到同频的人，<span className="brand-text">把想法做出来。</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            第二届大工黑客松公开组队平台。发现队伍、匹配伙伴、确认阵容并展示作品。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/browse-teams">
                浏览队伍
                <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/register">填写报名资料</Link>
            </Button>
          </div>
        </div>
        <Sparkles className="absolute -right-10 -top-10 size-72 text-blue-500/10" />
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {features.map(({ icon: Icon, title, text, href }) => (
          <Card key={title} className="bg-white/70">
            <CardHeader>
              <Icon className="size-8 text-blue-600" />
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-5 text-sm text-muted-foreground">{text}</p>
              <Button variant="link" className="px-0" asChild>
                <Link href={href}>
                  开始使用
                  <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
