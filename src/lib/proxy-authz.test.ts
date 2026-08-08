import { describe, it, expect } from "vitest";
import { authorizeAdminPath } from "./proxy-authz";

describe("authorizeAdminPath", () => {
  it("blocks unauthenticated access to the admin area", () => {
    expect(authorizeAdminPath({ pathname: "/admin", hasSession: false })).toBe(
      false,
    );
    expect(
      authorizeAdminPath({ pathname: "/admin/teams", hasSession: false }),
    ).toBe(false);
  });
  it("lets authenticated requests reach the page so requireAdmin can enforce the role", () => {
    expect(authorizeAdminPath({ pathname: "/admin", hasSession: true })).toBe(
      true,
    );
    expect(
      authorizeAdminPath({ pathname: "/admin/participants", hasSession: true }),
    ).toBe(true);
  });
  it("leaves every other path to its own page guard", () => {
    expect(authorizeAdminPath({ pathname: "/create", hasSession: false })).toBe(
      true,
    );
    expect(authorizeAdminPath({ pathname: "/", hasSession: false })).toBe(true);
    expect(
      authorizeAdminPath({ pathname: "/browse-teams", hasSession: false }),
    ).toBe(true);
  });
});
