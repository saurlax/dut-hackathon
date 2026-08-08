import { createHash } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  config: null as unknown,
  sendMail: vi.fn(),
  insertValues: vi.fn(),
  baseCreateVerificationToken: vi.fn(),
  cleanupMagicLinkState: vi.fn(),
  consumeMagicLinkEmailRateLimit: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next-auth", () => ({
  default: vi.fn((config: unknown) => {
    state.config = config;
    return {
      handlers: { GET: vi.fn(), POST: vi.fn() },
      auth: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    };
  }),
}));
vi.mock("next-auth/providers/nodemailer", () => ({
  default: vi.fn((options: object) => ({
    id: "nodemailer",
    type: "email",
    ...options,
  })),
}));
vi.mock("@auth/drizzle-adapter", () => ({
  DrizzleAdapter: vi.fn(() => ({
    createVerificationToken: state.baseCreateVerificationToken,
  })),
}));
vi.mock("nodemailer", () => ({
  createTransport: vi.fn(() => ({ sendMail: state.sendMail })),
}));
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(() => ({ values: state.insertValues })),
    update: vi.fn(),
  },
}));
vi.mock("@/lib/env", () => ({
  getServerEnv: vi.fn(() => ({
    AUTH_SECRET: "auth-unit-test-secret-0123456789abcdef",
    AUTH_URL: "https://hackathon.example.com",
    EMAIL_SERVER_HOST: "smtp.example.com",
    EMAIL_SERVER_PORT: 587,
    EMAIL_SERVER_USER: "",
    EMAIL_SERVER_PASSWORD: "",
    EMAIL_FROM: "login@example.com",
    ADMIN_EMAILS: "",
    TRUST_PROXY: "false",
  })),
  adminEmails: vi.fn(() => new Set<string>()),
}));
vi.mock("@/lib/email-rate-limit", () => ({
  cleanupMagicLinkState: state.cleanupMagicLinkState,
  consumeMagicLinkEmailRateLimit: state.consumeMagicLinkEmailRateLimit,
}));

type VerificationRequest = {
  identifier: string;
  token: string;
  url: string;
  expires: Date;
  provider: { server: object; from: string };
};

type CapturedConfig = {
  adapter: {
    createVerificationToken: (value: {
      identifier: string;
      token: string;
      expires: Date;
    }) => Promise<unknown>;
  };
  providers: {
    sendVerificationRequest: (request: VerificationRequest) => Promise<void>;
  }[];
  callbacks: {
    signIn: (input: {
      user: { email: string };
      account: { type: string };
      email: { verificationRequest: boolean };
    }) => Promise<boolean>;
  };
};

let config: CapturedConfig;

beforeAll(async () => {
  await import("./auth");
  config = state.config as CapturedConfig;
});

beforeEach(() => {
  vi.clearAllMocks();
  state.insertValues.mockResolvedValue(undefined);
});

function verificationRequest(): VerificationRequest {
  return {
    identifier: "person@example.com",
    token: "raw-magic-link-token",
    url: "https://hackathon.example.com/api/auth/callback/nodemailer?token=raw-magic-link-token",
    expires: new Date("2026-08-09T00:00:00.000Z"),
    provider: { server: {}, from: "login@example.com" },
  };
}

describe("Auth.js magic-link token lifecycle", () => {
  it("persists the hashed token only after SMTP accepts the email", async () => {
    state.sendMail.mockResolvedValue({ rejected: [], pending: [] });
    const request = verificationRequest();

    await config.providers[0].sendVerificationRequest(request);

    expect(state.insertValues).toHaveBeenCalledWith({
      identifier: request.identifier,
      token: createHash("sha256")
        .update(`${request.token}auth-unit-test-secret-0123456789abcdef`)
        .digest("hex"),
      expires: request.expires,
    });
  });

  it("does not persist a token when SMTP throws or rejects a recipient", async () => {
    state.sendMail.mockRejectedValueOnce(new Error("SMTP unavailable"));
    await expect(
      config.providers[0].sendVerificationRequest(verificationRequest()),
    ).rejects.toThrow("SMTP unavailable");
    expect(state.insertValues).not.toHaveBeenCalled();

    state.sendMail.mockResolvedValueOnce({
      rejected: ["person@example.com"],
      pending: [],
    });
    await expect(
      config.providers[0].sendVerificationRequest(verificationRequest()),
    ).rejects.toThrow("登录邮件发送失败");
    expect(state.insertValues).not.toHaveBeenCalled();
  });

  it("makes the Auth.js adapter token write a no-op", async () => {
    const token = {
      identifier: "person@example.com",
      token: "hashed",
      expires: new Date("2026-08-09T00:00:00.000Z"),
    };

    await expect(config.adapter.createVerificationToken(token)).resolves.toBe(
      token,
    );
    expect(state.baseCreateVerificationToken).not.toHaveBeenCalled();
  });

  it("applies the per-email limiter before a verification request proceeds", async () => {
    await expect(
      config.callbacks.signIn({
        user: { email: "Person@Example.com" },
        account: { type: "email" },
        email: { verificationRequest: true },
      }),
    ).resolves.toBe(true);
    expect(state.cleanupMagicLinkState).toHaveBeenCalledOnce();
    expect(state.consumeMagicLinkEmailRateLimit).toHaveBeenCalledWith(
      "person@example.com",
    );
    expect(
      state.cleanupMagicLinkState.mock.invocationCallOrder[0],
    ).toBeLessThan(
      state.consumeMagicLinkEmailRateLimit.mock.invocationCallOrder[0],
    );
  });
});
