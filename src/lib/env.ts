import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),
  EMAIL_SERVER_HOST: z.string().min(1),
  EMAIL_SERVER_PORT: z.coerce.number().int().positive().default(587),
  EMAIL_SERVER_USER: z.string().default(""),
  EMAIL_SERVER_PASSWORD: z.string().default(""),
  EMAIL_FROM: z.string().email(),
  ADMIN_EMAILS: z.string().default(""),
});

export type ServerEnv = z.infer<typeof envSchema>;

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (!cached) cached = envSchema.parse(process.env);
  return cached;
}

export function adminEmails(value = process.env.ADMIN_EMAILS ?? "") {
  return new Set(
    value
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}
