import { beforeEach, describe, expect, it, vi } from "vitest";
import { GlobalAnnouncement } from "@/components/global-announcement";

const { activeAnnouncementMock } = vi.hoisted(() => ({
  activeAnnouncementMock: vi.fn(),
}));

vi.mock("@/lib/queries", () => ({
  activeAnnouncement: activeAnnouncementMock,
}));

beforeEach(() => {
  activeAnnouncementMock.mockReset();
});

describe("GlobalAnnouncement", () => {
  it("does not render a client boundary without an active announcement", async () => {
    activeAnnouncementMock.mockResolvedValue(null);

    expect(await GlobalAnnouncement()).toBeNull();
  });

  it("renders the dialog boundary for an active announcement", async () => {
    activeAnnouncementMock.mockResolvedValue({
      title: "测试公告",
      markdown: "正文",
      version: "version-1",
    });

    expect(await GlobalAnnouncement()).not.toBeNull();
  });
});
