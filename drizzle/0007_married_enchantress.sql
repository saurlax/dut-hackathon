ALTER TABLE "email_send_limits" ADD COLUMN "request_count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "revision" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "revision" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "team_confirmations" ADD COLUMN "revision" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "revision" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
UPDATE "submissions" SET "material_status" = 'complete' WHERE "audit_status" = 'approved';--> statement-breakpoint
UPDATE "submissions" SET "material_status" = 'incomplete' WHERE "audit_status" = 'rejected';--> statement-breakpoint
CREATE INDEX "email_send_limits_last_request_idx" ON "email_send_limits" USING btree ("last_request_at");--> statement-breakpoint
CREATE INDEX "verification_tokens_expires_idx" ON "verification_tokens" USING btree ("expires");
