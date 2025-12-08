CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(45)
);
--> statement-breakpoint
CREATE TABLE "candidate_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"onboarding_request_id" integer NOT NULL,
	"token" varchar(64) NOT NULL,
	"verification_code" varchar(6) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified_at" timestamp,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "candidate_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "hr_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"hr_user_id" integer NOT NULL,
	"onboarding_request_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"invited_by" integer NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" varchar(30) DEFAULT 'nd_draft' NOT NULL,
	"created_by_nd_id" integer NOT NULL,
	"assigned_hr_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"candidate_first_name" varchar(100) NOT NULL,
	"candidate_last_name" varchar(100) NOT NULL,
	"candidate_email" varchar(255) NOT NULL,
	"candidate_phone" varchar(20),
	"state_of_residence" varchar(2),
	"tour_name" varchar(255),
	"position_title" varchar(100),
	"hire_date" date,
	"salary_event_rate" numeric(10, 2),
	"worker_category" varchar(10),
	"hire_or_rehire" varchar(20),
	"notes" text,
	"tax_id_number" varchar(11),
	"birth_date" date,
	"marital_status_state" varchar(20),
	"address_line_1" varchar(255),
	"address_line_2" varchar(255),
	"address_city" varchar(100),
	"address_state" varchar(2),
	"address_zip_code" varchar(10),
	"candidate_submitted_at" timestamp,
	"change_effective_date" date,
	"company_code" varchar(50),
	"home_department" varchar(100),
	"sui" varchar(10),
	"will_worker_complete_i9" varchar(3),
	"e_verify_work_location" varchar(100),
	"hr_completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"role" varchar(50) NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100),
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(20) DEFAULT 'nd' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_tokens" ADD CONSTRAINT "candidate_tokens_onboarding_request_id_onboarding_requests_id_fk" FOREIGN KEY ("onboarding_request_id") REFERENCES "public"."onboarding_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_assignments" ADD CONSTRAINT "hr_assignments_hr_user_id_users_id_fk" FOREIGN KEY ("hr_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_assignments" ADD CONSTRAINT "hr_assignments_onboarding_request_id_onboarding_requests_id_fk" FOREIGN KEY ("onboarding_request_id") REFERENCES "public"."onboarding_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_assignments" ADD CONSTRAINT "hr_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_requests" ADD CONSTRAINT "onboarding_requests_created_by_nd_id_users_id_fk" FOREIGN KEY ("created_by_nd_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_requests" ADD CONSTRAINT "onboarding_requests_assigned_hr_id_users_id_fk" FOREIGN KEY ("assigned_hr_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;