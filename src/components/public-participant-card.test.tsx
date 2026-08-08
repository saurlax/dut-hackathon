import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PublicParticipantCard } from "./public-participant-card";

const participant = {
  id: "participant-1",
  participantNumber: 7,
  name: "测试伙伴",
  school: "大连理工大学",
  college: "软件学院",
  grade: "大三",
  isInternal: true,
  registrationMethod: "个人报名，正在找队伍",
  skills: ["产品设计", "前端开发"],
  techStack: ["React", "TypeScript"],
  desiredRoles: ["开发", "产品"],
  availableTime: "每周 20 小时",
  teamRole: "全栈开发",
  projectExperience: "做过两个完整的 Web 项目",
  bio: "喜欢快速验证创意",
  portfolioUrl: "https://example.com/portfolio",
  publicContact: "微信 test-partner",
};

describe("PublicParticipantCard", () => {
  it("opens the complete public profile from the whole card", async () => {
    const user = userEvent.setup();
    render(<PublicParticipantCard participant={participant} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "查看 测试伙伴 的公开资料" }),
    );

    const dialog = await screen.findByRole("dialog");
    const profile = within(dialog);
    expect(
      profile.getByRole("heading", { name: "测试伙伴" }),
    ).toBeInTheDocument();
    expect(profile.getByText("P0007 · 完整公开资料")).toBeInTheDocument();
    expect(profile.getByText("校内学生")).toBeInTheDocument();
    expect(profile.getByText("个人报名，正在找队伍")).toBeInTheDocument();
    expect(profile.getByText("产品设计")).toBeInTheDocument();
    expect(profile.getByText("TypeScript")).toBeInTheDocument();
    expect(profile.getByText("每周 20 小时")).toBeInTheDocument();
    expect(profile.getByText("全栈开发")).toBeInTheDocument();
    expect(profile.getByText("做过两个完整的 Web 项目")).toBeInTheDocument();
    expect(profile.getByText("喜欢快速验证创意")).toBeInTheDocument();
    expect(profile.getByText("微信 test-partner")).toBeInTheDocument();
    expect(
      profile.getByRole("link", { name: /https:\/\/example.com\/portfolio/ }),
    ).toHaveAttribute("href", "https://example.com/portfolio");
    expect(
      profile.getByText(/不包含手机号、联系邮箱和学号/),
    ).toBeInTheDocument();

    await user.click(profile.getByRole("button", { name: "关闭" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
