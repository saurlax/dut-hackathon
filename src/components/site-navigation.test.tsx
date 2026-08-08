import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SiteNavigation } from "./site-navigation";

const { pathnameMock } = vi.hoisted(() => ({
  pathnameMock: vi.fn(),
}));

const scrollIntoViewMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: pathnameMock,
}));

describe("SiteNavigation", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/");
    scrollIntoViewMock.mockClear();
    Element.prototype.scrollIntoView = scrollIntoViewMock;
  });

  afterEach(cleanup);

  it("marks only the current top-level page", () => {
    render(<SiteNavigation />);

    expect(screen.getByRole("link", { name: "首页" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "队伍大厅" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("keeps a team detail page associated with the team lobby", () => {
    pathnameMock.mockReturnValue("/team/team-123");
    render(<SiteNavigation />);

    expect(screen.getByRole("link", { name: "队伍大厅" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "首页" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks nested showcase routes in the mobile navigation", () => {
    pathnameMock.mockReturnValue("/showcase/project-123");
    render(<SiteNavigation mobile />);

    expect(screen.getByRole("navigation", { name: "主导航" })).toHaveClass(
      "mobile-scroll-x",
    );
    expect(screen.getByRole("link", { name: "作品展示" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      block: "nearest",
      inline: "center",
    });
  });
});
