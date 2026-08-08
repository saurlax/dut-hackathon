import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorPage from "./error";

describe("ErrorPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a Chinese fallback and lets the user retry", () => {
    const retry = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorPage error={new Error("network")} retry={retry} />);

    expect(
      screen.getByRole("heading", { name: "页面暂时不可用" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
