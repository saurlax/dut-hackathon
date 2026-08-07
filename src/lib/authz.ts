import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireUser(callbackUrl?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      `/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`,
    );
  }
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (user.role !== "admin") redirect("/?error=forbidden");
  return user;
}
