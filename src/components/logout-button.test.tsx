import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LogoutButton } from "./logout-button";

const { logoutMock } = vi.hoisted(() => ({
  logoutMock: vi.fn(async () => {}),
}));

vi.mock("@/app/actions", () => ({ logout: logoutMock }));

describe("LogoutButton", () => {
  beforeEach(() => {
    logoutMock.mockClear();
  });

  it("submits logout without leaving the user on an unresponsive button", async () => {
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: "退出登录" }));

    await waitFor(() => expect(logoutMock).toHaveBeenCalledOnce());
  });
});
