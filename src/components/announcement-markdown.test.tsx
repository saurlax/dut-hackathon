import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AnnouncementMarkdown } from "@/components/announcement-markdown";

afterEach(cleanup);

describe("AnnouncementMarkdown", () => {
  it("renders GFM content and safe external links", () => {
    render(
      <AnnouncementMarkdown
        markdown={[
          "# 重要安排",
          "",
          "- [x] 已确认",
          "- [ ] 待确认",
          "",
          "| 日期 | 安排 |",
          "| --- | --- |",
          "| 8 月 8 日 | 签到 |",
          "",
          "[查看详情](https://example.com/details)",
          "",
          "[协议相对链接](//example.com/details)",
        ].join("\n")}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "重要安排" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.getAllByRole("checkbox")[0]).toBeChecked();
    const link = screen.getByRole("link", { name: "查看详情" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "协议相对链接" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  });

  it("allows same-origin and HTTPS images but rejects insecure external images", () => {
    const { container } = render(
      <AnnouncementMarkdown
        markdown={[
          "![安全海报](https://example.com/poster.png)",
          "",
          "![站内海报](/poster.png)",
          "",
          "![不安全海报](http://example.com/poster.png)",
        ].join("\n")}
      />,
    );

    const image = screen.getByRole("img", { name: "安全海报" });
    expect(image).toHaveAttribute("src", "https://example.com/poster.png");
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(within(container).getByText("[不安全海报]")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "站内海报" })).toHaveAttribute(
      "src",
      "/poster.png",
    );
    expect(screen.getAllByRole("img")).toHaveLength(2);
  });

  it("drops raw HTML and dangerous link protocols", () => {
    render(
      <AnnouncementMarkdown
        markdown={
          '<script>alert("xss")</script>\n\n[危险链接](javascript:alert(1))'
        }
      />,
    );

    expect(screen.queryByText(/alert\("xss"\)/)).not.toBeInTheDocument();
    const dangerousLink = screen.getByText("危险链接").closest("a");
    expect(dangerousLink).toBeInTheDocument();
    expect(dangerousLink).toHaveAttribute("href", "");
  });
});
