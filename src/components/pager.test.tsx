import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Pager } from "./pager";

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

describe("Pager", () => {
  it("renders nothing when there is only a single page", () => {
    const { container } = render(
      <Pager
        basePath="/browse-teams"
        searchParams={{}}
        page={1}
        pageSize={12}
        total={5}
      />,
    );
    expect(container.innerHTML).toBe("");
  });
  it("links prev/next and preserves the keyword and page size", () => {
    render(
      <Pager
        basePath="/browse-teams"
        searchParams={{ q: "ai", pageSize: "12" }}
        page={2}
        pageSize={12}
        total={30}
      />,
    );
    expect(screen.getByRole("link", { name: /上一页/ })).toHaveAttribute(
      "href",
      "/browse-teams?q=ai&pageSize=12&page=1",
    );
    expect(screen.getByRole("link", { name: /下一页/ })).toHaveAttribute(
      "href",
      "/browse-teams?q=ai&pageSize=12&page=3",
    );
    expect(screen.getByText(/第 2 \/ 3 页/)).toBeInTheDocument();
  });
  it("omits the prev link on the first page and the next link on the last", () => {
    render(
      <Pager
        basePath="/browse-teams"
        searchParams={{}}
        page={1}
        pageSize={12}
        total={30}
      />,
    );
    expect(screen.queryByRole("link", { name: /上一页/ })).toBeNull();
    expect(screen.getByRole("link", { name: /下一页/ })).toBeTruthy();
  });
});
