import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AdminDetailDialog } from "./admin-detail-dialog";

describe("AdminDetailDialog", () => {
  it("opens record details and closes accessibly", async () => {
    const user = userEvent.setup();
    render(
      <AdminDetailDialog
        title="P0001 · 测试用户"
        description="查看完整报名资料后再执行审核。"
      >
        <p>手机号：13800000000</p>
      </AdminDetailDialog>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "详情" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "P0001 · 测试用户" }),
    ).toBeInTheDocument();
    expect(screen.getByText("手机号：13800000000")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "关闭" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
