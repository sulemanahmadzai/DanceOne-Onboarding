import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  date,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// ENUMS
// ============================================================================
export enum OnboardingStatus {
  ND_TO_APPROVE = "nd_to_approve", // New: Bulk imported, waiting for ND/Admin/HR to approve and send to candidate
  ND_DRAFT = "nd_draft",
  WAITING_FOR_CANDIDATE = "waiting_for_candidate",
  WAITING_FOR_HR = "waiting_for_hr",
  OFFER_LETTER_SENT = "offer_letter_sent",
  ADP_COMPLETED = "adp_completed",
  COMPLETED = "completed",
}

export enum UserRole {
  ADMIN = "admin",
  ND = "nd",
  HR = "hr",
}

export enum WorkerCategory {
  W2 = "W2",
  CONTRACTOR_1099 = "1099",
}

export enum HireOrRehire {
  NEW_HIRE = "new_hire",
  REHIRE = "rehire",
}

export enum MaritalStatus {
  SINGLE = "single",
  MARRIED = "married",
  DIVORCED = "divorced",
  WIDOWED = "widowed",
}

export enum ActivityType {
  // Auth activities
  SIGN_UP = "SIGN_UP",
  SIGN_IN = "SIGN_IN",
  SIGN_OUT = "SIGN_OUT",
  UPDATE_PASSWORD = "UPDATE_PASSWORD",
  DELETE_ACCOUNT = "DELETE_ACCOUNT",
  UPDATE_ACCOUNT = "UPDATE_ACCOUNT",
  // Team activities
  CREATE_TEAM = "CREATE_TEAM",
  REMOVE_TEAM_MEMBER = "REMOVE_TEAM_MEMBER",
  INVITE_TEAM_MEMBER = "INVITE_TEAM_MEMBER",
  ACCEPT_INVITATION = "ACCEPT_INVITATION",
  // Onboarding activities
  CREATE_ONBOARDING_REQUEST = "CREATE_ONBOARDING_REQUEST",
  CANDIDATE_SUBMITTED = "CANDIDATE_SUBMITTED",
  HR_COMPLETED = "HR_COMPLETED",
  HR_ASSIGNED = "HR_ASSIGNED",
  EXPORT_RECORDS = "EXPORT_RECORDS",
}

// ============================================================================
// USERS TABLE
// ============================================================================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  supabaseAuthId: varchar("supabase_auth_id", { length: 100 }).unique(),
  name: varchar("name", { length: 100 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"),
  role: varchar("role", { length: 20 }).notNull().default(UserRole.ND),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// ============================================================================
// TEAMS TABLE
// ============================================================================
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id),
  role: varchar("role", { length: 50 }).notNull(),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

// ============================================================================
// ACTIVITY LOGS TABLE
// ============================================================================
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  ipAddress: varchar("ip_address", { length: 45 }),
});

// ============================================================================
// INVITATIONS TABLE
// ============================================================================
export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  invitedBy: integer("invited_by")
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp("invited_at").notNull().defaultNow(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
});

// ============================================================================
// ONBOARDING REQUESTS TABLE
// ============================================================================
export const onboardingRequests = pgTable("onboarding_requests", {
  id: serial("id").primaryKey(),
  // System fields
  status: varchar("status", { length: 30 })
    .notNull()
    .default(OnboardingStatus.ND_DRAFT),
  createdByNdId: integer("created_by_nd_id")
    .notNull()
    .references(() => users.id),
  assignedHrId: integer("assigned_hr_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Shared Candidate Identity (collected by ND in Step 1)
  candidateFirstName: varchar("candidate_first_name", {
    length: 100,
  }).notNull(),
  candidateLastName: varchar("candidate_last_name", { length: 100 }).notNull(),
  candidateEmail: varchar("candidate_email", { length: 255 }).notNull(),
  candidatePhone: varchar("candidate_phone", { length: 20 }),
  stateOfResidence: varchar("state_of_residence", { length: 2 }),

  // ND Fields (Step 1)
  tourName: varchar("tour_name", { length: 255 }),
  positionTitle: varchar("position_title", { length: 100 }),
  hireDate: date("hire_date"),
  eventRate: decimal("event_rate", { precision: 10, scale: 2 }),
  dayRate: decimal("day_rate", { precision: 10, scale: 2 }),
  workerCategory: varchar("worker_category", { length: 10 }), // W2 or 1099
  hireOrRehire: varchar("hire_or_rehire", { length: 20 }), // new_hire or rehire
  notes: text("notes"),

  // Candidate Fields (Step 2)
  taxIdNumber: varchar("tax_id_number", { length: 11 }),
  birthDate: date("birth_date"),
  maritalStatusState: varchar("marital_status_state", { length: 20 }),
  addressLine1: varchar("address_line_1", { length: 255 }),
  addressLine2: varchar("address_line_2", { length: 255 }),
  addressCity: varchar("address_city", { length: 100 }),
  addressState: varchar("address_state", { length: 2 }),
  addressZipCode: varchar("address_zip_code", { length: 10 }),
  candidateSubmittedAt: timestamp("candidate_submitted_at"),

  // HR Fields (Step 3)
  changeEffectiveDate: date("change_effective_date"),
  companyCode: varchar("company_code", { length: 50 }),
  homeDepartment: varchar("home_department", { length: 100 }),
  sui: varchar("sui", { length: 10 }),
  willWorkerCompleteI9: varchar("will_worker_complete_i9", { length: 3 }), // yes or no
  eVerifyWorkLocation: varchar("e_verify_work_location", { length: 100 }),
  hrCompletedAt: timestamp("hr_completed_at"),
  pandadocDocumentId: varchar("pandadoc_document_id", { length: 100 }),
  // PandaDoc signature tracking
  ndInitialsCompletedAt: timestamp("nd_initials_completed_at"),
  hrSignatureCompletedAt: timestamp("hr_signature_completed_at"),
  candidateSignatureCompletedAt: timestamp("candidate_signature_completed_at"),
});

// ============================================================================
// CANDIDATE TOKENS TABLE (Magic links with verification)
// ============================================================================
export const candidateTokens = pgTable("candidate_tokens", {
  id: serial("id").primaryKey(),
  onboardingRequestId: integer("onboarding_request_id")
    .notNull()
    .references(() => onboardingRequests.id),
  token: varchar("token", { length: 64 }).notNull().unique(),
  verificationCode: varchar("verification_code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verifiedAt: timestamp("verified_at"),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// HR ASSIGNMENTS TABLE
// ============================================================================
export const hrAssignments = pgTable("hr_assignments", {
  id: serial("id").primaryKey(),
  hrUserId: integer("hr_user_id")
    .notNull()
    .references(() => users.id),
  onboardingRequestId: integer("onboarding_request_id")
    .notNull()
    .references(() => onboardingRequests.id),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  assignedBy: integer("assigned_by")
    .notNull()
    .references(() => users.id),
});

// ============================================================================
// RELATIONS
// ============================================================================
export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  createdOnboardingRequests: many(onboardingRequests, {
    relationName: "createdByNd",
  }),
  assignedOnboardingRequests: many(onboardingRequests, {
    relationName: "assignedHr",
  }),
  hrAssignments: many(hrAssignments, {
    relationName: "hrUser",
  }),
  hrAssignmentsAssigned: many(hrAssignments, {
    relationName: "assignedByUser",
  }),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const onboardingRequestsRelations = relations(
  onboardingRequests,
  ({ one, many }) => ({
    createdByNd: one(users, {
      fields: [onboardingRequests.createdByNdId],
      references: [users.id],
      relationName: "createdByNd",
    }),
    assignedHr: one(users, {
      fields: [onboardingRequests.assignedHrId],
      references: [users.id],
      relationName: "assignedHr",
    }),
    candidateTokens: many(candidateTokens),
    hrAssignments: many(hrAssignments),
  })
);

export const candidateTokensRelations = relations(
  candidateTokens,
  ({ one }) => ({
    onboardingRequest: one(onboardingRequests, {
      fields: [candidateTokens.onboardingRequestId],
      references: [onboardingRequests.id],
    }),
  })
);

export const hrAssignmentsRelations = relations(hrAssignments, ({ one }) => ({
  hrUser: one(users, {
    fields: [hrAssignments.hrUserId],
    references: [users.id],
    relationName: "hrUser",
  }),
  onboardingRequest: one(onboardingRequests, {
    fields: [hrAssignments.onboardingRequestId],
    references: [onboardingRequests.id],
  }),
  assignedByUser: one(users, {
    fields: [hrAssignments.assignedBy],
    references: [users.id],
    relationName: "assignedByUser",
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type OnboardingRequest = typeof onboardingRequests.$inferSelect;
export type NewOnboardingRequest = typeof onboardingRequests.$inferInsert;
export type CandidateToken = typeof candidateTokens.$inferSelect;
export type NewCandidateToken = typeof candidateTokens.$inferInsert;
export type HrAssignment = typeof hrAssignments.$inferSelect;
export type NewHrAssignment = typeof hrAssignments.$inferInsert;

export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, "id" | "name" | "email">;
  })[];
};

export type OnboardingRequestWithRelations = OnboardingRequest & {
  createdByNd: Pick<User, "id" | "name" | "email">;
  assignedHr?: Pick<User, "id" | "name" | "email"> | null;
  candidateTokens?: CandidateToken[];
};
