import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TeamApplicationContext } from "./team-application-entry";
import { TeamApplicationEntry } from "./team-application-entry";

afterEach(cleanup);

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/application-form", () => ({
  ApplicationForm: () => <form>申请表单</form>,
}));

const approvedContext: TeamApplicationContext = {
  participant: {
    auditStatus: "approved",
    adminNote: "",
    isInternal: true,
  },
  membershipTeamId: null,
  pendingApplication: null,
  activeApplicationCount: 0,
};

describe("TeamApplicationEntry", () => {
  it("does not show the apply form to the team leader", () => {
    render(
      <TeamApplicationEntry
        teamId="team-1"
        recruitStatus="recruiting"
        recruitmentDeadline="2099-12-31"
        allowExternal={true}
        currentSize={1}
        maxSize={4}
        authenticated={true}
        context={{ ...approvedContext, membershipTeamId: "team-1" }}
      />,
    );

    expect(screen.getByText("你已经在这支队伍中")).toBeInTheDocument();
    expect(screen.queryByText("申请表单")).not.toBeInTheDocument();
  });

  it("keeps a pending application visible instead of showing another form", () => {
    render(
      <TeamApplicationEntry
        teamId="team-1"
        recruitStatus="recruiting"
        recruitmentDeadline="2099-12-31"
        allowExternal={true}
        currentSize={1}
        maxSize={4}
        authenticated={true}
        context={{ ...approvedContext, pendingApplication: { id: "app-1" } }}
      />,
    );

    expect(screen.getByText("申请已提交")).toBeInTheDocument();
  });

  it("sends unauthenticated visitors to login with the team callback", () => {
    render(
      <TeamApplicationEntry
        teamId="team-1"
        recruitStatus="recruiting"
        recruitmentDeadline="2099-12-31"
        allowExternal={true}
        currentSize={1}
        maxSize={4}
        authenticated={false}
        context={null}
      />,
    );

    expect(screen.getByRole("link", { name: "邮箱登录" })).toHaveAttribute(
      "href",
      "/login?callbackUrl=%2Fteam%2Fteam-1",
    );
  });

  it("blocks external applicants from an internal-only team", () => {
    render(
      <TeamApplicationEntry
        teamId="team-1"
        recruitStatus="recruiting"
        recruitmentDeadline="2099-12-31"
        allowExternal={false}
        currentSize={1}
        maxSize={4}
        authenticated={true}
        context={{
          ...approvedContext,
          participant: { ...approvedContext.participant, isInternal: false },
        }}
      />,
    );

    expect(screen.getByText("这支队伍仅接受校内成员")).toBeInTheDocument();
  });
});
