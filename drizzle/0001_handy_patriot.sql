ALTER TYPE "public"."application_status" ADD VALUE 'approved' BEFORE 'withdrawn';--> statement-breakpoint
ALTER TYPE "public"."application_status" ADD VALUE 'rejected' BEFORE 'withdrawn';--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "public_display" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "public_display" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "public_consent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "consented_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "public_consent_at" timestamp with time zone;--> statement-breakpoint
UPDATE "submissions"
SET "public_display" = false,
    "public_consent_at" = NULL;--> statement-breakpoint
UPDATE "teams"
SET "public_display" = false,
    "public_consent_at" = NULL;--> statement-breakpoint
UPDATE "team_members" AS "member"
SET "consented_at" = "member"."joined_at"
FROM "teams" AS "team"
WHERE "member"."team_id" = "team"."id"
	AND "member"."participant_id" = "team"."leader_participant_id";--> statement-breakpoint
WITH "ranked_pending_applications" AS (
	SELECT
		"id",
		row_number() OVER (
			PARTITION BY "team_id", "applicant_id"
			ORDER BY "created_at" DESC, "id" DESC
		) AS "rank"
	FROM "team_applications"
	WHERE "status" = 'pending'
)
UPDATE "team_applications"
SET "status" = 'withdrawn',
	"updated_at" = now()
WHERE "id" IN (
	SELECT "id"
	FROM "ranked_pending_applications"
	WHERE "rank" > 1
);--> statement-breakpoint
CREATE UNIQUE INDEX "applications_pending_unique_idx" ON "team_applications" USING btree ("team_id","applicant_id") WHERE "team_applications"."status" = 'pending';
