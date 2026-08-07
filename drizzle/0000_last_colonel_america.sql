CREATE TYPE "public"."application_status" AS ENUM('pending', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."audit_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."material_status" AS ENUM('pending', 'complete', 'incomplete');--> statement-breakpoint
CREATE TYPE "public"."recruit_status" AS ENUM('recruiting', 'paused', 'full', 'completed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('participant', 'admin');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "confirmation_members" (
	"confirmation_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"participant_number" integer NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT '成员' NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "confirmation_members_confirmation_id_participant_id_pk" PRIMARY KEY("confirmation_id","participant_id")
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_number" serial NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"school" text NOT NULL,
	"college" text NOT NULL,
	"grade" text NOT NULL,
	"student_id" text NOT NULL,
	"is_internal" boolean DEFAULT true NOT NULL,
	"skills" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"tech_stack" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"desired_roles" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"project_experience" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"portfolio_url" text DEFAULT '' NOT NULL,
	"available_time" text DEFAULT '' NOT NULL,
	"expected_tracks" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"registration_method" text DEFAULT '暂未确定' NOT NULL,
	"team_role" text DEFAULT '' NOT NULL,
	"public_contact" text DEFAULT '' NOT NULL,
	"public_display" boolean DEFAULT false NOT NULL,
	"audit_status" "audit_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "participants_participant_number_unique" UNIQUE("participant_number"),
	CONSTRAINT "participants_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_number" serial NOT NULL,
	"team_id" uuid NOT NULL,
	"submitted_by_id" uuid NOT NULL,
	"project_name" text NOT NULL,
	"track" text NOT NULL,
	"one_liner" text NOT NULL,
	"background" text NOT NULL,
	"problem_solved" text NOT NULL,
	"core_features" text NOT NULL,
	"tech_approach" text NOT NULL,
	"innovation" text NOT NULL,
	"application_value" text NOT NULL,
	"usage_guide" text NOT NULL,
	"links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"public_display" boolean DEFAULT true NOT NULL,
	"audit_status" "audit_status" DEFAULT 'pending' NOT NULL,
	"material_status" "material_status" DEFAULT 'pending' NOT NULL,
	"admin_note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submissions_submission_number_unique" UNIQUE("submission_number"),
	CONSTRAINT "submissions_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE "team_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"applicant_id" uuid NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"status" "application_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_confirmations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"confirmation_number" serial NOT NULL,
	"team_id" uuid NOT NULL,
	"submitted_by_id" uuid NOT NULL,
	"all_confirmed" boolean DEFAULT false NOT NULL,
	"commitment" boolean DEFAULT true NOT NULL,
	"audit_status" "audit_status" DEFAULT 'pending' NOT NULL,
	"exception" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_confirmations_confirmation_number_unique" UNIQUE("confirmation_number"),
	CONSTRAINT "team_confirmations_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"team_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"role" text DEFAULT '成员' NOT NULL,
	"position" integer NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_team_id_participant_id_pk" PRIMARY KEY("team_id","participant_id"),
	CONSTRAINT "team_member_position_check" CHECK ("team_members"."position" between 1 and 4)
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_number" serial NOT NULL,
	"name" text NOT NULL,
	"leader_participant_id" uuid NOT NULL,
	"track" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"project_direction" text DEFAULT '' NOT NULL,
	"maturity" text DEFAULT '' NOT NULL,
	"capabilities" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"required_roles" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"tech_stack" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"requirements" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"contact" text NOT NULL,
	"allow_external" boolean DEFAULT false NOT NULL,
	"public_display" boolean DEFAULT true NOT NULL,
	"recruitment_deadline" date NOT NULL,
	"max_size" integer DEFAULT 4 NOT NULL,
	"recruit_status" "recruit_status" DEFAULT 'recruiting' NOT NULL,
	"audit_status" "audit_status" DEFAULT 'pending' NOT NULL,
	"exception" text DEFAULT '' NOT NULL,
	"final_project_name" text DEFAULT '' NOT NULL,
	"final_project_direction" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_team_number_unique" UNIQUE("team_number"),
	CONSTRAINT "teams_max_size_check" CHECK ("teams"."max_size" between 1 and 4)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"image" text,
	"role" "user_role" DEFAULT 'participant' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confirmation_members" ADD CONSTRAINT "confirmation_members_confirmation_id_team_confirmations_id_fk" FOREIGN KEY ("confirmation_id") REFERENCES "public"."team_confirmations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confirmation_members" ADD CONSTRAINT "confirmation_members_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_submitted_by_id_participants_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_applications" ADD CONSTRAINT "team_applications_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_applications" ADD CONSTRAINT "team_applications_applicant_id_participants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_confirmations" ADD CONSTRAINT "team_confirmations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_confirmations" ADD CONSTRAINT "team_confirmations_submitted_by_id_participants_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_leader_participant_id_participants_id_fk" FOREIGN KEY ("leader_participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "participants_audit_idx" ON "participants" USING btree ("audit_status");--> statement-breakpoint
CREATE INDEX "applications_applicant_idx" ON "team_applications" USING btree ("applicant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "team_member_one_team_idx" ON "team_members" USING btree ("participant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_member_position_idx" ON "team_members" USING btree ("team_id","position");--> statement-breakpoint
CREATE INDEX "teams_public_idx" ON "teams" USING btree ("public_display","audit_status","recruit_status");