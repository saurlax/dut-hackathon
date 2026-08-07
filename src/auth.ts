import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { createTransport } from "nodemailer";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { adminEmails, getServerEnv } from "@/lib/env";
import { createLoginEmail } from "@/lib/login-email";

const env = getServerEnv();

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  trustHost: true,
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
    error: "/login/error",
  },
  providers: [
    Nodemailer({
      server: {
        host: env.EMAIL_SERVER_HOST,
        port: env.EMAIL_SERVER_PORT,
        secure: env.EMAIL_SERVER_PORT === 465,
        auth:
          env.EMAIL_SERVER_USER && env.EMAIL_SERVER_PASSWORD
            ? {
                user: env.EMAIL_SERVER_USER,
                pass: env.EMAIL_SERVER_PASSWORD,
              }
            : undefined,
      },
      from: env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url, expires, provider }) {
        const transport = createTransport(provider.server);
        const result = await transport.sendMail({
          to: identifier,
          from: provider.from,
          ...createLoginEmail({ url, expires }),
        });
        const failed = [...(result.rejected ?? []), ...(result.pending ?? [])]
          .filter(Boolean)
          .map(String);

        if (failed.length > 0) {
          throw new Error(`登录邮件发送失败：${failed.join(", ")}`);
        }
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      if (!user.id || !user.email) return;
      if (!adminEmails(env.ADMIN_EMAILS).has(user.email.toLowerCase())) return;
      await db
        .update(users)
        .set({ role: "admin", updatedAt: new Date() })
        .where(eq(users.id, user.id));
    },
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role;
      return session;
    },
  },
});
