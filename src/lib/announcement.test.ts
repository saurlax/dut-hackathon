import { describe, expect, it } from "vitest";
import {
  announcementContentVersion,
  normalizeAnnouncementContent,
} from "@/lib/announcement";

describe("announcement content identity", () => {
  it("normalizes outer whitespace and line endings", () => {
    expect(
      normalizeAnnouncementContent({
        title: "  重要\r\n通知  ",
        content: "  第一行\r\n第二行\r  ",
      }),
    ).toEqual({ title: "重要\n通知", content: "第一行\n第二行" });
  });

  it("keeps the version stable for visually identical content", () => {
    const first = announcementContentVersion({
      title: "重要通知",
      content: "第一行\r\n第二行",
    });
    const second = announcementContentVersion({
      title: "  重要通知  ",
      content: "\n第一行\n第二行\n",
    });

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes the version when either the title or body changes", () => {
    const original = announcementContentVersion({
      title: "重要通知",
      content: "正文",
    });

    expect(
      announcementContentVersion({ title: "新通知", content: "正文" }),
    ).not.toBe(original);
    expect(
      announcementContentVersion({ title: "重要通知", content: "新正文" }),
    ).not.toBe(original);
  });
});
