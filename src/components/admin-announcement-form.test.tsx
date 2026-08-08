import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminAnnouncementForm } from "@/components/admin-announcement-form";

const { saveAnnouncementMock } = vi.hoisted(() => ({
  saveAnnouncementMock: vi.fn(async () => ({
    ok: true,
    message: "公告已保存并启用",
  })),
}));

vi.mock("@/app/actions", () => ({
  saveAnnouncement: saveAnnouncementMock,
}));

beforeEach(() => {
  saveAnnouncementMock.mockClear();
});

afterEach(cleanup);

describe("AdminAnnouncementForm", () => {
  it("keeps action feedback while syncing refreshed server values", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <AdminAnnouncementForm
        initialValue={{
          title: "旧标题",
          content: "旧正文",
          enabled: false,
          updatedAtLabel: "尚未保存公告",
        }}
      />,
    );

    await user.clear(screen.getByLabelText("公告标题 *"));
    await user.type(screen.getByLabelText("公告标题 *"), " 新标题 ");
    await user.clear(screen.getByLabelText("Markdown 正文 *"));
    await user.type(screen.getByLabelText("Markdown 正文 *"), " 新正文 ");
    await user.click(screen.getByRole("checkbox", { name: /启用这条公告/ }));
    await user.click(screen.getByRole("button", { name: "保存公告" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "公告已保存并启用",
    );

    rerender(
      <AdminAnnouncementForm
        initialValue={{
          title: "新标题",
          content: "新正文",
          enabled: true,
          updatedAtLabel: "上次保存：2026-08-09 00:10",
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("公告标题 *")).toHaveValue("新标题");
      expect(screen.getByLabelText("Markdown 正文 *")).toHaveValue("新正文");
    });
    expect(screen.getByRole("status")).toHaveTextContent("公告已保存并启用");
    expect(screen.getByText("上次保存：2026-08-09 00:10")).toBeInTheDocument();
  });
});
