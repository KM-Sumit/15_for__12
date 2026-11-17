-- Multi-tenant education platform.
-- Every tenant-owned row carries institute_id. PostgreSQL RLS is the final backstop: a request can only
-- read/write rows for the institute set on its reserved connection (`app.institute_id`). Super-admin
-- requests set `app.bypass_rls = 'on'`.
--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'super_admin';
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."institute_status" AS ENUM('active', 'suspended'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."membership_role" AS ENUM('admin', 'teacher', 'student'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."material_kind" AS ENUM('pdf', 'link', 'text'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"description" text DEFAULT '' NOT NULL,
	"price_inr" integer DEFAULT 0 NOT NULL,
	"max_students" integer,
	"max_admins" integer,
	"max_tests" integer,
	"modules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "institutes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"status" "institute_status" DEFAULT 'active' NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"contact_email" text,
	"phone" text,
	"address" text DEFAULT '' NOT NULL,
	"website" text,
	"logo_url" text,
	"primary_color" text DEFAULT '#e2580b' NOT NULL,
	"plan_id" uuid REFERENCES "plans"("id") ON DELETE SET NULL,
	"notes" text DEFAULT '' NOT NULL,
	"suspended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "institute_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institute_id" uuid NOT NULL REFERENCES "institutes"("id") ON DELETE CASCADE,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"role" "membership_role" DEFAULT 'student' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "institute_memberships_user_unique" ON "institute_memberships" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "institute_memberships_institute_role_idx" ON "institute_memberships" ("institute_id", "role");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "institute_modules" (
	"institute_id" uuid NOT NULL REFERENCES "institutes"("id") ON DELETE CASCADE,
	"module_key" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "institute_modules_institute_id_module_key_pk" PRIMARY KEY("institute_id", "module_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "institute_settings" (
	"institute_id" uuid PRIMARY KEY NOT NULL REFERENCES "institutes"("id") ON DELETE CASCADE,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "platform_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "study_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"kind" "material_kind" DEFAULT 'text' NOT NULL,
	"url" text,
	"file_id" uuid,
	"body" text DEFAULT '' NOT NULL,
	"subject_id" uuid REFERENCES "subjects"("id") ON DELETE SET NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_institute_id_idx" ON "users" ("institute_id");
--> statement-breakpoint
ALTER TABLE "academic_sessions" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "batches" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "test_sets" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "tests" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "test_grants" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "test_access_failures" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "ai_jobs" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "banners" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "toppers" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "faculty" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "entitlements" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "doubts" ADD COLUMN IF NOT EXISTS "institute_id" uuid REFERENCES "institutes"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tests_institute_idx" ON "tests" ("institute_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attempts_institute_idx" ON "attempts" ("institute_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "questions_institute_idx" ON "questions" ("institute_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "modules_institute_idx" ON "modules" ("institute_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_institute_idx" ON "products" ("institute_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_institute_idx" ON "notifications" ("institute_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "study_materials_institute_idx" ON "study_materials" ("institute_id", "published");
--> statement-breakpoint
-- Keep the old global session-name index from blocking two institutes from both having "2026-27".
ALTER TABLE "academic_sessions" DROP CONSTRAINT IF EXISTS "academic_sessions_name_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "academic_sessions_institute_name_unique" ON "academic_sessions" ("institute_id", "name");
--> statement-breakpoint
-- Existing installations: put all legacy rows into one institute so nothing is lost or invisible.
INSERT INTO "institutes" ("id", "name", "slug", "status", "tagline", "description", "primary_color")
SELECT gen_random_uuid(), 'Legacy Institute', 'legacy', 'active', 'Imported from the single-institute deployment', 'Data migrated automatically by 0009_multitenant.', '#e2580b'
WHERE EXISTS (SELECT 1 FROM "users") AND NOT EXISTS (SELECT 1 FROM "institutes");
--> statement-breakpoint
UPDATE "users" SET "institute_id" = (SELECT "id" FROM "institutes" WHERE "slug" = 'legacy' LIMIT 1)
WHERE "institute_id" IS NULL AND "role"::text <> 'super_admin' AND (SELECT count(*) FROM "institutes" WHERE "slug" = 'legacy') > 0;
--> statement-breakpoint
INSERT INTO "institute_memberships" ("institute_id", "user_id", "role")
SELECT u."institute_id", u."id", CASE WHEN u."role" IN ('admin', 'teacher') THEN u."role"::text::"membership_role" ELSE 'student'::"membership_role" END
FROM "users" u
WHERE u."institute_id" IS NOT NULL
ON CONFLICT ("user_id") DO NOTHING;
--> statement-breakpoint
DO $$
DECLARE tbl text;
BEGIN
	FOREACH tbl IN ARRAY ARRAY['academic_sessions','batches','files','courses','notes','modules','questions','test_sets','tests','test_grants','test_access_failures','attempts','ai_jobs','banners','notifications','toppers','faculty','products','payments','entitlements','live_classes','posts','coupons','doubts']
	LOOP
		EXECUTE format('UPDATE %I SET institute_id = (SELECT id FROM institutes WHERE slug = ''legacy'' LIMIT 1) WHERE institute_id IS NULL AND (SELECT count(*) FROM institutes WHERE slug = ''legacy'') > 0', tbl);
	END LOOP;
END $$;
--> statement-breakpoint
-- Auto-fill institute_id on inserts made inside a tenant request.
CREATE OR REPLACE FUNCTION app_set_institute_id() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
	IF NEW.institute_id IS NULL THEN
		NEW.institute_id := NULLIF(current_setting('app.institute_id', true), '')::uuid;
	END IF;
	RETURN NEW;
END $$;
--> statement-breakpoint
DO $$
DECLARE tbl text;
BEGIN
	FOREACH tbl IN ARRAY ARRAY['academic_sessions','batches','files','courses','notes','modules','questions','test_sets','tests','test_grants','test_access_failures','attempts','ai_jobs','banners','notifications','toppers','faculty','audit_log','products','payments','entitlements','live_classes','posts','coupons','doubts','study_materials']
	LOOP
		EXECUTE format('DROP TRIGGER IF EXISTS set_institute_id ON %I', tbl);
		EXECUTE format('CREATE TRIGGER set_institute_id BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION app_set_institute_id()', tbl);
		EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
		EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
		EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', tbl);
		EXECUTE format('CREATE POLICY tenant_isolation ON %I USING (institute_id = NULLIF(current_setting(''app.institute_id'', true), '''')::uuid OR current_setting(''app.bypass_rls'', true) = ''on'') WITH CHECK (institute_id = NULLIF(current_setting(''app.institute_id'', true), '''')::uuid OR current_setting(''app.bypass_rls'', true) = ''on'')', tbl);
	END LOOP;
END $$;
