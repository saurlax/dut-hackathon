UPDATE "participants"
SET "audit_status" = 'approved',
	"updated_at" = now()
WHERE "audit_status" = 'pending';--> statement-breakpoint

UPDATE "teams"
SET "audit_status" = 'approved',
	"updated_at" = now()
WHERE "audit_status" = 'pending';
