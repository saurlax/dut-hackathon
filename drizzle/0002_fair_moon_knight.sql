ALTER TABLE "participants" ALTER COLUMN "is_internal" SET DEFAULT false;--> statement-breakpoint
UPDATE "participants"
SET "is_internal" = false,
	"audit_status" = 'pending',
	"updated_at" = now()
WHERE "is_internal" = true;
