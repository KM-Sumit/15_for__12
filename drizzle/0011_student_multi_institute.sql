-- Students may study at several institutes at once (staff stay single-institute — enforced by app code).
-- One membership row per (user, institute) replaces the old one-membership-per-user rule.
DROP INDEX IF EXISTS "institute_memberships_user_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "institute_memberships_user_institute_unique" ON "institute_memberships" ("user_id", "institute_id");
