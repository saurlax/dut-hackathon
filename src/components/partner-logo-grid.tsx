import Image from "next/image";
import { Reveal } from "@/components/animation/reveal";

interface PartnerLogo {
  name: string;
  src: string;
  width: number;
  height: number;
  imageClassName: string;
}

const partnerLogos: PartnerLogo[] = [
  {
    name: "大工创协",
    src: "/partners/dut-innovation-association.svg",
    width: 1000,
    height: 300,
    imageClassName: "max-h-11 max-w-[164px] sm:max-h-12",
  },
  {
    name: "TIC 腾讯高校创新俱乐部",
    src: "/partners/tencent-tic.png",
    width: 522,
    height: 299,
    imageClassName: "max-h-[3.25rem] max-w-[126px] sm:max-h-14",
  },
  {
    name: "NAOSI",
    src: "/partners/naosi.svg",
    width: 7287,
    height: 2570,
    imageClassName: "max-h-12 max-w-[166px] sm:max-h-[3.25rem]",
  },
  {
    name: "创中",
    src: "/partners/chuangzhong.svg",
    width: 261,
    height: 152,
    imageClassName: "max-h-12 max-w-[124px] sm:max-h-[3.25rem]",
  },
  {
    name: "大连理工大学图书馆",
    src: "/partners/dlut-library.png",
    width: 2382,
    height: 3366,
    imageClassName: "max-h-[9.5rem] max-w-32 sm:max-h-44",
  },
  {
    name: "去探索",
    src: "/partners/qu-tansuo.png",
    width: 4096,
    height: 1164,
    imageClassName: "max-h-11 max-w-[170px] sm:max-h-12",
  },
  {
    name: "奇绩创坛 MiraclePlus",
    src: "/partners/miracleplus.png",
    width: 3330,
    height: 810,
    imageClassName: "max-h-10 max-w-[174px] sm:max-h-11",
  },
  {
    name: "七牛云",
    src: "/partners/qiniu-cloud.png",
    width: 356,
    height: 124,
    imageClassName: "max-h-12 max-w-[150px] sm:max-h-[3.25rem]",
  },
  {
    name: "开放原子校源行",
    src: "/partners/openatom-campus.png",
    width: 1676,
    height: 593,
    imageClassName: "max-h-12 max-w-[160px] sm:max-h-[3.25rem]",
  },
  {
    name: "阶跃 StepFun",
    src: "/partners/stepfun.png",
    width: 1120,
    height: 500,
    imageClassName: "max-h-12 max-w-[146px] sm:max-h-[3.25rem]",
  },
];

export function PartnerLogoGrid() {
  return (
    <section
      className="border-t border-primary/15 py-10 md:py-12"
      aria-labelledby="partners-heading"
    >
      <Reveal className="mb-6 flex items-baseline justify-between gap-4">
        <h2
          id="partners-heading"
          className="flex items-center gap-3 font-display text-xl font-extrabold tracking-tight"
        >
          合作伙伴
          <span className="label-mono text-[11px] font-medium text-muted-foreground">
            PARTNERS
          </span>
        </h2>
        <span className="label-mono text-[11px] text-muted-foreground">10</span>
      </Reveal>

      <Reveal
        className="relative overflow-hidden rounded-lg border border-primary/20 bg-[image:var(--field-gradient)] px-3 py-5 shadow-sm sm:px-5 sm:py-6"
        delay={0.05}
      >
        <span
          aria-hidden="true"
          className="paper-grain pointer-events-none absolute inset-0 opacity-50"
        />
        <ul className="relative z-10 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-3 lg:grid-cols-5 lg:gap-x-5">
          {partnerLogos.map((logo) => (
            <li
              key={logo.name}
              className="group flex h-24 items-center justify-center px-2 transition-transform duration-200 hover:-translate-y-0.5 sm:h-28 sm:px-3"
            >
              <div className="flex h-16 w-full items-center justify-center transition-transform duration-200 group-hover:scale-[1.03] sm:h-[4.5rem]">
                <Image
                  src={logo.src}
                  alt={`${logo.name}标志`}
                  width={logo.width}
                  height={logo.height}
                  sizes="(min-width: 1024px) 176px, (min-width: 640px) 30vw, 42vw"
                  className={`h-auto w-auto bg-transparent object-contain ${logo.imageClassName}`}
                />
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
