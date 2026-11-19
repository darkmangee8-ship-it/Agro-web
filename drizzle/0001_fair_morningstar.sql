CREATE TABLE "sponsor_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"organization_name" text NOT NULL,
	"organization_type" text NOT NULL,
	"approval_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loan_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"farmer_id" text NOT NULL,
	"sponsor_id" text,
	"requested_amount" numeric(16, 2) NOT NULL,
	"requested_term_months" integer NOT NULL,
	"purpose" text NOT NULL,
	"repayment_plan" text NOT NULL,
	"sponsor_consent_at" timestamp with time zone NOT NULL,
	"sponsor_consent" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"offered_amount" numeric(16, 2),
	"annual_interest_rate" numeric(7, 4),
	"offered_term_months" integer,
	"estimated_total_repayment" numeric(16, 2),
	"sponsor_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loan_audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"loan_request_id" text,
	"actor_id" text NOT NULL,
	"event_type" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sponsor_profiles" ADD CONSTRAINT "sponsor_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "loan_requests" ADD CONSTRAINT "loan_requests_farmer_id_user_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "loan_requests" ADD CONSTRAINT "loan_requests_sponsor_id_user_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "loan_audit_events" ADD CONSTRAINT "loan_audit_events_loan_request_id_loan_requests_id_fk" FOREIGN KEY ("loan_request_id") REFERENCES "public"."loan_requests"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "loan_audit_events" ADD CONSTRAINT "loan_audit_events_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;