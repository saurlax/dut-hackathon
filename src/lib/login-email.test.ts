import { describe, expect, it } from "vitest";
import { createLoginEmail } from "./login-email";

const expires = new Date("2026-08-08T16:30:00.000Z");

describe("createLoginEmail", () => {
  it("creates a Chinese branded login email", () => {
    const email = createLoginEmail({
      url: "https://hackathon.example.com/api/auth/callback/nodemailer?token=secret",
      expires,
    });

    expect(email.subject).toBe("登录大工黑客松组队中心");
    expect(email.html).toContain('<html lang="zh-CN">');
    expect(email.html).toContain("登录组队中心");
    expect(email.html).toContain("安全登录");
    expect(email.html).toContain("北京时间");
    expect(email.text).toContain("你正在登录大工黑客松组队中心");
    expect(email.text).toContain("此链接仅可使用一次");
  });

  it("keeps the plain-text URL intact and escapes it in HTML", () => {
    const url =
      "https://hackathon.example.com/api/auth/callback/nodemailer?token=a&callbackUrl=%2Fmy-team";
    const email = createLoginEmail({ url, expires });

    expect(email.text).toContain(url);
    expect(email.html).toContain("token=a&amp;callbackUrl=%2Fmy-team");
    expect(email.html).not.toContain("token=a&callbackUrl=%2Fmy-team");
  });
});
