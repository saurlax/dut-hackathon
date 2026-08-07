import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AdminAuditQueue } from "./admin-audit-queue";

describe("AdminAuditQueue", () => {
  it("shows pending records by default and switches to approved or all", async () => {
    const user = userEvent.setup();
    render(
      <AdminAuditQueue
        title="队伍审核"
        headers={["队伍"]}
        allLabel="全部队伍"
        records={[
          { key: "pending", status: "pending", cells: ["待审队伍"] },
          { key: "approved", status: "approved", cells: ["已通过队伍"] },
          { key: "rejected", status: "rejected", cells: ["已驳回队伍"] },
        ]}
      />,
    );

    expect(screen.getByText("待审队伍")).toBeInTheDocument();
    expect(screen.queryByText("已通过队伍")).not.toBeInTheDocument();
    expect(screen.queryByText("已驳回队伍")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /已通过/ }));
    expect(screen.getByText("已通过队伍")).toBeInTheDocument();
    expect(screen.queryByText("待审队伍")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /全部队伍/ }));
    expect(screen.getByText("待审队伍")).toBeInTheDocument();
    expect(screen.getByText("已通过队伍")).toBeInTheDocument();
    expect(screen.getByText("已驳回队伍")).toBeInTheDocument();
  });
});
