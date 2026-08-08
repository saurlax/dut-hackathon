import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionState } from "@/lib/domain";
import { TeamForm } from "./team-form";

const { saveTeamMock } = vi.hoisted(() => ({
  saveTeamMock: vi.fn(
    async (_state: ActionState, _formData: FormData): Promise<ActionState> => {
      void _state;
      void _formData;
      return { ok: false, message: "最大人数不能超过 4" };
    },
  ),
}));

vi.mock("@/app/actions", () => ({ saveTeam: saveTeamMock }));

describe("TeamForm", () => {
  beforeEach(() => {
    saveTeamMock.mockClear();
  });

  it("keeps the entered values when the server rejects the form", async () => {
    const user = userEvent.setup();
    render(<TeamForm team={null} />);

    await user.type(
      screen.getByLabelText("队伍名称", { exact: false }),
      "QA 队伍",
    );
    await user.type(
      screen.getByLabelText("公开联系渠道", { exact: false }),
      "contact@example.com",
    );
    fireEvent.change(screen.getByLabelText("招募截止日期", { exact: false }), {
      target: { value: "2099-12-31" },
    });
    await user.type(
      screen.getByLabelText("队伍介绍", { exact: false }),
      "End-to-end QA team",
    );
    fireEvent.change(screen.getByLabelText("最大人数", { exact: false }), {
      target: { value: "5" },
    });
    await user.click(screen.getByRole("button", { name: "创建队伍" }));

    await waitFor(() => expect(saveTeamMock).toHaveBeenCalled());
    expect(screen.getByLabelText("队伍名称", { exact: false })).toHaveValue(
      "QA 队伍",
    );
    expect(screen.getByLabelText("最大人数", { exact: false })).toHaveValue(5);
  });
});
