import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminAuditButtons } from "./admin-audit-buttons";

vi.mock("@/app/actions", () => ({ updateAudit: vi.fn() }));

describe("AdminAuditButtons", () => {
  afterEach(() => cleanup());

  it("uses review actions for a pending participant", () => {
    render(
      <AdminAuditButtons
        kind="participant"
        id="participant-1"
        status="pending"
        revision={1}
      />,
    );

    expect(screen.getByRole("button", { name: "通过" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "驳回" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "恢复并通过" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "下架" }),
    ).not.toBeInTheDocument();
  });

  it("uses a takedown action for an approved participant", () => {
    render(
      <AdminAuditButtons
        kind="participant"
        id="participant-2"
        status="approved"
        revision={2}
      />,
    );

    expect(screen.getByRole("button", { name: "下架" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "通过" }),
    ).not.toBeInTheDocument();
  });

  it("uses a restore action for a rejected team", () => {
    render(
      <AdminAuditButtons
        kind="team"
        id="team-1"
        status="rejected"
        revision={3}
      />,
    );

    expect(
      screen.getByRole("button", { name: "恢复并通过" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "驳回" }),
    ).not.toBeInTheDocument();
  });
});
