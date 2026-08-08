import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RemoveAdminButton } from "./remove-admin-button";

afterEach(cleanup);

vi.mock("@/app/actions", () => ({
  removeAdmin: vi.fn(async () => ({ ok: true, message: "已移除管理员" })),
}));

describe("RemoveAdminButton", () => {
  it("requires a two-step confirmation before showing the destructive action", async () => {
    const user = userEvent.setup();
    render(<RemoveAdminButton email="a@example.com" />);

    expect(screen.queryByRole("button", { name: /确认移除/ })).toBeNull();
    await user.click(screen.getByRole("button", { name: "移除" }));

    expect(screen.getByRole("button", { name: /确认移除/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "取消" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "取消" }));
    expect(screen.queryByRole("button", { name: /确认移除/ })).toBeNull();
  });
  it("renders a muted placeholder when disabled", () => {
    const { container } = render(
      <RemoveAdminButton email="a@example.com" disabled />,
    );
    expect(container.textContent).toBe("—");
  });
});
