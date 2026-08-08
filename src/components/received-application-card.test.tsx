import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReceivedApplicationCard } from "./received-application-card";

vi.mock("@/components/application-review-buttons", () => ({
  ApplicationReviewButtons: () => null,
}));

describe("ReceivedApplicationCard", () => {
  it("shows the applicant message and number to the team leader", () => {
    render(
      <ReceivedApplicationCard
        application={{
          id: "application-1",
          status: "pending",
          message: "我会 React 和 PostgreSQL",
        }}
        participant={{ name: "申请人", participantNumber: 7 }}
      />,
    );

    expect(screen.getByText("申请人 · P0007")).toBeInTheDocument();
    expect(screen.getByText("我会 React 和 PostgreSQL")).toBeInTheDocument();
  });

  it("shows a neutral placeholder when the applicant did not leave a message", () => {
    render(
      <ReceivedApplicationCard
        application={{
          id: "application-2",
          status: "pending",
          message: "",
        }}
        participant={{ name: "申请人", participantNumber: 8 }}
      />,
    );

    expect(screen.getByText("未填写留言")).toBeInTheDocument();
  });
});
