CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
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
CREATE TABLE "lookups" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tiktok_url" text NOT NULL,
	"caption" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" text PRIMARY KEY NOT NULL,
	"lookup_id" text NOT NULL,
	"source" text NOT NULL,
	"product_url" text NOT NULL,
	"product_key" text NOT NULL,
	"title" text,
	"image_url" text,
	"price_cents" integer,
	"currency" text DEFAULT 'USD',
	"confidence" integer NOT NULL,
	"ranked_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trending_agg" (
	"product_key" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"product_url" text NOT NULL,
	"title" text,
	"image_url" text,
	"lookup_count" integer DEFAULT 0 NOT NULL,
	"unique_user_count" integer DEFAULT 0 NOT NULL,
	"first_seen" timestamp DEFAULT now() NOT NULL,
	"last_seen" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"plan" text DEFAULT 'free' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lookups" ADD CONSTRAINT "lookups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_lookup_id_lookups_id_fk" FOREIGN KEY ("lookup_id") REFERENCES "public"."lookups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lookups_user_created_idx" ON "lookups" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "lookups_created_idx" ON "lookups" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "matches_lookup_idx" ON "matches" USING btree ("lookup_id");--> statement-breakpoint
CREATE INDEX "matches_product_key_idx" ON "matches" USING btree ("product_key");--> statement-breakpoint
CREATE INDEX "trending_lookup_count_idx" ON "trending_agg" USING btree ("lookup_count");--> statement-breakpoint
CREATE INDEX "trending_last_seen_idx" ON "trending_agg" USING btree ("last_seen");