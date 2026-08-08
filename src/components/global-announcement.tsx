import { activeAnnouncement } from "@/lib/queries";
import { AnnouncementDialog } from "@/components/announcement-dialog";

export async function GlobalAnnouncement() {
  const announcement = await activeAnnouncement();
  if (!announcement) return null;
  return <AnnouncementDialog announcement={announcement} />;
}
