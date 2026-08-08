import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Slot } from "radix-ui";
import { createRef } from "react";
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

  it("forwards dropdown item layout props to the button", () => {
    const ref = createRef<HTMLButtonElement>();

    render(
      <Slot.Root ref={ref} role="menuitem" className="menu-item-layout">
        <LogoutButton />
      </Slot.Root>,
    );

    const button = screen.getByRole("menuitem", { name: "退出登录" });
    expect(button).toHaveClass("menu-item-layout");
    expect(ref.current).toBe(button);
  });
});
