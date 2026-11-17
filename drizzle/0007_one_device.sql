ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "session_until" timestamp with time zone;--> statement-breakpoint
-- Students already signed in on two phones share one token. One bump signs those copies out; the next sign-in holds a single device.
UPDATE "users" SET "session_version" = "session_version" + 1 WHERE "role" = 'student';
