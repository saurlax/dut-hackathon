ALTER TABLE "participants" ADD COLUMN "approved_revision" integer;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "approved_revision" integer;--> statement-breakpoint

CREATE OR REPLACE FUNCTION "enforce_participant_review_state"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
	profile_changed boolean := false;
BEGIN
	IF TG_OP = 'UPDATE' THEN
		profile_changed := ROW(
			NEW."user_id",
			NEW."name",
			NEW."phone",
			NEW."email",
			NEW."school",
			NEW."college",
			NEW."grade",
			NEW."student_id",
			NEW."is_internal",
			NEW."skills",
			NEW."tech_stack",
			NEW."desired_roles",
			NEW."project_experience",
			NEW."bio",
			NEW."portfolio_url",
			NEW."available_time",
			NEW."registration_method",
			NEW."team_role",
			NEW."public_contact",
			NEW."public_display"
		) IS DISTINCT FROM ROW(
			OLD."user_id",
			OLD."name",
			OLD."phone",
			OLD."email",
			OLD."school",
			OLD."college",
			OLD."grade",
			OLD."student_id",
			OLD."is_internal",
			OLD."skills",
			OLD."tech_stack",
			OLD."desired_roles",
			OLD."project_experience",
			OLD."bio",
			OLD."portfolio_url",
			OLD."available_time",
			OLD."registration_method",
			OLD."team_role",
			OLD."public_contact",
			OLD."public_display"
		);

		IF profile_changed THEN
			NEW."audit_status" := 'pending';
			NEW."approved_revision" := NULL;
			NEW."admin_note" := '';
			IF NEW."revision" <= OLD."revision" THEN
				NEW."revision" := OLD."revision" + 1;
			END IF;
		END IF;
	END IF;

	IF NEW."audit_status" = 'approved'
		AND NEW."approved_revision" IS DISTINCT FROM NEW."revision" THEN
		NEW."audit_status" := 'pending';
		NEW."approved_revision" := NULL;
		NEW."admin_note" := '';
	ELSIF NEW."audit_status" <> 'approved' THEN
		NEW."approved_revision" := NULL;
	END IF;

	RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION "enforce_team_review_state"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
	profile_changed boolean := false;
BEGIN
	IF TG_OP = 'UPDATE' THEN
		profile_changed := ROW(
			NEW."name",
			NEW."leader_participant_id",
			NEW."track",
			NEW."project_direction",
			NEW."maturity",
			NEW."capabilities",
			NEW."required_roles",
			NEW."tech_stack",
			NEW."requirements",
			NEW."description",
			NEW."contact",
			NEW."allow_external",
			NEW."public_display",
			NEW."public_consent_at",
			NEW."recruitment_deadline",
			NEW."max_size",
			NEW."final_project_name",
			NEW."final_project_direction"
		) IS DISTINCT FROM ROW(
			OLD."name",
			OLD."leader_participant_id",
			OLD."track",
			OLD."project_direction",
			OLD."maturity",
			OLD."capabilities",
			OLD."required_roles",
			OLD."tech_stack",
			OLD."requirements",
			OLD."description",
			OLD."contact",
			OLD."allow_external",
			OLD."public_display",
			OLD."public_consent_at",
			OLD."recruitment_deadline",
			OLD."max_size",
			OLD."final_project_name",
			OLD."final_project_direction"
		);

		IF profile_changed THEN
			NEW."audit_status" := 'pending';
			NEW."approved_revision" := NULL;
			NEW."exception" := '';
			IF NEW."revision" <= OLD."revision" THEN
				NEW."revision" := OLD."revision" + 1;
			END IF;
		END IF;
	END IF;

	IF NEW."audit_status" = 'approved'
		AND NEW."approved_revision" IS DISTINCT FROM NEW."revision" THEN
		NEW."audit_status" := 'pending';
		NEW."approved_revision" := NULL;
		NEW."exception" := '';
	ELSIF NEW."audit_status" <> 'approved' THEN
		NEW."approved_revision" := NULL;
	END IF;

	RETURN NEW;
END;
$$;--> statement-breakpoint

CREATE TRIGGER "participants_review_guard"
BEFORE INSERT OR UPDATE ON "participants"
FOR EACH ROW
EXECUTE FUNCTION "enforce_participant_review_state"();--> statement-breakpoint

CREATE TRIGGER "teams_review_guard"
BEFORE INSERT OR UPDATE ON "teams"
FOR EACH ROW
EXECUTE FUNCTION "enforce_team_review_state"();--> statement-breakpoint

UPDATE "participants"
SET "audit_status" = 'pending',
	"revision" = "revision" + 1,
	"approved_revision" = NULL,
	"admin_note" = '',
	"updated_at" = now()
WHERE "audit_status" = 'approved';--> statement-breakpoint

UPDATE "teams"
SET "audit_status" = 'pending',
	"revision" = "revision" + 1,
	"approved_revision" = NULL,
	"exception" = '',
	"updated_at" = now()
WHERE "audit_status" = 'approved';--> statement-breakpoint

ALTER TABLE "participants" ADD CONSTRAINT "participants_approval_revision_check" CHECK (("participants"."audit_status" = 'approved' and "participants"."approved_revision" is not distinct from "participants"."revision") or ("participants"."audit_status" <> 'approved' and "participants"."approved_revision" is null));--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_approval_revision_check" CHECK (("teams"."audit_status" = 'approved' and "teams"."approved_revision" is not distinct from "teams"."revision") or ("teams"."audit_status" <> 'approved' and "teams"."approved_revision" is null));
