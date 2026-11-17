-- Only FCM changes belong here. Course/test-set/logo/session schema is already
-- applied by 0003–0007; recreating it makes upgrades fail and Swarm roll back.
ALTER TABLE "push_subscriptions" ALTER COLUMN "p256dh" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "push_subscriptions" ALTER COLUMN "auth" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD COLUMN "fcm_token" text;--> statement-breakpoint
CREATE INDEX "push_subscriptions_fcm_token_index" ON "push_subscriptions" USING btree ("fcm_token");
