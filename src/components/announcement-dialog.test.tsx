import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ANNOUNCEMENT_CLOSED_TODAY_KEY,
  ANNOUNCEMENT_DISMISSED_KEY,
  AnnouncementDialog,
  millisecondsUntilNextShanghaiDay,
  shanghaiDateKey,
  shouldShowAnnouncement,
} from "@/components/announcement-dialog";

const announcement = {
  title: "测试公告",
  markdown: "**重要内容**",
  version: "version-1",
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("AnnouncementDialog", () => {
  it("opens for a new announcement and asks how to close", async () => {
    const user = userEvent.setup();
    render(<AnnouncementDialog announcement={announcement} />);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "测试公告" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "关闭公告" }).parentElement,
    ).toHaveClass("absolute", "top-4", "right-4");

    await user.click(screen.getByRole("button", { name: "关闭公告" }));
    expect(
      screen.getByRole("heading", { name: "如何关闭这条公告？" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "关闭本次（今天不再显示）" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "不再显示" }),
    ).toBeInTheDocument();
  });

  it("routes Escape and backdrop close requests through the close choices", async () => {
    const user = userEvent.setup();
    render(<AnnouncementDialog announcement={announcement} />);

    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    expect(
      screen.getByRole("heading", { name: "如何关闭这条公告？" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "返回公告" }));
    expect(
      screen.getByRole("heading", { name: announcement.title }),
    ).toBeInTheDocument();

    const overlay = document.querySelector<HTMLElement>(
      '[data-slot="dialog-overlay"]',
    );
    expect(overlay).not.toBeNull();
    await user.click(overlay!);
    expect(
      screen.getByRole("heading", { name: "如何关闭这条公告？" }),
    ).toBeInTheDocument();
  });

  it("remembers a permanent dismissal for the same version only", async () => {
    const user = userEvent.setup();
    render(<AnnouncementDialog announcement={announcement} />);

    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "关闭公告" }));
    await user.click(screen.getByRole("button", { name: "不再显示" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(localStorage.getItem(ANNOUNCEMENT_DISMISSED_KEY)).toBe(
      announcement.version,
    );

    cleanup();
    render(<AnnouncementDialog announcement={announcement} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    cleanup();
    render(
      <AnnouncementDialog
        announcement={{ ...announcement, version: "version-2" }}
      />,
    );
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("closes for the current Shanghai day and reopens the next day", async () => {
    const user = userEvent.setup();
    render(<AnnouncementDialog announcement={announcement} />);

    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "关闭公告" }));
    await user.click(
      screen.getByRole("button", { name: "关闭本次（今天不再显示）" }),
    );
    expect(
      JSON.parse(localStorage.getItem(ANNOUNCEMENT_CLOSED_TODAY_KEY)!),
    ).toEqual({ version: "version-1", date: shanghaiDateKey() });

    cleanup();
    render(<AnnouncementDialog announcement={announcement} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    localStorage.setItem(
      ANNOUNCEMENT_CLOSED_TODAY_KEY,
      JSON.stringify({ version: "version-1", date: "2026-08-08" }),
    );
    expect(
      shouldShowAnnouncement(
        announcement,
        new Date("2026-08-08T16:01:00.000Z"),
      ),
    ).toBe(true);
  });

  it("still closes when browser storage rejects writes", async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    render(<AnnouncementDialog announcement={announcement} />);

    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "关闭公告" }));
    await user.click(screen.getByRole("button", { name: "不再显示" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("ignores damaged browser storage", async () => {
    localStorage.setItem(ANNOUNCEMENT_CLOSED_TODAY_KEY, "not-json");
    render(<AnnouncementDialog announcement={announcement} />);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("uses the Asia/Shanghai calendar date", () => {
    expect(shanghaiDateKey(new Date("2026-08-07T16:30:00.000Z"))).toBe(
      "2026-08-08",
    );
  });

  it("reopens a daily-dismissed announcement after Shanghai midnight", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-08T15:59:59.900Z"));
    localStorage.setItem(
      ANNOUNCEMENT_CLOSED_TODAY_KEY,
      JSON.stringify({ version: announcement.version, date: "2026-08-08" }),
    );

    expect(millisecondsUntilNextShanghaiDay()).toBe(100);
    render(<AnnouncementDialog announcement={announcement} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
