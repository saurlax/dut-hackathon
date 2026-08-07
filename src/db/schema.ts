import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const userRole = pgEnum("user_role", ["participant", "admin"]);
export const auditStatus = pgEnum("audit_status", [
  "pending",
  "approved",
  "rejected",
]);
export const recruitStatus = pgEnum("recruit_status", [
  "recruiting",
  "paused",
  "full",
  "completed",
]);
export const applicationStatus = pgEnum("application_status", [
  "pending",
  "approved",
  "rejected",
  "withdrawn",
]);
export const materialStatus = pgEnum("material_status", [
  "pending",
  "complete",
  "incomplete",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  role: userRole("role").notNull().default("participant"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

export const participants = pgTable(
  "participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    participantNumber: serial("participant_number").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull(),
    school: text("school").notNull(),
    college: text("college").notNull(),
    grade: text("grade").notNull(),
    studentId: text("student_id").notNull(),
    isInternal: boolean("is_internal").notNull().default(false),
    skills: text("skills")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    techStack: text("tech_stack")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    desiredRoles: text("desired_roles")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    projectExperience: text("project_experience").notNull().default(""),
    bio: text("bio").notNull().default(""),
    portfolioUrl: text("portfolio_url").notNull().default(""),
    availableTime: text("available_time").notNull().default(""),
    expectedTracks: text("expected_tracks")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    registrationMethod: text("registration_method")
      .notNull()
      .default("暂未确定"),
    teamRole: text("team_role").notNull().default(""),
    publicContact: text("public_contact").notNull().default(""),
    publicDisplay: boolean("public_display").notNull().default(false),
    auditStatus: auditStatus("audit_status").notNull().default("pending"),
    adminNote: text("admin_note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("participants_audit_idx").on(table.auditStatus)],
);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamNumber: serial("team_number").notNull().unique(),
    name: text("name").notNull(),
    leaderParticipantId: uuid("leader_participant_id")
      .notNull()
      .references(() => participants.id),
    track: text("track")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    projectDirection: text("project_direction").notNull().default(""),
    maturity: text("maturity").notNull().default(""),
    capabilities: text("capabilities")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    requiredRoles: text("required_roles")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    techStack: text("tech_stack")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    requirements: text("requirements").notNull().default(""),
    description: text("description").notNull().default(""),
    contact: text("contact").notNull(),
    allowExternal: boolean("allow_external").notNull().default(false),
    publicDisplay: boolean("public_display").notNull().default(false),
    publicConsentAt: timestamp("public_consent_at", { withTimezone: true }),
    recruitmentDeadline: date("recruitment_deadline").notNull(),
    maxSize: integer("max_size").notNull().default(4),
    recruitStatus: recruitStatus("recruit_status")
      .notNull()
      .default("recruiting"),
    auditStatus: auditStatus("audit_status").notNull().default("pending"),
    exception: text("exception").notNull().default(""),
    finalProjectName: text("final_project_name").notNull().default(""),
    finalProjectDirection: text("final_project_direction")
      .notNull()
      .default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("teams_max_size_check", sql`${table.maxSize} between 1 and 4`),
    index("teams_public_idx").on(
      table.publicDisplay,
      table.auditStatus,
      table.recruitStatus,
    ),
  ],
);

export const teamMembers = pgTable(
  "team_members",
  {
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("成员"),
    position: integer("position").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    consentedAt: timestamp("consented_at", { withTimezone: true }),
  },
  (table) => [
    primaryKey({ columns: [table.teamId, table.participantId] }),
    uniqueIndex("team_member_one_team_idx").on(table.participantId),
    uniqueIndex("team_member_position_idx").on(table.teamId, table.position),
    check("team_member_position_check", sql`${table.position} between 1 and 4`),
  ],
);

export const teamApplications = pgTable(
  "team_applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    applicantId: uuid("applicant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    message: text("message").notNull().default(""),
    status: applicationStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("applications_applicant_idx").on(table.applicantId, table.status),
    uniqueIndex("applications_pending_unique_idx")
      .on(table.teamId, table.applicantId)
      .where(sql`${table.status} = 'pending'`),
  ],
);

export const teamConfirmations = pgTable("team_confirmations", {
  id: uuid("id").defaultRandom().primaryKey(),
  confirmationNumber: serial("confirmation_number").notNull().unique(),
  teamId: uuid("team_id")
    .notNull()
    .unique()
    .references(() => teams.id, { onDelete: "cascade" }),
  submittedById: uuid("submitted_by_id")
    .notNull()
    .references(() => participants.id),
  allConfirmed: boolean("all_confirmed").notNull().default(false),
  commitment: boolean("commitment").notNull().default(true),
  auditStatus: auditStatus("audit_status").notNull().default("pending"),
  exception: text("exception").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const confirmationMembers = pgTable(
  "confirmation_members",
  {
    confirmationId: uuid("confirmation_id")
      .notNull()
      .references(() => teamConfirmations.id, { onDelete: "cascade" }),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => participants.id),
    participantNumber: integer("participant_number").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull().default("成员"),
    position: integer("position").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.confirmationId, table.participantId] }),
  ],
);

export const submissions = pgTable("submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  submissionNumber: serial("submission_number").notNull().unique(),
  teamId: uuid("team_id")
    .notNull()
    .unique()
    .references(() => teams.id, { onDelete: "cascade" }),
  submittedById: uuid("submitted_by_id")
    .notNull()
    .references(() => participants.id),
  projectName: text("project_name").notNull(),
  track: text("track").notNull(),
  oneLiner: text("one_liner").notNull(),
  background: text("background").notNull(),
  problemSolved: text("problem_solved").notNull(),
  coreFeatures: text("core_features").notNull(),
  techApproach: text("tech_approach").notNull(),
  innovation: text("innovation").notNull(),
  applicationValue: text("application_value").notNull(),
  usageGuide: text("usage_guide").notNull(),
  links: jsonb("links").$type<Record<string, string>>().notNull().default({}),
  publicDisplay: boolean("public_display").notNull().default(false),
  publicConsentAt: timestamp("public_consent_at", { withTimezone: true }),
  auditStatus: auditStatus("audit_status").notNull().default("pending"),
  materialStatus: materialStatus("material_status")
    .notNull()
    .default("pending"),
  adminNote: text("admin_note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usersRelations = relations(users, ({ one }) => ({
  participant: one(participants),
}));
export const participantsRelations = relations(
  participants,
  ({ one, many }) => ({
    user: one(users, { fields: [participants.userId], references: [users.id] }),
    memberships: many(teamMembers),
    applications: many(teamApplications),
  }),
);
export const teamsRelations = relations(teams, ({ one, many }) => ({
  leader: one(participants, {
    fields: [teams.leaderParticipantId],
    references: [participants.id],
  }),
  members: many(teamMembers),
  applications: many(teamApplications),
  confirmation: one(teamConfirmations),
  submission: one(submissions),
}));
export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
  participant: one(participants, {
    fields: [teamMembers.participantId],
    references: [participants.id],
  }),
}));
