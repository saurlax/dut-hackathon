"use client";

import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import type { PublicAnnouncement } from "@/lib/announcement";
import { AnnouncementMarkdown } from "@/components/announcement-markdown";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const ANNOUNCEMENT_DISMISSED_KEY =
  "dut-hackathon:announcement:dismissed-version";
export const ANNOUNCEMENT_CLOSED_TODAY_KEY =
  "dut-hackathon:announcement:closed-today";

type CloseView = "announcement" | "close-options";

type ClosedTodayRecord = {
  version: string;
  date: string;
};

function shanghaiDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

export function shanghaiDateKey(date = new Date()) {
  const { year, month, day } = shanghaiDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function millisecondsUntilNextShanghaiDay(date = new Date()) {
  const { year, month, day } = shanghaiDateParts(date);
  const nextMidnight = Date.UTC(year, month - 1, day + 1) - 8 * 60 * 60 * 1_000;
  return Math.max(1, nextMidnight - date.getTime());
}

function readClosedToday(): ClosedTodayRecord | null {
  try {
    const value = localStorage.getItem(ANNOUNCEMENT_CLOSED_TODAY_KEY);
    if (!value) return null;
    const parsed: unknown = JSON.parse(value);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("version" in parsed) ||
      !("date" in parsed) ||
      typeof parsed.version !== "string" ||
      typeof parsed.date !== "string"
    ) {
      return null;
    }
    return { version: parsed.version, date: parsed.date };
  } catch {
    return null;
  }
}

export function shouldShowAnnouncement(
  announcement: PublicAnnouncement,
  date = new Date(),
) {
  try {
    if (
      localStorage.getItem(ANNOUNCEMENT_DISMISSED_KEY) === announcement.version
    ) {
      return false;
    }
  } catch {
    // Storage can be unavailable in privacy-restricted browsers. In that case
    // show the announcement and keep all controls usable for this page load.
  }

  const closedToday = readClosedToday();
  return !(
    closedToday?.version === announcement.version &&
    closedToday.date === shanghaiDateKey(date)
  );
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Closing the current dialog must still work when persistence is blocked.
  }
}

export function AnnouncementDialog({
  announcement,
}: {
  announcement: PublicAnnouncement;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<CloseView>("announcement");

  useEffect(() => {
    let observedDate = shanghaiDateKey();
    let midnightTimer: number | undefined;

    function applyStoredVisibility() {
      setView("announcement");
      setOpen(shouldShowAnnouncement(announcement));
    }

    function checkForNewShanghaiDay() {
      const currentDate = shanghaiDateKey();
      if (currentDate === observedDate) return false;
      observedDate = currentDate;
      applyStoredVisibility();
      return true;
    }

    function scheduleMidnightCheck() {
      if (midnightTimer !== undefined) window.clearTimeout(midnightTimer);
      midnightTimer = window.setTimeout(() => {
        checkForNewShanghaiDay();
        scheduleMidnightCheck();
      }, millisecondsUntilNextShanghaiDay() + 50);
    }

    function handleFocus() {
      if (checkForNewShanghaiDay()) scheduleMidnightCheck();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") handleFocus();
    }

    applyStoredVisibility();
    scheduleMidnightCheck();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (midnightTimer !== undefined) window.clearTimeout(midnightTimer);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [announcement]);

  const currentAnnouncement = announcement;

  function requestClose(nextOpen: boolean) {
    if (nextOpen) {
      setOpen(true);
      return;
    }
    if (view === "announcement") setView("close-options");
  }

  function closeForToday() {
    writeStorage(
      ANNOUNCEMENT_CLOSED_TODAY_KEY,
      JSON.stringify({
        version: currentAnnouncement.version,
        date: shanghaiDateKey(),
      } satisfies ClosedTodayRecord),
    );
    setOpen(false);
  }

  function dismissVersion() {
    writeStorage(ANNOUNCEMENT_DISMISSED_KEY, currentAnnouncement.version);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={requestClose}>
      <DialogContent
        className="max-w-2xl gap-0 overflow-hidden p-0"
        showCloseButton={false}
      >
        {view === "announcement" ? (
          <>
            <DialogHeader className="relative border-b border-primary/15 bg-[linear-gradient(135deg,rgba(37,99,235,0.09),rgba(6,182,212,0.06),rgba(255,255,255,0.75))] px-6 py-5 pr-16 sm:px-7 sm:py-6 sm:pr-16">
              <div className="mb-1 flex items-center gap-2 text-primary">
                <Megaphone className="size-4" aria-hidden="true" />
                <span className="eyebrow">ANNOUNCEMENT</span>
              </div>
              <DialogTitle className="text-2xl sm:text-3xl">
                {currentAnnouncement.title}
              </DialogTitle>
              <DialogDescription>大工黑客松组队中心赛事公告</DialogDescription>
              <div className="absolute top-4 right-4 z-10">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="关闭公告"
                  onClick={() => setView("close-options")}
                >
                  <X />
                </Button>
              </div>
            </DialogHeader>
            <div className="max-h-[min(68vh,42rem)] overflow-y-auto px-6 py-5 sm:px-7 sm:py-6">
              <AnnouncementMarkdown markdown={currentAnnouncement.markdown} />
            </div>
          </>
        ) : (
          <div className="p-6 sm:p-7">
            <DialogHeader>
              <DialogTitle>如何关闭这条公告？</DialogTitle>
              <DialogDescription>
                公告内容发生变化后，无论选择哪种方式都会重新显示。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 sm:flex-wrap">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setView("announcement")}
              >
                返回公告
              </Button>
              <Button
                type="button"
                variant="outline"
                autoFocus
                onClick={closeForToday}
              >
                关闭本次（今天不再显示）
              </Button>
              <Button type="button" onClick={dismissVersion}>
                不再显示
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
