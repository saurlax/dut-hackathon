import Image from "next/image";
import { Link } from "next-view-transitions";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
  Eye,
  Shield,
  Upload,
  UserPlus,
  UserSearch,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PartnerLogoGrid } from "@/components/partner-logo-grid";
import { Reveal } from "@/components/animation/reveal";

const processSteps = [
  "每位参赛者独立完成报名",
  "浏览招募队伍与个人组队池",
  "通过公开联系方式主动沟通",
  "队长完善成员并锁定最终阵容",
  "比赛结束后提交项目作品",
  "审核通过后进入公开展示厅",
];

const entries = [
  {
    index: "01",
    title: "我要报名",
    description: "填写或更新个人参赛资料",
    href: "/register",
    icon: UserPlus,
    status: "需登录",
  },
  {
    index: "02",
    title: "正在招募的队伍",
    description: "按方向与技术栈发现合适队伍",
    href: "/browse-teams",
    icon: Users,
    status: "公开浏览",
  },
  {
    index: "03",
    title: "个人组队池",
    description: "寻找技能互补的参赛伙伴",
    href: "/browse-pool",
    icon: UserSearch,
    status: "公开浏览",
  },
  {
    index: "04",
    title: "创建 / 管理队伍",
    description: "维护方向、成员与招募状态",
    href: "/my-team",
    icon: Shield,
    status: "需登录",
  },
  {
    index: "05",
    title: "最终组队确认",
    description: "由队长提交最终参赛阵容",
    href: "/final-confirmation",
    icon: CheckCircle,
    status: "队长操作",
  },
  {
    index: "06",
    title: "作品提交",
    description: "集中提交作品介绍与公开链接",
    href: "/submission",
    icon: Upload,
    status: "队长操作",
  },
];

const notes = [
  "每位参赛者只有一份报名资料，也只能加入一支队伍。",
  "队伍与个人资料只有在明确授权并通过管理员审核后才会公开；修改后会重新审核。",
  "每支队伍最多四人，队长负责最终确认与作品提交。",
  "公开联系方式只用于本次赛事组队，请尊重彼此隐私。",
];

export default function Home() {
  return (
    <div>
      <section className="tech-frame relative grid min-h-[500px] overflow-hidden py-12 md:grid-cols-[1.08fr_0.92fr] md:items-center md:gap-8 md:py-16">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-3 bottom-2 select-none font-display text-[8rem] font-black italic leading-none text-primary/[0.045] sm:text-[12rem] md:text-[15rem]"
        >
          S2
        </span>

        <Reveal className="relative z-10 max-w-2xl" y={18}>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="tech-kicker brand-text text-[11px]">
              THINK · BUILD · UPDATE
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-white/70 px-2 py-1 shadow-xs">
              <span className="brand-gradient size-1.5 rounded-full" />
              <span className="label-mono text-[10px] text-primary">
                DUT HACKATHON · S2
              </span>
            </span>
          </div>

          <h1 className="tech-title text-5xl leading-[0.96] text-foreground sm:text-6xl md:text-7xl">
            找到同频的人，
            <br />
            <span className="brand-text">把想法做出来。</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            第二届大工黑客松公开组队平台。
            <br className="hidden sm:block" />
            发现队伍 · 匹配伙伴 · 确认阵容 · 展示作品。
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="shadow-md">
              <Link href="/register">
                <UserPlus />
                我要报名
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/browse-teams">
                <Users />
                浏览队伍
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/browse-pool">
                <UserSearch />
                寻找队友
              </Link>
            </Button>
          </div>
        </Reveal>

        <Reveal
          className="relative z-10 mt-10 flex justify-center md:mt-0 md:justify-end"
          delay={0.1}
          y={16}
        >
          <div className="signal-arc">
            <Image
              src="/brand/dut-hackathon-s2.png"
              alt="第二届大工黑客松标志"
              width={2400}
              height={2400}
              sizes="(max-width: 767px) 66vw, 260px"
              loading="eager"
              fetchPriority="high"
              className="absolute left-1/2 top-0 h-auto w-[66%] -translate-x-1/2 bg-transparent object-contain [filter:drop-shadow(0_12px_18px_rgba(34,61,233,0.18))]"
            />
          </div>
        </Reveal>
      </section>

      <section className="border-b border-primary/15 py-10 md:py-12">
        <SectionHeading title="组队流程" english="HOW IT WORKS" count="06" />
        <Reveal className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-primary/15 bg-primary/15 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
          {processSteps.map((label, index) => (
            <li
              key={label}
              className="flex items-start gap-4 bg-white/90 p-5 transition-colors hover:bg-secondary/80"
            >
              <span className="label-mono shrink-0 text-sm font-bold text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-sm leading-relaxed text-foreground">
                {label}
              </span>
            </li>
          ))}
        </Reveal>
      </section>

      <section className="py-10 md:py-12">
        <SectionHeading title="功能入口" english="ENTER" count="06" />
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-primary/15 bg-primary/15 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(({ icon: Icon, ...entry }, index) => (
            <Reveal
              key={entry.href}
              className="h-full"
              delay={Math.min(index * 0.05, 0.2)}
            >
              <Link
                href={entry.href}
                className="group relative flex h-full flex-col bg-white/90 p-6 transition-colors duration-200 hover:bg-secondary/80"
              >
                <span className="brand-gradient absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100" />
                <div className="mb-6 flex items-start justify-between">
                  <span className="label-mono text-xs font-bold text-muted-foreground transition-colors group-hover:text-primary">
                    {entry.index}
                  </span>
                  <Icon className="size-5 text-foreground transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold tracking-tight">
                  {entry.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {entry.description}
                </p>
                <div className="mt-5 flex items-center gap-1 text-xs">
                  <span className="label-mono text-muted-foreground transition-colors group-hover:text-primary">
                    {entry.status}
                  </span>
                  <ArrowUpRight className="size-3.5 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal
        className="grid grid-cols-1 gap-6 pb-6 lg:grid-cols-3"
        delay={0.05}
      >
        <Card className="flex flex-col justify-between border-foreground/20 p-6 lg:col-span-1">
          <div>
            <span className="label-mono text-[11px] text-muted-foreground">
              AFTER EVENT
            </span>
            <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight">
              赛后作品
              <br />
              展示厅
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              审核通过且获得公开授权的项目，会在这里集中展示。
            </p>
          </div>
          <Button asChild variant="outline" className="mt-6 self-start">
            <Link href="/showcase">
              <Eye />
              进入展示厅
              <ArrowRight />
            </Link>
          </Button>
        </Card>

        <Card className="border-foreground/20 p-6 lg:col-span-2">
          <div className="mb-4 flex items-baseline gap-3">
            <h2 className="font-display text-lg font-extrabold tracking-tight">
              参赛须知
            </h2>
            <span className="label-mono text-[11px] text-muted-foreground">
              READ ME
            </span>
          </div>
          <ul className="divide-y divide-foreground/10">
            {notes.map((note, index) => (
              <li key={note} className="flex items-start gap-4 py-3">
                <span className="label-mono mt-0.5 shrink-0 text-xs font-bold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-sm leading-relaxed text-foreground/90">
                  {note}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </Reveal>

      <PartnerLogoGrid />
    </div>
  );
}

function SectionHeading({
  title,
  english,
  count,
}: {
  title: string;
  english: string;
  count: string;
}) {
  return (
    <div className="mb-6 flex items-baseline justify-between gap-4">
      <h2 className="flex items-center gap-3 font-display text-xl font-extrabold tracking-tight">
        {title}
        <span className="label-mono text-[11px] font-medium text-muted-foreground">
          {english}
        </span>
      </h2>
      <span className="label-mono text-[11px] text-muted-foreground">
        {count}
      </span>
    </div>
  );
}
