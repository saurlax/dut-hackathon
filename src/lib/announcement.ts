import { createHash } from "node:crypto";

export const CURRENT_ANNOUNCEMENT_ID = "current";

export type AnnouncementContent = {
  title: string;
  content: string;
};

export type PublicAnnouncement = {
  title: string;
  markdown: string;
  version: string;
};

export function normalizeAnnouncementContent(
  announcement: AnnouncementContent,
): AnnouncementContent {
  return {
    title: announcement.title.replace(/\r\n?/g, "\n").trim(),
    content: announcement.content.replace(/\r\n?/g, "\n").trim(),
  };
}

export function announcementContentVersion(
  announcement: AnnouncementContent,
): string {
  const normalized = normalizeAnnouncementContent(announcement);
  return createHash("sha256")
    .update(JSON.stringify([normalized.title, normalized.content]), "utf8")
    .digest("hex");
}
