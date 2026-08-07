import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/components/auth-form";
import type { ActionState } from "@/lib/domain";

const { requestMagicLinkMock } = vi.hoisted(() => ({
  requestMagicLinkMock: vi.fn(
    async (state: ActionState, formData: FormData): Promise<ActionState> => {
      void state;
      void formData;
      return {
        ok: true,
        message: "登录链接已发送，请检查邮箱",
      };
    },
  ),
}));

vi.mock("@/app/actions", () => ({
  requestMagicLink: requestMagicLinkMock,
}));

describe("AuthForm", () => {
  beforeEach(() => {
    requestMagicLinkMock.mockClear();
  });

  it("submits the form data after asynchronous validation", async () => {
    const user = userEvent.setup();
    render(<AuthForm callbackUrl="/register" />);

    await user.type(screen.getByLabelText("邮箱地址"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "发送登录链接" }));

    await waitFor(() => expect(requestMagicLinkMock).toHaveBeenCalledOnce());
    const formData = requestMagicLinkMock.mock.calls[0]?.[1] as FormData;
    expect(formData.get("email")).toBe("user@example.com");
    expect(formData.get("callbackUrl")).toBe("/register");
  });
});
