import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionState } from "@/lib/domain";
import { RegistrationForm } from "./registration-form";

const { saveRegistrationMock } = vi.hoisted(() => ({
  saveRegistrationMock: vi.fn(
    async (_state: ActionState, _formData: FormData): Promise<ActionState> => {
      void _state;
      void _formData;
      return { ok: false, message: "请检查表单内容" };
    },
  ),
}));

vi.mock("@/app/actions", () => ({ saveRegistration: saveRegistrationMock }));

describe("RegistrationForm", () => {
  beforeEach(() => {
    saveRegistrationMock.mockClear();
  });

  it("keeps the entered values when the server rejects the form", async () => {
    render(<RegistrationForm participant={null} email="user@example.com" />);
    fireEvent.change(screen.getByLabelText("姓名", { exact: false }), {
      target: { value: "QA 用户" },
    });
    fireEvent.change(screen.getByLabelText("手机号", { exact: false }), {
      target: { value: "13800000000" },
    });
    const form = screen
      .getByRole("button", { name: "提交报名" })
      .closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => expect(saveRegistrationMock).toHaveBeenCalled());
    expect(screen.getByLabelText("姓名", { exact: false })).toHaveValue(
      "QA 用户",
    );
    expect(screen.getByLabelText("手机号", { exact: false })).toHaveValue(
      "13800000000",
    );
  });

  it("does not ask for an expected track during registration", () => {
    render(<RegistrationForm participant={null} email="user@example.com" />);

    expect(screen.queryByText("期望赛道")).not.toBeInTheDocument();
  });
});
